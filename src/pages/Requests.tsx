import { useEffect, useState } from "react";
import { api, ApiError } from "@/api/client";
import { Shell } from "@/components/Shell";

export type AccessRequestItem = {
  id: string;
  name: string;
  email: string;
  organization?: string | null;
  message?: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
  reviewedAt?: string | null;
  reviewedByEmail?: string | null;
  alreadyHasAccount?: boolean;
};

export function Requests() {
  const [requests, setRequests] = useState<AccessRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"ALL" | "PENDING" | "APPROVED" | "REJECTED">("ALL");
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.get<{ requests: AccessRequestItem[] }>("/api/v1/admin/access-requests");
      setRequests(data.requests);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load access requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchRequests();
  }, []);

  const handleApprove = async (id: string, name: string) => {
    if (!confirm(`Approve access request for ${name}?`)) return;
    try {
      setProcessingId(id);
      await api.post<{ approved: boolean }>(`/api/v1/admin/access-requests/${id}/approve`);
      setRequests((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: "APPROVED" } : r))
      );
      alert(`Approved access request for ${name}. Activation invite link has been generated!`);
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Failed to approve request");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id: string, name: string) => {
    if (!confirm(`Reject access request for ${name}?`)) return;
    try {
      setProcessingId(id);
      await api.post<{ rejected: boolean }>(`/api/v1/admin/access-requests/${id}/reject`);
      setRequests((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: "REJECTED" } : r))
      );
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Failed to reject request");
    } finally {
      setProcessingId(null);
    }
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
                        onClick={() => void handleApprove(req.id, req.name)}
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
    </Shell>
  );
}
