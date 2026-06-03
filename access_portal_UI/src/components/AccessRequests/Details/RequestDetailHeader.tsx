import { cn } from "@/lib/utils";
import { AlertCircle, ArrowLeft, ArrowRight, Check } from "lucide-react";

export type StepStatus = "idle" | "completed" | "inprogress" | "destructive";

export interface StepItem {
    id: number | string;
    title: string;
    sub: string;
    status: StepStatus;
    label?: string;
}

interface RequestDetailHeadersProps {
    steps?: StepItem[];
    className?: string;
}

const defaultSteps: StepItem[] = [
    { id: 1, title: "Current Status", sub: "Submitted", status: "completed" },
    { id: 2, title: "Cash Flow", sub: "Pending with IT", status: "inprogress" },
    { id: 3, title: "Assumptions", sub: "Awaiting review", status: "idle" },
    { id: 4, title: "Results", sub: "Projections", status: "idle" },
];

export const RequestDetailHeaders = ({
    steps = defaultSteps,
    className,
}: RequestDetailHeadersProps) => {
    return (
        <div className={cn("w-full px-2 py-2 md:px-0", className)}>
            <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 rounded-3xl border border-border/70 bg-card p-4 shadow-[0_18px_35px_-18px_rgba(15,23,42,0.35)] backdrop-blur-xl md:flex-row md:items-center md:justify-between md:px-6 md:py-5">
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <ArrowLeft className="h-4 w-4" />
                    <span className="font-medium text-foreground">Request progress</span>
                </div>

                <div className="grid flex-1 gap-3 md:grid-cols-4">
                    {steps.map((step, index) => {
                        const isLast = index === steps.length - 1;

                        return (
                            <div key={step.id} className="relative flex items-center gap-3 rounded-2xl border border-border/70 bg-card p-3 shadow-sm">
                                <div
                                    className={cn(
                                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-xs font-bold transition-all duration-300",
                                        {
                                            "border-emerald-500 bg-emerald-500 text-slate-950": step.status === "completed",
                                            "border-emerald-500 bg-emerald-500/10 text-emerald-600 shadow-[0_0_14px_rgba(16,185,129,0.18)]": step.status === "inprogress",
                                            "border-rose-500 bg-rose-500/10 text-rose-600": step.status === "destructive",
                                            "border-border bg-slate-100 text-slate-500 dark:bg-slate-800/80 dark:text-slate-400": step.status === "idle",
                                        }
                                    )}
                                >
                                    {step.status === "completed" && <Check className="h-4 w-4 stroke-3" />}
                                    {step.status === "destructive" && <AlertCircle className="h-4 w-4" />}
                                    {step.status !== "completed" && step.status !== "destructive" && (
                                        <span>{step.label || index + 1}</span>
                                    )}
                                </div>

                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-semibold text-foreground">{step.title}</p>
                                    <p className={cn("truncate text-[11px] font-medium", {
                                        "text-emerald-600 dark:text-emerald-400": step.status === "inprogress",
                                        "text-rose-600 dark:text-rose-400": step.status === "destructive",
                                        "text-muted-foreground": step.status !== "inprogress" && step.status !== "destructive",
                                    })}>{step.sub}</p>
                                </div>

                                {!isLast && (
                                    <ArrowRight className="absolute -right-2 top-1/2 hidden h-4 w-4 -translate-y-1/2 text-border md:block" />
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default RequestDetailHeaders;
