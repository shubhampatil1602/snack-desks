import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { organization } from "better-auth/plugins";
import { prisma } from "../db";
import bcrypt from "bcryptjs";
import { verifyPassword } from "better-auth/crypto";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),

  user: {
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "user",
        input: false,
      },
    },
  },

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    password: {
      hash: async (password) => bcrypt.hash(password, 10),
      verify: async ({ hash, password }) => {
        // Existing users have scrypt hashes (no $2 prefix)
        if (hash.startsWith("$2")) {
          return bcrypt.compare(password, hash);
        }
        // Better Auth native scrypt format
        return verifyPassword({ hash, password });
      },
    },
  },

  databaseHooks: {
    session: {
      create: {
        before: async (session) => {
          // find the user's org membership
          const member = await prisma.member.findFirst({
            where: { userId: session.userId },
          });

          // if they belong to an org, set it as active on session creation
          if (member) {
            return {
              data: {
                ...session,
                activeOrganizationId: member.organizationId,
              },
            };
          }

          return { data: session };
        },
      },
    },
  },

  plugins: [
    organization({
      allowUserToCreateOrganization: false,
      schema: {
        organization: {
          additionalFields: {
            inviteCode: {
              type: "string",
              required: true,
              input: true,
            },
          },
        },
      },
    }),
    nextCookies(),
  ],
});

export type Session = typeof auth.$Infer.Session;
export type ActiveOrganization = typeof auth.$Infer.ActiveOrganization;
