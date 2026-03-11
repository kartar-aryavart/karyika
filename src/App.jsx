import { useState, useEffect, useRef } from "react";
import { useAuth } from "./hooks/useAuth";
import { subscribeToTasks, subscribeToHabits, subscribeToNotes, subscribeToProjects, subscribeToGoals, checkIsAdmin, addNotification } from "./firebase/services";
import { playSound } from "./components/NotificationBell";
import { useLang } from "./i18n/translations.jsx";
import AuthPage from "./pages/AuthPage";
import LandingPage from "./pages/LandingPage";
import Dashboard from "./pages/Dashboard";
import TasksPage from "./pages/TasksPage";
import { HabitsPage, FocusTimer, SettingsPage } from "./pages/OtherPages";
import EnterpriseCalendarPage from "./pages/EnterpriseCalendarPage";
import ProjectsPage from "./pages/ProjectsPage";
import GoalsPage from "./pages/GoalsPage";
import AdminPage from "./pages/AdminPage";
import AIAssistantPage from "./pages/AIAssistantPage";
import TimeTrackerPage from "./pages/TimeTrackerPage";
import AutomationsPage from "./pages/AutomationsPage";
import NotionPage from "./pages/NotionPage";
import GanttPage from "./pages/GanttPage";
import TeamPage from "./pages/TeamPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import WorkloadPage from "./pages/WorkloadPage";
import Sidebar from "./components/Sidebar";
import CommandPalette from "./components/CommandPalette";
import NotificationBell from "./components/NotificationBell";
import { ToastContainer } from "./components/UI";

const PAGE_TITLES = {
  dashboard:"Home", tasks:"Tasks", habits:"Habits", calendar:"Calendar",
  timer:"Focus Timer", notes:"Pages", projects:"Projects", goals:"Goals & OKRs",
  settings:"Settings", admin:"Admin", ai:"AI Assistant", timetracker:"Time Tracker",
  automations:"Automations", gantt:"Gantt", team:"Team", analytics:"Analytics",
  workload:"Workload",
};

