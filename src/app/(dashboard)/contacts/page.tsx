import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ContactsClient } from "@/components/contacts/contacts-client";

export default async function ContactsPage() {
  const user = await requireAuth();

  const [contacts, companies] = await Promise.all([
    prisma.contact.findMany({
      orderBy: { createdAt: "desc" },
      include: { company: { select: { id: true, name: true } } },
    }),
    prisma.company.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  return (
    <ContactsClient
      initialContacts={contacts}
      companies={companies}
      userRole={user.role}
    />
  );
}