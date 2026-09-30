export function formatCurrency(amount: number | null | undefined): string {
  return `₹${(amount || 0).toLocaleString("en-IN")}`;
}

export function formatDate(
  date: Date | string | null | undefined
): string {
  if (!date) return "—";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }); // DD Mon YYYY  e.g. 14 Sep 2026
}

export function formatDateTime(
  date: Date | string | null | undefined
): string {
  if (!date) return "—";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "—";
  return `${formatDate(d)}, ${d.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}