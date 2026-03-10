// 🏠 Dashboard v6 — Motivational, Live Data, Full Light+Dark
import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";

const QUOTES = [
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain", emoji: "🚀" },
  { text: "Focus on being productive instead of busy.", author: "Tim Ferriss", emoji: "⚡" },
  { text: "Small steps every day lead to big results.", author: "Unknown", emoji: "🌱" },
  { text: "Done is better than perfect.", author: "Sheryl Sandberg", emoji: "✅" },
  { text: "Your future is created by what you do today.", author: "Robert Kiyosaki", emoji: "🎯" },
  { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt", emoji: "🌟" },
  { text: "Success is the sum of small efforts, repeated.", author: "Robert Collier", emoji: "💪" },
  { text: "The way to get started is to quit talking and begin doing.", author: "Walt Disney", emoji: "🔥" },
];

const THOUGHTS_HI = [
  "Aaj ka din tumhara hai — ek kaam karo jo future tumhe thank kare! 🙏",
  "Har bada goal chote steps se shuru hota hai. Aaj pehla step lo! 👣",
  "Mushkil kaam pehle karo — baaki sab aasaan lagega! 💪",
  "Consistency is the key — roz thoda thoda karo! 🔑",
  "Jo karna hai, aaj karo — kal sirf ek idea hai! 💡",
];

const todayStr = () => new Date().toISOString().slice(0, 10);

function greet(name) {
  const h = new Date().getHours();
  const g = h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : h < 21 ? "Good evening" : "Good night";
  return `${g}, ${(name || "there").split(" ")[0]}! 👋`;
}

// ── Animated number counter
function Counter({ to }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!to) return;
    let cur = 0;
    const step = Math.max(1, Math.ceil(to / 25));
    const t = setInterval(() => { cur = Math.min(cur + step, to); setVal(cur); if (cur >= to) clearInterval(t); }, 35);
    return () => clearInterval(t);
  }, [to]);
  return <>{val}</>;
}

// ── Progress ring
function Ring({ pct, color, size = 64, stroke = 6 }) {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)", flexShrink: 0 }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface3)" strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
        strokeDasharray={`${(pct / 100) * c} ${c}`} style={{ transition: "stroke-dasharray 1.2s ease" }} />
    </svg>
  );
}

// ── Mini progress bar
function Bar({ pct, color }) {
  return (
    <div style={{ height: 5, background: "var(--surface3)", borderRadius: 5, overflow: "hidden" }}>
      <div style={{ height: "100%", width: `${Math.min(pct, 100)}%`, background: color, borderRadius: 5, transition: "width 1s ease", boxShadow: `0 0 6px ${color}55` }} />
    </div>
  );
}

// ── Big stat card
function StatCard({ icon, label, value, sub, color, trend }) {
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderTop: `3px solid ${color}`, borderRadius: 18, padding: "18px 20px", transition: "all 0.2s" }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = `0 8px 28px ${color}18`; }}
      onMouseLeave={e => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <span style={{ fontSize: 11, fontWeight: 800, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "1px" }}>{icon} {label}</span>
        {trend !== undefined && <span style={{ fontSize: 10, fontWeight: 800, color: trend >= 0 ? "var(--teal)" : "var(--rose)", background: trend >= 0 ? "rgba(16,185,129,0.1)" : "rgba(244,63,94,0.1)", padding: "2px 7px", borderRadius: 20 }}>{trend >= 0 ? "↑" : "↓"}{Math.abs(trend)}%</span>}
      </div>
      <div style={{ fontFamily: "var(--font-head)", fontSize: 38, fontWeight: 900, color: "var(--text)", letterSpacing: "-2px", lineHeight: 1 }}>
        <Counter to={parseInt(value) || 0} />
      </div>
      {sub && <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 6 }}>{sub}</div>}
    </div>
  );
}

