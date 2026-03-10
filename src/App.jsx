// 🚀 App.jsx v6 — Karyika Phase 5
import { useState, useEffect } from "react";
import { useAuth } from "./hooks/useAuth";
import { subscribeToTasks, subscribeToHabits, subscribeToNotes, subscribeToProjects, subscribeToGoals, checkIsAdmin } from "./firebase/services";
import { useLang } from "./i18n/translations.jsx";
import AuthPage from "./pages/AuthPage";
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
import Sidebar from "./components/Sidebar";
import CommandPalette from "./components/CommandPalette";
import NotificationBell from "./components/NotificationBell";
import { ToastContainer } from "./components/UI";

const PAGE_TITLES = {
  dashboard:"Home", tasks:"Tasks", habits:"Habits", calendar:"Calendar",
  timer:"Focus Timer", notes:"Pages", projects:"Projects", goals:"Goals & OKRs",
  settings:"Settings", admin:"Admin Panel", ai:"AI Assistant", timetracker:"Time Tracker",
  automations:"Automations", gantt:"Gantt & Dependencies", team:"Team Workspace",
  analytics:"Analytics",
};

export default function App() {
  const { user, loading: authLoading } = useAuth();
  const [page, setPage] = useState("dashboard");
  const [dark, setDark] = useState(() => localStorage.getItem("karyika-dark")!=="false");
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

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", dark?"dark":"light");
    localStorage.setItem("karyika-dark", dark);
  }, [dark]);

  useEffect(() => {
    if (!user) { setTasks([]); setHabits([]); setNotes([]); setProjects([]); setGoals([]); setDataLoading(false); return; }
    setDataLoading(true);
    const u1 = subscribeToTasks(user.uid,    d => { setTasks(d); setDataLoading(false); });
    const u2 = subscribeToHabits(user.uid,   setHabits);
    const u3 = subscribeToNotes(user.uid,    setNotes);
    const u4 = subscribeToProjects(user.uid, setProjects);
    const u5 = subscribeToGoals(user.uid,    setGoals);
    checkIsAdmin(user.uid).then(setIsAdmin);
    return () => { u1(); u2(); u3(); u4(); u5(); };
  }, [user]);

  useEffect(() => {
    const handler = e => {
      if ((e.metaKey||e.ctrlKey) && e.key==="k") { e.preventDefault(); setCmdOpen(o=>!o); }
      if (e.key==="Escape") setCmdOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const navigate = p => {
    setPageTransition(true);
    setTimeout(() => { setPage(p); setSidebarOpen(false); setPageTransition(false); }, 80);
  };

  if (authLoading) return (
    <div style={{height:"100vh",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:20,background:"#09090E"}}>
      <div style={{position:"relative"}}>
        <div style={{width:64,height:64,borderRadius:16,background:"linear-gradient(135deg,#FF6B35,#FF8C5A)",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 0 40px rgba(255,107,53,0.4)"}}>
          <img src="/logo.png" alt="K" style={{width:48,height:48,objectFit:"contain"}} onError={e=>e.target.style.display="none"} />
        </div>
        <div style={{position:"absolute",inset:-4,borderRadius:20,border:"2px solid rgba(255,107,53,0.3)",animation:"spin 2s linear infinite"}} />
      </div>
      <div style={{fontFamily:"'Cabinet Grotesk',sans-serif",fontSize:22,fontWeight:900,background:"linear-gradient(135deg,#FFFFFF,rgba(255,107,53,0.9))",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>Karyika</div>
      <div style={{fontSize:12,color:"#4B5563",letterSpacing:"2px",textTransform:"uppercase"}}>Loading workspace...</div>
    </div>
  );

  if (!user) return (<><AuthPage /><ToastContainer /></>);

  const pendingCount = tasks.filter(x=>!x.done).length;

  return (
    <div style={{display:"flex",height:"100vh",overflow:"hidden",background:"var(--bg)"}}>
      <Sidebar page={page} setPage={navigate} dark={dark} setDark={setDark} pendingCount={pendingCount} open={sidebarOpen} setOpen={setSidebarOpen} isAdmin={isAdmin} />

      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",minWidth:0}}>
        {/* Topbar — hidden for notes (full screen editor) */}
        {page!=="notes" && (
          <div style={{position:"sticky",top:0,zIndex:50,background:"rgba(9,9,14,0.85)",borderBottom:"1px solid rgba(255,255,255,0.05)",padding:"10px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",backdropFilter:"blur(20px)",flexShrink:0}}>
            <div style={{display:"flex",alignItems:"center",gap:12}}>
              <button id="mobile-btn" onClick={()=>setSidebarOpen(o=>!o)} style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:8,padding:"7px 10px",cursor:"pointer",fontSize:16,color:"#6B7280",display:"none"}}>☰</button>
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                <span style={{fontSize:12,color:"#4B5563",fontWeight:500}}>Karyika</span>
                <span style={{color:"#2A2A3A",fontSize:12}}>›</span>
                <span style={{fontFamily:"'Cabinet Grotesk',sans-serif",fontSize:16,fontWeight:800,color:"#F3F4F6"}}>{PAGE_TITLES[page]||page}</span>
              </div>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <button onClick={()=>setCmdOpen(true)} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 14px",border:"1px solid rgba(255,255,255,0.06)",borderRadius:20,background:"rgba(255,255,255,0.03)",cursor:"pointer",fontSize:12,fontWeight:500,color:"#4B5563",fontFamily:"inherit",transition:"all 0.2s"}}
                onMouseEnter={e=>{e.currentTarget.style.background="rgba(255,255,255,0.06)";}} onMouseLeave={e=>{e.currentTarget.style.background="rgba(255,255,255,0.03)";}}>
                🔍 <span>Search</span>
                <kbd style={{padding:"1px 5px",background:"rgba(255,255,255,0.06)",borderRadius:4,fontSize:10,fontFamily:"monospace",color:"#4B5563",border:"1px solid rgba(255,255,255,0.06)"}}>⌘K</kbd>
              </button>
              <NotificationBell onNavigate={navigate} />
              <div style={{fontSize:11,color:"#4B5563",background:"rgba(255,255,255,0.03)",padding:"5px 10px",borderRadius:20,border:"1px solid rgba(255,255,255,0.05)"}}>
                {new Date().toLocaleDateString("en-IN",{weekday:"short",month:"short",day:"numeric"})}
              </div>
            </div>
          </div>
        )}

        {/* Page content */}
        <div style={{flex:1,overflowY:page==="notes"?"hidden":"auto",padding:page==="notes"?"0":"20px 22px",opacity:pageTransition?0:1,transition:"opacity 0.1s ease",height:page==="notes"?"100%":undefined}}>
          {page==="dashboard"   && <Dashboard tasks={tasks} habits={habits} projects={projects} goals={goals} />}
          {page==="tasks"       && <TasksPage tasks={tasks} projects={projects} loading={dataLoading} />}
          {page==="habits"      && <HabitsPage habits={habits} loading={dataLoading} />}
          {page==="calendar"    && <EnterpriseCalendarPage tasks={tasks} habits={habits} />}
          {page==="timer"       && <div style={{display:"flex",justifyContent:"center",paddingTop:16}}><FocusTimer tasks={tasks} /></div>}
          {page==="notes"       && <NotionPage />}
          {page==="projects"    && <ProjectsPage projects={projects} tasks={tasks} />}
          {page==="goals"       && <GoalsPage goals={goals} />}
          {page==="settings"    && <SettingsPage dark={dark} setDark={setDark} tasks={tasks} habits={habits} notes={notes} />}
          {page==="admin"       && <AdminPage />}
          {page==="ai"          && <AIAssistantPage tasks={tasks} projects={projects} goals={goals} />}
          {page==="timetracker" && <TimeTrackerPage tasks={tasks} />}
          {page==="automations" && <AutomationsPage />}
          {page==="gantt"       && <GanttPage tasks={tasks} projects={projects} />}
          {page==="team"        && <TeamPage />}
          {page==="analytics"   && <AnalyticsPage tasks={tasks} habits={habits} projects={projects} goals={goals} />}
        </div>
      </div>

      {cmdOpen && <CommandPalette tasks={tasks} projects={projects} habits={habits} notes={notes} onNavigate={navigate} onClose={()=>setCmdOpen(false)} />}
      <ToastContainer />
      <style>{`@media(max-width:768px){#mobile-btn{display:flex!important}}@keyframes spin{to{transform:rotate(360deg)}}@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}@keyframes slideUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}@keyframes popIn{from{opacity:0;transform:scale(0.94)}to{opacity:1;transform:scale(1)}}`}</style>
    </div>
  );
}
