// 📦 All remaining pages — Karyika
// HabitsPage, NotesPage, CalendarPage, FocusTimer, SettingsPage

import { useState, useEffect, useRef } from "react";
import { useAuth } from "../hooks/useAuth";
import { addHabit, updateHabit, deleteHabit, addNote, updateNote, deleteNote } from "../firebase/services";
import { Modal, Btn, Input, Empty, Card, ProgressBar, SectionHeader, StatCard, Toggle, Loader } from "../components/UI";
import { toast } from "../components/UI";

const todayStr = () => new Date().toISOString().split("T")[0];
const fmt = d => { try { return new Date(d).toLocaleDateString("en-IN", { month: "short", day: "numeric" }); } catch { return ""; } };
const fmtFull = d => { try { return new Date(d).toLocaleDateString("en-IN", { weekday: "long", month: "long", day: "numeric", year: "numeric" }); } catch { return ""; } };

// ─── HABITS PAGE ──────────────────────────────────────────────────────────────
export function HabitsPage({ habits, loading }) {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [newH, setNewH] = useState({ name: "", emoji: "📌", color: "#FF6B35" });
  const [saving, setSaving] = useState(false);
  const td = todayStr();

  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - 6 + i); return d.toISOString().split("T")[0];
  });
  const WDAYS = ["S", "M", "T", "W", "T", "F", "S"];

  const calcStreak = (logs = {}) => {
    let s = 0; const d = new Date();
    while (true) { const ds = d.toISOString().split("T")[0]; if (!logs[ds]) break; s++; d.setDate(d.getDate() - 1); }
    return s;
  };

  const toggleDay = async (h, ds) => {
    const logs = { ...(h.logs || {}) };
    logs[ds] ? delete logs[ds] : (logs[ds] = true);
    try { await updateHabit(user.uid, h.id, { logs }); }
    catch { toast("Update nahi hua.", "error"); }
  };

  const addH = async () => {
    if (!newH.name.trim()) { toast("Habit ka naam daalo!", "error"); return; }
    setSaving(true);
    try { await addHabit(user.uid, { ...newH, logs: {} }); toast("Habit add ho gayi! 🌱", "success"); setShowForm(false); setNewH({ name: "", emoji: "📌", color: "#FF6B35" }); }
    catch { toast("Kuch gadbad.", "error"); }
    setSaving(false);
  };

  const delH = async (id) => {
    if (!window.confirm("Habit delete karna chahte ho?")) return;
    try { await deleteHabit(user.uid, id); toast("Habit delete ho gayi!"); }
    catch { toast("Delete nahi hua.", "error"); }
  };

  if (loading) return <Loader />;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <div style={{ fontFamily: "var(--font-head)", fontSize: 18, fontWeight: 700 }}>Habit Tracker</div>
          <div style={{ fontSize: 13, color: "var(--text2)", marginTop: 2 }}>Rozana ki aadatein track karo</div>
        </div>
        <Btn onClick={() => setShowForm(true)}>+ Habit Add Karo</Btn>
      </div>

      {habits.length === 0 ? <Empty emoji="🌱" text="Koi habit nahi" sub="Ek achhi aadat se shuru karo!" /> : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {habits.map(h => {
            const s = calcStreak(h.logs);
            const doneDays = last7.filter(d => h.logs?.[d]).length;
            const pct = Math.round(doneDays / 7 * 100);
            return (
              <div key={h.id} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: 18 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
                  <span style={{ fontSize: 26 }}>{h.emoji || "📌"}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{h.name}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <ProgressBar value={pct} color={h.color || "var(--accent)"} height={5} />
                      <span style={{ fontSize: 11, color: "var(--text2)", whiteSpace: "nowrap" }}>{pct}% is hafte</span>
                    </div>
                  </div>
                  <div style={{ textAlign: "center", background: "var(--surface2)", padding: "8px 14px", borderRadius: 10 }}>
                    <div style={{ fontFamily: "var(--font-head)", fontSize: 22, fontWeight: 800, color: h.color || "var(--accent)", lineHeight: 1 }}>{s}</div>
                    <div style={{ fontSize: 10, color: "var(--text3)", fontWeight: 600 }}>streak</div>
                  </div>
                  <button onClick={() => delH(h.id)} style={{ padding: "6px 8px", border: "none", borderRadius: 8, background: "#FFF0F0", cursor: "pointer", fontSize: 14 }}>🗑️</button>
                </div>
                <div style={{ display: "flex", gap: 5 }}>
                  {last7.map(d => (
                    <div key={d} onClick={() => toggleDay(h, d)} style={{
                      flex: 1, aspectRatio: "1", borderRadius: 8,
                      border: `1.5px solid ${h.logs?.[d] ? (h.color || "var(--accent)") : "var(--border)"}`,
                      background: h.logs?.[d] ? (h.color || "var(--accent)") : "var(--surface2)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      cursor: "pointer", fontSize: 11, fontWeight: 700,
                      color: h.logs?.[d] ? "#fff" : "var(--text3)",
                      transition: "all var(--t)",
                    }}>
                      {WDAYS[new Date(d).getDay()]}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <Modal title="Nai Habit Add Karo" onClose={() => setShowForm(false)}
          footer={<><Btn variant="ghost" onClick={() => setShowForm(false)}>Cancel</Btn><Btn onClick={addH} disabled={saving}>{saving ? "Saving..." : "Add Karo"}</Btn></>}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Input label="Habit Name" placeholder="e.g. Subah ki exercise" value={newH.name} onChange={e => setNewH(h => ({ ...h, name: e.target.value }))} autoFocus />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Input label="Emoji" placeholder="e.g. 🏃" value={newH.emoji} onChange={e => setNewH(h => ({ ...h, emoji: e.target.value }))} />
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text2)", display: "block", marginBottom: 5 }}>Color</label>
                <input type="color" value={newH.color} onChange={e => setNewH(h => ({ ...h, color: e.target.value }))} style={{ height: 42, width: "100%", borderRadius: 10, border: "1.5px solid var(--border)", padding: 4, cursor: "pointer" }} />
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── NOTES PAGE ───────────────────────────────────────────────────────────────
const NOTE_COLORS = ["#FFF8E7", "#E8F5E9", "#E3F2FD", "#F3E5F5", "#FBE9E7", "#FFF3E0"];

export function NotesPage({ notes, loading }) {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [editNote, setEditNote] = useState(null);
  const [form, setForm] = useState({ title: "", body: "", color: NOTE_COLORS[0] });
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);

  const filtered = notes.filter(n => !search ||
    n.title?.toLowerCase().includes(search.toLowerCase()) ||
    n.body?.toLowerCase().includes(search.toLowerCase())
  );

  const openEdit = n => { setEditNote(n); setForm({ title: n.title || "", body: n.body || "", color: n.color || NOTE_COLORS[0] }); setShowForm(true); };
  const openNew = () => { setEditNote(null); setForm({ title: "", body: "", color: NOTE_COLORS[0] }); setShowForm(true); };

  const handleSave = async () => {
    if (!form.title.trim() && !form.body.trim()) { toast("Note khali hai!", "error"); return; }
    setSaving(true);
    try {
      if (editNote) { await updateNote(user.uid, editNote.id, form); toast("Note update ho gaya!"); }
      else { await addNote(user.uid, form); toast("Note save ho gaya! 📓", "success"); }
      setShowForm(false);
    } catch { toast("Save nahi hua.", "error"); }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    try { await deleteNote(user.uid, id); toast("Note delete ho gaya!"); setShowForm(false); }
    catch { toast("Delete nahi hua.", "error"); }
  };

  if (loading) return <Loader />;

  return (
    <div>
      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <div style={{ flex: 1, position: "relative" }}>
          <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text3)", fontSize: 14, pointerEvents: "none" }}>🔍</span>
          <input placeholder="Notes dhundo..." value={search} onChange={e => setSearch(e.target.value)} style={{
            background: "var(--surface2)", border: "1.5px solid var(--border)", borderRadius: 10,
            color: "var(--text)", fontSize: 14, padding: "10px 13px 10px 34px",
            fontFamily: "var(--font-body)", outline: "none", width: "100%",
          }} />
        </div>
        <Btn onClick={openNew}>+ Naya Note</Btn>
      </div>

      {filtered.length === 0 ? <Empty emoji="📓" text="Koi note nahi" sub="Apne ideas yahan likhna shuru karo!" /> : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
          {filtered.map(n => (
            <div key={n.id} onClick={() => openEdit(n)} style={{
              background: n.color || NOTE_COLORS[0], border: "1px solid rgba(0,0,0,0.06)",
              borderRadius: 14, padding: 18, cursor: "pointer", minHeight: 140,
              display: "flex", flexDirection: "column", transition: "all var(--t)",
              boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
            }}>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 8, color: "#1C1815" }}>{n.title || "Untitled"}</div>
              <div style={{ fontSize: 13, color: "#6B6459", flex: 1, whiteSpace: "pre-wrap", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 5, WebkitBoxOrient: "vertical" }}>{n.body}</div>
              <div style={{ fontSize: 11, color: "#9E9890", marginTop: 12 }}>{fmt(n.createdAt?.toDate?.() || n.createdAt)}</div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <Modal title={editNote ? "Note Edit Karo" : "Naya Note"} onClose={() => setShowForm(false)}
          footer={<>
            <Btn variant="ghost" onClick={() => setShowForm(false)}>Cancel</Btn>
            {editNote && <Btn variant="danger" onClick={() => handleDelete(editNote.id)}>Delete</Btn>}
            <Btn onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save Karo"}</Btn>
          </>}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Input label="Title" placeholder="Note ka title..." value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} autoFocus />
            <Input label="Content" placeholder="Yahan likho..." value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} rows={7} />
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text2)", display: "block", marginBottom: 8 }}>Color</label>
              <div style={{ display: "flex", gap: 8 }}>
                {NOTE_COLORS.map(c => (
                  <div key={c} onClick={() => setForm(f => ({ ...f, color: c }))} style={{
                    width: 30, height: 30, borderRadius: 8, background: c, cursor: "pointer",
                    border: `2.5px solid ${form.color === c ? "var(--accent)" : "transparent"}`,
                    transition: "border-color var(--t)",
                  }} />
                ))}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── CALENDAR PAGE ────────────────────────────────────────────────────────────
export function CalendarPage({ tasks, habits }) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selected, setSelected] = useState(todayStr());
  const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const td = todayStr();
  const firstDay = new Date(year, month, 1).getDay();
  const dim = new Date(year, month + 1, 0).getDate();
  const ds = d => `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  const prev = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const next = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };
  const selTasks = tasks.filter(t => t.due === selected);
  const selHabits = habits.filter(h => h.logs?.[selected]);
  const PC = { high: "var(--rose)", medium: "var(--gold)", low: "var(--teal)" };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, alignItems: "start" }}>
      <Card>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <button onClick={prev} style={{ background: "var(--surface2)", border: "none", borderRadius: 8, padding: "6px 10px", cursor: "pointer", fontSize: 16, color: "var(--text2)" }}>‹</button>
          <div style={{ fontFamily: "var(--font-head)", fontWeight: 700, fontSize: 16 }}>{MONTHS[month]} {year}</div>
          <button onClick={next} style={{ background: "var(--surface2)", border: "none", borderRadius: 8, padding: "6px 10px", cursor: "pointer", fontSize: 16, color: "var(--text2)" }}>›</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 3 }}>
          {DAYS.map(d => <div key={d} style={{ textAlign: "center", fontSize: 10, fontWeight: 700, color: "var(--text3)", padding: "5px 0", letterSpacing: "0.5px" }}>{d}</div>)}
          {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
          {Array.from({ length: dim }, (_, i) => {
            const d = i + 1; const dateStr = ds(d);
            const dayTasks = tasks.filter(t => t.due === dateStr);
            const isToday = dateStr === td; const isSel = dateStr === selected;
            return (
              <div key={d} onClick={() => setSelected(dateStr)} style={{
                aspectRatio: "1", borderRadius: 8, display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "flex-start", padding: "5px 2px",
                cursor: "pointer", transition: "all var(--t)",
                background: isSel ? "var(--accent)" : isToday ? "rgba(255,107,53,0.1)" : "var(--surface2)",
                border: `1.5px solid ${isToday && !isSel ? "var(--accent)" : "transparent"}`,
                color: isSel ? "#fff" : undefined,
              }}>
                <span style={{ fontSize: 12, fontWeight: isToday ? 800 : 500 }}>{d}</span>
                {dayTasks.length > 0 && (
                  <div style={{ display: "flex", gap: 2, marginTop: 2, flexWrap: "wrap", justifyContent: "center" }}>
                    {dayTasks.slice(0, 3).map((t, ti) => <div key={ti} style={{ width: 4, height: 4, borderRadius: "50%", background: isSel ? "rgba(255,255,255,0.7)" : (PC[t.priority] || "var(--accent)") }} />)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      <Card>
        <div style={{ fontFamily: "var(--font-head)", fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{fmtFull(selected)}</div>
        <div style={{ fontSize: 12, color: "var(--text3)", marginBottom: 16 }}>{selTasks.length} tasks · {selHabits.length} habits done</div>
        {selTasks.length === 0 && selHabits.length === 0
          ? <Empty emoji="🌿" text="Kuch schedule nahi hai" />
          : (
            <>
              {selTasks.length > 0 && (
                <>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 8 }}>Tasks</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
                    {selTasks.map(t => (
                      <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", background: "var(--surface2)", borderRadius: 8 }}>
                        <span>{t.done ? "✅" : "○"}</span>
                        <span style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>{t.title}</span>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: t.priority === "high" ? "#FFF0F5" : "#FFF8E6", color: t.priority === "high" ? "var(--rose)" : "var(--gold)" }}>{t.priority}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
              {selHabits.length > 0 && (
                <>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 8 }}>Habits Done</div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {selHabits.map(h => (
                      <div key={h.id} style={{ padding: "6px 12px", background: (h.color || "var(--accent)") + "20", color: h.color || "var(--accent)", borderRadius: 20, fontSize: 13, fontWeight: 600 }}>
                        {h.emoji} {h.name}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
      </Card>
    </div>
  );
}

// ─── FOCUS TIMER ─────────────────────────────────────────────────────────────
export function FocusTimer() {
  const MODES = [
    { label: "Focus", duration: 25 * 60, color: "var(--accent)" },
    { label: "Short Break", duration: 5 * 60, color: "var(--teal)" },
    { label: "Long Break", duration: 15 * 60, color: "var(--gold)" },
  ];
  const [mi, setMi] = useState(0);
  const [timeLeft, setTimeLeft] = useState(MODES[0].duration);
  const [running, setRunning] = useState(false);
  const [sessions, setSessions] = useState(0);
  const iRef = useRef(null);
  const mode = MODES[mi];
  const pct = timeLeft / mode.duration * 100;
  const R = 110, C = 2 * Math.PI * R;
  const mm = String(Math.floor(timeLeft / 60)).padStart(2, "0");
  const ss = String(timeLeft % 60).padStart(2, "0");

  useEffect(() => {
    if (running) {
      iRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) {
            clearInterval(iRef.current); setRunning(false);
            if (mi === 0) setSessions(s => s + 1);
            toast(`${mode.label} khatam! 🎉`, "success");
            if ("Notification" in window && Notification.permission === "granted")
              new Notification(`Karyika — ${mode.label} complete! 🎉`);
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => clearInterval(iRef.current);
  }, [running, mi]);

  const switchMode = idx => { clearInterval(iRef.current); setRunning(false); setMi(idx); setTimeLeft(MODES[idx].duration); };
  const toggle = () => { if (timeLeft === 0) { setTimeLeft(mode.duration); return; } setRunning(r => !r); };
  const reset = () => { clearInterval(iRef.current); setRunning(false); setTimeLeft(mode.duration); };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", maxWidth: 480, margin: "0 auto" }}>
      {/* Mode tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 36 }}>
        {MODES.map((m, i) => (
          <div key={m.label} onClick={() => switchMode(i)} style={{
            padding: "7px 18px", borderRadius: 20, fontSize: 13, fontWeight: 600,
            cursor: "pointer", border: `1.5px solid ${mi === i ? m.color : "var(--border)"}`,
            background: mi === i ? m.color : "var(--surface)",
            color: mi === i ? "#fff" : "var(--text2)", transition: "all var(--t)", userSelect: "none",
          }}>{m.label}</div>
        ))}
      </div>

      {/* Ring */}
      <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 36 }}>
        <svg width={260} height={260} style={{ transform: "rotate(-90deg)" }}>
          <circle cx={130} cy={130} r={R} fill="none" stroke="var(--surface2)" strokeWidth={12} />
          <circle cx={130} cy={130} r={R} fill="none" stroke={mode.color} strokeWidth={12}
            strokeDasharray={C} strokeDashoffset={C - (pct / 100) * C} strokeLinecap="round"
            style={{ transition: running ? "stroke-dashoffset 1s linear" : "stroke-dashoffset .3s ease" }} />
        </svg>
        <div style={{ position: "absolute", textAlign: "center", fontFamily: "var(--font-head)" }}>
          <div style={{ fontSize: 52, fontWeight: 800, lineHeight: 1, letterSpacing: -2, color: mode.color }}>{mm}:{ss}</div>
          <div style={{ fontSize: 13, color: "var(--text2)", marginTop: 6 }}>{mode.label}</div>
        </div>
      </div>

      {/* Buttons */}
      <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
        <Btn variant="ghost" onClick={reset}>↺ Reset</Btn>
        <Btn style={{ padding: "12px 40px", fontSize: 15, background: mode.color }} onClick={toggle}>
          {running ? "⏸ Pause" : timeLeft === 0 ? "↺ Restart" : "▶ Start"}
        </Btn>
      </div>

      {/* Sessions */}
      <Card style={{ width: "100%", textAlign: "center", marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 8 }}>
          {Array.from({ length: Math.max(sessions, 4) }, (_, i) => (
            <div key={i} style={{ width: 16, height: 16, borderRadius: 4, background: i < sessions ? mode.color : "var(--surface2)", transition: "background .3s" }} />
          ))}
        </div>
        <div style={{ fontSize: 13, color: "var(--text2)" }}>{sessions} session{sessions !== 1 ? "s" : ""} aaj kiye</div>
      </Card>

      <Card style={{ width: "100%", background: "var(--surface2)", border: "none" }}>
        <div style={{ fontSize: 13, color: "var(--text2)", lineHeight: 1.9 }}>
          <strong style={{ color: "var(--text)" }}>💡 Pomodoro Technique</strong><br />
          25 min kaam karo, 5 min break lo. 4 sessions ke baad 15 min ka bada break lo.
        </div>
      </Card>
    </div>
  );
}

// ─── SETTINGS PAGE ────────────────────────────────────────────────────────────
export function SettingsPage({ dark, setDark, tasks, habits, notes }) {
  const { user } = useAuth();

  const reqNotif = () => {
    if ("Notification" in window)
      Notification.requestPermission().then(p => toast(p === "granted" ? "Notifications on ho gayi! 🔔" : "Permission nahi mili.", p === "granted" ? "success" : "error"));
    else toast("Browser notifications support nahi karta.", "error");
  };

  const exportData = () => {
    const blob = new Blob([JSON.stringify({ tasks, habits, notes, at: new Date().toISOString() }, null, 2)], { type: "application/json" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "karyika-backup.json"; a.click();
    toast("Data export ho gaya! 💾", "success");
  };

  const ns = "Notification" in window ? Notification.permission : "unsupported";

  return (
    <div style={{ maxWidth: 600, display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Profile */}
      {user && (
        <Card>
          <SectionHeader title="👤 Profile" />
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 52, height: 52, borderRadius: "50%", background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 20, fontWeight: 700, overflow: "hidden", flexShrink: 0 }}>
              {user.photoURL ? <img src={user.photoURL} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : (user.displayName?.[0] || "U").toUpperCase()}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{user.displayName || "User"}</div>
              <div style={{ fontSize: 13, color: "var(--text2)" }}>{user.email}</div>
            </div>
          </div>
        </Card>
      )}

      {/* Appearance */}
      <Card>
        <SectionHeader title="🎨 Dikhavat" />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0" }}>
          <div><div style={{ fontWeight: 600, fontSize: 14 }}>Dark Mode</div><div style={{ fontSize: 12, color: "var(--text2)", marginTop: 2 }}>Raat mein aankhon ko aaram</div></div>
          <Toggle on={dark} onChange={setDark} />
        </div>
      </Card>

      {/* Notifications */}
      <Card>
        <SectionHeader title="🔔 Notifications" />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0" }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>Browser Notifications</div>
            <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 2 }}>Status: <strong style={{ color: ns === "granted" ? "var(--teal)" : "var(--rose)" }}>{ns}</strong></div>
          </div>
          <Btn variant="ghost" onClick={reqNotif} size="sm">Enable Karo</Btn>
        </div>
      </Card>

      {/* Stats */}
      <Card>
        <SectionHeader title="📊 Aapka Data" />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
          {[{ icon: "📋", val: tasks.length, label: "Total Tasks" }, { icon: "🌱", val: habits.length, label: "Habits" }, { icon: "📓", val: notes.length, label: "Notes" }].map(s => (
            <div key={s.label} style={{ textAlign: "center", padding: 14, background: "var(--surface2)", borderRadius: 12 }}>
              <div style={{ fontSize: 24 }}>{s.icon}</div>
              <div style={{ fontFamily: "var(--font-head)", fontSize: 26, fontWeight: 800, color: "var(--accent)" }}>{s.val}</div>
              <div style={{ fontSize: 11, color: "var(--text2)" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Data */}
      <Card>
        <SectionHeader title="💾 Data" />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--border)" }}>
          <div><div style={{ fontWeight: 600, fontSize: 14 }}>Data Export Karo</div><div style={{ fontSize: 12, color: "var(--text2)" }}>JSON backup download karo</div></div>
          <Btn variant="ghost" size="sm" onClick={exportData}>Export</Btn>
        </div>
        <div style={{ padding: "10px 0 0" }}>
          <div style={{ fontSize: 12, color: "var(--text3)", lineHeight: 1.8 }}>
            <strong>Karyika v1.0</strong> — Built with React + Firebase<br />
            Data Firebase Firestore mein save hota hai — kisi bhi device se access karo
          </div>
        </div>
      </Card>
    </div>
  );
}
