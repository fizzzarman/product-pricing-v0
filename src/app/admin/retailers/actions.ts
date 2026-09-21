"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";

export async function toggleRetailerActive(retailerId: string, nextActive: boolean) {
  await prisma.retailer.update({ where: { id: retailerId }, data: { isActive: nextActive } });
  await prisma.adminAuditLog.create({
    data: {
      action: nextActive ? "retailer.enable" : "retailer.disable",
      entity: "Retailer",
      entityId: retailerId,
    },
  });
  revalidatePath("/admin/retailers");
}
