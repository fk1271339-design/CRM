import { requireAuth } from "@/lib/auth";
import { getLeads } from "@/actions/leads";
import { LeadsClientPage } from "@/components/leads/leads-client";

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  await requireAuth();
  const params = await searchParams;
  const leads = await getLeads(params.q, params.status);

  const query = params.q || "";
  const status = params.status || "ALL";

  return (
    <LeadsClientPage
      key={`${query}|${status}`}
      initialLeads={leads}
      currentQuery={query}
      currentStatus={status}
    />
  );
}
