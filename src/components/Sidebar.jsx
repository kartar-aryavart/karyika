import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useLang } from "../i18n/translations.jsx";

const NAV = (isAdmin) => [
  { title: "MAIN", items: [
    { id: "dashboard",  label: "Home",        emoji: "🏠", color: "#FF6B35" },
    { id: "tasks",      label: "Tasks",       emoji: "📋", color: "#818CF8" },
    { id: "projects",   label: "Projects",    emoji: "📁", color: "#06B6D4" },
    { id: "team",       label: "Team",        emoji: "👥", color: "#10B981" },
    { id: "workload",   label: "Workload",    emoji: "📊", color: "#F59E0B", badge: "NEW" },
  ]},
  { title: "PLAN", items: [
    { id: "goals",      label: "Goals & OKRs", emoji: "🎯", color: "#F43F5E" },
    { id: "gantt",      label: "Gantt",        emoji: "📅", color: "#F59E0B" },
    { id: "calendar",   label: "Calendar",     emoji: "📆", color: "#8B5CF6" },
    { id: "analytics",  label: "Analytics",   emoji: "📈", color: "#06B6D4" },
  ]},
  { title: "CREATE", items: [
    { id: "notes",       label: "Pages",        emoji: "📄", color: "#E5E7EB", badge: "NOTION" },
    { id: "habits",      label: "Habits",       emoji: "🌱", color: "#10B981" },
    { id: "timer",       label: "Focus Timer",  emoji: "⏱",  color: "#F43F5E" },
    { id: "timetracker", label: "Time Track",   emoji: "⏰", color: "#818CF8" },
  ]},
  { title: "AI & AUTO", items: [
    { id: "ai",          label: "AI Assistant", emoji: "🤖", color: "#8B5CF6", badge: "AI" },
    { id: "automations", label: "Automations",  emoji: "⚡", color: "#F43F5E" },
  ]},
  { title: "SYSTEM", items: [
    { id: "settings", label: "Settings", emoji: "⚙️", color: "#6B7280" },
    ...(isAdmin ? [{ id: "admin", label: "Admin", emoji: "🛡️", color: "#F43F5E" }] : []),
  ]},
];

const BADGE_STYLE = {
  "NEW":    { bg: "rgba(16,185,129,0.15)",   color: "#10B981" },
  "AI":     { bg: "rgba(139,92,246,0.15)",   color: "#8B5CF6" },
  "NOTION": { bg: "rgba(255,255,255,0.06)",  color: "#9CA3AF" },
};

