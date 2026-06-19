import React from "react"

interface StatCardProps {
  title: string
  value: string
  subtext1: string
  subtext2?: string
  variant?: "default" | "danger"
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtext1,
  subtext2,
  variant = "default",
}) => {
  const isDanger = variant === "danger"
  return (
    <div
      className={`flex-1 rounded-lg border p-3 ${isDanger ? "border-amber-200 bg-amber-50/50" : "border-slate-200 bg-white"}`}
    >
      <div className="flex items-center justify-between font-medium tracking-wide text-slate-400">
        <span>{title}</span>
      </div>
      <div
        className={`mt-1 text-xl font-bold ${isDanger ? "text-amber-700" : "text-slate-800"}`}
      >
        {value}
      </div>
      <div className="mt-2 space-y-0.5 text-[10px] text-slate-400">
        <div>{subtext1}</div>
        {subtext2 && <div>{subtext2}</div>}
      </div>
    </div>
  )
}

export const HeaderStats: React.FC = () => {
  return (
    <div className="flex w-full gap-4">
      <StatCard title="Total Items" value="15" subtext1="7 approved · 7 open" />
      <StatCard
        title="Approved Qty"
        value="38,725"
        subtext1="confirmed units"
      />
      <StatCard
        title="Allocated (OA)"
        value="51,695"
        subtext1="133% fill rate"
      />
      <StatCard
        title="Unallocated"
        value="-12,970"
        subtext1="-33% remaining"
        variant="danger"
      />
      <StatCard
        title="Order Acknowledgements"
        value="15"
        subtext1="linked to approved items"
      />
    </div>
  )
}
