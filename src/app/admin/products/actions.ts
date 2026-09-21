"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { productUpdateSchema } from "@/lib/validation/admin";

export async function updateProduct(productId: string, formData: FormData) {
  const parsed = productUpdateSchema.safeParse({
    name: formData.get("name"),
    model: formData.get("model") || null,
    description: formData.get("description") || null,
    imageUrl: formData.get("imageUrl") || null,
    isActive: formData.get("isActive") === "on",
  });

  if (!parsed.success) {
    throw new Error("Invalid product data: " + parsed.error.issues.map((i) => i.message).join(", "));
  }

  await prisma.product.update({
    where: { id: productId },
    data: {
      name: parsed.data.name,
      model: parsed.data.model,
      description: parsed.data.description,
      imageUrl: parsed.data.imageUrl || null,
      isActive: parsed.data.isActive,
    },
  });

  await prisma.adminAuditLog.create({
    data: { action: "product.update", entity: "Product", entityId: productId },
  });

  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${productId}`);
}

export async function deleteProduct(productId: string) {
  await prisma.product.delete({ where: { id: productId } });
  await prisma.adminAuditLog.create({
    data: { action: "product.delete", entity: "Product", entityId: productId },
  });
  revalidatePath("/admin/products");
  redirect("/admin/products");
}
