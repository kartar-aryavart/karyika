// 🏠 Dashboard Page — Karyika
import { useAuth } from "../hooks/useAuth";
import { StatCard, ProgressBar, SectionHeader, Card } from "../components/UI";

const todayStr = () => new Date().toISOString().split("T")[0];
const fmt = d => new Date(d).toLocaleDateString("en-IN", { month: "short", day: "numeric" });
const fmtFull = d => new Date(d).toLocaleDateString("en-IN", { weekday: "long", month: "long", day: "numeric", year: "numeric" });

export default function Dashboard({ tasks, habits }) {
  const { user } = useAuth();
  const td = todayStr();

  const todayTasks = tasks.filter(t => t.due === td);
  const pending = tasks.filter(t => !t.done);
  const completed = tasks.filter(t => t.done);
  const overdue = tasks.filter(t => !t.done && t.due < td);
  const habitDone = habits.filter(h => h.logs?.[td]).length;
  const habitPct = habits.length ? Math.round(habitDone / habits.length * 100) : 0;

  // Weekly bar chart — last 7 days
  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const weekData = weekDays.map((d, i) => {
    const dt = new Date(); const day = dt.getDay() || 7;
    dt.setDate(dt.getDate() - day + 1 + i);
    const ds = dt.toISOString().split("T")[0];
    return { d, done: tasks.filter(t => t.done && t.due === ds).length, total: tasks.filter(t => t.due === ds).length };
  });
  const maxBar = Math.max(...weekData.map(w => w.total), 1);

  const greet = () => { const h = new Date().getHours(); if (h < 12) return "Suprabhat 🌅"; if (h < 17) return "Namaskar ☀️"; return "Shubh Sandhya 🌙"; };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Greeting Banner */}
      <div style={{
        background: "linear-gradient(135deg, #FF6B35 0%, #E85A26 50%, #FF8C5A 100%)",
        borderRadius: "var(--radius)", padding: "28px 28px", color: "#fff",
        position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", right: -20, top: -20, width: 160, height: 160, borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />
        <div style={{ position: "absolute", right: 60, bottom: -40, width: 100, height: 100, borderRadius: "50%", background: "rgba(255,255,255,0.08)" }} />
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ fontSize: 12, opacity: 0.85, marginBottom: 4 }}>{fmtFull(new Date())}</div>
          <div style={{ fontFamily: "var(--font-head)", fontSize: 26, fontWeight: 800, marginBottom: 6 }}>
            {greet()}, {user?.displayName?.split(" ")[0] || "Friend"}!
          </div>
          <div style={{ fontSize: 14, opacity: 0.9 }}>
            {pending.length > 0
              ? `${pending.length} kaam baaki hai aaj — chalo shuru karte hain! 💪`
              : "Sab kaam ho gaya! Badiya kaam kiya aaj 🎉"}
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        <StatCard icon="📋" number={todayTasks.length} label="Aaj ke Tasks" color="var(--accent)" />
        <StatCard icon="⏳" number={pending.length} label="Baaki Tasks" color="var(--gold)" />
        <StatCard icon="✅" number={completed.length} label="Complete" color="var(--teal)" />
        <StatCard icon="⚠️" number={overdue.length} label="Late Tasks" color="var(--rose)" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* Weekly chart */}
        <Card>
          <SectionHeader title="📊 Is Hafte ki Activity" />
          <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 90 }}>
            {weekData.map(w => (
              <div key={w.d} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flex: 1 }}>
                <div style={{
                  width: "100%", borderRadius: "4px 4px 0 0", minHeight: 4,
                  height: `${Math.max(w.done / maxBar * 80, 4)}px`,
                  background: "var(--accent)", opacity: 0.5 + w.done / (maxBar + 1) * 0.5,
                  transition: "height 0.4s ease",
                }} />
                <div style={{ fontSize: 10, color: "var(--text3)", fontWeight: 600 }}>{w.d}</div>
              </div>
            ))}
          </div>
        </Card>

        {/* Habit progress */}
        <Card>
          <SectionHeader title="🌱 Aaj ki Habits" />
          <div style={{ textAlign: "center", marginBottom: 14 }}>
            <div style={{ fontFamily: "var(--font-head)", fontSize: 40, fontWeight: 800, color: "var(--teal)" }}>{habitPct}%</div>
            <div style={{ fontSize: 12, color: "var(--text2)" }}>{habitDone} / {habits.length} habits done</div>
          </div>
          <ProgressBar value={habitPct} color="var(--teal)" height={8} />
          <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>
            {habits.slice(0, 4).map(h => (
              <div key={h.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                <span>{h.emoji || "📌"}</span>
                <span style={{ flex: 1, fontWeight: 500 }}>{h.name}</span>
                <span>{h.logs?.[td] ? "✅" : "○"}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Today's tasks preview */}
      <Card>
        <SectionHeader
          title="📋 Aaj ke Tasks"
          action={<span style={{ fontSize: 12, color: "var(--text3)" }}>{todayTasks.filter(t => t.done).length}/{todayTasks.length} done</span>}
        />
        {todayTasks.length === 0 ? (
          <div style={{ textAlign: "center", padding: "24px", color: "var(--text3)" }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🎯</div>
            <div style={{ fontSize: 14 }}>Aaj ke liye koi task nahi. Add karo!</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {todayTasks.slice(0, 6).map((t, i) => (
              <div key={t.id} style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "10px 0",
                borderBottom: i < todayTasks.slice(0, 6).length - 1 ? "1px solid var(--border)" : "none",
              }}>
                <span style={{ fontSize: 16, flexShrink: 0 }}>{t.done ? "✅" : "○"}</span>
                <span style={{ flex: 1, fontSize: 14, fontWeight: 500, textDecoration: t.done ? "line-through" : "none", opacity: t.done ? 0.5 : 1 }}>{t.title}</span>
                <span style={{
                  fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20,
                  background: t.priority === "high" ? "#FFF0F5" : t.priority === "medium" ? "#FFF8E6" : "#E6F7F5",
                  color: t.priority === "high" ? "var(--rose)" : t.priority === "medium" ? "#B87A00" : "var(--teal)",
                }}>{t.priority}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
