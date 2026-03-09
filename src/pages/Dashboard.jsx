// 🏠 Dashboard v2 — with i18n
import { useAuth } from "../hooks/useAuth";
import { StatCard, ProgressBar, SectionHeader, Card } from "../components/UI";
import { useLang } from "../i18n/translations";

const todayStr = () => new Date().toISOString().split("T")[0];
const fmt = d => { try { return new Date(d).toLocaleDateString("en-IN", { month: "short", day: "numeric" }); } catch { return d; } };
const fmtFull = d => { try { return new Date(d).toLocaleDateString("en-IN", { weekday: "long", month: "long", day: "numeric", year: "numeric" }); } catch { return ""; } };

export default function Dashboard({ tasks, habits, projects = [], goals = [] }) {
  const { user } = useAuth();
  const { t } = useLang();
  const td = todayStr();

  const todayTasks = tasks.filter(x => x.due === td);
  const pending = tasks.filter(x => !x.done);
  const completed = tasks.filter(x => x.done);
  const overdue = tasks.filter(x => !x.done && x.due < td);
  const habitDone = habits.filter(h => h.logs?.[td]).length;
  const habitPct = habits.length ? Math.round(habitDone / habits.length * 100) : 0;

  const days = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
  const weekData = days.map((d, i) => {
    const dt = new Date(); const day = dt.getDay() || 7;
    dt.setDate(dt.getDate() - day + 1 + i);
    const ds = dt.toISOString().split("T")[0];
    return { d, done: tasks.filter(x => x.done && x.due === ds).length, total: tasks.filter(x => x.due === ds).length };
  });
  const maxBar = Math.max(...weekData.map(w => w.total), 1);
  const greet = () => { const h = new Date().getHours(); if (h < 12) return t("greeting_morning"); if (h < 17) return t("greeting_afternoon"); return t("greeting_evening"); };

  // Weekly report
  const last7 = Array.from({ length: 7 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - 6 + i); return d.toISOString().split("T")[0]; });
  const wCompleted = tasks.filter(x => x.done && last7.includes(x.due)).length;
  const wCreated = tasks.filter(x => last7.some(d => new Date(x.createdAt?.seconds ? x.createdAt.seconds * 1000 : x.createdAt).toISOString().split("T")[0] === d)).length;
  const habitTotal = habits.length * 7;
  const habitDoneW = habits.reduce((sum, h) => sum + last7.filter(d => h.logs?.[d]).length, 0);
  const hRate = habitTotal ? Math.round(habitDoneW / habitTotal * 100) : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Weekly Report */}
      <Card>
        <SectionHeader title={`📈 ${t("weeklyReport")}`} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
          {[{ icon: "✅", val: wCompleted, label: t("tasksCompleted"), c: "var(--teal)" }, { icon: "📋", val: wCreated, label: t("tasksCreated"), c: "var(--accent)" }, { icon: "🌱", val: `${hRate}%`, label: t("habitRate"), c: "var(--gold)" }].map(s => (
            <div key={s.label} style={{ textAlign: "center", padding: 14, background: "var(--surface2)", borderRadius: 12 }}>
              <div style={{ fontSize: 22 }}>{s.icon}</div>
              <div style={{ fontFamily: "var(--font-head)", fontSize: 26, fontWeight: 800, color: s.c }}>{s.val}</div>
              <div style={{ fontSize: 11, color: "var(--text2)" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* Greeting */}
      <div style={{ background: "linear-gradient(135deg,#FF6B35 0%,#E85A26 50%,#FF8C5A 100%)", borderRadius: "var(--radius)", padding: "26px 28px", color: "#fff", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", right: -20, top: -20, width: 160, height: 160, borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ fontSize: 12, opacity: 0.85, marginBottom: 4 }}>{fmtFull(new Date())}</div>
          <div style={{ fontFamily: "var(--font-head)", fontSize: 24, fontWeight: 800, marginBottom: 6 }}>{greet()}, {user?.displayName?.split(" ")[0] || "Friend"}! 👋</div>
          <div style={{ fontSize: 14, opacity: 0.9 }}>{pending.length > 0 ? `${pending.length} ${t("pendingMessage")}` : t("allCaughtUp")}</div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
        <StatCard icon="📋" number={todayTasks.length} label={t("todayTasks")} color="var(--accent)" />
        <StatCard icon="⏳" number={pending.length} label={t("pendingTasks")} color="var(--gold)" />
        <StatCard icon="✅" number={completed.length} label={t("completedTasks")} color="var(--teal)" />
        <StatCard icon="⚠️" number={overdue.length} label={t("overdueTasks")} color="var(--rose)" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* Chart */}
        <Card>
          <SectionHeader title={`📊 ${t("weeklyActivity")}`} />
          <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 90 }}>
            {weekData.map(w => (
              <div key={w.d} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flex: 1 }}>
                <div style={{ width: "100%", borderRadius: "4px 4px 0 0", minHeight: 4, height: `${Math.max(w.done / maxBar * 80, 4)}px`, background: "var(--accent)", opacity: 0.5 + w.done / (maxBar + 1) * 0.5, transition: "height 0.4s ease" }} />
                <div style={{ fontSize: 10, color: "var(--text3)", fontWeight: 600 }}>{w.d}</div>
              </div>
            ))}
          </div>
        </Card>
        {/* Habits */}
        <Card>
          <SectionHeader title={`🌱 ${t("todayHabits")}`} />
          <div style={{ textAlign: "center", marginBottom: 14 }}>
            <div style={{ fontFamily: "var(--font-head)", fontSize: 40, fontWeight: 800, color: "var(--teal)" }}>{habitPct}%</div>
            <div style={{ fontSize: 12, color: "var(--text2)" }}>{habitDone} / {habits.length} {t("habitsDone")}</div>
          </div>
          <ProgressBar value={habitPct} color="var(--teal)" height={8} />
          <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>
            {habits.slice(0, 4).map(h => (
              <div key={h.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                <span>{h.emoji || "📌"}</span><span style={{ flex: 1, fontWeight: 500 }}>{h.name}</span>
                <span>{h.logs?.[td] ? "✅" : "○"}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Today's tasks */}
      <Card>
        <SectionHeader title={`📋 ${t("todayTasks")}`} action={<span style={{ fontSize: 12, color: "var(--text3)" }}>{todayTasks.filter(x => x.done).length}/{todayTasks.length} done</span>} />
        {todayTasks.length === 0
          ? <div style={{ textAlign: "center", padding: 24, color: "var(--text3)" }}><div style={{ fontSize: 32, marginBottom: 8 }}>🎯</div><div>No tasks for today!</div></div>
          : <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {todayTasks.slice(0, 6).map((x, i) => (
              <div key={x.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: i < Math.min(todayTasks.length, 6) - 1 ? "1px solid var(--border)" : "none" }}>
                <span style={{ flexShrink: 0 }}>{x.done ? "✅" : "○"}</span>
                <span style={{ flex: 1, fontSize: 14, fontWeight: 500, textDecoration: x.done ? "line-through" : "none", opacity: x.done ? 0.5 : 1 }}>{x.title}</span>
                <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: x.priority === "high" ? "#FFF0F5" : x.priority === "medium" ? "#FFF8E6" : "#E6F7F5", color: x.priority === "high" ? "var(--rose)" : x.priority === "medium" ? "var(--gold)" : "var(--teal)" }}>{x.priority}</span>
              </div>
            ))}
          </div>
        }
      </Card>
    </div>
  );
}
