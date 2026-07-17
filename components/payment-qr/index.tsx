import { authIsRequired } from "@/actions/user";
import { prisma } from "@/lib/db";
import { PaymentQRDialog } from "./dialog";

export const PaymentQR = async () => {
  const session = await authIsRequired();
  
  const member = await prisma.member.findFirst({
    where: { userId: session.user.id },
  });

  if (!member) return null;

  const shops = await prisma.shop.findMany({
    where: {
      organizationId: member.organizationId,
      paymentUpi: {
        not: null,
      },
    },
    select: {
      id: true,
      name: true,
      paymentUpi: true,
    },
  });

  const validShops = shops.filter((s) => s.paymentUpi && s.paymentUpi.trim() !== "");

  if (validShops.length === 0) return null;

  return <PaymentQRDialog shops={validShops} />;
};
