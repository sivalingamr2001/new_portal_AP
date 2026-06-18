import React from 'react';

interface StatCardProps {
  title: string;
  value: string;
  subtext1: string;
  subtext2?: string;
  variant?: 'default' | 'danger';
}

const StatCard: React.FC<StatCardProps> = ({ title, value, subtext1, subtext2, variant = 'default' }) => {
  const isDanger = variant === 'danger';
  return (
    <div className={`flex-1 p-3 border rounded-lg ${isDanger ? 'bg-amber-50/50 border-amber-200' : 'bg-white border-slate-200'}`}>
      <div className="flex justify-between items-center text-slate-400 font-medium tracking-wide">
        <span>{title}</span>
      </div>
      <div className={`text-xl font-bold mt-1 ${isDanger ? 'text-amber-700' : 'text-slate-800'}`}>
        {value}
      </div>
      <div className="mt-2 text-[10px] text-slate-400 space-y-0.5">
        <div>{subtext1}</div>
        {subtext2 && <div>{subtext2}</div>}
      </div>
    </div>
  );
};

export const HeaderStats: React.FC = () => {
  return (
    <div className="flex gap-4 w-full">
      <StatCard title="Total Items" value="15" subtext1="7 approved · 7 open" />
      <StatCard title="Approved Qty" value="38,725" subtext1="confirmed units" />
      <StatCard title="Allocated (OA)" value="51,695" subtext1="133% fill rate" />
      <StatCard title="Unallocated" value="-12,970" subtext1="-33% remaining" variant="danger" />
      <StatCard title="Order Acknowledgements" value="15" subtext1="linked to approved items" />
    </div>
  );
};
