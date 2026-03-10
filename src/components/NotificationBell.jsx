// 🔔 NotificationBell — with Web Audio sound on any device
import { useState, useEffect, useRef } from "react";
import { useAuth } from "../hooks/useAuth";
import { subscribeToNotifications, markNotifRead, markAllNotifsRead, deleteNotification } from "../firebase/services";

const TYPE_ICON  = { info:"💬", task:"✅", reminder:"⏰", team:"👥", ai:"🤖", warning:"⚠️", success:"🎉" };
const TYPE_COLOR = { info:"#818CF8", task:"#10B981", reminder:"#F59E0B", team:"#FF6B35", ai:"#8B5CF6", warning:"#F43F5E", success:"#10B981" };

// ── Sound generator using Web Audio API (works on all devices) ────────────────
function playSound(type = "notif") {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const master = ctx.createGain();
    master.connect(ctx.destination);
    master.gain.setValueAtTime(0.4, ctx.currentTime);

    const presets = {
      notif:   [[0, 880, 0.08], [0.09, 1100, 0.08], [0.18, 1320, 0.1]],
      success: [[0, 523, 0.1], [0.1, 659, 0.1], [0.2, 784, 0.12]],
      warning: [[0, 440, 0.12], [0.15, 370, 0.1]],
    };
    const notes = presets[type] || presets.notif;

    notes.forEach(([when, freq, dur]) => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(master);
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime + when);
      gain.gain.setValueAtTime(0, ctx.currentTime + when);
      gain.gain.linearRampToValueAtTime(0.8, ctx.currentTime + when + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + when + dur + 0.18);
      osc.start(ctx.currentTime + when);
      osc.stop(ctx.currentTime + when + dur + 0.2);
    });

    // Auto-close context
    setTimeout(() => ctx.close(), 2000);
  } catch (e) {
    console.log("Audio unavailable:", e.message);
  }
}

export { playSound };

function timeAgo(ts) {
  if (!ts) return "";
  const d = ts?.toDate ? ts.toDate() : new Date(ts);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60)    return "just now";
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function NotificationBell({ onNavigate }) {
  const { user } = useAuth();
  const [notifs, setNotifs]   = useState([]);
  const [open, setOpen]       = useState(false);
  const [ringing, setRinging] = useState(false);
  const prevCount = useRef(0);
  const ref = useRef();

  useEffect(() => {
    if (!user) return;
    return subscribeToNotifications(user.uid, (data) => {
      const newUnread = data.filter(n => !n.read).length;
      // Play sound when new notification arrives
      if (newUnread > prevCount.current) {
        playSound("notif");
        setRinging(true);
        setTimeout(() => setRinging(false), 800);
      }
      prevCount.current = newUnread;
      setNotifs(data);
    });
  }, [user]);

  useEffect(() => {
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const unread = notifs.filter(n => !n.read).length;

  const handleClick = async (n) => {
    if (!n.read) await markNotifRead(user.uid, n.id);
    if (n.link && onNavigate) onNavigate(n.link);
    setOpen(false);
  };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      {/* Bell button */}
      <button
        onClick={() => { setOpen(o => !o); if (unread > 0) playSound("notif"); }}
        style={{
          position: "relative", width: 36, height: 36, borderRadius: "50%",
          background: open ? "rgba(255,107,53,0.1)" : "var(--surface2)",
          border: `1px solid ${open ? "rgba(255,107,53,0.3)" : "var(--border)"}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", transition: "all 0.2s", fontSize: 16,
          animation: ringing ? "notifBounce 0.6s ease" : "none",
        }}>
        🔔
        {unread > 0 && (
          <div style={{
            position: "absolute", top: -3, right: -3, minWidth: 18, height: 18,
            borderRadius: 9, background: "#F43F5E", border: "2px solid var(--bg)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 10, fontWeight: 900, color: "#fff", padding: "0 4px",
            animation: "notifBounce 0.5s ease",
          }}>{unread > 9 ? "9+" : unread}</div>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: "absolute", right: 0, top: "calc(100% + 10px)",
          width: 350, background: "var(--modal-bg)", border: "1px solid var(--border2)",
          borderRadius: 18, boxShadow: "var(--shadow-xl)", zIndex: 9999,
          overflow: "hidden", animation: "popIn 0.18s ease",
        }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderBottom: "1px solid var(--border)" }}>
            <div style={{ fontFamily: "var(--font-head)", fontSize: 14, fontWeight: 800, color: "var(--text)" }}>
              Notifications {unread > 0 && <span style={{ fontSize: 11, background: "#F43F5E", color: "#fff", borderRadius: 20, padding: "1px 7px", marginLeft: 6 }}>{unread}</span>}
            </div>
            {unread > 0 && (
              <button onClick={() => markAllNotifsRead(user.uid)} style={{ fontSize: 11, color: "var(--accent)", background: "transparent", border: "none", cursor: "pointer", fontFamily: "inherit", fontWeight: 700 }}>
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div style={{ maxHeight: 380, overflowY: "auto" }}>
            {notifs.length === 0 && (
              <div style={{ textAlign: "center", padding: "36px 20px", color: "var(--text3)" }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>🔕</div>
                <div style={{ fontSize: 13 }}>You're all caught up!</div>
              </div>
            )}
            {notifs.map(n => (
              <div key={n.id} onClick={() => handleClick(n)} style={{
                display: "flex", gap: 12, padding: "11px 16px", cursor: "pointer",
                background: n.read ? "transparent" : "rgba(255,107,53,0.04)",
                borderBottom: "1px solid var(--border)",
                borderLeft: `3px solid ${n.read ? "transparent" : TYPE_COLOR[n.type] || "#FF6B35"}`,
                transition: "background 0.12s",
              }}
                onMouseEnter={e => e.currentTarget.style.background = "var(--hover-bg)"}
                onMouseLeave={e => e.currentTarget.style.background = n.read ? "transparent" : "rgba(255,107,53,0.04)"}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: `${TYPE_COLOR[n.type] || "#FF6B35"}18`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>
                  {TYPE_ICON[n.type] || "🔔"}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: n.read ? 500 : 700, color: n.read ? "var(--text2)" : "var(--text)", lineHeight: 1.4 }}>{n.title}</div>
                  {n.body && <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{n.body}</div>}
                  <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 4 }}>{timeAgo(n.createdAt)}</div>
                </div>
                <button onClick={e => { e.stopPropagation(); deleteNotification(user.uid, n.id); }} style={{ background: "transparent", border: "none", color: "var(--text3)", cursor: "pointer", fontSize: 16, padding: "0 4px", flexShrink: 0, lineHeight: 1, transition: "color 0.15s" }}
                  onMouseEnter={e => e.currentTarget.style.color = "#F43F5E"}
                  onMouseLeave={e => e.currentTarget.style.color = "var(--text3)"}>×</button>
              </div>
            ))}
          </div>

          <div style={{ padding: "10px 16px", borderTop: "1px solid var(--border)", textAlign: "center" }}>
            <button onClick={() => setOpen(false)} style={{ fontSize: 12, color: "var(--text3)", background: "transparent", border: "none", cursor: "pointer", fontFamily: "inherit" }}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
