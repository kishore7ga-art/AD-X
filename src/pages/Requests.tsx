import { useEffect, useState } from "react";
import { api, ApiError } from "@/api/client";
import { Shell } from "@/components/Shell";
import { ModalDialog } from "@/components/ModalDialog";
import type { ModalDialogState } from "@/components/ModalDialog";

export type AccessRequest = {
  id: string;
  name: string;
  email: string;
  hasPassword?: boolean;
  collegeName?: string;
  subdomain?: string;
  role?: string;
  organization?: string | null;
  message?: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
  reviewedAt?: string | null;
  reviewedByEmail?: string | null;
  alreadyHasAccount?: boolean;
};

export function Requests() {
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"ALL" | "PENDING" | "APPROVED" | "REJECTED">("ALL");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [modalConfig, setModalConfig] = useState<ModalDialogState | null>(null);

  const showAlert = (title: string, message: string, variant: "success" | "danger" | "info" | "warning" = "info") => {
    setModalConfig({
      isOpen: true,
      type: "alert",
      variant,
      title,
      message,
      confirmText: "OK",
      onConfirm: () => setModalConfig(null),
    });
  };

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api
        .get<{ requests: AccessRequest[] }>("/api/v1/admin/access-requests?status=ALL");
      setRequests(data.requests || []);
    } catch (err) {
      /**
       * Say that the list could not be loaded, rather than inventing one.
       *
       * This used to answer *any* failure — an expired admin session, a network
       * error, a 500 — by replacing the queue with a single hardcoded request
       * for a college that does not exist. Somebody watching this screen for new
       * signups saw a plausible-looking row and no real ones, with nothing to
       * suggest the call had failed at all. Between that and the API answering
       * "received" for requests it had failed to write, a submission could go
       * missing at either end without anyone seeing an error.
       */
      setError(
        err instanceof Error
          ? `Could not load access requests: ${err.message}`
          : "Could not load access requests.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchRequests();

    /**
     * The queue is something a person watches while people are signing up, so it
     * refreshes itself. Fifteen seconds is short enough to feel live and long
     * enough that an idle tab is not a load generator.
     */
    const timer = setInterval(() => void fetchRequests(), 15_000);
    return () => clearInterval(timer);
  }, []);

  const handleApprove = (reqItem: AccessRequest) => {
    const pwdNotice = reqItem.hasPassword
      ? "User set a custom password during registration. Approving will activate their account with their requested password."
      : "No custom password was set by user. Default initial password 'college123' will be set.";

    setModalConfig({
      isOpen: true,
      type: "confirm",
      variant: "success",
      title: `Approve Access for ${reqItem.name}?`,
      message: `Are you sure you want to approve and activate the access request for ${reqItem.name} (${reqItem.email})?\n\n${pwdNotice}`,
      confirmText: "Approve & Activate",
      cancelText: "Cancel",
      onCancel: () => setModalConfig(null),
      onConfirm: async () => {
        setModalConfig(null);
        try {
          setProcessingId(reqItem.id);
          await api.post<{ approved: boolean }>(
            `/api/v1/admin/access-requests/${reqItem.id}/approve`,
            {}
          );
          setRequests((prev) =>
            prev.map((r) => (r.id === reqItem.id ? { ...r, status: "APPROVED" } : r))
          );
          showAlert(
            "Access Approved!",
            `Account activated for ${reqItem.name} (${reqItem.email}). User can now log in using their password!`,
            "success"
          );
        } catch (err) {
          showAlert("Approval Failed", err instanceof ApiError ? err.message : "Failed to approve request", "danger");
        } finally {
          setProcessingId(null);
        }
      },
    });
  };

  const handleReject = (id: string, name: string) => {
    setModalConfig({
      isOpen: true,
      type: "confirm",
      variant: "warning",
      title: `Reject Request for ${name}?`,
      message: `Are you sure you want to reject the access request for ${name}?`,
      confirmText: "Reject Request",
      cancelText: "Cancel",
      onCancel: () => setModalConfig(null),
      onConfirm: async () => {
        setModalConfig(null);
        try {
          setProcessingId(id);
          await api.post<{ rejected: boolean }>(`/api/v1/admin/access-requests/${id}/reject`);
          setRequests((prev) =>
            prev.map((r) => (r.id === id ? { ...r, status: "REJECTED" } : r))
          );
          showAlert("Request Rejected", `Access request for ${name} has been rejected.`, "info");
        } catch (err) {
          showAlert("Rejection Failed", err instanceof ApiError ? err.message : "Failed to reject request", "danger");
        } finally {
          setProcessingId(null);
        }
      },
    });
  };

  const filtered = requests.filter((r) => {
    if (filter === "ALL") return true;
    return r.status === filter;
  });

  return (
    <Shell title="Access Requests">
      <div className="space-y-6">
        {/* Top Header & Action Filter Bar */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-extrabold text-slate-900">User Access Requests</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Review, approve (accept), or reject incoming college registration requests.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Filter Pills */}
            <div className="flex rounded-2xl bg-slate-100 p-1 text-xs border border-slate-200/60">
              {(["ALL", "PENDING", "APPROVED", "REJECTED"] as const).map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setFilter(status)}
                  className={`rounded-xl px-3.5 py-1.5 font-bold transition cursor-pointer ${
                    filter === status
                      ? "bg-white text-slate-900 shadow-xs border border-slate-200/60"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => void fetchRequests()}
              className="rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-700 transition shadow-xs cursor-pointer"
            >
              🔄 Refresh
            </button>
          </div>
        </div>

        {/* 3 Stats Overview for Requests */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs flex flex-col justify-between">
            <span className="text-xs font-extrabold text-slate-500">Total Requests</span>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-3xl font-black text-slate-900 tabular-nums">{requests.length}</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                All time
              </span>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs flex flex-col justify-between">
            <span className="text-xs font-extrabold text-amber-600">Pending Review</span>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-3xl font-black text-slate-900 tabular-nums">
                {requests.filter((r) => r.status === "PENDING").length}
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                Action needed
              </span>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs flex flex-col justify-between">
            <span className="text-xs font-extrabold text-emerald-600">Approved Colleges</span>
            <div className="mt-3 flex items-baseline justify-between">
              <span className="text-3xl font-black text-slate-900 tabular-nums">
                {requests.filter((r) => r.status === "APPROVED").length}
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                Active
              </span>
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-2xl bg-red-50 border border-red-200 p-4 text-xs font-bold text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="bg-white rounded-3xl p-12 text-center text-xs text-slate-400 border border-slate-200/80 shadow-xs">
            Loading access requests...
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center text-xs text-slate-400 border border-slate-200/80 shadow-xs">
            No access requests found matching "{filter}".
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((req) => (
              <div
                key={req.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl border border-slate-200/80 bg-white p-5 transition-all hover:shadow-sm hover:border-cyan-300"
              >
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-extrabold text-slate-900">{req.name}</span>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-extrabold ${
                        req.status === "PENDING"
                          ? "bg-amber-50 text-amber-700 border border-amber-200"
                          : req.status === "APPROVED"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-rose-50 text-rose-700 border border-rose-200"
                      }`}
                    >
                      {req.status}
                    </span>
                    {req.hasPassword ? (
                      <span className="inline-flex items-center rounded-full bg-cyan-50 text-cyan-700 border border-cyan-200 px-2.5 py-0.5 text-[10px] font-bold">
                        🔑 Password set
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-slate-100 text-slate-600 border border-slate-200 px-2.5 py-0.5 text-[10px] font-bold">
                        ⚡ Default password
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                    <span className="font-semibold text-slate-700">{req.email}</span>
                    {req.collegeName && (
                      <span className="font-bold text-slate-900">
                        &bull; {req.collegeName}
                      </span>
                    )}
                    {req.organization && (
                      <span className="font-medium text-slate-600">
                        &bull; {req.organization}
                      </span>
                    )}
                    <span className="text-[11px] font-mono text-slate-400">
                      {new Date(req.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>

                  {req.message && (
                    <p className="mt-2 text-xs text-slate-600 bg-slate-50 p-3 rounded-2xl border border-slate-100 italic">
                      "{req.message}"
                    </p>
                  )}
                </div>

                {/* Actions: Accept (Approve) & Reject */}
                <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0">
                  {req.status === "PENDING" ? (
                    <>
                      <button
                        type="button"
                        disabled={processingId === req.id}
                        onClick={() => void handleApprove(req)}
                        className="rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 px-4 py-2 text-xs font-extrabold text-white transition disabled:opacity-50 shadow-sm cursor-pointer"
                      >
                        {processingId === req.id ? "Processing..." : "Accept (Approve)"}
                      </button>

                      <button
                        type="button"
                        disabled={processingId === req.id}
                        onClick={() => void handleReject(req.id, req.name)}
                        className="rounded-2xl border border-rose-200 bg-rose-50 hover:bg-rose-100 px-3.5 py-2 text-xs font-extrabold text-rose-600 transition disabled:opacity-50 cursor-pointer"
                      >
                        Reject
                      </button>
                    </>
                  ) : (
                    <div className="text-right text-[11px] text-slate-400 font-mono">
                      Reviewed by {req.reviewedByEmail || "Admin"}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {modalConfig && <ModalDialog {...modalConfig} />}
    </Shell>
  );
}
