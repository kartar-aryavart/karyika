// 🏠 Dashboard v7 — God Mode: Motivational + Live Data + Beautiful
import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";

const QUOTES = [
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain", emoji: "🚀", hi: "Shuru karo — bas yahi raaz hai." },
  { text: "Focus on being productive instead of busy.", author: "Tim Ferriss", emoji: "⚡", hi: "Busy nahi, productive bano." },
  { text: "Small steps every day lead to big results.", author: "Unknown", emoji: "🌱", hi: "Roz thoda thoda — bade nateeje milenge." },
  { text: "Done is better than perfect.", author: "Sheryl Sandberg", emoji: "✅", hi: "Karo pehle, perfect baad mein." },
  { text: "Your future is created by what you do today.", author: "Robert Kiyosaki", emoji: "🎯", hi: "Aaj ka kaam kal ka future banata hai." },
  { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt", emoji: "🌟", hi: "Agar maan lo toh aadha ho gaya." },
  { text: "Success is the sum of small efforts, repeated.", author: "Robert Collier", emoji: "💪", hi: "Chhote kadam, roz roz — yahi safalta hai." },
  { text: "Energy and persistence conquer all things.", author: "Benjamin Franklin", emoji: "🔥", hi: "Himmat aur mehnat se sab milta hai." },
  { text: "It always seems impossible until it's done.", author: "Nelson Mandela", emoji: "🏆", hi: "Mushkil lagta hai — jab tak ho nahi jaata." },
  { text: "The harder you work, the luckier you get.", author: "Gary Player", emoji: "🍀", hi: "Jitna karoge, utni kismat milegi." },
];

const THOUGHTS = [
  { text: "Aaj ka din tumhara hai — ek kaam karo jo future tumhe thank kare! 🙏", color: "#FF6B35" },
  { text: "Har bada goal chote steps se shuru hota hai. Aaj pehla step lo! 👣", color: "#8B5CF6" },
  { text: "Mushkil kaam pehle karo — baaki sab aasaan lagega! 💪", color: "#10B981" },
  { text: "Consistency is the key — roz thoda thoda karo! 🔑", color: "#F59E0B" },
  { text: "Jo karna hai, aaj karo — kal sirf ek idea hai! 💡", color: "#06B6D4" },
  { text: "Thaka hua feel ho raha hai? Bas ek kaam karo — momentum aayega! ⚡", color: "#F43F5E" },
  { text: "Apne aap se compete karo — kal se behtar bano aaj! 🏃", color: "#818CF8" },
];

const todayStr = () => new Date().toISOString().slice(0, 10);

function greet(name) {
  const h = new Date().getHours();
  const n = (name || "Yaar").split(" ")[0];
  if (h < 5)  return "🌙 Raat ko jaag rahe ho, " + n + "?";
  if (h < 12) return "☀️ Subah ki shuruat, " + n + "!";
  if (h < 17) return "🌤 Dopahar ka time, " + n + "!";
  if (h < 21) return "🌅 Shaam ki productivity, " + n + "!";
  return "🌙 Raat ki mehnat, " + n + "!";
}

function Counter({ to, suffix }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!to) return;
    let cur = 0;
    const step = Math.max(1, Math.ceil(to / 30));
    const t = setInterval(() => { cur = Math.min(cur + step, to); setVal(cur); if (cur >= to) clearInterval(t); }, 30);
    return () => clearInterval(t);
  }, [to]);
  return <>{val}{suffix || ""}</>;
}

function Ring({ pct, color, size, stroke }) {
  size = size || 68; stroke = stroke || 7;
  const r = (size - stroke) / 2, c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)", flexShrink: 0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--surface3)" strokeWidth={stroke} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
        strokeDasharray={(pct/100)*c + " " + c} style={{ transition: "stroke-dasharray 1.4s cubic-bezier(0.4,0,0.2,1)" }} />
    </svg>
  );
}

function Bar({ pct, color }) {
  return (
    <div style={{ height: 5, background: "var(--surface3)", borderRadius: 5, overflow: "hidden" }}>
      <div style={{ height: "100%", width: Math.min(pct, 100) + "%", background: color, borderRadius: 5, transition: "width 1.2s ease", boxShadow: "0 0 8px " + color + "44" }} />
    </div>
  );
}

