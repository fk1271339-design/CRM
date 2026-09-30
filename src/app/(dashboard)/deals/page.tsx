import { requireAuth } from "@/lib/auth";
import { getDeals } from "@/actions/deals";
import { DealsKanbanClient } from "@/components/deals/deals-kanban-client";

export default async function DealsPage() {
  await requireAuth();
  const deals = await getDeals();

  return <DealsKanbanClient initialDeals={deals} />;
}
