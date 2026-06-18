"use client";

import { useState } from "react";
import { X } from "lucide-react";

type FollowUp = {
  id: string;
  reason: string;
  next_follow_up_at: string;
  lead_id: string;
  leads?: any;
};

type FollowUpsBannerProps = {
  followUps: FollowUp[];
};

export function FollowUpsBanner({ followUps }: FollowUpsBannerProps) {
  const [isOpen, setIsOpen] = useState(true);

  if (!isOpen || !followUps || followUps.length === 0) return null;

  return (
    <section className="relative rounded-[16px] border-2 border-[#FAC54D] bg-[#FAC54D]/5 p-6 shadow-md animate-[slideUpFade_0.3s_ease-out_both]">
      <button
        onClick={() => setIsOpen(false)}
        className="absolute right-4 top-4 rounded-[6px] p-1.5 text-gray-500 hover:bg-[#FAC54D]/15 hover:text-black transition cursor-pointer"
        title="Close notification"
      >
        <X className="size-4" strokeWidth={2} />
      </button>

      <div className="flex items-center gap-2 mb-4 pr-8">
        <span className="relative flex h-3.5 w-3.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-red-500"></span>
        </span>
        <h2 className="text-sm font-extrabold uppercase tracking-wider text-[#b58b29]">
          Action Required: Upcoming Follow-ups ({followUps.length})
        </h2>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {followUps.map((fu) => {
          const leadObj = Array.isArray(fu.leads) ? fu.leads[0] : fu.leads;
          const leadName = leadObj?.name ?? "Lead";
          const timeLeft = new Date(fu.next_follow_up_at).getTime() - Date.now();
          const hoursLeft = Math.round(timeLeft / (1000 * 60 * 60));
          let timeText = "";
          if (hoursLeft < 0) {
            timeText = "Overdue";
          } else if (hoursLeft === 0) {
            timeText = "Due now";
          } else {
            timeText = `Due in ${hoursLeft}h`;
          }

          return (
            <a
              key={fu.id}
              href={`/leads?q=${encodeURIComponent(leadName)}&openFollowUps=${fu.lead_id}`}
              className="flex flex-col justify-between rounded-[12px] border border-[#FAC54D]/30 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[#FAC54D] hover:shadow-md"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="font-bold text-gray-900 text-sm">{leadName}</span>
                  <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full whitespace-nowrap ${hoursLeft < 0 ? 'bg-red-100 text-red-700' : 'bg-[#FAC54D]/20 text-gray-800'}`}>
                    {timeText}
                  </span>
                </div>
                <p className="text-xs font-semibold text-gray-600 line-clamp-2">
                  Reason: {fu.reason}
                </p>
              </div>
              <div className="mt-3 text-[11px] font-bold text-[#b58b29] text-right">
                View details →
              </div>
            </a>
          );
        })}
      </div>
    </section>
  );
}
