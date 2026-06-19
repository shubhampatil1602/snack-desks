"use server";

import crypto from "crypto";
import bcrypt from "bcryptjs";
import { headers } from "next/headers";
import { nanoid } from "nanoid";

import { authIsRequired } from "@/actions/user";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth/auth";

const EXPIRY_MINUTES = {
  1: 1,
  15: 15,
  60: 60,
} as const;

export async function generatePasswordResetToken(
  userId: string,
  expiry: 1 | 15 | 60,
) {
  const session = await authIsRequired();

  if (session.user.role !== "admin" && session.user.role !== "super_admin") {
    return {
      success: false,
      error: "Unauthorized",
    };
  }

  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true,
      passwordResetExpiry: true,
    },
  });

  if (!user) {
    return {
      success: false,
      error: "User not found",
    };
  }

  if (user.passwordResetExpiry && user.passwordResetExpiry > new Date()) {
    return {
      success: false,
      error: "An active reset token already exists",
    };
  }

  const rawToken = "SNK-" + crypto.randomBytes(6).toString("hex").toUpperCase();

  const hashedToken = await bcrypt.hash(rawToken, 10);

  const expiresAt = new Date(Date.now() + EXPIRY_MINUTES[expiry] * 60 * 1000);

  await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      passwordResetToken: hashedToken,
      passwordResetExpiry: expiresAt,
    },
  });

  return {
    success: true,
    token: rawToken,
    expiresAt,
  };
}

export async function verifyPasswordResetToken(email: string, token: string) {
  const user = await prisma.user.findUnique({
    where: {
      email,
    },
    select: {
      id: true,
      passwordResetToken: true,
      passwordResetExpiry: true,
    },
  });

  if (!user) {
    return null;
  }

  if (!user.passwordResetToken || !user.passwordResetExpiry) {
    return null;
  }

  if (user.passwordResetExpiry < new Date()) {
    return null;
  }

  const valid = await bcrypt.compare(token, user.passwordResetToken);

  if (!valid) {
    return null;
  }

  return user.id;
}

// Fixed: Reset password action - direct database update
export async function resetPasswordAction(input: {
  email: string;
  token: string;
  newPassword: string;
}) {
  // Validate input
  if (!input.email || !input.token || !input.newPassword) {
    return {
      success: false,
      error: "All fields are required",
    };
  }

  if (input.newPassword.length < 8) {
    return {
      success: false,
      error: "Password must be at least 8 characters",
    };
  }

  // Verify the token
  const userId = await verifyPasswordResetToken(input.email, input.token);

  if (!userId) {
    return {
      success: false,
      error: "Invalid or expired reset token. Please request a new one.",
    };
  }

  try {
    // Hash the new password using bcrypt with 10 rounds
    const hashedPassword = await bcrypt.hash(input.newPassword, 10);

    // Find the account
    let account = await prisma.account.findFirst({
      where: {
        userId: userId,
        providerId: "credential",
      },
    });

    if (!account) {
      // Create new account if doesn't exist
      account = await prisma.account.create({
        data: {
          id: nanoid(),
          userId: userId,
          providerId: "email",
          accountId: userId,
          password: hashedPassword,
        },
      });
      console.log("Created new account for user:", userId);
    } else {
      // Update existing account
      await prisma.account.update({
        where: {
          id: account.id,
        },
        data: {
          password: hashedPassword,
        },
      });
      console.log("Updated password for user:", userId);
    }

    // Clear the reset token
    await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        passwordResetToken: null,
        passwordResetExpiry: null,
      },
    });

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error resetting password:", error);
    return {
      success: false,
      error: "Failed to reset password. Please try again.",
    };
  }
}
