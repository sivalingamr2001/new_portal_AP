import React, { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock,
  Download,
  Folder,
  Mail,
  RefreshCw,
  Shield,
  Trash2,
  User as UserIcon,
  XCircle,
} from "lucide-react";

export type UserRole = "ADMIN" | "HOD" | "OPERATOR" | "USER";

export interface AccessItem {
  accessItemId: number;
  ticketNumber: string;
  folderPath: string;
  accessType: number;
  confirmAccessType: number;
  reason: string;
  rejectionReason: string | null;
  status: number;
  hodApproverId: number;
  itApproverId: number | null;
  requestedAtUtc: string;
  lastActionAtUtc: string;
  approvedAtUtc: string | null;
  expiresAtUtc: string | null;
  approvals: any[];
}

export interface RequestData {
  accessReqId: number;
  userId: number;
  userName: string;
  userEmail: string;
  reqTo: number;
  isAgreed: boolean;
  itsrNo: string | null;
  currentStatus: number;
  currentApproverId: number;
  requestedAtUtc: string;
  lastActionAtUtc: string;
  items: AccessItem[];
}

interface RequestDetailsProps {
  currentUserRole: UserRole;
  currentUserId: number;
  hodName?: string | null;
  requestPayload: {
    data: RequestData[];
  };
  onApprove?: (requestId: number, itemId: number, notes?: string) => void;
  onReject?: (requestId: number, itemId: number, reason: string) => void;
  onRevoke?: (requestId: number, itemId: number) => void;
  onResubmit?: (requestId: number, itemId: number, updatedData: any) => void;
  onRenew?: (requestId: number, itemId: number, duration: string) => void;
  onExport?: (requestId: number) => void;
}

