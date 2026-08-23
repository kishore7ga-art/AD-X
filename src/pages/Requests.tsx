import { useEffect, useState } from "react";
import { api, ApiError } from "@/api/client";
import { Shell } from "@/components/Shell";
import { ModalDialog } from "@/components/ModalDialog";
import { StatTile } from "@/components/StatTile";
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
  // Opens on the requests that need a decision. "ALL" put 800 already-handled
  // rows in front of the handful waiting on somebody.
  const [filter, setFilter] = useState<"ALL" | "PENDING" | "APPROVED" | "REJECTED">("PENDING");
  const [search, setSearch] = useState("");
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
    /**
     * What approving actually does, rather than what it used to do.
     *
     * This notice promised "Default initial password 'college123' will be set",
     * and the success alert that followed said the user could log in with their
     * password — both true once, neither true now. An account approved without
     * a password of its own is created with CSPRNG output nobody is told, and
     * the activation link is the only way in. Telling an administrator that
     * somebody can sign in when they cannot is worse than telling them nothing:
     * it is the reason the failure gets discovered by the applicant.
     */
    const pwdNotice = reqItem.hasPassword
      ? "They chose a password when they applied. Approving activates the account with that password, and they can sign in straight away."
      : "They did not choose a password. The account is created with a random one nobody is told — the way in is the activation link, which is emailed on approval.";

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
          const result = await api.post<{
            approved: boolean;
            delivered?: boolean;
            deliveryError?: string;
            activationUrl?: string;
          }>(`/api/v1/admin/access-requests/${reqItem.id}/approve`, {});
          setRequests((prev) =>
            prev.map((r) => (r.id === reqItem.id ? { ...r, status: "APPROVED" } : r))
          );

          /**
           * Say whether the invite actually went out.
           *
           * The API has always reported `delivered`, and this screen has always
           * ignored it — so a deployment with no `RESEND_API_KEY` approved
           * college after college, told the administrator each one was ready,
           * and left every applicant with no way to sign in. When delivery
           * fails the API now hands back the activation link, and the only
           * useful thing to do with it is put it in front of the person who can
           * pass it on.
           */
          if (result?.delivered === false) {
            showAlert(
              "Approved — but the invite email did not send",
              `${reqItem.name} (${reqItem.email}) is approved and the account exists.\n\n` +
                `The email could not be sent${result.deliveryError ? `: ${result.deliveryError}` : ""}.\n\n` +
                (result.activationUrl
                  ? `Send them this activation link yourself — it is the only way into the account, and it expires:\n\n${result.activationUrl}`
                  : reqItem.hasPassword
                    ? "They chose their own password when applying, so they can still sign in with it."
                    : "There is no way into this account until mail delivery is configured. Set a password for them from the Users screen."),
              "warning",
            );
          } else {
            showAlert(
              "Access Approved",
              `${reqItem.name} (${reqItem.email}) is approved and the activation link has been emailed to them.` +
                (reqItem.hasPassword
                  ? " They can also sign in with the password they chose when applying."
                  : ""),
              "success",
            );
          }
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

  /**
   * Status, then search.
   *
   * The queue holds over a thousand rows, the great majority of them seed and
   * test addresses, and the only control on the screen was a status tab. A
   * genuine new request landed at the top of a list nobody could scan and was
   * reported as "not appearing in the admin panel" — it was there, it was first,
   * and it was indistinguishable from a thousand rows of noise.
   */
  const needle = search.trim().toLowerCase();
  const filtered = requests.filter((r) => {
    if (filter !== "ALL" && r.status !== filter) return false;
    if (!needle) return true;
    return (
      r.email.toLowerCase().includes(needle) ||
      (r.name || "").toLowerCase().includes(needle) ||
      (r.collegeName || "").toLowerCase().includes(needle)
    );
  });

  return (
    <Shell title="Access Requests">
      <div className="space-y-6">
        {/* Top Header & Action Filter Bar */}
        <div className="bg-white rounded-xl p-5 border border-night-line flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-chalk">User Access Requests</h2>
            <p className="text-xs text-chalk-dim mt-0.5">
              Review, approve (accept), or reject incoming college registration requests.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Filter Pills */}
            <div className="flex rounded-lg bg-night p-1 text-xs border border-night-line">
              {(["ALL", "PENDING", "APPROVED", "REJECTED"] as const).map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setFilter(status)}
                  className={`rounded-lg px-3.5 py-1.5 font-bold transition cursor-pointer ${
                    filter === status
                      ? "bg-white text-chalk  border border-night-line"
                      : "text-chalk-dim hover:text-chalk"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => void fetchRequests()}
              className="rounded-lg border border-night-line bg-white hover:bg-night px-3.5 py-2 text-xs font-bold text-chalk transition cursor-pointer"
            >
              🔄 Refresh
            </button>
          </div>
        </div>

        {/* 3 Stats Overview for Requests */}
        <div className="grid gap-4 sm:grid-cols-3">
          <StatTile
            label="Total Requests"
            sublabel="Every registration ever received"
            value={requests.length}
            badge="All time"
            tone="lilac"
          />
          <StatTile
            label="Pending Review"
            sublabel="Waiting on a decision from you"
            value={requests.filter((r) => r.status === "PENDING").length}
            badge="Action needed"
            tone="sun"
          />
          <StatTile
            label="Approved Colleges"
            sublabel="Accepted and provisioned"
            value={requests.filter((r) => r.status === "APPROVED").length}
            badge="Active"
            tone="mint"
          />
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-xs font-bold text-red-700">
            {error}
          </div>
        )}

        <div className="flex items-center gap-3">
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by email, name or college…"
            className="flex-1 rounded-lg border border-night-line bg-white px-4 py-2.5 text-xs font-medium text-chalk placeholder:text-chalk-dim outline-none focus:border-chalk"
          />
          <span className="shrink-0 text-[11px] font-bold text-chalk-dim">
            {filtered.length} of {requests.length}
          </span>
        </div>

        {loading ? (
          <div className="bg-white rounded-xl p-12 text-center text-xs text-chalk-dim border border-night-line">
            Loading access requests...
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center text-xs text-chalk-dim border border-night-line">
            No access requests match {needle ? `"${search}"` : `"${filter}"`}.
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((req) => (
              <div
                key={req.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-night-line bg-white p-5 transition-all hover:border-chalk/20 hover:border-chalk/25"
              >
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-chalk">{req.name}</span>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
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
                      <span className="inline-flex items-center rounded-full bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-0.5 text-[10px] font-bold">
                        🔑 Password set
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-night text-chalk-dim border border-night-line px-2.5 py-0.5 text-[10px] font-bold">
                        ⚡ Default password
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-chalk-dim">
                    <span className="font-semibold text-chalk">{req.email}</span>
                    {req.collegeName && (
                      <span className="font-bold text-chalk">
                        &bull; {req.collegeName}
                      </span>
                    )}
                    {req.organization && (
                      <span className="font-medium text-chalk-dim">
                        &bull; {req.organization}
                      </span>
                    )}
                    <span className="text-[11px] font-mono text-chalk-dim">
                      {new Date(req.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>

                  {req.message && (
                    <p className="mt-2 text-xs text-chalk-dim bg-night p-3 rounded-lg border border-night-line italic">
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
                        className="rounded-lg bg-emerald-600 hover:bg-emerald-700 px-4 py-2 text-xs font-semibold text-white transition disabled:opacity-50 shadow-sm cursor-pointer"
                      >
                        {processingId === req.id ? "Processing..." : "Accept (Approve)"}
                      </button>

                      <button
                        type="button"
                        disabled={processingId === req.id}
                        onClick={() => void handleReject(req.id, req.name)}
                        className="rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 px-3.5 py-2 text-xs font-semibold text-rose-600 transition disabled:opacity-50 cursor-pointer"
                      >
                        Reject
                      </button>
                    </>
                  ) : (
                    <div className="text-right text-[11px] text-chalk-dim font-mono">
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
