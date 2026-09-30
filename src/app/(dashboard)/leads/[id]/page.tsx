import { requireAuth } from "@/lib/auth";
import { getLeadDetail } from "@/actions/lead-detail";
import { LeadDetailClient } from "@/components/leads/lead-detail-client";
import { notFound } from "next/navigation";

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAuth();
  const { id } = await params;

  let lead;
  try {
    lead = await getLeadDetail(id);
  } catch {
    notFound();
  }

  return <LeadDetailClient key={lead.id} lead={lead} />;
}