export default function Sidebar({ page, setPage, dark, setDark, pendingCount, open, setOpen, isAdmin }) {
  const { user, logout } = useAuth();
  const { lang, toggleLang } = useLang();
  const [hov, setHov] = useState(null);
  const isMobile = window.innerWidth < 768;

  return (
    <>
      {open && isMobile && <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 99, backdropFilter: "blur(4px)" }} />}
      <nav style={{
        width: 220, display: "flex", flexDirection: "column", zIndex: 100, flexShrink: 0,
        background: "linear-gradient(180deg,#0A0A14 0%,#0C0C18 100%)",
        borderRight: "1px solid rgba(255,255,255,0.04)",
        position: isMobile ? "fixed" : "relative", top: 0, left: 0, bottom: 0,
        transform: isMobile ? (open ? "translateX(0)" : "translateX(-100%)") : "none",
        transition: "transform 0.22s cubic-bezier(0.4,0,0.2,1)",
        boxShadow: isMobile && open ? "0 0 60px rgba(0,0,0,0.8)" : "none",
      }}>

        {/* Logo */}
        <div style={{ padding: "16px 14px 12px", borderBottom: "1px solid rgba(255,255,255,0.04)", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, overflow: "hidden", flexShrink: 0, background: "linear-gradient(135deg,rgba(255,107,53,0.15),rgba(139,92,246,0.1))", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(255,107,53,0.15)" }}>
              <img src="/logo.png" alt="K" style={{ width: 32, height: 32, objectFit: "contain" }}
                onError={e => { e.target.style.display = "none"; e.target.parentElement.innerHTML = "<span style='font-size:16px;color:#FF6B35;font-weight:900'>K</span>"; }} />
            </div>
            <div>
              <div style={{ fontFamily: "'Cabinet Grotesk',sans-serif", fontSize: 15, fontWeight: 900, letterSpacing: "-0.5px", background: "linear-gradient(135deg,#FFFFFF,rgba(255,107,53,0.9))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Karyika</div>
              <div style={{ fontSize: 8, color: "rgba(255,255,255,0.12)", fontWeight: 800, letterSpacing: "2px", textTransform: "uppercase" }}>Phase 6+7</div>
            </div>
          </div>
        </div>

        {/* Nav items */}
        <div style={{ flex: 1, overflowY: "auto", padding: "6px 7px" }}>
          {NAV(isAdmin).map(section => (
            <div key={section.title} style={{ marginBottom: 2 }}>
              <div style={{ fontSize: 8, fontWeight: 900, color: "rgba(255,255,255,0.1)", letterSpacing: "2px", padding: "8px 9px 3px", textTransform: "uppercase" }}>{section.title}</div>
              {section.items.map(item => {
                const active = page === item.id;
                const hovered = hov === item.id;
                const bs = BADGE_STYLE[item.badge] || {};
                return (
                  <button key={item.id}
                    onClick={() => { setPage(item.id); setOpen(false); }}
                    onMouseEnter={() => setHov(item.id)}
                    onMouseLeave={() => setHov(null)}
                    style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "6px 9px", border: "none", borderRadius: 8, cursor: "pointer", fontFamily: "inherit", textAlign: "left", background: active ? `${item.color}12` : hovered ? "rgba(255,255,255,0.04)" : "transparent", transition: "all 0.12s", position: "relative" }}>
                    {active && <div style={{ position: "absolute", left: 0, top: "20%", bottom: "20%", width: 2.5, borderRadius: "0 3px 3px 0", background: item.color, boxShadow: `0 0 8px ${item.color}88` }} />}
                    <div style={{ width: 24, height: 24, borderRadius: 6, flexShrink: 0, background: active ? `${item.color}18` : "rgba(255,255,255,0.04)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, boxShadow: active ? `0 0 10px ${item.color}33` : "none" }}>{item.emoji}</div>
                    <span style={{ fontSize: 12, fontWeight: active ? 700 : 400, color: active ? item.color : hovered ? "#C9D1D9" : "#6B7280", flex: 1, transition: "color 0.12s" }}>{item.label}</span>
                    {item.badge && <span style={{ fontSize: 7, padding: "2px 5px", borderRadius: 6, fontWeight: 900, letterSpacing: "0.3px", background: bs.bg, color: bs.color }}>{item.badge}</span>}
                    {item.id === "tasks" && pendingCount > 0 && <span style={{ fontSize: 9, padding: "1px 6px", borderRadius: 10, background: "rgba(244,63,94,0.15)", color: "#F43F5E", fontWeight: 800 }}>{pendingCount}</span>}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.04)", padding: "8px 9px", flexShrink: 0 }}>
          <div style={{ display: "flex", gap: 5, marginBottom: 7 }}>
            <button onClick={() => setDark(d => !d)} title={dark ? "Light mode" : "Dark mode"} style={{ flex: 1, padding: "6px", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 7, background: "rgba(255,255,255,0.03)", cursor: "pointer", fontSize: 14, color: "#9CA3AF", fontFamily: "inherit", transition: "all 0.15s" }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.07)"}
              onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.03)"}>
              {dark ? "☀️" : "🌙"}
            </button>
            <button onClick={toggleLang} style={{ flex: 1, padding: "6px", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 7, background: "rgba(255,255,255,0.03)", cursor: "pointer", fontSize: 10, color: "#9CA3AF", fontFamily: "inherit", fontWeight: 800, transition: "all 0.15s" }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.07)"}
              onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.03)"}>
              {lang === "en" ? "हिं" : "EN"}
            </button>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", borderRadius: 9, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}>
            <div style={{ width: 26, height: 26, borderRadius: "50%", background: "linear-gradient(135deg,#FF6B35,#8B5CF6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: "#fff", flexShrink: 0 }}>
              {(user?.displayName || user?.email || "U")[0].toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#C9D1D9", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {user?.displayName || user?.email?.split("@")[0] || "User"}
              </div>
              <div style={{ fontSize: 8, color: "#4B5563", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>Pro · Phase 6+7</div>
            </div>
            <button onClick={logout} style={{ background: "transparent", border: "none", color: "#4B5563", cursor: "pointer", fontSize: 14, lineHeight: 1, transition: "color 0.15s" }}
              onMouseEnter={e => e.currentTarget.style.color = "#F43F5E"}
              onMouseLeave={e => e.currentTarget.style.color = "#4B5563"} title="Logout">↩</button>
          </div>
        </div>
      </nav>
    </>
  );
}