const getStatusDetails = (status: number) => {
  switch (status) {
    case 1:
      return { text: "Pending HOD", bg: "bg-amber-500/10 text-amber-600 border-amber-500/20", icon: Clock };
    case 2:
      return { text: "Pending IT Operator", bg: "bg-blue-500/10 text-blue-600 border-blue-500/20", icon: Shield };
    case 3:
      return { text: "Active / Approved", bg: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20", icon: CheckCircle2 };
    case 4:
      return { text: "Rejected", bg: "bg-rose-500/10 text-rose-600 border-rose-500/20", icon: XCircle };
    case 5:
      return { text: "Expired", bg: "bg-slate-500/10 text-slate-400 border-slate-500/20", icon: AlertTriangle };
    case 6:
      return { text: "Revoked", bg: "bg-violet-500/10 text-violet-500 border-violet-500/20", icon: Trash2 };
    default:
      return { text: "Unknown", bg: "bg-slate-500/10 text-slate-400 border-slate-500/20", icon: AlertTriangle };
  }
};

const getAccessTypeLabel = (type: number) => {
  if (type === 1) return "Read Only";
  if (type === 2) return "Read & Write";
  return "Full Control";
};

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return "N/A";
  return new Date(dateStr).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={(event) => event.stopPropagation()}
          className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900"
          role="dialog"
          aria-modal="true"
        >
          <h3 className="mb-4 text-lg font-semibold text-slate-900 dark:text-slate-50">{title}</h3>
          {children}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default function RequestDetails({
  currentUserRole,
  currentUserId,
  hodName,
  requestPayload,
  onApprove,
  onReject,
  onRevoke,
  onResubmit,
  onRenew,
  onExport,
}: RequestDetailsProps) {
  const request = useMemo(() => requestPayload?.data?.[0], [requestPayload]);
  const [activeModal, setActiveModal] = useState<"resubmit" | "renew" | "reject" | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [renewDuration, setRenewDuration] = useState("30");
  const [resubmitReason, setResubmitReason] = useState("");

  if (!request) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-slate-200 p-8 text-center dark:border-slate-800">
        <p className="text-sm text-slate-500 dark:text-slate-400">No request data found.</p>
      </div>
    );
  }

  const isHod = currentUserRole === "HOD" || currentUserRole === "ADMIN";
  const isOperator = currentUserRole === "OPERATOR" || currentUserRole === "ADMIN";
  const isOwner = currentUserRole === "USER";

  const handleOpenModal = (type: "resubmit" | "renew" | "reject", itemId: number) => {
    setSelectedItemId(itemId);
    setActiveModal(type);
  };

  const handleModalClose = () => {
    setActiveModal(null);
    setSelectedItemId(null);
    setRejectionReason("");
    setResubmitReason("");
  };

  return (
    <div className="w-full space-y-6 rounded-3xl border border-border/70 bg-background/70 p-4 text-foreground shadow-[0_18px_40px_-18px_rgba(15,23,42,0.35)] md:p-6">
      <div className="flex flex-col gap-4 rounded-3xl border border-border/70 bg-card p-5 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            <span>Request Panel</span>
            <ChevronRight className="h-3 w-3" />
            <span className="text-muted-foreground">#{request.accessReqId}</span>
          </div>
          <h1 className="mt-2 text-xl font-semibold tracking-tight text-foreground md:text-2xl">Access Request Overview</h1>
          <p className="text-sm text-muted-foreground">Live request details from the API.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {(currentUserRole === "ADMIN" || currentUserRole === "OPERATOR") && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onExport?.(request.accessReqId)}
              className="inline-flex h-8 items-center gap-2 rounded-xl border border-border bg-card px-3 text-xs font-semibold text-card-foreground shadow-sm transition-colors hover:bg-accent/10"
            >
              <Download className="h-3.5 w-3.5" />
              Export
            </motion.button>
          )}
          <button
            type="button"
            onClick={() => onApprove?.(request.accessReqId, request.items[0]?.accessItemId ?? 0)}
            className="inline-flex h-8 items-center gap-2 rounded-xl bg-primary px-3 text-xs font-semibold text-primary-foreground shadow-sm transition-colors hover:opacity-90"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </button>
        </div>
      </div>

      <section className="rounded-3xl border border-border/70 bg-card p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">Requester & HOD Details</h2>
            <p className="text-xs text-muted-foreground">Single card view with key/value details.</p>
          </div>
          <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">{request.items.length} item(s)</span>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <DetailRow label="User Name" value={request.userName} icon={UserIcon} />
          <DetailRow label="User ID" value={String(currentUserId || request.userId)} icon={Shield} />
          <DetailRow label="Email" value={request.userEmail || "No email found"} icon={Mail} />
          <DetailRow label="HOD Name" value={hodName || `Approver #${request.reqTo}`} icon={CalendarDays} />
          <DetailRow label="Requested On" value={formatDate(request.requestedAtUtc)} icon={CalendarDays} />
          <DetailRow label="Last Updated" value={formatDate(request.lastActionAtUtc)} icon={Clock} />
          <DetailRow label="Current Status" value={getStatusDetails(request.currentStatus).text} icon={Shield} />
          <DetailRow label="ITSR No." value={request.itsrNo || "Not provided"} icon={Folder} />
        </div>
      </section>

      <section className="rounded-3xl border border-border/70 bg-card p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">Requested Access Items</h2>
            <p className="text-xs text-muted-foreground">Using the actual API response for each item.</p>
          </div>
        </div>

        <div className="space-y-4">
          {request.items.map((item) => {
            const status = getStatusDetails(item.status);
            const StatusIcon = status.icon;

            return (
              <article key={item.accessItemId} className="rounded-3xl border border-border/70 bg-background/90 p-4 shadow-sm">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">{item.ticketNumber}</span>
                      <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${status.bg}`}>
                        <StatusIcon className="h-3.5 w-3.5" />
                        {status.text}
                      </span>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      <DetailRow label="Folder Path" value={item.folderPath} icon={Folder} />
                      <DetailRow label="Access Type" value={getAccessTypeLabel(item.accessType)} icon={Shield} />
                      <DetailRow label="Reason" value={item.reason || "No reason provided"} icon={Mail} />
                      <DetailRow label="Valid Until" value={item.expiresAtUtc ? formatDate(item.expiresAtUtc) : "No expiry date set"} icon={CalendarDays} />
                    </div>

                    {item.rejectionReason && (
                      <p className="rounded-xl border border-rose-200 bg-rose-50/80 p-3 text-xs text-rose-700 dark:border-rose-950/60 dark:bg-rose-950/40 dark:text-rose-300">Rejection reason: {item.rejectionReason}</p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 md:justify-end">
                    {isOwner && (item.status === 4 || item.status === 5 || item.status === 6) && (
                      <>
                        <button onClick={() => { handleOpenModal("resubmit", item.accessItemId); onResubmit?.(request.accessReqId, item.accessItemId, { reason: resubmitReason }); }} className="inline-flex h-8 items-center rounded-xl bg-primary px-3 text-xs font-semibold text-primary-foreground shadow-sm hover:opacity-90">Resubmit</button>
                        <button onClick={() => { handleOpenModal("renew", item.accessItemId); onRenew?.(request.accessReqId, item.accessItemId, renewDuration); }} className="inline-flex h-8 items-center rounded-xl border border-border bg-card px-3 text-xs font-semibold text-card-foreground shadow-sm hover:bg-accent/10">Renew</button>
                      </>
                    )}
                    {isHod && item.status === 1 && (
                      <>
                        <button onClick={() => handleOpenModal("reject", item.accessItemId)} className="inline-flex h-8 items-center rounded-xl border border-rose-200 bg-white px-3 text-xs font-semibold text-rose-600 shadow-sm hover:bg-rose-50 dark:border-rose-950 dark:bg-slate-950 dark:text-rose-400 dark:hover:bg-rose-950/40">Reject</button>
                        <button onClick={() => onApprove?.(request.accessReqId, item.accessItemId)} className="inline-flex h-8 items-center rounded-xl bg-primary px-3 text-xs font-semibold text-primary-foreground shadow-sm hover:opacity-90">Approve</button>
                      </>
                    )}
                    {isOperator && (
                      <>
                        {item.status === 2 && (
                          <>
                            <button onClick={() => handleOpenModal("reject", item.accessItemId)} className="inline-flex h-8 items-center rounded-xl border border-rose-200 bg-white px-3 text-xs font-semibold text-rose-600 shadow-sm hover:bg-rose-50 dark:border-rose-950 dark:bg-slate-950 dark:text-rose-400 dark:hover:bg-rose-950/40">Reject</button>
                            <button onClick={() => onApprove?.(request.accessReqId, item.accessItemId)} className="inline-flex h-8 items-center rounded-xl bg-emerald-600 px-3 text-xs font-semibold text-white shadow-sm hover:bg-emerald-500">Provision</button>
                          </>
                        )}
                        {item.status === 3 && (
                          <button onClick={() => onRevoke?.(request.accessReqId, item.accessItemId)} className="inline-flex h-8 items-center rounded-xl border border-violet-200 bg-white px-3 text-xs font-semibold text-violet-600 shadow-sm hover:bg-violet-50 dark:border-violet-900/40 dark:bg-slate-950 dark:text-violet-400 dark:hover:bg-violet-950/40">Revoke</button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <Modal isOpen={activeModal === "reject"} onClose={handleModalClose} title="Reject Access Request">
        <div className="space-y-4">
          <label className="block text-sm text-slate-700 dark:text-slate-200">Reason for rejection</label>
          <textarea rows={3} value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-900 outline-none transition-all focus:border-indigo-500 focus:bg-white dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-indigo-400 dark:focus:bg-slate-900" />
          <div className="flex justify-end gap-2">
            <button onClick={handleModalClose} className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">Cancel</button>
            <button disabled={!rejectionReason.trim()} onClick={() => { if (selectedItemId) { onReject?.(request.accessReqId, selectedItemId, rejectionReason); handleModalClose(); } }} className="rounded-xl bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-rose-500 disabled:opacity-40">Confirm Rejection</button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={activeModal === "renew"} onClose={handleModalClose} title="Renew Access Window">
        <div className="space-y-4">
          <label className="block text-sm text-slate-700 dark:text-slate-200">Extended lifetime duration</label>
          <select value={renewDuration} onChange={(e) => setRenewDuration(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2 text-sm text-slate-900 outline-none transition-all focus:border-indigo-500 focus:bg-white dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-indigo-400 dark:focus:bg-slate-900">
            <option value="7">Extend by 7 Days</option>
            <option value="30">Extend by 30 Days</option>
            <option value="90">Extend by 90 Days</option>
          </select>
          <div className="flex justify-end gap-2">
            <button onClick={handleModalClose} className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">Cancel</button>
            <button onClick={() => { if (selectedItemId) { onRenew?.(request.accessReqId, selectedItemId, renewDuration); handleModalClose(); } }} className="rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500">Request Renewal</button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={activeModal === "resubmit"} onClose={handleModalClose} title="Resubmit Access Case">
        <div className="space-y-4">
          <label className="block text-sm text-slate-700 dark:text-slate-200">Updated justification notes</label>
          <textarea rows={3} value={resubmitReason} onChange={(e) => setResubmitReason(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-900 outline-none transition-all focus:border-indigo-500 focus:bg-white dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-indigo-400 dark:focus:bg-slate-900" />
          <div className="flex justify-end gap-2">
            <button onClick={handleModalClose} className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">Cancel</button>
            <button disabled={!resubmitReason.trim()} onClick={() => { if (selectedItemId) { onResubmit?.(request.accessReqId, selectedItemId, { reason: resubmitReason }); handleModalClose(); } }} className="rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-40">Resubmit Request</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function DetailRow({ label, value, icon: Icon }: { label: string; value: string; icon: React.ElementType }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-background/90 p-3 shadow-sm">
      <div className="mb-1 flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </div>
      <div className="text-sm font-medium text-foreground">{value}</div>
    </div>
  );
}
