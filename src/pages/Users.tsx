import { useEffect, useState } from "react";
import { api, ApiError } from "@/api/client";
import { Shell } from "@/components/Shell";

export type UserItem = {
  id: string;
  email: string;
  status: "ACTIVE" | "DISABLED";
  createdAt: string;
  college: {
    id: string;
    name: string;
    subdomain: string;
  };
};

export function Users() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.get<{ users: UserItem[] }>("/api/v1/admin/users");
      setUsers(data.users);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchUsers();
  }, []);

  const toggleStatus = async (user: UserItem) => {
    const nextStatus = user.status === "ACTIVE" ? "DISABLED" : "ACTIVE";
    try {
      setUpdatingId(user.id);
      await api.patch<{ user: UserItem }>(`/api/v1/admin/users/${user.id}/status`, {
        status: nextStatus,
      });
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, status: nextStatus } : u))
      );
    } catch (err) {
      alert(err instanceof ApiError ? err.message : "Could not update user status");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <Shell title="Users & Accounts">
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-night-line pb-4">
          <div>
            <h2 className="text-lg font-bold text-chalk">Registered College Staff Users</h2>
            <p className="text-xs text-chalk-dim/60">
              Manage accounts, tenant assignments, and login access.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void fetchUsers()}
            className="rounded-lg border border-night-line px-3 py-1.5 text-xs font-semibold text-chalk-dim transition hover:border-chalk-dim/40 hover:text-chalk"
          >
            Refresh List
          </button>
        </div>

        {error && (
          <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-xs text-red-400">
            {error}
          </div>
        )}

        {loading ? (
          <div className="py-12 text-center text-xs text-chalk-dim/50">
            Loading accounts...
          </div>
        ) : users.length === 0 ? (
          <div className="py-12 text-center text-xs text-chalk-dim/50">
            No registered users found.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-night-line bg-night-soft">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-night-line bg-night/50 text-[10px] uppercase tracking-wider text-chalk-dim/60">
                <tr>
                  <th className="px-4 py-3">User Email</th>
                  <th className="px-4 py-3">Assigned College</th>
                  <th className="px-4 py-3">Subdomain</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-night-line/50 font-medium">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-night-line/20 transition">
                    <td className="px-4 py-3 font-semibold text-chalk">{user.email}</td>
                    <td className="px-4 py-3 text-chalk-dim">{user.college?.name || "—"}</td>
                    <td className="px-4 py-3 font-mono text-chalk-dim/80">
                      {user.college?.subdomain || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          user.status === "ACTIVE"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : "bg-red-500/10 text-red-400 border border-red-500/20"
                        }`}
                      >
                        {user.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        disabled={updatingId === user.id}
                        onClick={() => void toggleStatus(user)}
                        className={`rounded-lg border px-3 py-1 text-[11px] font-bold transition disabled:opacity-50 ${
                          user.status === "ACTIVE"
                            ? "border-red-500/30 text-red-400 hover:bg-red-500/10"
                            : "border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                        }`}
                      >
                        {updatingId === user.id
                          ? "Updating..."
                          : user.status === "ACTIVE"
                          ? "Disable Access"
                          : "Enable Access"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Shell>
  );
}
