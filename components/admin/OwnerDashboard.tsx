"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase-browser";

export type AcademyRole = "user" | "moderator" | "admin" | "owner";

type ManagedUser = {
  id: string;
  email: string;
  display_name: string | null;
  role: AcademyRole;
  premium: boolean;
  premium_expires_at: string | null;
  xp: number;
  credits: number;
  reputation: number;
  streak: number;
  banned: boolean;
  suspended_until: string | null;
  badges: string[];
  profile_backgrounds: string[];
  created_at: string;
  last_active_at: string;
};

type PlatformStats = {
  total_accounts: number;
  premium_users: number;
  banned_users: number;
  suspended_users: number;
  active_24h: number;
  active_7d: number;
  signups_today: number;
  attempts_total: number;
  attempts_today: number;
  average_accuracy: number;
  most_played_mode: string | null;
};

type DailyActivity = {
  activity_date: string;
  signups: number;
  active_users: number;
  attempts: number;
};

type AuditEntry = {
  id: number;
  actor_email: string;
  target_email: string | null;
  action: string;
  details: Record<string, unknown>;
  created_at: string;
};

type OwnerDashboardProps = {
  profileRole: AcademyRole;
  authUserId: string | null;
};

const BADGE_OPTIONS = [
  "Founding Member",
  "Risk Manager",
  "Patience Pro",
  "Community Helper",
  "Tournament Champion"
];

const BACKGROUND_OPTIONS = [
  "Trading Floor",
  "Night Exchange",
  "Academy Hall",
  "Market Skyline",
  "Founder Gold"
];

function toDateTime(value: string | null) {
  if (!value) return "Never";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "Unknown" : parsed.toLocaleString();
}

