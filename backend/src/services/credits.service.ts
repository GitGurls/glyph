import { prisma } from "../lib/prisma";
import type { Prisma } from "@prisma/client";

// Every balance change is written to CreditTransaction as an immutable ledger entry —
// never just mutate User.credits in isolation. This is what makes the balance auditable
// and is the same pattern real billing systems (Stripe, banks) use.
export async function adjustCredits(userId: string, amount: number, type: string) {
  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const user = await tx.user.findUniqueOrThrow({ where: { id: userId } });
    const newBalance = user.credits + amount;

    if (newBalance < 0) {
      throw new Error("INSUFFICIENT_CREDITS");
    }

    await tx.user.update({ where: { id: userId }, data: { credits: newBalance } });

    await tx.creditTransaction.create({
      data: { userId, amount, type, balanceAfter: newBalance },
    });

    return newBalance;
  });
}

export const MODEL_COSTS: Record<string, number> = {
  image: 5,
  "face-swap": 8,
  video: 15,
};