export default function Dashboard({ tasks = [], habits = [], projects = [], goals = [] }) {
  const { user } = useAuth();
  const [qIdx, setQIdx] = useState(() => Math.floor(Math.random() * QUOTES.length));
  const [qVisible, setQVisible] = useState(true);
  const [thought] = useState(() => THOUGHTS_HI[Math.floor(Math.random() * THOUGHTS_HI.length)]);
  const [time, setTime] = useState(new Date());

  useEffect(() => { const t = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(t); }, []);

  useEffect(() => {
    const t = setInterval(() => {
      setQVisible(false);
      setTimeout(() => { setQIdx(i => (i + 1) % QUOTES.length); setQVisible(true); }, 350);
    }, 7000);
    return () => clearInterval(t);
  }, []);

  const today = todayStr();
  const pending      = tasks.filter(t => !t.done);
  const doneToday    = tasks.filter(t => t.done && t.completedAt?.slice?.(0, 10) === today);
  const overdue      = pending.filter(t => t.due && t.due < today);
  const todayTasks   = pending.filter(t => t.due === today);
  const highPri      = pending.filter(t => t.priority === "urgent" || t.priority === "high").slice(0, 4);
  const upcoming     = [...pending].filter(t => t.due).sort((a, b) => a.due.localeCompare(b.due)).slice(0, 5);
  const donePct      = tasks.length ? Math.round(tasks.filter(t => t.done).length / tasks.length * 100) : 0;
  const habitsToday  = habits.filter(h => h.logs?.[today]);
  const habitPct     = habits.length ? Math.round(habitsToday.length / habits.length * 100) : 0;
  const goalAvg      = goals.length ? Math.round(goals.reduce((s, g) => s + Math.min(Math.round((g.current / Math.max(g.target, 1)) * 100), 100), 0) / goals.length) : 0;

  const q = QUOTES[qIdx];
  const userName = user?.displayName || user?.email?.split("@")[0] || "there";
  const timeStr = time.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
  const dateStr = time.toLocaleDateString("en-IN", { weekday: "long", month: "long", day: "numeric" });

  const PRI_COLOR = { urgent: "var(--gold)", high: "var(--rose)", medium: "var(--gold)", low: "var(--teal)" };

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>

      {/* ── HERO GREETING ── */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 22, padding: "26px 30px", marginBottom: 16, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", right: -20, top: -20, width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle,rgba(255,107,53,0.07),transparent 70%)", pointerEvents: "none" }} />
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <div>
            <h1 style={{ fontFamily: "var(--font-head)", fontSize: "clamp(22px,3vw,30px)", fontWeight: 900, letterSpacing: "-1px", color: "var(--text)", marginBottom: 5 }}>{greet(userName)}</h1>
            <div style={{ fontSize: 13, color: "var(--text2)", marginBottom: 14 }}>{dateStr}</div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 9, padding: "8px 14px", background: "rgba(255,107,53,0.07)", border: "1px solid rgba(255,107,53,0.14)", borderRadius: 12, fontSize: 13, color: "var(--text2)", maxWidth: 480 }}>
              <span style={{ fontSize: 18 }}>💭</span>
              <span><strong style={{ color: "var(--accent)" }}>Soch:</strong> {thought}</span>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: "var(--font-head)", fontSize: 34, fontWeight: 900, color: "var(--text)", letterSpacing: "-2px", lineHeight: 1 }}>{timeStr}</div>
            <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 5 }}>
              {doneToday.length > 0 ? `🎉 ${doneToday.length} tasks done today!` : "Let's get things done! 💪"}
            </div>
            {overdue.length > 0 && <div style={{ fontSize: 12, color: "var(--rose)", fontWeight: 700, marginTop: 4 }}>⚠️ {overdue.length} overdue task{overdue.length > 1 ? "s" : ""}</div>}
          </div>
        </div>
      </div>

      {/* ── QUOTE CARD ── */}
      <div style={{ background: "linear-gradient(135deg,rgba(255,107,53,0.06),rgba(139,92,246,0.05))", border: "1px solid rgba(255,107,53,0.14)", borderRadius: 16, padding: "16px 22px", marginBottom: 16, display: "flex", alignItems: "center", gap: 14 }}>
        <span style={{ fontSize: 26, flexShrink: 0, opacity: qVisible ? 1 : 0, transition: "opacity 0.35s" }}>{q.emoji}</span>
        <div style={{ flex: 1, opacity: qVisible ? 1 : 0, transform: qVisible ? "none" : "translateY(5px)", transition: "all 0.35s ease" }}>
          <div style={{ fontSize: "clamp(13px,2vw,15px)", fontWeight: 700, color: "var(--text)", fontStyle: "italic", lineHeight: 1.5 }}>"{q.text}"</div>
          <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 4, fontWeight: 600 }}>— {q.author}</div>
        </div>
        <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
          {QUOTES.map((_, i) => (
            <div key={i} onClick={() => { setQVisible(false); setTimeout(() => { setQIdx(i); setQVisible(true); }, 200); }}
              style={{ width: i === qIdx ? 16 : 5, height: 5, borderRadius: 5, background: i === qIdx ? "var(--accent)" : "var(--surface3)", cursor: "pointer", transition: "all 0.3s" }} />
          ))}
        </div>
      </div>

      {/* ── STAT CARDS ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 14 }}>
        <StatCard icon="📋" label="Pending" value={pending.length} sub={todayTasks.length > 0 ? `${todayTasks.length} due today` : "Nothing due today"} color="var(--indigo)" />
        <StatCard icon="✅" label="Done" value={tasks.filter(t => t.done).length} sub={`${donePct}% completion`} color="var(--teal)" trend={donePct > 50 ? 8 : -3} />
        <StatCard icon="🌱" label="Habits Today" value={habitsToday.length} sub={`${habitPct}% of ${habits.length} habits`} color="var(--gold)" />
        <StatCard icon="🎯" label="Goal Progress" value={goalAvg} sub={`${goals.length} active goals`} color="var(--rose)" />
      </div>

      {/* ── MAIN ROW ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 13, marginBottom: 13 }}>

        {/* Today tasks */}
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 18, padding: "18px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 13 }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: "var(--text)" }}>📅 Today's Tasks</span>
            <span style={{ fontSize: 10, padding: "2px 8px", background: "rgba(245,158,11,0.1)", color: "var(--gold)", borderRadius: 20, fontWeight: 700 }}>{todayTasks.length}</span>
          </div>
          {todayTasks.length === 0 ? (
            <div style={{ textAlign: "center", padding: "20px 0", color: "var(--text3)", fontSize: 13 }}>🎉 No tasks today!<br /><span style={{ fontSize: 11 }}>Chill karo 😎</span></div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {todayTasks.slice(0, 5).map(t => (
                <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 9, padding: "7px 10px", background: "var(--surface2)", borderRadius: 10, borderLeft: `3px solid ${PRI_COLOR[t.priority] || "var(--text3)"}` }}>
                  <div style={{ width: 13, height: 13, borderRadius: "50%", border: "1.5px solid var(--border2)", flexShrink: 0 }} />
                  <span style={{ fontSize: 13, color: "var(--text)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.title}</span>
                  <span style={{ fontSize: 9, padding: "2px 6px", background: "var(--surface3)", color: "var(--text3)", borderRadius: 8, flexShrink: 0, fontWeight: 700, textTransform: "uppercase" }}>{t.priority}</span>
                </div>
              ))}
              {todayTasks.length > 5 && <div style={{ fontSize: 11, color: "var(--text3)", textAlign: "center", marginTop: 2 }}>+{todayTasks.length - 5} more</div>}
            </div>
          )}
        </div>

        {/* Progress rings */}
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 18, padding: "18px 20px" }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: "var(--text)", marginBottom: 16 }}>📊 Progress Overview</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            {[
              { label: "Tasks", pct: donePct, color: "var(--teal)" },
              { label: "Habits", pct: habitPct, color: "var(--gold)" },
              { label: "Goals", pct: goalAvg, color: "var(--rose)" },
              { label: "Projects", pct: projects.length ? Math.round(projects.filter(p => p.status === "done").length / projects.length * 100) : 0, color: "var(--indigo)" },
            ].map(r => (
              <div key={r.label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                <div style={{ position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                  <Ring pct={r.pct} color={r.color} size={62} stroke={6} />
                  <div style={{ position: "absolute", fontFamily: "var(--font-head)", fontSize: 13, fontWeight: 900, color: r.color }}>{r.pct}%</div>
                </div>
                <div style={{ fontSize: 11, color: "var(--text3)", fontWeight: 600, textAlign: "center" }}>{r.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* High priority */}
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 18, padding: "18px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 13 }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: "var(--text)" }}>🔥 High Priority</span>
            <span style={{ fontSize: 10, padding: "2px 8px", background: "rgba(244,63,94,0.1)", color: "var(--rose)", borderRadius: 20, fontWeight: 700 }}>{highPri.length}</span>
          </div>
          {highPri.length === 0 ? (
            <div style={{ textAlign: "center", padding: "20px 0", color: "var(--text3)", fontSize: 13 }}>✅ No urgent tasks!</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {highPri.map(t => (
                <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 9, padding: "7px 10px", background: t.priority === "urgent" ? "rgba(249,115,22,0.06)" : "rgba(244,63,94,0.05)", border: `1px solid ${t.priority === "urgent" ? "rgba(249,115,22,0.15)" : "rgba(244,63,94,0.1)"}`, borderRadius: 10 }}>
                  <span style={{ fontSize: 14, flexShrink: 0 }}>{t.priority === "urgent" ? "🚨" : "❗"}</span>
                  <span style={{ fontSize: 12, color: "var(--text)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.title}</span>
                  {t.due && <span style={{ fontSize: 10, color: t.due < today ? "var(--rose)" : "var(--text3)", flexShrink: 0, fontWeight: 600 }}>{t.due === today ? "Today" : t.due < today ? "Late" : t.due.slice(5)}</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── SECOND ROW ── */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 13, marginBottom: 13 }}>

        {/* Upcoming tasks */}
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 18, padding: "18px 20px" }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: "var(--text)", marginBottom: 13 }}>🗓 Upcoming Tasks</div>
          {upcoming.length === 0 ? <div style={{ textAlign: "center", padding: "20px 0", color: "var(--text3)", fontSize: 13 }}>No upcoming — free ho! 😄</div> : (
            <div>
              {upcoming.map((t, i) => (
                <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "9px 0", borderBottom: i < upcoming.length - 1 ? "1px solid var(--border)" : "none" }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: PRI_COLOR[t.priority] || "var(--text3)", flexShrink: 0, boxShadow: `0 0 6px ${PRI_COLOR[t.priority] || "transparent"}66` }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.title}</div>
                    {(t.tags || []).length > 0 && <div style={{ display: "flex", gap: 4, marginTop: 3 }}>{(t.tags || []).slice(0, 2).map(tag => <span key={tag} style={{ fontSize: 10, padding: "1px 6px", background: "rgba(255,107,53,0.08)", color: "var(--accent2)", borderRadius: 10 }}>#{tag}</span>)}</div>}
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: t.due < today ? "var(--rose)" : t.due === today ? "var(--gold)" : "var(--text3)" }}>
                      {t.due < today ? "Overdue" : t.due === today ? "Today" : t.due.slice(5)}
                    </div>
                    <div style={{ fontSize: 10, color: "var(--text3)", textTransform: "capitalize" }}>{t.priority}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Habits + Projects */}
        <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 18, padding: "18px 20px", flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: "var(--text)", marginBottom: 12 }}>🌱 Habits Today</div>
            {habits.length === 0 ? <div style={{ color: "var(--text3)", fontSize: 12, textAlign: "center", padding: "12px 0" }}>No habits added</div> : (
              <>
                <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                  {habits.slice(0, 4).map(h => {
                    const done = !!h.logs?.[today];
                    return (
                      <div key={h.id} style={{ display: "flex", alignItems: "center", gap: 9 }}>
                        <span style={{ fontSize: 16 }}>{h.emoji || "✨"}</span>
                        <span style={{ fontSize: 12, flex: 1, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textDecoration: done ? "line-through" : "none", opacity: done ? 0.5 : 1 }}>{h.name}</span>
                        <div style={{ width: 18, height: 18, borderRadius: 5, background: done ? "var(--teal)" : "var(--surface3)", border: `1.5px solid ${done ? "var(--teal)" : "var(--border2)"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          {done && <span style={{ color: "#fff", fontSize: 10, fontWeight: 900 }}>✓</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div style={{ marginTop: 12 }}>
                  <Bar pct={habitPct} color="var(--gold)" />
                  <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 4, textAlign: "right" }}>{habitsToday.length}/{habits.length} done</div>
                </div>
              </>
            )}
          </div>
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 18, padding: "18px 20px" }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: "var(--text)", marginBottom: 12 }}>📁 Projects</div>
            {projects.length === 0 ? <div style={{ color: "var(--text3)", fontSize: 12, textAlign: "center", padding: "8px 0" }}>No projects yet</div> : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {projects.slice(0, 3).map(p => {
                  const pt = tasks.filter(t => t.projectId === p.id);
                  const pct = pt.length ? Math.round(pt.filter(t => t.done).length / pt.length * 100) : 0;
                  return (
                    <div key={p.id}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                        <span style={{ fontSize: 12, color: "var(--text)", fontWeight: 600 }}>{p.emoji || "📁"} {p.name}</span>
                        <span style={{ fontSize: 11, color: "var(--text3)" }}>{pct}%</span>
                      </div>
                      <Bar pct={pct} color={p.color || "var(--indigo)"} />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── QUICK LINKS ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
        {[
          { icon: "📋", label: "Add Task", sub: "Go to Tasks →", color: "var(--indigo)" },
          { icon: "📄", label: "New Page", sub: "Go to Pages →", color: "var(--accent)" },
          { icon: "🎯", label: "Set Goal", sub: "Go to Goals →", color: "var(--rose)" },
          { icon: "🌱", label: "Track Habit", sub: "Go to Habits →", color: "var(--teal)" },
        ].map(item => (
          <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, cursor: "pointer", transition: "all 0.18s" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = item.color; e.currentTarget.style.background = "var(--surface2)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.background = "var(--surface)"; }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: `${item.color}14`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>{item.icon}</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{item.label}</div>
              <div style={{ fontSize: 11, color: "var(--text3)" }}>{item.sub}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
