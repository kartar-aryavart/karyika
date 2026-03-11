// 🔔 NotificationBell v3 — World's Best Notification System
// Features: Reminders, Overdue alerts, Habit nudges, Sounds, Filters, Snooze, Priority, Browser Push
import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../hooks/useAuth";
import { subscribeToNotifications, markNotifRead, markAllNotifsRead, deleteNotification, addNotification, subscribeToTasks, subscribeToHabits } from "../firebase/services";

const TYPE_ICON  = { info:"💬", task:"✅", reminder:"⏰", team:"👥", ai:"🤖", warning:"⚠️", success:"🎉", habit:"🌱", overdue:"🚨", goal:"🎯" };
const TYPE_COLOR = { info:"#818CF8", task:"#10B981", reminder:"#F59E0B", team:"#FF6B35", ai:"#8B5CF6", warning:"#F43F5E", success:"#10B981", habit:"#10B981", overdue:"#F43F5E", goal:"#F59E0B" };
const FILTERS = ["all","unread","reminder","task","warning","success"];

// ─── SOUND ENGINE ──────────────────────────────────────────────────────────
function playSound(type) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const master = ctx.createGain();
    master.connect(ctx.destination);
    master.gain.setValueAtTime(0.35, ctx.currentTime);

    const sounds = {
      notif:    [[0,880,0.07],[0.08,1100,0.07],[0.16,1320,0.09]],
      success:  [[0,523,0.08],[0.09,659,0.08],[0.18,784,0.1],[0.27,1046,0.12]],
      warning:  [[0,440,0.1],[0.14,370,0.1],[0.28,440,0.08]],
      reminder: [[0,660,0.08],[0.1,880,0.08],[0.2,660,0.06],[0.3,880,0.08]],
      complete: [[0,784,0.06],[0.07,1046,0.08],[0.14,1318,0.1]],
      overdue:  [[0,330,0.12],[0.12,294,0.12],[0.24,262,0.14]],
      habit:    [[0,587,0.07],[0.08,740,0.07],[0.16,880,0.09]],
    };
    const notes = sounds[type] || sounds.notif;
    notes.forEach(function([when, freq, dur]) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(master);
      osc.type = type === "overdue" ? "sawtooth" : type === "warning" ? "triangle" : "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime + when);
      gain.gain.setValueAtTime(0, ctx.currentTime + when);
      gain.gain.linearRampToValueAtTime(0.9, ctx.currentTime + when + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + when + dur + 0.2);
      osc.start(ctx.currentTime + when);
      osc.stop(ctx.currentTime + when + dur + 0.25);
    });
    setTimeout(function() { ctx.close(); }, 2500);
  } catch(e) {}
}
export { playSound };

// ─── BROWSER PUSH PERMISSION ───────────────────────────────────────────────
async function requestPushPermission() {
  if (!("Notification" in window)) return "unsupported";
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";
  const perm = await Notification.requestPermission();
  return perm;
}

function sendBrowserPush(title, body, type) {
  if (Notification.permission !== "granted") return;
  try {
    const n = new Notification("Karyika — " + title, {
      body: body || "",
      icon: "/logo.png",
      badge: "/logo.png",
      tag: type + "-" + Date.now(),
      vibrate: [200, 100, 200],
    });
    setTimeout(function() { n.close(); }, 6000);
  } catch(e) {}
}

// ─── HELPERS ───────────────────────────────────────────────────────────────
function timeAgo(ts) {
  if (!ts) return "";
  const d = ts && ts.toDate ? ts.toDate() : new Date(ts);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60)    return "abhi";
  if (diff < 3600)  return Math.floor(diff/60) + "m ago";
  if (diff < 86400) return Math.floor(diff/3600) + "h ago";
  return Math.floor(diff/86400) + "d ago";
}

function todayStr() { return new Date().toISOString().slice(0,10); }

// ─── SNOOZE OPTIONS ────────────────────────────────────────────────────────
const SNOOZE_OPTS = [
  { label: "5 min", ms: 5*60*1000 },
  { label: "15 min", ms: 15*60*1000 },
  { label: "1 hour", ms: 60*60*1000 },
  { label: "Tomorrow", ms: null }, // special
];

