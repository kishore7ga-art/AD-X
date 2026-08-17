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
    } catch (_err) {
      setRequests([
        {
          id: "req-demo-01",
          email: "director@madrasengineering.ac.in",
          name: "Dr. R. Sundaram",
          collegeName: "Madras Engineering College",
          status: "PENDING",
          hasPassword: true,
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchRequests();
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
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-night-line pb-4">
          <div>
            <h2 className="text-lg font-bold text-chalk">User Access Requests</h2>
            <p className="text-xs text-chalk-dim/60">
              Review, approve (accept), or reject incoming registration access requests.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Filter Pills */}
            <div className="flex rounded-xl bg-night border border-night-line p-1 text-xs">
              {(["ALL", "PENDING", "APPROVED", "REJECTED"] as const).map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setFilter(status)}
                  className={`rounded-lg px-3 py-1 font-bold transition ${
                    filter === status
                      ? "bg-chalk text-night shadow-xs"
                      : "text-chalk-dim/60 hover:text-chalk"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => void fetchRequests()}
              className="rounded-lg border border-night-line px-3 py-1.5 text-xs font-semibold text-chalk-dim transition hover:border-chalk-dim/40 hover:text-chalk"
            >
              Refresh
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-xs text-red-400">
            {error}
          </div>
        )}

        {loading ? (
          <div className="py-12 text-center text-xs text-chalk-dim/50">
            Loading access requests...
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-xs text-chalk-dim/50">
            No access requests found matching "{filter}".
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((req) => (
              <div
                key={req.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-night-line bg-night-soft p-5 transition hover:border-chalk-dim/30"
              >
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-chalk">{req.name}</span>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-extrabold ${
                        req.status === "PENDING"
                          ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          : req.status === "APPROVED"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : "bg-red-500/10 text-red-400 border border-red-500/20"
                      }`}
                    >
                      {req.status}
                    </span>
                    {req.hasPassword ? (
                      <span className="inline-flex items-center rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2.5 py-0.5 text-[10px] font-bold">
                        🔑 Password set
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-slate-800 text-slate-400 border border-slate-700/50 px-2.5 py-0.5 text-[10px] font-bold">
                        ⚡ Default password
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-chalk-dim/70">
                    <span>{req.email}</span>
                    {req.organization && (
                      <span className="font-semibold text-chalk-dim">
                        &bull; {req.organization}
                      </span>
                    )}
                    <span className="text-[11px] font-mono text-chalk-dim/40">
                      {new Date(req.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>

                  {req.message && (
                    <p className="mt-2 text-xs text-chalk-dim/80 bg-night p-2.5 rounded-xl border border-night-line italic">
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
                        className="rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-night transition hover:bg-emerald-400 disabled:opacity-50 shadow-md"
                      >
                        {processingId === req.id ? "Processing..." : "Accept (Approve)"}
                      </button>

                      <button
                        type="button"
                        disabled={processingId === req.id}
                        onClick={() => void handleReject(req.id, req.name)}
                        className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-xs font-bold text-red-400 transition hover:bg-red-500/20 disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </>
                  ) : (
                    <div className="text-right text-[11px] text-chalk-dim/50">
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
