"use server";

import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { authorize, buildOwnershipFilter } from "@/lib/permissions";
import { contactSchema, type ContactInput } from "@/lib/validation/schemas";
import { revalidatePath } from "next/cache";

const assertUser = async () => {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  return user;
};

export async function getCompanies() {
  await assertUser();

  return prisma.company.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
}

export async function createContact(data: ContactInput) {
  const user = await assertUser();

  authorize(user, "create_contact");

  const validated = contactSchema.parse(data);

  const contact = await prisma.contact.create({
    data: {
      name: validated.name,
      email: validated.email || null,
      phone: validated.phone || null,
      jobTitle: validated.jobTitle || null,
      companyId: validated.companyId || null,
      ownerId: user.id,
      source: validated.source || null,
    },
  });

  await prisma.activity.create({
    data: {
      type: "STATUS_CHANGE",
      title: "Contact Created",
      description: `New contact "${validated.name}" added`,
      userId: user.id,
      contactId: contact.id,
    },
  });

  await prisma.notification.create({
    data: {
      userId: user.id,
      message: `New contact created: ${validated.name}`,
      link: "/contacts",
    },
  });

  revalidatePath("/contacts");
  revalidatePath("/dashboard");
  return { success: true, contact };
}

export async function updateContact(id: string, data: ContactInput) {
  const user = await assertUser();

  const level = authorize(user, "edit_any_contact");
  const ownershipFilter = buildOwnershipFilter(level, user.id, "ownerId");

  const validated = contactSchema.parse(data);

  const result = await prisma.contact.updateMany({
    where: { id, ...ownershipFilter },
    data: {
      name: validated.name,
      email: validated.email || null,
      phone: validated.phone || null,
      jobTitle: validated.jobTitle || null,
      companyId: validated.companyId || null,
      source: validated.source || null,
    } as Prisma.ContactUpdateManyMutationInput,
  });

  if (result.count === 0) {
    throw new Error(
      "Contact not found or you don't have permission to update it"
    );
  }

  const updated = await prisma.contact.findUniqueOrThrow({
    where: { id },
    include: { company: { select: { id: true, name: true } } },
  });

  await prisma.activity.create({
    data: {
      type: "STATUS_CHANGE",
      title: "Contact Updated",
      description: `Contact "${validated.name}" updated`,
      userId: user.id,
      contactId: id,
    },
  });

  revalidatePath("/contacts");
  revalidatePath("/dashboard");
  return { success: true, contact: updated };
}

export async function deleteContact(id: string) {
  const user = await assertUser();

  authorize(user, "delete_contact");

  await prisma.contact.delete({ where: { id } });

  revalidatePath("/contacts");
  return { success: true };
}