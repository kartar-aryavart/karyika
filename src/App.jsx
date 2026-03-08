// 🚀 App.jsx v2 — Karyika Phase 1
import { useState, useEffect } from "react";
import { useAuth } from "./hooks/useAuth";
import { subscribeToTasks, subscribeToHabits, subscribeToNotes } from "./firebase/services";
import { useLang } from "./i18n/translations";

import AuthPage from "./pages/AuthPage";
import Dashboard from "./pages/Dashboard";
import TasksPage from "./pages/TasksPage";
import { HabitsPage, NotesPage, CalendarPage, FocusTimer, SettingsPage } from "./pages/OtherPages";
import Sidebar from "./components/Sidebar";
import { ToastContainer, Loader } from "./components/UI";

export default function App() {
  const { user, loading: authLoading } = useAuth();
  const { t } = useLang();
  const [page, setPage] = useState("dashboard");
  const [dark, setDark] = useState(() => localStorage.getItem("karyika-dark") === "true");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [habits, setHabits] = useState([]);
  const [notes, setNotes] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);

  // Dark mode
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
    localStorage.setItem("karyika-dark", dark);
  }, [dark]);

  // Firebase real-time listeners
  useEffect(() => {
    if (!user) { setTasks([]); setHabits([]); setNotes([]); setDataLoading(false); return; }
    setDataLoading(true);
    const unsubTasks = subscribeToTasks(user.uid, data => { setTasks(data); setDataLoading(false); });
    const unsubHabits = subscribeToHabits(user.uid, setHabits);
    const unsubNotes = subscribeToNotes(user.uid, setNotes);
    return () => { unsubTasks(); unsubHabits(); unsubNotes(); };
  }, [user]);

  if (authLoading) {
    return (
      <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16, background: "var(--bg)" }}>
        <img src="/logo.png" alt="Karyika" style={{ width: 64, height: 64, borderRadius: 16, objectFit: "contain" }} onError={e => e.target.style.display = "none"} />
        <div style={{ fontFamily: "var(--font-head)", fontSize: 28, fontWeight: 800, color: "var(--accent)" }}>Karyika</div>
        <div style={{ width: 36, height: 36, borderRadius: "50%", border: "3px solid var(--surface2)", borderTopColor: "var(--accent)", animation: "spin 0.8s linear infinite" }} />
      </div>
    );
  }

  if (!user) return (<><AuthPage /><ToastContainer /></>);

  const pendingCount = tasks.filter(t => !t.done).length;
  const PAGE_TITLES = {
    dashboard: t("dashboard"), tasks: t("tasks"), habits: t("habits"),
    calendar: t("calendar"), timer: t("focusTimer"), notes: t("notes"), settings: t("settings"),
  };

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      <Sidebar page={page} setPage={setPage} dark={dark} setDark={setDark} pendingCount={pendingCount} open={sidebarOpen} setOpen={setSidebarOpen} />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>
        {/* Topbar */}
        <div style={{ position: "sticky", top: 0, zIndex: 50, background: "var(--bg)", borderBottom: "1px solid var(--border)", padding: "13px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", backdropFilter: "blur(8px)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button id="mobile-menu-btn" onClick={() => setSidebarOpen(o => !o)} style={{ background: "var(--surface2)", border: "none", borderRadius: 8, padding: "7px 10px", cursor: "pointer", fontSize: 16, color: "var(--text2)", display: "none" }}>☰</button>
            <div style={{ fontFamily: "var(--font-head)", fontSize: 19, fontWeight: 700 }}>{PAGE_TITLES[page]}</div>
          </div>
          <div style={{ fontSize: 12, color: "var(--text3)", background: "var(--surface2)", padding: "5px 12px", borderRadius: 20 }}>
            {new Date().toLocaleDateString("en-IN", { weekday: "short", month: "short", day: "numeric" })}
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px" }}>
          {page === "dashboard" && <Dashboard tasks={tasks} habits={habits} />}
          {page === "tasks"     && <TasksPage tasks={tasks} loading={dataLoading} />}
          {page === "habits"    && <HabitsPage habits={habits} loading={dataLoading} />}
          {page === "calendar"  && <CalendarPage tasks={tasks} habits={habits} />}
          {page === "timer"     && <div style={{ display: "flex", justifyContent: "center", paddingTop: 16 }}><FocusTimer /></div>}
          {page === "notes"     && <NotesPage notes={notes} loading={dataLoading} />}
          {page === "settings"  && <SettingsPage dark={dark} setDark={setDark} tasks={tasks} habits={habits} notes={notes} />}
        </div>
      </div>

      <ToastContainer />
      <style>{`@media(max-width:768px){#mobile-menu-btn{display:flex!important}}`}</style>
    </div>
  );
}
