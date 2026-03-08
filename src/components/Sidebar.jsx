// 🧭 Sidebar v2 — with Logo + Language Switcher
import { useAuth } from "../hooks/useAuth";
import { Toggle } from "./UI";
import { useLang } from "../i18n/translations";

const NAV_ITEMS = (t) => [
  { id: "dashboard", icon: "🏠", label: t("dashboard") },
  { id: "tasks",     icon: "📋", label: t("tasks") },
  { id: "habits",    icon: "🌱", label: t("habits") },
  { id: "calendar",  icon: "📅", label: t("calendar") },
  { id: "timer",     icon: "⏱️", label: t("focusTimer") },
  { id: "notes",     icon: "📓", label: t("notes") },
  { id: "settings",  icon: "⚙️", label: t("settings") },
];

export default function Sidebar({ page, setPage, dark, setDark, pendingCount, open, setOpen }) {
  const { user, logout } = useAuth();
  const { t, lang, toggleLang } = useLang();
  const go = p => { setPage(p); setOpen(false); };
  const isMobile = window.innerWidth < 768;

  return (
    <>
      {open && <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(28,24,21,0.5)", zIndex: 99, backdropFilter: "blur(2px)" }} className="fade-in" />}
      <nav style={{
        width: "var(--nav-w)", background: "var(--surface)", borderRight: "1px solid var(--border)",
        display: "flex", flexDirection: "column", padding: "20px 0", zIndex: 100, flexShrink: 0,
        ...(isMobile ? { position: "fixed", top: 0, left: 0, bottom: 0, transform: open ? "translateX(0)" : "translateX(-100%)", transition: "transform var(--t)", boxShadow: open ? "var(--shadow-xl)" : "none" } : {}),
      }}>
        {/* Logo */}
        <div style={{ padding: "0 18px 20px", borderBottom: "1px solid var(--border)", marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <img src="/logo.png" alt="Karyika" style={{ width: 42, height: 42, borderRadius: 10, objectFit: "contain" }} onError={e => { e.target.style.display = "none"; }} />
            <div>
              <div style={{ fontFamily: "var(--font-head)", fontSize: 19, fontWeight: 800, color: "var(--accent)", lineHeight: 1.2 }}>Karyika</div>
              <div style={{ fontSize: 10, color: "var(--text3)" }}>कार्यिका</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color: "var(--text3)", padding: "0 18px 6px" }}>Menu</div>
        {NAV_ITEMS(t).map(n => (
          <div key={n.id} onClick={() => go(n.id)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 18px", cursor: "pointer", fontSize: 14, fontWeight: 500, color: page === n.id ? "var(--accent)" : "var(--text2)", background: page === n.id ? "rgba(255,107,53,0.08)" : "transparent", borderLeft: `3px solid ${page === n.id ? "var(--accent)" : "transparent"}`, transition: "all var(--t)", userSelect: "none" }}>
            <span style={{ fontSize: 17, width: 22, textAlign: "center" }}>{n.icon}</span>
            <span style={{ flex: 1 }}>{n.label}</span>
            {n.id === "tasks" && pendingCount > 0 && <span style={{ background: "var(--accent)", color: "#fff", borderRadius: 20, fontSize: 10, fontWeight: 700, padding: "1px 7px" }}>{pendingCount}</span>}
          </div>
        ))}

        {/* Bottom */}
        <div style={{ marginTop: "auto", padding: "14px 18px 0", borderTop: "1px solid var(--border)" }}>
          {/* User */}
          {user && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, padding: "9px 11px", background: "var(--surface2)", borderRadius: 11 }}>
              <div style={{ width: 30, height: 30, borderRadius: "50%", background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 12, fontWeight: 700, flexShrink: 0, overflow: "hidden" }}>
                {user.photoURL ? <img src={user.photoURL} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : (user.displayName?.[0] || "U").toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.displayName || "User"}</div>
                <div style={{ fontSize: 10, color: "var(--text3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.email}</div>
              </div>
            </div>
          )}
          {/* Language switcher */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <span style={{ fontSize: 13, color: "var(--text2)", flex: 1 }}>🌐 Language</span>
            <button onClick={toggleLang} style={{ padding: "4px 12px", border: "1.5px solid var(--border)", borderRadius: 20, background: "var(--surface2)", cursor: "pointer", fontSize: 12, fontWeight: 700, color: "var(--text)", fontFamily: "var(--font-body)" }}>
              {lang === "en" ? "हिं" : "EN"}
            </button>
          </div>
          {/* Dark mode */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <span style={{ fontSize: 13, color: "var(--text2)", flex: 1 }}>🌙 {t("darkMode")}</span>
            <Toggle on={dark} onChange={setDark} />
          </div>
          {/* Logout */}
          <button onClick={logout} style={{ width: "100%", padding: "9px", border: "1.5px solid var(--border)", borderRadius: 10, background: "transparent", color: "var(--text2)", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-body)", transition: "all var(--t)" }}>
            🚪 {t("logout")}
          </button>
        </div>
      </nav>
    </>
  );
}