function StatCard({ icon, label, value, sub, color, trend, suffix }) {
  const [hov, setHov] = useState(false);
  return (
    <div style={{ background: "var(--surface)", border: "1px solid " + (hov ? color + "44" : "var(--border)"), borderTop: "3px solid " + color, borderRadius: 18, padding: "18px 20px", transition: "all 0.22s", transform: hov ? "translateY(-3px)" : "none", boxShadow: hov ? "0 12px 32px " + color + "18" : "none" }}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <span style={{ fontSize: 11, fontWeight: 800, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "1px" }}>{icon} {label}</span>
        {trend !== undefined && <span style={{ fontSize: 10, fontWeight: 800, color: trend >= 0 ? "var(--teal)" : "var(--rose)", background: trend >= 0 ? "rgba(16,185,129,0.1)" : "rgba(244,63,94,0.1)", padding: "2px 8px", borderRadius: 20 }}>{trend >= 0 ? "↑" : "↓"}{Math.abs(trend)}%</span>}
      </div>
      <div style={{ fontFamily: "var(--font-head)", fontSize: 40, fontWeight: 900, color: hov ? color : "var(--text)", letterSpacing: "-2px", lineHeight: 1, transition: "color 0.22s" }}>
        <Counter to={parseInt(value) || 0} suffix={suffix} />
      </div>
      {sub && <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 7 }}>{sub}</div>}
    </div>
  );
}

function WeekBar({ tasks }) {
  const days = Array.from({ length: 7 }, function(_, i) {
    const d = new Date(); d.setDate(d.getDate() - 6 + i);
    const str = d.toISOString().slice(0, 10);
    const done = tasks.filter(function(t) { return t.done && t.completedAt && t.completedAt.slice(0, 10) === str; }).length;
    return { label: d.toLocaleDateString("en-IN", { weekday: "short" }), str, done, isToday: str === todayStr() };
  });
  const max = Math.max.apply(null, days.map(function(d) { return d.done; }).concat([1]));
  return (
    <div style={{ display: "flex", gap: 6, alignItems: "flex-end", height: 56 }}>
      {days.map(function(d) {
        return (
          <div key={d.str} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
            <div style={{ width: "100%", borderRadius: 5, background: d.isToday ? "var(--accent)" : "var(--indigo)", opacity: d.isToday ? 1 : 0.35, height: Math.max((d.done / max) * 44, 4) + "px", transition: "height 1s ease" }} />
            <div style={{ fontSize: 9, color: d.isToday ? "var(--accent)" : "var(--text3)", fontWeight: d.isToday ? 800 : 400 }}>{d.label}</div>
          </div>
        );
      })}
    </div>
  );
}

