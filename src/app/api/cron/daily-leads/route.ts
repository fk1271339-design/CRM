import { runDailyLeadGeneration } from "@/actions/lead-generation";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

/**
 * Automated 1-run-per-day trigger for the Daily Lead Generator.
 *
 * Call target: https://<host>/api/cron/daily-leads
 * Must include header: Authorization: Bearer <CRON_SECRET>
 * For most providers (Vercel cron, GitHub Actions, Windows Task Scheduler)
 * schedule it once per day around 9:00 AM IST.
 *
 * The engine itself is idempotent (one batch per calendar date), so even a
 * double-fire cannot create more than 5 leads for the day.
 */
export async function GET() {
  const secret = process.env.CRON_SECRET;

  if (secret) {
    const headersList = await headers();
    const auth = headersList.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const result = await runDailyLeadGeneration(undefined, "AUTOMATIC");
    return Response.json(result);
  } catch (error) {
    console.error("Daily lead generation failed:", error);
    return Response.json(
      { error: "Daily lead generation failed", message: String(error) },
      { status: 500 }
    );
  }
}