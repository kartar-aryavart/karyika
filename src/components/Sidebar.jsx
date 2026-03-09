// 🧭 Sidebar v3 — with Projects, Goals, Admin
import { useAuth } from "../hooks/useAuth";
import { Toggle } from "./UI";
import { useLang } from "../i18n/translations";

const NAV = (t, isAdmin) => [
  { id: "dashboard", icon: "🏠", label: t("dashboard") },
  { id: "tasks",     icon: "📋", label: t("tasks") },
  { id: "projects",  icon: "📁", label: t("projects") },
  { id: "goals",     icon: "🎯", label: "Goals & OKRs" },
  { id: "habits",    icon: "🌱", label: t("habits") },
  { id: "calendar",  icon: "📅", label: t("calendar") },
  { id: "timer",     icon: "⏱️", label: t("focusTimer") },
  { id: "notes",     icon: "📓", label: t("notes") },
  { id: "settings",  icon: "⚙️", label: t("settings") },
  ...(isAdmin ? [{ id: "admin", icon: "🛡️", label: "Admin Panel" }] : []),
];

export default function Sidebar({ page, setPage, dark, setDark, pendingCount, open, setOpen, isAdmin }) {
  const { user, logout } = useAuth();
  const { t, lang, toggleLang } = useLang();
  const go = p => { setPage(p); setOpen(false); };
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  return (
    <>
      {open && <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(28,24,21,0.5)", zIndex: 99, backdropFilter: "blur(2px)" }} className="fade-in" />}
      <nav style={{
        width: "var(--nav-w)", background: "var(--surface)", borderRight: "1px solid var(--border)",
        display: "flex", flexDirection: "column", zIndex: 100, flexShrink: 0,
        ...(isMobile ? { position: "fixed", top: 0, left: 0, bottom: 0, transform: open ? "translateX(0)" : "translateX(-100%)", transition: "transform var(--t)", boxShadow: open ? "var(--shadow-xl)" : "none" } : {}),
        overflow: "hidden",
      }}>
        {/* Logo */}
        <div style={{ padding: "18px 18px 16px", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <img src="/logo.png" alt="Karyika" style={{ width: 40, height: 40, borderRadius: 10, objectFit: "contain" }} onError={e => e.target.style.display = "none"} />
            <div>
              <div style={{ fontFamily: "var(--font-head)", fontSize: 18, fontWeight: 800, color: "var(--accent)", lineHeight: 1.2 }}>Karyika</div>
              <div style={{ fontSize: 9, color: "var(--text3)", letterSpacing: "0.5px" }}>PRODUCTIVITY SUITE</div>
            </div>
          </div>
        </div>

        {/* Nav — scrollable */}
        <div style={{ flex: 1, overflowY: "auto", padding: "10px 0" }}>
          <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: "var(--text3)", padding: "0 18px 6px" }}>Menu</div>
          {NAV(t, isAdmin).map(n => (
            <div key={n.id} onClick={() => go(n.id)} style={{
              display: "flex", alignItems: "center", gap: 10, padding: "9px 18px",
              cursor: "pointer", fontSize: 13, fontWeight: 500,
              color: page === n.id ? "var(--accent)" : "var(--text2)",
              background: page === n.id ? "rgba(255,107,53,0.08)" : "transparent",
              borderLeft: `3px solid ${page === n.id ? "var(--accent)" : "transparent"}`,
              transition: "all var(--t)", userSelect: "none",
              ...(n.id === "admin" ? { marginTop: 4, borderTop: "1px solid var(--border)", paddingTop: 12 } : {}),
            }}>
              <span style={{ fontSize: 16, width: 20, textAlign: "center" }}>{n.icon}</span>
              <span style={{ flex: 1 }}>{n.label}</span>
              {n.id === "tasks" && pendingCount > 0 && (
                <span style={{ background: "var(--accent)", color: "#fff", borderRadius: 20, fontSize: 9, fontWeight: 700, padding: "1px 6px" }}>{pendingCount}</span>
              )}
            </div>
          ))}
        </div>

        {/* Bottom controls */}
        <div style={{ padding: "12px 18px", borderTop: "1px solid var(--border)", flexShrink: 0 }}>
          {user && (
            <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 10, padding: "8px 10px", background: "var(--surface2)", borderRadius: 10 }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 12, fontWeight: 700, flexShrink: 0, overflow: "hidden" }}>
                {user.photoURL ? <img src={user.photoURL} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : (user.displayName?.[0] || "U").toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.displayName || "User"}</div>
                <div style={{ fontSize: 9, color: "var(--text3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.email}</div>
              </div>
            </div>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 12, color: "var(--text2)", flex: 1 }}>🌐 Language</span>
            <button onClick={toggleLang} style={{ padding: "3px 10px", border: "1.5px solid var(--border)", borderRadius: 20, background: "var(--surface2)", cursor: "pointer", fontSize: 11, fontWeight: 700, color: "var(--text)", fontFamily: "var(--font-body)" }}>
              {lang === "en" ? "हिं" : "EN"}
            </button>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <span style={{ fontSize: 12, color: "var(--text2)", flex: 1 }}>🌙 {t("darkMode")}</span>
            <Toggle on={dark} onChange={setDark} />
          </div>
          <button onClick={logout} style={{ width: "100%", padding: "8px", border: "1.5px solid var(--border)", borderRadius: 10, background: "transparent", color: "var(--text2)", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-body)", transition: "all var(--t)" }}>
            🚪 {t("logout")}
          </button>
        </div>
      </nav>
    </>
  );
}