export default function Dashboard({ tasks, habits, projects, goals }) {
  tasks = tasks || []; habits = habits || []; projects = projects || []; goals = goals || [];
  const { user } = useAuth();
  const [qIdx, setQIdx] = useState(function() { return Math.floor(Math.random() * QUOTES.length); });
  const [qVisible, setQVisible] = useState(true);
  const [thought] = useState(function() { return THOUGHTS[Math.floor(Math.random() * THOUGHTS.length)]; });
  const [time, setTime] = useState(new Date());
  const [showHi, setShowHi] = useState(false);

  useEffect(function() { const t = setInterval(function() { setTime(new Date()); }, 1000); return function() { clearInterval(t); }; }, []);
  useEffect(function() {
    const t = setInterval(function() {
      setQVisible(false);
      setTimeout(function() { setQIdx(function(i) { return (i + 1) % QUOTES.length; }); setQVisible(true); }, 400);
    }, 8000);
    return function() { clearInterval(t); };
  }, []);

  const today = todayStr();
  const pending     = tasks.filter(function(t) { return !t.done; });
  const doneToday   = tasks.filter(function(t) { return t.done && t.completedAt && t.completedAt.slice(0, 10) === today; });
  const overdue     = pending.filter(function(t) { return t.due && t.due < today; });
  const todayTasks  = pending.filter(function(t) { return t.due === today; });
  const tm = new Date(); tm.setDate(tm.getDate() + 1);
  const tmStr = tm.toISOString().slice(0, 10);
  const tomorrowT   = pending.filter(function(t) { return t.due === tmStr; });
  const highPri     = pending.filter(function(t) { return t.priority === "urgent" || t.priority === "high"; }).slice(0, 5);
  const upcoming    = pending.filter(function(t) { return t.due && t.due >= today; }).sort(function(a, b) { return a.due.localeCompare(b.due); }).slice(0, 6);
  const donePct     = tasks.length ? Math.round(tasks.filter(function(t) { return t.done; }).length / tasks.length * 100) : 0;
  const habitsToday = habits.filter(function(h) { return h.logs && h.logs[today]; });
  const habitPct    = habits.length ? Math.round(habitsToday.length / habits.length * 100) : 0;
  const goalAvg     = goals.length ? Math.round(goals.reduce(function(s, g) { return s + Math.min(Math.round((g.current / Math.max(g.target, 1)) * 100), 100); }, 0) / goals.length) : 0;
  const projDone    = projects.length ? Math.round(projects.filter(function(p) { return p.status === "done"; }).length / projects.length * 100) : 0;

  const q = QUOTES[qIdx];
  const userName = (user && user.displayName) || (user && user.email && user.email.split("@")[0]) || "Yaar";
  const timeStr = time.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
  const dateStr = time.toLocaleDateString("en-IN", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  const PRI = { urgent: "var(--gold)", high: "var(--rose)", medium: "var(--gold)", low: "var(--teal)" };

  const getMotivation = function() {
    if (doneToday.length >= 5) return { msg: "Wah bhai! Aaj " + doneToday.length + " tasks done! 🏆", color: "var(--teal)" };
    if (overdue.length > 3)    return { msg: overdue.length + " tasks overdue hain — aaj kuch pakad lo! 💪", color: "var(--rose)" };
    if (todayTasks.length > 0) return { msg: "Aaj " + todayTasks.length + " tasks hain — focus karo! ⚡", color: "var(--accent)" };
    if (habitPct === 100)      return { msg: "Sare habits complete! Legend ho tum! 🌟", color: "var(--gold)" };
    return { msg: "Ek kaam shuru karo — baaki khud ho jaega! 🚀", color: "var(--indigo)" };
  };
  const motivation = getMotivation();

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", paddingBottom: 32 }}>

      {/* HERO */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 22, padding: "24px 28px", marginBottom: 14, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", right: -30, top: -30, width: 220, height: 220, borderRadius: "50%", background: "radial-gradient(circle,rgba(255,107,53,0.08),transparent 70%)", pointerEvents: "none" }} />
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16, position: "relative" }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <h1 style={{ fontFamily: "var(--font-head)", fontSize: "clamp(20px,3vw,28px)", fontWeight: 900, letterSpacing: "-1px", color: "var(--text)", marginBottom: 4 }}>{greet(userName)}</h1>
            <div style={{ fontSize: 12, color: "var(--text3)", marginBottom: 14 }}>{dateStr}</div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 14px", background: motivation.color + "10", border: "1px solid " + motivation.color + "25", borderRadius: 12, fontSize: 13, color: motivation.color, fontWeight: 700, marginBottom: 12 }}>
              {motivation.msg}
            </div>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "10px 14px", background: thought.color + "08", border: "1px solid " + thought.color + "18", borderRadius: 12, maxWidth: 500 }}>
              <span style={{ fontSize: 16, flexShrink: 0 }}>💭</span>
              <span style={{ fontSize: 13, color: "var(--text2)", lineHeight: 1.5 }}><strong style={{ color: thought.color }}>Aaj ki soch:</strong> {thought.text}</span>
            </div>
          </div>
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <div style={{ fontFamily: "var(--font-head)", fontSize: 40, fontWeight: 900, color: "var(--text)", letterSpacing: "-2px", lineHeight: 1 }}>{timeStr}</div>
            <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 6, marginBottom: 10 }}>{doneToday.length > 0 ? "🎉 " + doneToday.length + " tasks done today!" : "Koi task done nahi abhi"}</div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", flexWrap: "wrap" }}>
              {overdue.length > 0 && <span style={{ fontSize: 11, padding: "3px 10px", background: "rgba(244,63,94,0.1)", color: "var(--rose)", borderRadius: 20, fontWeight: 700 }}>⚠️ {overdue.length} overdue</span>}
              {todayTasks.length > 0 && <span style={{ fontSize: 11, padding: "3px 10px", background: "rgba(245,158,11,0.1)", color: "var(--gold)", borderRadius: 20, fontWeight: 700 }}>📅 {todayTasks.length} today</span>}
              {tomorrowT.length > 0 && <span style={{ fontSize: 11, padding: "3px 10px", background: "rgba(129,140,248,0.1)", color: "var(--indigo)", borderRadius: 20, fontWeight: 700 }}>🔜 {tomorrowT.length} tomorrow</span>}
            </div>
          </div>
        </div>
      </div>

      {/* QUOTE */}
      <div style={{ background: "linear-gradient(135deg,rgba(255,107,53,0.05),rgba(139,92,246,0.04))", border: "1px solid rgba(255,107,53,0.12)", borderRadius: 16, padding: "16px 20px", marginBottom: 14, display: "flex", alignItems: "center", gap: 14 }}>
        <span style={{ fontSize: 28, flexShrink: 0, opacity: qVisible ? 1 : 0, transition: "opacity 0.4s" }}>{q.emoji}</span>
        <div style={{ flex: 1, opacity: qVisible ? 1 : 0, transform: qVisible ? "none" : "translateY(6px)", transition: "all 0.4s ease" }}>
          <div style={{ fontSize: "clamp(13px,1.8vw,15px)", fontWeight: 700, color: "var(--text)", fontStyle: "italic", lineHeight: 1.55 }}>"{showHi ? q.hi : q.text}"</div>
          <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 4, fontWeight: 600 }}>— {q.author}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, flexShrink: 0, alignItems: "flex-end" }}>
          <button onClick={function() { setShowHi(function(h) { return !h; }); }} style={{ fontSize: 10, padding: "3px 10px", background: "rgba(255,107,53,0.08)", border: "1px solid rgba(255,107,53,0.15)", borderRadius: 20, color: "var(--accent)", cursor: "pointer", fontFamily: "inherit", fontWeight: 700 }}>{showHi ? "EN" : "हिं"}</button>
          <div style={{ display: "flex", gap: 4 }}>
            {QUOTES.map(function(_, i) {
              return <div key={i} onClick={function() { setQVisible(false); setTimeout(function() { setQIdx(i); setQVisible(true); }, 250); }} style={{ width: i === qIdx ? 16 : 5, height: 5, borderRadius: 5, background: i === qIdx ? "var(--accent)" : "var(--surface3)", cursor: "pointer", transition: "all 0.3s" }} />;
            })}
          </div>
        </div>
      </div>

      {/* STAT CARDS */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 14 }}>
        <StatCard icon="📋" label="Pending" value={pending.length} sub={todayTasks.length > 0 ? todayTasks.length + " due today" : "Nothing due today ✓"} color="var(--indigo)" />
        <StatCard icon="✅" label="Done" value={tasks.filter(function(t){return t.done;}).length} sub={donePct + "% completion rate"} color="var(--teal)" trend={donePct > 50 ? 8 : -3} />
        <StatCard icon="🌱" label="Habits" value={habitsToday.length} sub={habitPct + "% of " + habits.length + " habits"} color="var(--gold)" suffix={"/" + habits.length} />
        <StatCard icon="🎯" label="Goals" value={goalAvg} sub={goals.length + " active goals"} color="var(--rose)" suffix="%" />
      </div>

      {/* MAIN ROW */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 12 }}>
        {/* Today Tasks */}
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 18, padding: "18px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 13 }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: "var(--text)" }}>📅 Aaj ke Tasks</span>
            <span style={{ fontSize: 10, padding: "2px 8px", background: "rgba(245,158,11,0.1)", color: "var(--gold)", borderRadius: 20, fontWeight: 700 }}>{todayTasks.length}</span>
          </div>
          {todayTasks.length === 0 ? (
            <div style={{ textAlign: "center", padding: "24px 0", color: "var(--text3)" }}>
              <div style={{ fontSize: 28, marginBottom: 6 }}>🎉</div>
              <div style={{ fontSize: 13 }}>Aaj koi task nahi!</div>
              <div style={{ fontSize: 11, marginTop: 3 }}>Chill ya aage plan karo 😎</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {todayTasks.slice(0, 5).map(function(t) {
                return (
                  <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 9, padding: "7px 10px", background: "var(--surface2)", borderRadius: 10, borderLeft: "3px solid " + (PRI[t.priority] || "var(--text3)") }}>
                    <div style={{ width: 12, height: 12, borderRadius: "50%", border: "1.5px solid var(--border2)", flexShrink: 0 }} />
                    <span style={{ fontSize: 13, color: "var(--text)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.title}</span>
                    <span style={{ fontSize: 9, padding: "2px 6px", background: "var(--surface3)", color: "var(--text3)", borderRadius: 8, fontWeight: 700, textTransform: "uppercase", flexShrink: 0 }}>{t.priority}</span>
                  </div>
                );
              })}
              {todayTasks.length > 5 && <div style={{ fontSize: 11, color: "var(--text3)", textAlign: "center", marginTop: 3 }}>+{todayTasks.length - 5} aur hain</div>}
            </div>
          )}
        </div>

        {/* Progress */}
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 18, padding: "18px 20px" }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: "var(--text)", marginBottom: 16 }}>📊 Progress Overview</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
            {[
              { label: "Tasks", pct: donePct, color: "var(--teal)", emoji: "✅" },
              { label: "Habits", pct: habitPct, color: "var(--gold)", emoji: "🌱" },
              { label: "Goals", pct: goalAvg, color: "var(--rose)", emoji: "🎯" },
              { label: "Projects", pct: projDone, color: "var(--indigo)", emoji: "📁" },
            ].map(function(r) {
              return (
                <div key={r.label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                  <div style={{ position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                    <Ring pct={r.pct} color={r.color} size={64} stroke={6} />
                    <div style={{ position: "absolute", fontFamily: "var(--font-head)", fontSize: 12, fontWeight: 900, color: r.color }}>{r.pct}%</div>
                  </div>
                  <div style={{ fontSize: 10, color: "var(--text3)", fontWeight: 700 }}>{r.emoji} {r.label}</div>
                </div>
              );
            })}
          </div>
          <div style={{ borderTop: "1px solid var(--border)", paddingTop: 12 }}>
            <div style={{ fontSize: 10, color: "var(--text3)", fontWeight: 700, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.5px" }}>This Week</div>
            <WeekBar tasks={tasks} />
          </div>
        </div>

        {/* High Priority */}
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 18, padding: "18px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 13 }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: "var(--text)" }}>🔥 High Priority</span>
            <span style={{ fontSize: 10, padding: "2px 8px", background: "rgba(244,63,94,0.1)", color: "var(--rose)", borderRadius: 20, fontWeight: 700 }}>{highPri.length}</span>
          </div>
          {highPri.length === 0 ? (
            <div style={{ textAlign: "center", padding: "24px 0", color: "var(--text3)" }}>
              <div style={{ fontSize: 28, marginBottom: 6 }}>✅</div>
              <div style={{ fontSize: 13 }}>Koi urgent task nahi!</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {highPri.map(function(t) {
                return (
                  <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 9, padding: "7px 10px", background: t.priority === "urgent" ? "rgba(249,115,22,0.06)" : "rgba(244,63,94,0.05)", border: "1px solid " + (t.priority === "urgent" ? "rgba(249,115,22,0.15)" : "rgba(244,63,94,0.1)"), borderRadius: 10 }}>
                    <span style={{ fontSize: 14, flexShrink: 0 }}>{t.priority === "urgent" ? "🚨" : "❗"}</span>
                    <span style={{ fontSize: 12, color: "var(--text)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.title}</span>
                    {t.due && <span style={{ fontSize: 10, color: t.due < today ? "var(--rose)" : "var(--text3)", flexShrink: 0, fontWeight: 700 }}>{t.due === today ? "Today" : t.due < today ? "Late!" : t.due.slice(5)}</span>}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* SECOND ROW */}
      <div style={{ display: "grid", gridTemplateColumns: "1.8fr 1fr", gap: 12, marginBottom: 12 }}>
        {/* Upcoming */}
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 18, padding: "18px 20px" }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: "var(--text)", marginBottom: 13 }}>🗓 Upcoming Tasks</div>
          {upcoming.length === 0 ? (
            <div style={{ textAlign: "center", padding: "20px 0", color: "var(--text3)", fontSize: 13 }}>Koi upcoming task nahi 📅</div>
          ) : upcoming.map(function(t, i) {
            return (
              <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "9px 0", borderBottom: i < upcoming.length - 1 ? "1px solid var(--border)" : "none" }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: PRI[t.priority] || "var(--text3)", flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.title}</div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: t.due === today ? "var(--gold)" : t.due < today ? "var(--rose)" : "var(--text3)" }}>
                    {t.due === today ? "📅 Today" : t.due < today ? "⚠️ Late" : t.due.slice(5)}
                  </div>
                  <div style={{ fontSize: 10, color: "var(--text3)", textTransform: "capitalize" }}>{t.priority}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Habits + Projects */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 18, padding: "16px 18px", flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: "var(--text)" }}>🌱 Habits Aaj</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: habitPct === 100 ? "var(--teal)" : "var(--text3)" }}>{habitsToday.length}/{habits.length}</span>
            </div>
            {habits.length === 0 ? <div style={{ color: "var(--text3)", fontSize: 12, textAlign: "center", padding: "10px 0" }}>Koi habit nahi 🌱</div> : (
              <>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {habits.slice(0, 4).map(function(h) {
                    const done = !!(h.logs && h.logs[today]);
                    return (
                      <div key={h.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 15 }}>{h.emoji || "✨"}</span>
                        <span style={{ fontSize: 12, flex: 1, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textDecoration: done ? "line-through" : "none", opacity: done ? 0.45 : 1 }}>{h.name}</span>
                        <div style={{ width: 17, height: 17, borderRadius: 5, background: done ? "var(--teal)" : "var(--surface3)", border: "1.5px solid " + (done ? "var(--teal)" : "var(--border2)"), display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          {done && <span style={{ color: "#fff", fontSize: 9, fontWeight: 900 }}>✓</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div style={{ marginTop: 10 }}>
                  <Bar pct={habitPct} color={habitPct === 100 ? "var(--teal)" : "var(--gold)"} />
                  <div style={{ fontSize: 10, color: habitPct === 100 ? "var(--teal)" : "var(--text3)", marginTop: 4, textAlign: "right", fontWeight: habitPct === 100 ? 800 : 400 }}>{habitPct === 100 ? "🎉 Sab complete!" : habitPct + "% done"}</div>
                </div>
              </>
            )}
          </div>
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 18, padding: "16px 18px" }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: "var(--text)", marginBottom: 12 }}>📁 Projects</div>
            {projects.length === 0 ? <div style={{ color: "var(--text3)", fontSize: 12, textAlign: "center", padding: "8px 0" }}>Koi project nahi!</div> : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {projects.slice(0, 3).map(function(p) {
                  const pt = tasks.filter(function(t) { return t.projectId === p.id; });
                  const pct = pt.length ? Math.round(pt.filter(function(t) { return t.done; }).length / pt.length * 100) : 0;
                  return (
                    <div key={p.id}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                        <span style={{ fontSize: 12, color: "var(--text)", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "70%" }}>{p.emoji || "📁"} {p.name}</span>
                        <span style={{ fontSize: 11, color: "var(--text3)", fontWeight: 700 }}>{pct}%</span>
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

      {/* QUICK ACTIONS */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
        {[
          { icon: "📋", label: "Task Add Karo", sub: "Tasks →", color: "var(--indigo)", bg: "rgba(129,140,248,0.08)" },
          { icon: "📄", label: "Page Likho", sub: "Pages →", color: "var(--accent)", bg: "rgba(255,107,53,0.08)" },
          { icon: "🎯", label: "Goal Set Karo", sub: "Goals →", color: "var(--rose)", bg: "rgba(244,63,94,0.08)" },
          { icon: "🌱", label: "Habit Track Karo", sub: "Habits →", color: "var(--teal)", bg: "rgba(16,185,129,0.08)" },
        ].map(function(item) {
          return (
            <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 10, padding: "13px 15px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, cursor: "pointer", transition: "all 0.18s" }}
              onMouseEnter={function(e) { e.currentTarget.style.borderColor = item.color; e.currentTarget.style.background = item.bg; e.currentTarget.style.transform = "translateY(-2px)"; }}
              onMouseLeave={function(e) { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.background = "var(--surface)"; e.currentTarget.style.transform = "none"; }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: item.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>{item.icon}</div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text)" }}>{item.label}</div>
                <div style={{ fontSize: 10, color: "var(--text3)" }}>{item.sub}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
