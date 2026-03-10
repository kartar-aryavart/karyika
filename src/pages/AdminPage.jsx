// 🛡️ Admin Dashboard — Karyika
import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { getAdminStats } from "../firebase/services";
import { Card, SectionHeader, ProgressBar, Loader } from "../components/UI";

export default function AdminPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    getAdminStats().then(s => { setStats(s); setLoading(false); });
  }, []);

  const tabs = [
    { id: "overview", icon: "📊", label: "Overview" },
    { id: "users", icon: "👥", label: "Users" },
    { id: "system", icon: "⚙️", label: "System" },
  ];

  if (loading) return <Loader />;

  const now = new Date();
  const SYSTEM_INFO = [
    { label: "App Version", value: "v2.0 Phase 2" },
    { label: "Firebase Project", value: "karyika-by-kartar-aryavart" },
    { label: "Region", value: "asia-south1 (Mumbai 🇮🇳)" },
    { label: "Auth Provider", value: "Email + Google" },
    { label: "Database", value: "Firestore" },
    { label: "Hosting", value: "Vercel" },
    { label: "Last Updated", value: now.toLocaleDateString("en-IN") },
  ];

  return (
    <div>
      {/* Admin Header */}
      <div style={{ background: "linear-gradient(135deg,#1C1815,#2A2420)", borderRadius: 16, padding: "24px 28px", marginBottom: 24, color: "#fff", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", right: -30, top: -30, width: 150, height: 150, borderRadius: "50%", background: "rgba(255,107,53,0.1)" }} />
        <div style={{ fontSize: 11, opacity: 0.6, marginBottom: 4, letterSpacing: 2, textTransform: "uppercase" }}>Admin Panel</div>
        <div style={{ fontFamily: "var(--font-head)", fontSize: 22, fontWeight: 800, marginBottom: 4 }}>🛡️ Karyika Admin Dashboard</div>
        <div style={{ fontSize: 13, opacity: 0.7 }}>Logged in as: {user?.email}</div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            padding: "9px 18px", border: "1.5px solid var(--border)", borderRadius: 10,
            background: activeTab === tab.id ? "var(--accent)" : "var(--surface)",
            color: activeTab === tab.id ? "#fff" : "var(--text2)",
            cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: "var(--font-body)",
            transition: "all 0.2s",
          }}>{tab.icon} {tab.label}</button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 20 }}>
            {[
              { icon: "👥", val: stats?.totalUsers || 0, label: "Total Users", color: "var(--accent)" },
              { icon: "📋", val: stats?.users?.reduce((s, u) => s + u.tasks, 0) || 0, label: "Total Tasks", color: "var(--teal)" },
              { icon: "🌱", val: stats?.users?.reduce((s, u) => s + u.habits, 0) || 0, label: "Total Habits", color: "var(--gold)" },
            ].map(s => (
              <div key={s.label} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: "20px", textAlign: "center" }}>
                <div style={{ fontSize: 32 }}>{s.icon}</div>
                <div style={{ fontFamily: "var(--font-head)", fontSize: 36, fontWeight: 800, color: s.color, marginTop: 6 }}>{s.val}</div>
                <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>

          <Card>
            <SectionHeader title="📈 App Activity" />
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {[
                { label: "Tasks Created", val: stats?.users?.reduce((s, u) => s + u.tasks, 0) || 0, max: 500, color: "var(--accent)" },
                { label: "Habits Tracked", val: stats?.users?.reduce((s, u) => s + u.habits, 0) || 0, max: 100, color: "var(--teal)" },
                { label: "Notes Written", val: stats?.users?.reduce((s, u) => s + u.notes, 0) || 0, max: 200, color: "var(--indigo)" },
              ].map(m => (
                <div key={m.label}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{m.label}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: m.color }}>{m.val}</span>
                  </div>
                  <ProgressBar value={Math.min((m.val / m.max) * 100, 100)} color={m.color} height={8} />
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === "users" && (
        <Card>
          <SectionHeader title="👥 All Users" action={<span style={{ fontSize: 12, color: "var(--text3)" }}>{stats?.totalUsers || 0} total</span>} />
          {(stats?.users || []).length === 0 ? (
            <div style={{ textAlign: "center", padding: 24, color: "var(--text3)" }}>No users found or insufficient permissions.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {stats.users.map((u, i) => (
                <div key={u.uid} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: "var(--surface2)", borderRadius: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 14, flexShrink: 0 }}>#{i + 1}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, color: "var(--text3)", fontFamily: "monospace", overflow: "hidden", textOverflow: "ellipsis" }}>{u.uid}</div>
                    <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                      <span style={{ fontSize: 11, color: "var(--text2)" }}>📋 {u.tasks} tasks</span>
                      <span style={{ fontSize: 11, color: "var(--text2)" }}>🌱 {u.habits} habits</span>
                      <span style={{ fontSize: 11, color: "var(--text2)" }}>📓 {u.notes} notes</span>
                    </div>
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: "#E6F7F5", color: "var(--teal)" }}>Active</div>
                </div>
              ))}
            </div>
          )}
          <div style={{ marginTop: 16, padding: "12px", background: "var(--surface2)", borderRadius: 10, fontSize: 12, color: "var(--text3)", lineHeight: 1.8 }}>
            ⚠️ Full user details (emails, names) ke liye Firebase Console → Authentication check karo.<br />
            Admin panel ko aur powerful banane ke liye Firebase Admin SDK backend chahiye hoga (Phase 3).
          </div>
        </Card>
      )}

      {/* System Tab */}
      {activeTab === "system" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Card>
            <SectionHeader title="⚙️ System Information" />
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {SYSTEM_INFO.map((info, i) => (
                <div key={info.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: i < SYSTEM_INFO.length - 1 ? "1px solid var(--border)" : "none" }}>
                  <span style={{ fontSize: 13, color: "var(--text2)" }}>{info.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{info.value}</span>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <SectionHeader title="🔗 Quick Links" />
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { label: "Firebase Console", url: "https://console.firebase.google.com/project/karyika-by-kartar-aryavart", icon: "🔥" },
                { label: "Vercel Dashboard", url: "https://vercel.com/kartar-aryavarts-projects/karyika", icon: "▲" },
                { label: "GitHub Repository", url: "https://github.com/kartar-aryavart/karyika", icon: "🐙" },
                { label: "Firebase Auth Users", url: "https://console.firebase.google.com/project/karyika-by-kartar-aryavart/authentication/users", icon: "👥" },
                { label: "Firestore Database", url: "https://console.firebase.google.com/project/karyika-by-kartar-aryavart/firestore", icon: "🗄️" },
              ].map(link => (
                <a key={link.label} href={link.url} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 14px", background: "var(--surface2)", borderRadius: 10, textDecoration: "none", color: "var(--text)", transition: "all 0.2s" }}>
                  <span style={{ fontSize: 18 }}>{link.icon}</span>
                  <span style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>{link.label}</span>
                  <span style={{ fontSize: 12, color: "var(--text3)" }}>↗</span>
                </a>
              ))}
            </div>
          </Card>

          <Card>
            <SectionHeader title="🚧 Phase 3 Preview" />
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {["User ban/unban controls", "Announcement broadcast", "Feature flags (on/off)", "Analytics graphs", "Error logs", "Email notifications to users"].map(f => (
                <div key={f} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0", borderBottom: "1px solid var(--border)", opacity: 0.6 }}>
                  <span style={{ fontSize: 12, background: "var(--surface2)", padding: "2px 8px", borderRadius: 6, fontWeight: 600, color: "var(--text3)" }}>Coming Soon</span>
                  <span style={{ fontSize: 13, color: "var(--text2)" }}>{f}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
