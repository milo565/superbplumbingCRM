import type { ReactNode } from "react";
import { COMPANY } from "@/lib/constants";

export function CompanyLetterhead({
  extra,
}: {
  extra?: ReactNode;
}) {
  return (
    <div className="flex justify-between gap-4 mb-6">
      <div>
        <p className="font-heading text-3xl uppercase text-navy">{COMPANY.name}</p>
        <p className="text-sm text-[#4b5c69]">{COMPANY.category}</p>
        <p className="text-sm text-[#4b5c69]">{COMPANY.address}</p>
        <p className="text-sm text-[#4b5c69]">ABN {COMPANY.abn} · GST included at 10%</p>
      </div>
      <div className="text-right text-sm">
        {extra}
        <p>
          <a className="text-blue font-semibold" href={COMPANY.phoneTel}>
            {COMPANY.phonePrimary}
          </a>
        </p>
        <p>{COMPANY.hours}</p>
        <p className="text-[#5b6b78]">{COMPANY.hoursSchedule}</p>
      </div>
    </div>
  );
}