export default function App() {
  const { user, loading: authLoading } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [page, setPage] = useState("dashboard");
  const [dark, setDark] = useState(() => localStorage.getItem("karyika-dark") !== "false");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const [tasks,    setTasks]    = useState([]);
  const [habits,   setHabits]   = useState([]);
  const [notes,    setNotes]    = useState([]);
  const [projects, setProjects] = useState([]);
  const [goals,    setGoals]    = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [pageTransition, setPageTransition] = useState(false);
  const prevTasks = useRef([]);
  const welcomeSent = useRef(false);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
    localStorage.setItem("karyika-dark", dark);
  }, [dark]);

  useEffect(() => {
    if (!user) { setTasks([]); setHabits([]); setNotes([]); setProjects([]); setGoals([]); setDataLoading(false); return; }
    setDataLoading(true);
    const u1 = subscribeToTasks(user.uid, d => {
      // Detect task completion
      const prev = prevTasks.current;
      if (prev.length > 0) {
        d.forEach(function(t) {
          const was = prev.find(function(p) { return p.id === t.id; });
          if (was && !was.done && t.done) {
            addNotification(user.uid, { title: "Task complete! 🎉", body: t.title, type: "success", link: "tasks" });
            playSound("complete");
          }
        });
      }
      prevTasks.current = d;
      setTasks(d);
      setDataLoading(false);
    });
    // Welcome notification on first load
    if (!welcomeSent.current) {
      welcomeSent.current = true;
      setTimeout(function() {
        const h = new Date().getHours();
        const greet = h < 12 ? "Subah Mubarak" : h < 17 ? "Dopahar ka salaam" : h < 21 ? "Shaam ayi hai" : "Raat ka safar";
        addNotification(user.uid, { title: greet + ", " + (user.displayName || "Yaar") + "! 👋", body: "Karyika mein aapka swagat hai. Kaam shuru karein?", type: "info" });
      }, 3000);
    }
    const u2 = subscribeToHabits(user.uid, setHabits);
    const u3 = subscribeToNotes(user.uid, setNotes);
    const u4 = subscribeToProjects(user.uid, setProjects);
    const u5 = subscribeToGoals(user.uid, setGoals);
    checkIsAdmin(user.uid).then(setIsAdmin);
    return () => { u1(); u2(); u3(); u4(); u5(); };
  }, [user]);

  useEffect(() => {
    const h = e => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); setCmdOpen(o => !o); }
      if (e.key === "Escape") setCmdOpen(false);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  const navigate = p => {
    setPageTransition(true);
    setTimeout(() => { setPage(p); setSidebarOpen(false); setPageTransition(false); }, 80);
  };

  // Loading splash
  if (authLoading) return (
    <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 20, background: "#09090E" }}>
      <div style={{ position: "relative" }}>
        <div style={{ width: 64, height: 64, borderRadius: 16, background: "linear-gradient(135deg,#FF6B35,#FF8C5A)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 40px rgba(255,107,53,0.4)" }}>
          <img src="/logo.png" alt="K" style={{ width: 48, height: 48, objectFit: "contain" }} onError={e => e.target.style.display = "none"} />
        </div>
        <div style={{ position: "absolute", inset: -4, borderRadius: 20, border: "2px solid rgba(255,107,53,0.3)", animation: "spin 2s linear infinite" }} />
      </div>
      <div style={{ fontFamily: "'Cabinet Grotesk',sans-serif", fontSize: 22, fontWeight: 900, background: "linear-gradient(135deg,#FFFFFF,rgba(255,107,53,0.9))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Karyika</div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  // Landing page for guests
  if (!user && !showAuth) return (
    <div style={{ overflowY: "auto", height: "100vh", background: "var(--bg)" }}>
      <LandingPage onGetStarted={() => setShowAuth(true)} />
    </div>
  );

  // Auth page
  if (!user) return (
    <>
      <AuthPage />
      <button onClick={() => setShowAuth(false)} style={{ position: "fixed", top: 16, left: 16, zIndex: 999, padding: "7px 14px", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, color: "#9CA3AF", cursor: "pointer", fontSize: 13, fontFamily: "inherit" }}>
        ← Back
      </button>
      <ToastContainer />
    </>
  );

  const pendingCount = tasks.filter(x => !x.done).length;

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "var(--bg)" }}>
      <Sidebar page={page} setPage={navigate} dark={dark} setDark={setDark} pendingCount={pendingCount} open={sidebarOpen} setOpen={setSidebarOpen} isAdmin={isAdmin} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>

        {/* Topbar */}
        <div className="topbar" style={{ position: "sticky", top: 0, zIndex: 50, background: "var(--topbar-bg)", borderBottom: "1px solid var(--border)", padding: "10px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", backdropFilter: "blur(20px)", flexShrink: 0, transition: "background 0.25s" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <button id="mob-btn" onClick={() => setSidebarOpen(o => !o)} style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 8, padding: "7px 10px", cursor: "pointer", fontSize: 16, color: "var(--text3)", display: "none" }}>☰</button>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 12, color: "var(--text3)" }}>Karyika</span>
                <span style={{ color: "var(--text3)", fontSize: 12 }}>›</span>
                <span style={{ fontFamily: "var(--font-head)", fontSize: 16, fontWeight: 800, color: "var(--text)" }}>{PAGE_TITLES[page] || page}</span>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <button onClick={() => setCmdOpen(true)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 14px", border: "1px solid var(--border2)", borderRadius: 20, background: "var(--surface2)", cursor: "pointer", fontSize: 12, fontWeight: 500, color: "var(--text3)", fontFamily: "inherit", transition: "all 0.2s" }}
                onMouseEnter={e => e.currentTarget.style.background = "var(--surface3)"}
                onMouseLeave={e => e.currentTarget.style.background = "var(--surface2)"}>
                🔍 Search
                <kbd style={{ padding: "1px 5px", background: "var(--kbd-bg)", borderRadius: 4, fontSize: 10, fontFamily: "monospace", color: "var(--text3)", border: "1px solid var(--border)" }}>⌘K</kbd>
              </button>
              <NotificationBell onNavigate={navigate} />
              <div style={{ fontSize: 11, color: "var(--text3)", background: "var(--surface2)", padding: "5px 10px", borderRadius: 20, border: "1px solid var(--border)" }}>
                {new Date().toLocaleDateString("en-IN", { weekday: "short", month: "short", day: "numeric" })}
              </div>
            </div>
          </div>

        {/* Page content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 22px", opacity: pageTransition ? 0 : 1, transition: "opacity 0.08s ease" }}>
          {page === "dashboard"   && <Dashboard tasks={tasks} habits={habits} projects={projects} goals={goals} />}
          {page === "tasks"       && <TasksPage tasks={tasks} projects={projects} loading={dataLoading} />}
          {page === "habits"      && <HabitsPage habits={habits} loading={dataLoading} />}
          {page === "calendar"    && <EnterpriseCalendarPage tasks={tasks} habits={habits} />}
          {page === "timer"       && <div style={{ display: "flex", justifyContent: "center", paddingTop: 16 }}><FocusTimer tasks={tasks} /></div>}
          {page === "notes"       && <NotionPage />}
          {page === "projects"    && <ProjectsPage projects={projects} tasks={tasks} />}
          {page === "goals"       && <GoalsPage goals={goals} />}
          {page === "settings"    && <SettingsPage dark={dark} setDark={setDark} tasks={tasks} habits={habits} notes={notes} />}
          {page === "admin"       && <AdminPage />}
          {page === "ai"          && <AIAssistantPage tasks={tasks} projects={projects} goals={goals} />}
          {page === "timetracker" && <TimeTrackerPage tasks={tasks} />}
          {page === "automations" && <AutomationsPage />}
          {page === "gantt"       && <GanttPage tasks={tasks} projects={projects} />}
          {page === "team"        && <TeamPage />}
          {page === "analytics"   && <AnalyticsPage tasks={tasks} habits={habits} projects={projects} goals={goals} />}
          {page === "workload"    && <WorkloadPage tasks={tasks} projects={projects} />}
        </div>
      </div>

      {cmdOpen && <CommandPalette tasks={tasks} projects={projects} habits={habits} notes={notes} onNavigate={navigate} onClose={() => setCmdOpen(false)} />}
      <ToastContainer />

      <style>{`
        @media(max-width:768px){#mob-btn{display:flex!important}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes popIn{from{opacity:0;transform:scale(0.94)}to{opacity:1;transform:scale(1)}}
        @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
        @keyframes gradient-shift{0%,100%{background-position:0% 50%}50%{background-position:100% 50%}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.45}}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
        @keyframes notifBounce{0%{transform:scale(1)}30%{transform:scale(1.3)}60%{transform:scale(0.9)}100%{transform:scale(1)}}
      `}</style>
    </div>
  );
}