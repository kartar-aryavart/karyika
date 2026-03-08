// 🧭 Sidebar Navigation — Karyika
import { useAuth } from "../hooks/useAuth";
import { Toggle } from "./UI";

const NAV = [
  { id: "dashboard", icon: "🏠", label: "Dashboard" },
  { id: "tasks",     icon: "📋", label: "Tasks" },
  { id: "habits",    icon: "🌱", label: "Habits" },
  { id: "calendar",  icon: "📅", label: "Calendar" },
  { id: "timer",     icon: "⏱️", label: "Focus Timer" },
  { id: "notes",     icon: "📓", label: "Notes" },
  { id: "settings",  icon: "⚙️", label: "Settings" },
];

export default function Sidebar({ page, setPage, dark, setDark, pendingCount, open, setOpen }) {
  const { user, logout } = useAuth();

  const navigate = (p) => { setPage(p); setOpen(false); };

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div onClick={() => setOpen(false)} style={{
          position: "fixed", inset: 0, background: "rgba(28,24,21,0.5)",
          zIndex: 99, backdropFilter: "blur(2px)",
        }} className="fade-in" />
      )}

      <nav style={{
        width: "var(--nav-w)", background: "var(--surface)",
        borderRight: "1px solid var(--border)",
        display: "flex", flexDirection: "column",
        padding: "24px 0", zIndex: 100, flexShrink: 0,
        transition: "transform var(--t)",
        // Mobile: slide in
        ...(typeof window !== "undefined" && window.innerWidth < 768 ? {
          position: "fixed", top: 0, left: 0, bottom: 0,
          transform: open ? "translateX(0)" : "translateX(-100%)",
          boxShadow: open ? "var(--shadow-xl)" : "none",
        } : {}),
      }}>
        {/* Logo */}
        <div style={{ padding: "0 20px 24px", borderBottom: "1px solid var(--border)", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10, background: "var(--accent)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "var(--font-head)", fontWeight: 800, color: "#fff", fontSize: 18,
            }}>क</div>
            <div>
              <div style={{ fontFamily: "var(--font-head)", fontSize: 18, fontWeight: 800, color: "var(--accent)", lineHeight: 1.2 }}>Karyika</div>
              <div style={{ fontSize: 10, color: "var(--text3)" }}>कार्यिका</div>
            </div>
          </div>
        </div>

        {/* Nav items */}
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: "var(--text3)", padding: "0 20px 8px" }}>Menu</div>
        {NAV.map(n => (
          <div key={n.id} onClick={() => navigate(n.id)} style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "10px 20px", cursor: "pointer", fontSize: 14, fontWeight: 500,
            color: page === n.id ? "var(--accent)" : "var(--text2)",
            background: page === n.id ? "rgba(255,107,53,0.07)" : "transparent",
            borderLeft: `3px solid ${page === n.id ? "var(--accent)" : "transparent"}`,
            transition: "all var(--t)", userSelect: "none",
          }}>
            <span style={{ fontSize: 17, width: 22, textAlign: "center" }}>{n.icon}</span>
            <span style={{ flex: 1 }}>{n.label}</span>
            {n.id === "tasks" && pendingCount > 0 && (
              <span style={{
                background: "var(--accent)", color: "#fff", borderRadius: 20,
                fontSize: 10, fontWeight: 700, padding: "1px 7px",
              }}>{pendingCount}</span>
            )}
          </div>
        ))}

        {/* Bottom */}
        <div style={{ marginTop: "auto", padding: "16px 20px 0", borderTop: "1px solid var(--border)" }}>
          {/* User info */}
          {user && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, padding: "10px 12px", background: "var(--surface2)", borderRadius: 12 }}>
              <div style={{
                width: 32, height: 32, borderRadius: "50%", background: "var(--accent)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#fff", fontSize: 13, fontWeight: 700, flexShrink: 0, overflow: "hidden",
              }}>
                {user.photoURL
                  ? <img src={user.photoURL} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : (user.displayName?.[0] || user.email?.[0] || "U").toUpperCase()
                }
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {user.displayName || "User"}
                </div>
                <div style={{ fontSize: 10, color: "var(--text3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {user.email}
                </div>
              </div>
            </div>
          )}
          {/* Dark mode */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <span style={{ fontSize: 13, color: "var(--text2)", flex: 1 }}>🌙 Dark Mode</span>
            <Toggle on={dark} onChange={setDark} />
          </div>
          {/* Logout */}
          <button onClick={logout} style={{
            width: "100%", padding: "9px", border: "1.5px solid var(--border)",
            borderRadius: 10, background: "transparent", color: "var(--text2)",
            fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-body)",
            transition: "all var(--t)",
          }}>🚪 Logout</button>
        </div>
      </nav>
    </>
  );
}