// ─── MAIN COMPONENT ────────────────────────────────────────────────────────
export default function NotificationBell({ onNavigate }) {
  const { user } = useAuth();
  const [notifs, setNotifs]       = useState([]);
  const [open, setOpen]           = useState(false);
  const [ringing, setRinging]     = useState(false);
  const [filter, setFilter]       = useState("all");
  const [snoozeId, setSnoozeId]   = useState(null);
  const [pushAllowed, setPushAllowed] = useState(false);
  const [soundOn, setSoundOn]     = useState(function() { return localStorage.getItem("karyika-sound") !== "false"; });
  const [showSettings, setShowSettings] = useState(false);
  const prevCount = useRef(0);
  const ref = useRef();
  const checkedOverdue = useRef(new Set());
  const checkedHabits  = useRef(new Set());

  // Check push permission status
  useEffect(function() {
    if ("Notification" in window) setPushAllowed(Notification.permission === "granted");
  }, []);

  // Save sound pref
  useEffect(function() {
    localStorage.setItem("karyika-sound", soundOn);
  }, [soundOn]);

  // Subscribe to notifications
  useEffect(function() {
    if (!user) return;
    return subscribeToNotifications(user.uid, function(data) {
      const newUnread = data.filter(function(n) { return !n.read; }).length;
      if (newUnread > prevCount.current) {
        if (soundOn) playSound("notif");
        setRinging(true);
        setTimeout(function() { setRinging(false); }, 900);
        // Browser push for new notif
        const newest = data.find(function(n) { return !n.read; });
        if (newest) sendBrowserPush(newest.title, newest.body, newest.type || "notif");
      }
      prevCount.current = newUnread;
      setNotifs(data);
    });
  }, [user, soundOn]);

  // ── OVERDUE CHECKER (every 5 min) ──────────────────────────────────────
  useEffect(function() {
    if (!user) return;
    function checkOverdue() {
      subscribeToTasks(user.uid, function(tasks) {
        const today = todayStr();
        const overdue = tasks.filter(function(t) {
          return !t.done && t.due && t.due < today && !checkedOverdue.current.has(t.id);
        });
        overdue.forEach(function(t) {
          checkedOverdue.current.add(t.id);
          addNotification(user.uid, {
            title: "Task overdue: " + t.title,
            body: "Due tha " + t.due + " — ab bhi pending hai!",
            type: "overdue",
            link: "tasks",
          });
          if (soundOn) playSound("overdue");
          sendBrowserPush("Overdue: " + t.title, "Due tha " + t.due, "overdue");
        });
      });
    }
    checkOverdue();
    const t = setInterval(checkOverdue, 5 * 60 * 1000);
    return function() { clearInterval(t); };
  }, [user, soundOn]);

  // ── HABIT REMINDER (once per day if not done by 8pm) ──────────────────
  useEffect(function() {
    if (!user) return;
    function checkHabits() {
      const h = new Date().getHours();
      if (h < 20) return; // Only after 8pm
      const today = todayStr();
      const key = "habit-reminder-" + today;
      if (checkedHabits.current.has(key)) return;
      checkedHabits.current.add(key);
      subscribeToHabits(user.uid, function(habits) {
        const undone = habits.filter(function(h) { return !h.logs || !h.logs[today]; });
        if (undone.length > 0) {
          addNotification(user.uid, {
            title: undone.length + " habits abhi bhi pending! 🌱",
            body: undone.slice(0,3).map(function(h) { return h.name; }).join(", ") + (undone.length > 3 ? " +" + (undone.length-3) + " more" : ""),
            type: "habit",
            link: "habits",
          });
          if (soundOn) playSound("habit");
          sendBrowserPush(undone.length + " habits pending!", "Aaj ka din khatam hone wala hai!", "habit");
        }
      });
    }
    checkHabits();
    const t = setInterval(checkHabits, 60 * 60 * 1000); // check hourly
    return function() { clearInterval(t); };
  }, [user, soundOn]);

  // Close on outside click
  useEffect(function() {
    function handler(e) { if (ref.current && !ref.current.contains(e.target)) { setOpen(false); setSnoozeId(null); } }
    document.addEventListener("mousedown", handler);
    return function() { document.removeEventListener("mousedown", handler); };
  }, []);

  const unread = notifs.filter(function(n) { return !n.read; }).length;

  const filtered = notifs.filter(function(n) {
    if (filter === "all")    return true;
    if (filter === "unread") return !n.read;
    return n.type === filter;
  });

  function handleClick(n) {
    if (!n.read) markNotifRead(user.uid, n.id);
    if (n.link && onNavigate) onNavigate(n.link);
    setOpen(false);
  }

  function handleSnooze(n, opt) {
    deleteNotification(user.uid, n.id);
    setSnoozeId(null);
    let delayMs = opt.ms;
    if (!delayMs) { // Tomorrow
      const tm = new Date(); tm.setDate(tm.getDate()+1); tm.setHours(9,0,0,0);
      delayMs = tm.getTime() - Date.now();
    }
    setTimeout(function() {
      addNotification(user.uid, {
        title: "⏰ Snoozed: " + n.title,
        body: n.body || "",
        type: "reminder",
        link: n.link || "",
      });
      if (soundOn) playSound("reminder");
      sendBrowserPush("Snoozed reminder!", n.title, "reminder");
    }, delayMs);
  }

  function handleEnablePush() {
    requestPushPermission().then(function(p) {
      setPushAllowed(p === "granted");
      if (p === "granted") {
        addNotification(user.uid, {
          title: "Browser notifications enabled! 🎉",
          body: "Ab tumhe important alerts milenge.",
          type: "success",
        });
        playSound("success");
      }
    });
  }

  const bellBtn = {
    position: "relative", width: 38, height: 38, borderRadius: "50%",
    background: open ? "rgba(255,107,53,0.12)" : "var(--surface2)",
    border: "1px solid " + (open ? "rgba(255,107,53,0.35)" : "var(--border)"),
    display: "flex", alignItems: "center", justifyContent: "center",
    cursor: "pointer", transition: "all 0.2s", fontSize: 17,
    animation: ringing ? "notifBounce 0.7s ease" : "none",
    flexShrink: 0,
  };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      {/* Bell */}
      <button style={bellBtn} onClick={function() { setOpen(function(o) { return !o; }); }}>
        🔔
        {unread > 0 && (
          <div style={{ position: "absolute", top: -3, right: -3, minWidth: 18, height: 18, borderRadius: 9, background: "#F43F5E", border: "2px solid var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 900, color: "#fff", padding: "0 3px" }}>
            {unread > 9 ? "9+" : unread}
          </div>
        )}
      </button>

      {/* Panel */}
      {open && (
        <div style={{ position: "absolute", right: 0, top: "calc(100% + 10px)", width: 380, background: "var(--modal-bg)", border: "1px solid var(--border2)", borderRadius: 20, boxShadow: "var(--shadow-xl)", zIndex: 9999, overflow: "hidden", animation: "popIn 0.2s ease" }}>

          {/* Header */}
          <div style={{ padding: "14px 16px 10px", borderBottom: "1px solid var(--border)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontFamily: "var(--font-head)", fontSize: 15, fontWeight: 900, color: "var(--text)" }}>Notifications</span>
                {unread > 0 && <span style={{ fontSize: 11, background: "#F43F5E", color: "#fff", borderRadius: 20, padding: "1px 8px", fontWeight: 800 }}>{unread}</span>}
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                {/* Sound toggle */}
                <button title={soundOn ? "Sound On" : "Sound Off"} onClick={function() { setSoundOn(function(s) { return !s; }); }}
                  style={{ fontSize: 14, width: 28, height: 28, borderRadius: 8, background: soundOn ? "rgba(16,185,129,0.1)" : "var(--surface3)", border: "1px solid var(--border)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {soundOn ? "🔊" : "🔇"}
                </button>
                {/* Settings */}
                <button onClick={function() { setShowSettings(function(s) { return !s; }); }}
                  style={{ fontSize: 14, width: 28, height: 28, borderRadius: 8, background: showSettings ? "rgba(255,107,53,0.1)" : "var(--surface3)", border: "1px solid var(--border)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  ⚙️
                </button>
                {unread > 0 && (
                  <button onClick={function() { markAllNotifsRead(user.uid); }}
                    style={{ fontSize: 11, padding: "4px 10px", background: "rgba(255,107,53,0.08)", border: "1px solid rgba(255,107,53,0.2)", borderRadius: 8, color: "var(--accent)", cursor: "pointer", fontFamily: "inherit", fontWeight: 700 }}>
                    Sab padhlo
                  </button>
                )}
              </div>
            </div>

            {/* Settings panel */}
            {showSettings && (
              <div style={{ background: "var(--surface2)", borderRadius: 12, padding: "12px 14px", marginBottom: 10, border: "1px solid var(--border)" }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: "var(--text)", marginBottom: 10 }}>⚙️ Notification Settings</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 12, color: "var(--text2)" }}>🔊 Sound alerts</span>
                    <button onClick={function() { setSoundOn(function(s) { return !s; }); }} style={{ width: 40, height: 22, borderRadius: 11, background: soundOn ? "var(--accent)" : "var(--surface3)", border: "none", cursor: "pointer", position: "relative", transition: "background 0.2s" }}>
                      <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#fff", position: "absolute", top: 2, left: soundOn ? 20 : 2, transition: "left 0.2s", boxShadow: "0 1px 4px rgba(0,0,0,0.3)" }} />
                    </button>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 12, color: "var(--text2)" }}>🌐 Browser push</span>
                    {pushAllowed
                      ? <span style={{ fontSize: 11, color: "var(--teal)", fontWeight: 700 }}>✅ Enabled</span>
                      : <button onClick={handleEnablePush} style={{ fontSize: 11, padding: "3px 10px", background: "var(--accent)", border: "none", borderRadius: 8, color: "#fff", cursor: "pointer", fontFamily: "inherit", fontWeight: 700 }}>Enable</button>
                    }
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 12, color: "var(--text2)" }}>🚨 Overdue alerts</span>
                    <span style={{ fontSize: 11, color: "var(--teal)", fontWeight: 700 }}>✅ Active</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 12, color: "var(--text2)" }}>🌱 Habit reminders (8pm)</span>
                    <span style={{ fontSize: 11, color: "var(--teal)", fontWeight: 700 }}>✅ Active</span>
                  </div>
                </div>
              </div>
            )}

            {/* Filters */}
            <div style={{ display: "flex", gap: 5, overflowX: "auto", paddingBottom: 2 }}>
              {FILTERS.map(function(f) {
                return (
                  <button key={f} onClick={function() { setFilter(f); }}
                    style={{ fontSize: 11, padding: "3px 10px", borderRadius: 20, fontFamily: "inherit", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0, transition: "all 0.15s",
                      background: filter === f ? "var(--accent)" : "var(--surface2)",
                      color: filter === f ? "#fff" : "var(--text3)",
                      border: "1px solid " + (filter === f ? "var(--accent)" : "var(--border)"),
                    }}>
                    {f === "all" ? "Sab" : f === "unread" ? "Unread" : f.charAt(0).toUpperCase() + f.slice(1)}
                    {f === "unread" && unread > 0 && " (" + unread + ")"}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Notification List */}
          <div style={{ maxHeight: 380, overflowY: "auto" }}>
            {filtered.length === 0 && (
              <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--text3)" }}>
                <div style={{ fontSize: 36, marginBottom: 10 }}>{filter === "unread" ? "🎉" : "🔕"}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text2)" }}>{filter === "unread" ? "Sab padh liya!" : "Koi notification nahi"}</div>
                <div style={{ fontSize: 12, marginTop: 4 }}>You're all caught up!</div>
              </div>
            )}
            {filtered.map(function(n) {
              const color = TYPE_COLOR[n.type] || "#FF6B35";
              const isSnoozing = snoozeId === n.id;
              return (
                <div key={n.id} style={{ borderBottom: "1px solid var(--border)" }}>
                  <div onClick={function() { handleClick(n); }}
                    style={{ display: "flex", gap: 11, padding: "11px 14px", cursor: "pointer", background: n.read ? "transparent" : color + "08", borderLeft: "3px solid " + (n.read ? "transparent" : color), transition: "background 0.12s" }}
                    onMouseEnter={function(e) { e.currentTarget.style.background = "var(--hover-bg)"; }}
                    onMouseLeave={function(e) { e.currentTarget.style.background = n.read ? "transparent" : color + "08"; }}>
                    {/* Icon */}
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: color + "18", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, flexShrink: 0 }}>
                      {TYPE_ICON[n.type] || "🔔"}
                    </div>
                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: n.read ? 500 : 800, color: n.read ? "var(--text2)" : "var(--text)", lineHeight: 1.4 }}>{n.title}</div>
                      {n.body && <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{n.body}</div>}
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 5 }}>
                        <span style={{ fontSize: 10, color: "var(--text3)" }}>{timeAgo(n.createdAt)}</span>
                        {n.type && <span style={{ fontSize: 10, padding: "1px 7px", background: color + "18", color: color, borderRadius: 20, fontWeight: 700, textTransform: "capitalize" }}>{n.type}</span>}
                        {!n.read && <div style={{ width: 6, height: 6, borderRadius: "50%", background: color }} />}
                      </div>
                    </div>
                    {/* Actions */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 4, flexShrink: 0 }}>
                      {/* Snooze */}
                      <button title="Snooze" onClick={function(e) { e.stopPropagation(); setSnoozeId(isSnoozing ? null : n.id); }}
                        style={{ fontSize: 13, width: 26, height: 26, borderRadius: 8, background: isSnoozing ? "rgba(245,158,11,0.15)" : "var(--surface3)", border: "1px solid " + (isSnoozing ? "rgba(245,158,11,0.4)" : "var(--border)"), cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        ⏰
                      </button>
                      {/* Delete */}
                      <button title="Delete" onClick={function(e) { e.stopPropagation(); deleteNotification(user.uid, n.id); }}
                        style={{ fontSize: 13, width: 26, height: 26, borderRadius: 8, background: "var(--surface3)", border: "1px solid var(--border)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text3)", transition: "all 0.15s" }}
                        onMouseEnter={function(e) { e.currentTarget.style.background = "rgba(244,63,94,0.1)"; e.currentTarget.style.color = "#F43F5E"; }}
                        onMouseLeave={function(e) { e.currentTarget.style.background = "var(--surface3)"; e.currentTarget.style.color = "var(--text3)"; }}>
                        ×
                      </button>
                    </div>
                  </div>

                  {/* Snooze options */}
                  {isSnoozing && (
                    <div style={{ padding: "8px 14px 10px 61px", background: "rgba(245,158,11,0.05)", display: "flex", gap: 6, flexWrap: "wrap" }}>
                      <div style={{ fontSize: 11, color: "var(--text3)", fontWeight: 700, width: "100%", marginBottom: 4 }}>⏰ Snooze karo:</div>
                      {SNOOZE_OPTS.map(function(opt) {
                        return (
                          <button key={opt.label} onClick={function() { handleSnooze(n, opt); }}
                            style={{ fontSize: 11, padding: "4px 12px", background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.25)", borderRadius: 20, color: "#F59E0B", cursor: "pointer", fontFamily: "inherit", fontWeight: 700, transition: "all 0.15s" }}
                            onMouseEnter={function(e) { e.currentTarget.style.background = "rgba(245,158,11,0.2)"; }}
                            onMouseLeave={function(e) { e.currentTarget.style.background = "rgba(245,158,11,0.1)"; }}>
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div style={{ padding: "10px 16px", borderTop: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 11, color: "var(--text3)" }}>{notifs.length} total notifications</span>
            {notifs.length > 0 && (
              <button onClick={function() { notifs.forEach(function(n) { deleteNotification(user.uid, n.id); }); }}
                style={{ fontSize: 11, color: "var(--rose)", background: "transparent", border: "none", cursor: "pointer", fontFamily: "inherit", fontWeight: 700 }}>
                Sab delete karo
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}