import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Building2, Globe, Calendar, MapPin } from "lucide-react";
import { formatDate } from "@/lib/format";

export default async function CompaniesPage() {
  await requireAuth();

  const companies = await prisma.company.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { contacts: true, deals: true } },
    },
  });

  return (
    <div className="space-y-6 p-6 md:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
            <Building2 className="w-7 h-7 text-emerald-400" />
            Accounts & Companies
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Enterprise client organizations and associated deals.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {companies.map((company) => (
          <div
            key={company.id}
            className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-xl space-y-3 hover:border-emerald-500/40 transition-all group"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-100 group-hover:text-emerald-300 transition-colors">
                {company.name}
              </h3>
              {company.industry && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {company.industry}
                </span>
              )}
            </div>

            <div className="space-y-1.5 text-xs text-slate-400">
              {company.website && (
                <div className="flex items-center gap-2">
                  <Globe className="w-3.5 h-3.5 text-slate-500" />
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:underline text-emerald-400"
                  >
                    {company.website}
                  </a>
                </div>
              )}
              {company.address && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" />
                  <span>{company.address}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-slate-600" />
                <span>Added: {formatDate(company.createdAt)}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
              <span>{company._count.contacts} Contacts</span>
              <span>{company._count.deals} Active Deals</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