export default function OwnerDashboard({
  profileRole,
  authUserId
}: OwnerDashboardProps) {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [platformStats, setPlatformStats] = useState<PlatformStats | null>(null);
  const [dailyActivity, setDailyActivity] = useState<DailyActivity[]>([]);
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [selectedUser, setSelectedUser] = useState<ManagedUser | null>(null);
  const [grantAmount, setGrantAmount] = useState(100);
  const [suspensionDays, setSuspensionDays] = useState(7);
  const [premiumDays, setPremiumDays] = useState(30);
  const [selectedBadge, setSelectedBadge] = useState(BADGE_OPTIONS[0]);
  const [selectedBackground, setSelectedBackground] = useState(BACKGROUND_OPTIONS[0]);
  const [panel, setPanel] = useState<"users" | "audit">("users");

  const isOwner = profileRole === "owner";

  const maxChartValue = useMemo(
    () =>
      Math.max(
        1,
        ...dailyActivity.flatMap(day => [
          Number(day.signups),
          Number(day.active_users),
          Number(day.attempts)
        ])
      ),
    [dailyActivity]
  );

  async function loadDashboard(searchText = search) {
    const client = supabase;
    if (!client || !isOwner) return;

    setLoading(true);
    setMessage("");

    const [usersResult, statsResult, activityResult, auditResult] =
      await Promise.all([
        client.rpc("owner_list_users", {
          search_text: searchText || null,
          page_limit: 100,
          page_offset: 0
        }),
        client.rpc("owner_platform_stats"),
        client.rpc("owner_daily_activity", { days_back: 14 }),
        client.rpc("owner_audit_log", { row_limit: 100 })
      ]);

    const firstError =
      usersResult.error ||
      statsResult.error ||
      activityResult.error ||
      auditResult.error;

    if (firstError) {
      setMessage(firstError.message);
      setLoading(false);
      return;
    }

    setUsers((usersResult.data || []) as ManagedUser[]);
    setPlatformStats((statsResult.data || null) as PlatformStats | null);
    setDailyActivity((activityResult.data || []) as DailyActivity[]);
    setAuditLog((auditResult.data || []) as AuditEntry[]);
    setLoading(false);
  }

  useEffect(() => {
    if (isOwner) void loadDashboard("");
    // Loading once when owner access is established is intentional.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOwner]);

  async function manageUser(
    user: ManagedUser,
    action: string,
    value?: string | null,
    amount?: number | null
  ) {
    const client = supabase;
    if (!client || !isOwner) return;

    setLoading(true);
    setMessage("");

    const { error } = await client.rpc("owner_manage_user", {
      target_user_id: user.id,
      requested_action: action,
      requested_value: value ?? null,
      requested_amount: amount ?? null
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    setMessage(`Updated ${user.display_name || user.email}.`);

    if (user.id === authUserId) {
      window.dispatchEvent(
        new CustomEvent("futures-academy-profile-updated")
      );
    }

    await loadDashboard(search);

    const { data: refreshed } = await client.rpc("owner_list_users", {
      search_text: user.email,
      page_limit: 1,
      page_offset: 0
    });

    setSelectedUser(
      refreshed && refreshed.length ? (refreshed[0] as ManagedUser) : null
    );
  }

  if (!isOwner) {
    return (
      <section className="page-section owner-dashboard">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Owner controls</span>
            <h2>Academy operations</h2>
          </div>
          <span className="role-badge">{profileRole.toUpperCase()}</span>
        </div>
        <div className="locked">This page is restricted to the Academy owner.</div>
      </section>
    );
  }

  return (
    <section className="page-section owner-dashboard">
      <div className="section-heading">
        <div>
          <span className="eyebrow">Owner controls</span>
          <h2>Academy operations</h2>
          <p className="muted">
            Manage users through owner-verified Supabase functions. Every
            sensitive action is recorded.
          </p>
        </div>
        <span className="role-badge owner-role-badge">OWNER</span>
      </div>

      {message && <div className="admin-message">{message}</div>}

      <div className="metric-grid owner-metrics">
        <div className="metric">
          <span>Total accounts</span>
          <strong>{platformStats?.total_accounts ?? "—"}</strong>
        </div>
        <div className="metric">
          <span>Signups today</span>
          <strong>{platformStats?.signups_today ?? "—"}</strong>
        </div>
        <div className="metric">
          <span>Active 24 hours</span>
          <strong>{platformStats?.active_24h ?? "—"}</strong>
        </div>
        <div className="metric">
          <span>Active 7 days</span>
          <strong>{platformStats?.active_7d ?? "—"}</strong>
        </div>
        <div className="metric">
          <span>Premium users</span>
          <strong>{platformStats?.premium_users ?? "—"}</strong>
        </div>
        <div className="metric">
          <span>Attempts today</span>
          <strong>{platformStats?.attempts_today ?? "—"}</strong>
        </div>
        <div className="metric">
          <span>Average accuracy</span>
          <strong>{platformStats ? `${platformStats.average_accuracy}%` : "—"}</strong>
        </div>
        <div className="metric">
          <span>Most played mode</span>
          <strong>{platformStats?.most_played_mode || "—"}</strong>
        </div>
      </div>

      <div className="admin-activity-card">
        <div className="section-heading compact-heading">
          <div>
            <span className="eyebrow">Last 14 days</span>
            <h3>Signups, active users, and attempts</h3>
          </div>
          <button
            className="secondary compact"
            type="button"
            onClick={() => void loadDashboard()}
            disabled={loading}
          >
            {loading ? "Loading…" : "Refresh"}
          </button>
        </div>

        <div className="activity-chart" aria-label="Academy activity chart">
          {dailyActivity.map(day => (
            <div className="activity-day" key={day.activity_date}>
              <div className="activity-bars">
                <i
                  className="signup-bar"
                  style={{
                    height: `${Math.max(
                      4,
                      (Number(day.signups) / maxChartValue) * 100
                    )}%`
                  }}
                  title={`${day.signups} signups`}
                />
                <i
                  className="active-bar"
                  style={{
                    height: `${Math.max(
                      4,
                      (Number(day.active_users) / maxChartValue) * 100
                    )}%`
                  }}
                  title={`${day.active_users} active users`}
                />
                <i
                  className="attempt-bar"
                  style={{
                    height: `${Math.max(
                      4,
                      (Number(day.attempts) / maxChartValue) * 100
                    )}%`
                  }}
                  title={`${day.attempts} attempts`}
                />
              </div>
              <small>
                {new Date(`${day.activity_date}T00:00:00`).toLocaleDateString(
                  undefined,
                  { month: "numeric", day: "numeric" }
                )}
              </small>
            </div>
          ))}
        </div>

        <div className="chart-legend">
          <span><i className="signup-dot" />Signups</span>
          <span><i className="active-dot" />Active users</span>
          <span><i className="attempt-dot" />Attempts</span>
        </div>
      </div>

      <div className="admin-panel-tabs">
        <button
          className={panel === "users" ? "active" : ""}
          type="button"
          onClick={() => setPanel("users")}
        >
          👥 Users
        </button>
        <button
          className={panel === "audit" ? "active" : ""}
          type="button"
          onClick={() => setPanel("audit")}
        >
          📝 Audit log
        </button>
      </div>

      {panel === "users" ? (
        <>
          <div className="admin-toolbar">
            <div className="admin-search">
              <span>🔎</span>
              <input
                value={search}
                onChange={event => setSearch(event.target.value)}
                onKeyDown={event => {
                  if (event.key === "Enter") void loadDashboard(search);
                }}
                placeholder="Search by email or display name"
              />
            </div>
            <button
              className="primary compact"
              type="button"
              onClick={() => void loadDashboard(search)}
              disabled={loading}
            >
              Search
            </button>
          </div>

          <div className="admin-table-wrap">
            <table className="owner-user-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Status</th>
                  <th>Progress</th>
                  <th>Access</th>
                  <th>Last active</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {users.map(user => {
                  const suspended = Boolean(
                    user.suspended_until &&
                      new Date(user.suspended_until) > new Date()
                  );

                  return (
                    <tr key={user.id}>
                      <td>
                        <div className="admin-user-cell">
                          <strong>{user.display_name || "Unnamed trader"}</strong>
                          <span>{user.email}</span>
                          <small>
                            Joined {new Date(user.created_at).toLocaleDateString()}
                          </small>
                        </div>
                      </td>
                      <td>
                        <div className="status-stack">
                          {user.banned ? (
                            <b className="status-banned">Banned</b>
                          ) : suspended ? (
                            <b className="status-suspended">Suspended</b>
                          ) : (
                            <b className="status-active">Active</b>
                          )}
                          {user.premium && (
                            <b className="status-premium">
                              Premium
                              {user.premium_expires_at
                                ? ` until ${new Date(
                                    user.premium_expires_at
                                  ).toLocaleDateString()}`
                                : ""}
                            </b>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="progress-stack">
                          <span>XP {Number(user.xp).toLocaleString()}</span>
                          <span>🪙 {Number(user.credits).toLocaleString()}</span>
                          <span>⭐ {Number(user.reputation).toLocaleString()}</span>
                        </div>
                      </td>
                      <td><span className="table-role">{user.role}</span></td>
                      <td>{toDateTime(user.last_active_at)}</td>
                      <td>
                        <button
                          className="secondary compact"
                          type="button"
                          onClick={() => setSelectedUser(user)}
                        >
                          Manage
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {!loading && users.length === 0 && (
                  <tr>
                    <td colSpan={6} className="empty-admin-table">
                      No matching users.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="audit-log-list">
          {auditLog.map(entry => (
            <article className="audit-entry" key={entry.id}>
              <div className="audit-icon">📝</div>
              <div>
                <strong>{entry.actor_email}</strong>
                <p>
                  {entry.action.replaceAll("_", " ")}
                  {entry.target_email ? ` → ${entry.target_email}` : ""}
                </p>
                <small>{toDateTime(entry.created_at)}</small>
              </div>
              <code>{JSON.stringify(entry.details)}</code>
            </article>
          ))}
          {!auditLog.length && (
            <div className="locked">No owner actions have been recorded yet.</div>
          )}
        </div>
      )}

      {selectedUser && (
        <div
          className="admin-modal-backdrop"
          onPointerDown={event => {
            if (event.currentTarget === event.target) setSelectedUser(null);
          }}
        >
          <section className="admin-user-modal">
            <button
              className="modal-close"
              type="button"
              onClick={() => setSelectedUser(null)}
            >
              ×
            </button>

            <span className="eyebrow">Manage user</span>
            <h2>{selectedUser.display_name || selectedUser.email}</h2>
            <p className="muted">{selectedUser.email}</p>

            <div className="admin-modal-section">
              <h3>Role and permanent Premium</h3>
              <div className="admin-action-row">
                <select
                  value={selectedUser.role}
                  disabled={selectedUser.id === authUserId}
                  onChange={event =>
                    void manageUser(selectedUser, "set_role", event.target.value)
                  }
                >
                  <option value="user">User</option>
                  <option value="moderator">Moderator</option>
                  <option value="admin">Admin</option>
                  <option value="owner">Owner</option>
                </select>

                <button
                  className={
                    selectedUser.premium ? "warning-button" : "success-button"
                  }
                  type="button"
                  onClick={() =>
                    void manageUser(
                      selectedUser,
                      "set_premium",
                      String(!selectedUser.premium)
                    )
                  }
                >
                  {selectedUser.premium ? "Remove Premium" : "Grant Premium"}
                </button>
              </div>
            </div>

            <div className="admin-modal-section">
              <h3>Temporary Premium</h3>
              <div className="suspension-row">
                <input
                  type="number"
                  min="1"
                  max="3650"
                  value={premiumDays}
                  onChange={event =>
                    setPremiumDays(Math.max(1, Number(event.target.value) || 1))
                  }
                />
                <button
                  type="button"
                  className="success-button"
                  onClick={() =>
                    void manageUser(
                      selectedUser,
                      "grant_premium_days",
                      null,
                      premiumDays
                    )
                  }
                >
                  Grant days
                </button>
                <button
                  type="button"
                  onClick={() =>
                    void manageUser(selectedUser, "clear_premium_expiration")
                  }
                >
                  Make permanent
                </button>
              </div>
            </div>

            <div className="admin-modal-section">
              <h3>Adjust progression</h3>
              <input
                type="number"
                value={grantAmount}
                onChange={event =>
                  setGrantAmount(Number(event.target.value) || 0)
                }
              />
              <div className="admin-action-grid">
                <button
                  type="button"
                  onClick={() =>
                    void manageUser(
                      selectedUser,
                      "grant_xp",
                      null,
                      grantAmount
                    )
                  }
                >
                  Adjust XP
                </button>
                <button
                  type="button"
                  onClick={() =>
                    void manageUser(
                      selectedUser,
                      "grant_credits",
                      null,
                      grantAmount
                    )
                  }
                >
                  Adjust Credits
                </button>
                <button
                  type="button"
                  onClick={() =>
                    void manageUser(
                      selectedUser,
                      "grant_reputation",
                      null,
                      grantAmount
                    )
                  }
                >
                  Adjust Reputation
                </button>
              </div>
              <small className="muted">
                Use a negative number to remove an amount. Values cannot fall
                below zero.
              </small>
            </div>

            <div className="admin-modal-section">
              <h3>Grant cosmetics</h3>
              <div className="admin-cosmetic-grid">
                <select
                  value={selectedBadge}
                  onChange={event => setSelectedBadge(event.target.value)}
                >
                  {BADGE_OPTIONS.map(option => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() =>
                    void manageUser(selectedUser, "grant_badge", selectedBadge)
                  }
                >
                  Grant badge
                </button>

                <select
                  value={selectedBackground}
                  onChange={event => setSelectedBackground(event.target.value)}
                >
                  {BACKGROUND_OPTIONS.map(option => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() =>
                    void manageUser(
                      selectedUser,
                      "grant_background",
                      selectedBackground
                    )
                  }
                >
                  Grant background
                </button>
              </div>
            </div>

            <div className="admin-modal-section">
              <h3>Account restrictions</h3>
              <div className="suspension-row">
                <input
                  type="number"
                  min="1"
                  max="3650"
                  value={suspensionDays}
                  onChange={event =>
                    setSuspensionDays(
                      Math.max(1, Number(event.target.value) || 1)
                    )
                  }
                />
                <button
                  type="button"
                  className="warning-button"
                  disabled={selectedUser.id === authUserId}
                  onClick={() =>
                    void manageUser(
                      selectedUser,
                      "suspend",
                      null,
                      suspensionDays
                    )
                  }
                >
                  Suspend days
                </button>
                <button
                  type="button"
                  onClick={() => void manageUser(selectedUser, "unsuspend")}
                >
                  Clear suspension
                </button>
              </div>

              <div className="admin-action-row">
                <button
                  type="button"
                  className={
                    selectedUser.banned ? "success-button" : "danger-button"
                  }
                  disabled={selectedUser.id === authUserId}
                  onClick={() =>
                    void manageUser(
                      selectedUser,
                      selectedUser.banned ? "unban" : "ban"
                    )
                  }
                >
                  {selectedUser.banned ? "Unban user" : "Ban user"}
                </button>
              </div>
            </div>
          </section>
        </div>
      )}
    </section>
  );
}
