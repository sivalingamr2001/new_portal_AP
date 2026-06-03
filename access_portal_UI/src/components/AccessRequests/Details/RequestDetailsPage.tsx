import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import accessRequestApi from "@/api/accessRequestApi";
import { useAuth } from "@/context/AuthContext";
import RequestDetails from "./RequestDetailSheet";
import RequestDetailHeaders from "./RequestDetailHeader";

export type StepStatus = "idle" | "completed" | "inprogress" | "destructive";

export interface StepItem {
    id: number | string;
    title: string;
    sub: string;
    status: StepStatus;
    label?: string;
}

export const RequestDetailsPage = () => {
    const { requestId } = useParams<{ requestId: string }>();
    const id = requestId || "";
    const { currentUser } = useAuth();

    const [request, setRequest] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const accessReqId = Number(id);
        if (!accessReqId) {
            setLoading(false);
            return;
        }

        let isMounted = true;

        setLoading(true);
        accessRequestApi
            .getById(accessReqId)
            .then((response) => {
                if (!isMounted) return;
                setRequest(response?.value ?? null);
            })
            .catch(() => {
                if (!isMounted) return;
                setRequest(null);
            })
            .finally(() => {
                if (isMounted) setLoading(false);
            });

        return () => {
            isMounted = false;
        };
    }, [id]);

    const workflowSteps = useMemo<StepItem[]>(() => {
        if (!request) {
            return [
                { id: 1, title: "Loading request", sub: "Fetching live data…", status: "inprogress" },
                { id: 2, title: "Workflow", sub: "Please wait", status: "idle" },
            ];
        }

        const statusLabel =
            request.currentStatus === 1
                ? "Submitted"
                : request.currentStatus === 2
                    ? "Pending with HOD"
                    : request.currentStatus === 3
                        ? "Pending with IT"
                        : request.currentStatus === 4
                            ? "Approved"
                            : request.currentStatus === 5
                                ? "Expired"
                                : "In review";

        return [
            { id: 1, title: "Submission", sub: `Requested by ${request.userName || "user"}`, status: "completed" },
            { id: 2, title: "HOD Review", sub: currentUser?.hod?.hodName || "Assigned HOD", status: request.currentStatus >= 2 ? "completed" : "inprogress" },
            { id: 3, title: "IT Provisioning", sub: statusLabel, status: request.currentStatus >= 3 ? "completed" : "inprogress" },
            { id: 4, title: "Current State", sub: request.items?.length ? `${request.items.length} item(s)` : "No items", status: "idle" },
        ];
    }, [currentUser?.hod?.hodName, request]);

    return (
        <div className="sm:px-6 lg:px-2">
            <div className="mx-auto max-w-full space-y-8">
                <RequestDetailHeaders steps={workflowSteps} />

                <main className="rounded-3xl border border-slate-900 bg-slate-900/20 p-1 shadow-2xl backdrop-blur-md">
                    {loading && !request ? (
                        <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-8 text-sm text-slate-300">Loading live request details…</div>
                    ) : (
                        <RequestDetails
                            currentUserRole={(currentUser?.user?.role || "USER") as any}
                            currentUserId={currentUser?.user?.userId ?? 0}
                            hodName={currentUser?.hod?.hodName ?? null}
                            requestPayload={{
                                data: request ? [request] : []
                            }}
                        />
                    )}
                </main>
            </div>
        </div>
    );
};
