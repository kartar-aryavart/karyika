// 📅 Enterprise Calendar — Month/Week/Day views + Drag & Drop
import { useState, useRef } from "react";
import { useAuth } from "../hooks/useAuth";
import { updateTask, addTask } from "../firebase/services";

const HOURS = Array.from({length:24},(_,i)=>i);
const DAYS_SHORT = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const todayStr = () => { const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; };
const PRI_COLOR = { high:"#F43F5E", medium:"#F59E0B", low:"#10B981" };

function TaskPill({ task, compact=false }) {
  return (
    <div style={{
      background:`${PRI_COLOR[task.priority]||"#FF6B35"}22`,
      border:`1.5px solid ${PRI_COLOR[task.priority]||"#FF6B35"}66`,
      borderLeft:`3px solid ${PRI_COLOR[task.priority]||"#FF6B35"}`,
      borderRadius:6, padding:compact?"2px 6px":"4px 8px",
      fontSize:compact?10:11, fontWeight:600, color:"var(--text)",
      overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
      cursor:"pointer", transition:"all 0.15s",
    }}
    onMouseEnter={e=>{e.currentTarget.style.background=`${PRI_COLOR[task.priority]||"#FF6B35"}44`;}}
    onMouseLeave={e=>{e.currentTarget.style.background=`${PRI_COLOR[task.priority]||"#FF6B35"}22`;}}>
      {task.done?"✓ ":""}{task.title}
    </div>
  );
}

// ─── MONTH VIEW ───────────────────────────────────────────────────────────────
function MonthView({ year, month, tasks, habits, onDayClick, onTaskDrop }) {
  const [dragging, setDragging] = useState(null);
  const td = todayStr();
  const firstDay = new Date(year, month, 1).getDay();
  const dim = new Date(year, month+1, 0).getDate();
  const ds = d => `${year}-${String(month+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;

  return (
    <div style={{ flex:1, display:"flex", flexDirection:"column" }}>
      {/* Day headers */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", borderBottom:"1px solid #1E1E2E" }}>
        {DAYS_SHORT.map(d => <div key={d} style={{ padding:"10px 0", textAlign:"center", fontSize:11, fontWeight:800, color:"var(--text3)", letterSpacing:"0.5px" }}>{d}</div>)}
      </div>
      <div style={{ flex:1, display:"grid", gridTemplateColumns:"repeat(7,1fr)", gridTemplateRows:`repeat(${Math.ceil((firstDay+dim)/7)},1fr)`, gap:0 }}>
        {Array.from({length:firstDay}).map((_,i) => <div key={`e${i}`} style={{ background:"var(--surface)", borderRight:"1px solid #1E1E2E", borderBottom:"1px solid #1E1E2E" }} />)}
        {Array.from({length:dim},(_,i) => {
          const d = i+1; const dateStr = ds(d);
          const dayTasks = tasks.filter(t => t.due===dateStr);
          const isToday = dateStr===td;
          const isWeekend = new Date(year,month,d).getDay()%6===0;
          return (
            <div key={d}
              onDragOver={e=>{e.preventDefault();e.currentTarget.style.background="rgba(255,107,53,0.08)";}}
              onDragLeave={e=>{e.currentTarget.style.background="";}}
              onDrop={e=>{e.currentTarget.style.background="";if(dragging||onTaskDrop){onTaskDrop&&onTaskDrop(dragging,dateStr);}}}
              onClick={()=>onDayClick(dateStr)}
              style={{ borderRight:"1px solid #1E1E2E", borderBottom:"1px solid #1E1E2E", padding:"6px 6px 4px", minHeight:90, cursor:"pointer", background:isWeekend?"rgba(255,255,255,0.01)":"transparent", transition:"background 0.1s", position:"relative" }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"center", width:24, height:24, borderRadius:"50%", background:isToday?"#FF6B35":"transparent", marginBottom:4 }}>
                <span style={{ fontSize:12, fontWeight:isToday?800:500, color:isToday?"#fff":"#9CA3AF" }}>{d}</span>
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:2 }}>
                {dayTasks.slice(0,3).map(t => <TaskPill key={t.id} task={t} compact />)}
                {dayTasks.length>3 && <div style={{ fontSize:10, color:"#FF6B35", fontWeight:700, paddingLeft:4 }}>+{dayTasks.length-3} more</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── WEEK VIEW ────────────────────────────────────────────────────────────────
function WeekView({ currentDate, tasks }) {
  const startOfWeek = new Date(currentDate);
  startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
  const weekDays = Array.from({length:7},(_,i)=>{ const d=new Date(startOfWeek); d.setDate(d.getDate()+i); return d; });
  const td = todayStr();
  const ds = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;

  return (
    <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"auto" }}>
      <div style={{ display:"grid", gridTemplateColumns:"60px repeat(7,1fr)", borderBottom:"1px solid #1E1E2E", position:"sticky", top:0, background:"#0D0D18", zIndex:10 }}>
        <div />
        {weekDays.map(d => {
          const dateStr=ds(d); const isToday=dateStr===td;
          return <div key={dateStr} style={{ padding:"10px 8px", textAlign:"center", borderLeft:"1px solid #1E1E2E" }}>
            <div style={{ fontSize:10, color:"var(--text3)", fontWeight:700 }}>{DAYS_SHORT[d.getDay()]}</div>
            <div style={{ width:28, height:28, borderRadius:"50%", background:isToday?"#FF6B35":"transparent", display:"flex", alignItems:"center", justifyContent:"center", margin:"4px auto 0", fontSize:14, fontWeight:isToday?800:500, color:isToday?"#fff":"#E5E7EB" }}>{d.getDate()}</div>
          </div>;
        })}
      </div>
      {HOURS.map(h => (
        <div key={h} style={{ display:"grid", gridTemplateColumns:"60px repeat(7,1fr)", minHeight:48, borderBottom:"1px solid #0F0F1A" }}>
          <div style={{ padding:"4px 8px 0", fontSize:10, color:"var(--text3)", fontWeight:600, textAlign:"right" }}>{h===0?"":h<12?`${h}am`:h===12?"12pm":`${h-12}pm`}</div>
          {weekDays.map(d => {
            const dateStr=ds(d);
            const hTasks = tasks.filter(t=>t.due===dateStr && (t.dueTime||"").startsWith(String(h).padStart(2,"0")));
            return <div key={dateStr} style={{ borderLeft:"1px solid #1A1A26", padding:"2px 3px", position:"relative" }}>
              {hTasks.map(t=><TaskPill key={t.id} task={t} compact />)}
            </div>;
          })}
        </div>
      ))}
    </div>
  );
}

// ─── DAY VIEW ─────────────────────────────────────────────────────────────────
function DayView({ currentDate, tasks }) {
  const ds = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
  const dateStr = ds(currentDate);
  const dayTasks = tasks.filter(t=>t.due===dateStr);
  const noTime = dayTasks.filter(t=>!t.dueTime);
  const withTime = dayTasks.filter(t=>t.dueTime).sort((a,b)=>a.dueTime.localeCompare(b.dueTime));

  return (
    <div style={{ flex:1, overflowY:"auto" }}>
      {noTime.length>0 && (
        <div style={{ padding:"12px 20px", borderBottom:"1px solid #1E1E2E" }}>
          <div style={{ fontSize:11, fontWeight:800, color:"var(--text3)", marginBottom:8, textTransform:"uppercase", letterSpacing:"1px" }}>All Day</div>
          <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
            {noTime.map(t=><div key={t.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 12px", background:"var(--surface2)", border:"1px solid #1E1E2E", borderLeft:`3px solid ${PRI_COLOR[t.priority]||"#FF6B35"}`, borderRadius:8 }}>
              <span style={{ fontSize:13, fontWeight:600, flex:1 }}>{t.done?"✓ ":""}{t.title}</span>
              <span style={{ fontSize:11, color:PRI_COLOR[t.priority], fontWeight:700 }}>● {t.priority}</span>
            </div>)}
          </div>
        </div>
      )}
      <div style={{ display:"grid", gridTemplateColumns:"60px 1fr", overflow:"auto" }}>
        {HOURS.map(h=>(
          <div key={h} style={{ display:"contents" }}>
            <div style={{ padding:"10px 10px 0", fontSize:11, color:"var(--text3)", textAlign:"right", borderBottom:"1px solid #0F0F1A" }}>{h===0?"":h<12?`${h}am`:h===12?"12pm":`${h-12}pm`}</div>
            <div style={{ borderLeft:"1px solid #1E1E2E", borderBottom:"1px solid #0F0F1A", minHeight:52, padding:"4px 10px", position:"relative" }}>
              {withTime.filter(t=>(t.dueTime||"").startsWith(String(h).padStart(2,"0"))).map(t=>(
                <div key={t.id} style={{ padding:"6px 10px", background:`${PRI_COLOR[t.priority]||"#FF6B35"}22`, border:`1.5px solid ${PRI_COLOR[t.priority]||"#FF6B35"}66`, borderLeft:`3px solid ${PRI_COLOR[t.priority]||"#FF6B35"}`, borderRadius:8, marginBottom:4 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:"var(--text)" }}>{t.title}</div>
                  <div style={{ fontSize:11, color:"var(--text2)" }}>{t.dueTime} · {t.estimatedTime?`${t.estimatedTime}m`:t.priority}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── MAIN CALENDAR ────────────────────────────────────────────────────────────
export default function EnterpriseCalendarPage({ tasks=[], habits=[] }) {
  const { user } = useAuth();
  const now = new Date();
  const [view, setView] = useState("month");
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [currentDate, setCurrentDate] = useState(now);
  const [selectedDay, setSelectedDay] = useState(null);
  const [quickAdd, setQuickAdd] = useState("");
  const [toast, setToast] = useState("");

  const showToast = m => { setToast(m); setTimeout(()=>setToast(""),2500); };

  const prev = () => {
    if (view==="month") { if(month===0){setMonth(11);setYear(y=>y-1);}else setMonth(m=>m-1); }
    else { const d=new Date(currentDate); d.setDate(d.getDate()-(view==="week"?7:1)); setCurrentDate(d); }
  };
  const next = () => {
    if (view==="month") { if(month===11){setMonth(0);setYear(y=>y+1);}else setMonth(m=>m+1); }
    else { const d=new Date(currentDate); d.setDate(d.getDate()+(view==="week"?7:1)); setCurrentDate(d); }
  };
  const goToday = () => { const n=new Date(); setYear(n.getFullYear()); setMonth(n.getMonth()); setCurrentDate(n); };

  const handleTaskDrop = async (taskId, dateStr) => {
    if (!taskId) return;
    await updateTask(user.uid, taskId, { due: dateStr });
    showToast(`📅 Task moved to ${dateStr}`);
  };

  const addQuick = async () => {
    if (!quickAdd.trim()||!selectedDay) return;
    await addTask(user.uid, { title:quickAdd.trim(), due:selectedDay, priority:"medium", done:false, status:"todo", tags:[], subtasks:[] });
    setQuickAdd(""); showToast("✅ Task added!");
  };

  const headerTitle = () => {
    if (view==="month") return `${MONTHS[month]} ${year}`;
    if (view==="week") {
      const s=new Date(currentDate); s.setDate(s.getDate()-s.getDay());
      const e=new Date(s); e.setDate(e.getDate()+6);
      return `${s.toLocaleDateString("en-IN",{month:"short",day:"numeric"})} – ${e.toLocaleDateString("en-IN",{month:"short",day:"numeric",year:"numeric"})}`;
    }
    return currentDate.toLocaleDateString("en-IN",{weekday:"long",month:"long",day:"numeric",year:"numeric"});
  };

  const selDayTasks = selectedDay ? tasks.filter(t=>t.due===selectedDay) : [];

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"calc(100vh - 108px)", background:"var(--bg)", borderRadius:16, overflow:"hidden", border:"1px solid #1E1E2E" }}>
      {toast && <div style={{ position:"fixed",bottom:24,right:24,background:"#10B981",color:"#fff",padding:"12px 20px",borderRadius:12,fontWeight:700,fontSize:14,zIndex:9999 }}>{toast}</div>}

      {/* Toolbar */}
      <div style={{ display:"flex", alignItems:"center", gap:10, padding:"12px 18px", borderBottom:"1px solid #1E1E2E", background:"#0D0D18", flexShrink:0 }}>
        <button onClick={goToday} style={{ padding:"6px 14px",border:"1px solid #2A2A3A",borderRadius:8,background:"transparent",color:"var(--text2)",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit" }}>Today</button>
        <div style={{ display:"flex", gap:4 }}>
          <button onClick={prev} style={{ padding:"6px 10px",border:"1px solid #1E1E2E",borderRadius:8,background:"var(--surface2)",color:"var(--text2)",fontSize:14,cursor:"pointer" }}>‹</button>
          <button onClick={next} style={{ padding:"6px 10px",border:"1px solid #1E1E2E",borderRadius:8,background:"var(--surface2)",color:"var(--text2)",fontSize:14,cursor:"pointer" }}>›</button>
        </div>
        <div style={{ fontFamily:"'Cabinet Grotesk',sans-serif", fontWeight:800, fontSize:15, flex:1 }}>{headerTitle()}</div>
        <div style={{ display:"flex", gap:4 }}>
          {["month","week","day"].map(v=>(
            <button key={v} onClick={()=>setView(v)} style={{ padding:"6px 12px",border:"1px solid",borderColor:view===v?"#FF6B35":"#1E1E2E",borderRadius:8,background:view===v?"rgba(255,107,53,0.1)":"transparent",color:view===v?"#FF6B35":"#6B7280",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit",textTransform:"capitalize" }}>{v}</button>
          ))}
        </div>
        <div style={{ fontSize:12, color:"var(--text3)", background:"var(--surface2)", padding:"6px 12px", borderRadius:8, border:"1px solid #1E1E2E" }}>
          {tasks.filter(t=>t.due).length} scheduled · {tasks.filter(t=>!t.done).length} pending
        </div>
      </div>

      {/* View content */}
      <div style={{ flex:1, display:"flex", overflow:"hidden" }}>
        <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"hidden" }}>
          {view==="month" && <MonthView year={year} month={month} tasks={tasks} habits={habits} onDayClick={setSelectedDay} onTaskDrop={handleTaskDrop} />}
          {view==="week"  && <WeekView currentDate={currentDate} tasks={tasks} />}
          {view==="day"   && <DayView  currentDate={currentDate} tasks={tasks} />}
        </div>

        {/* Side panel — selected day details */}
        {view==="month" && selectedDay && (
          <div style={{ width:260, borderLeft:"1px solid #1E1E2E", background:"#0D0D18", display:"flex", flexDirection:"column", flexShrink:0 }}>
            <div style={{ padding:"14px 16px", borderBottom:"1px solid #1E1E2E" }}>
              <div style={{ fontFamily:"'Cabinet Grotesk',sans-serif", fontWeight:800, fontSize:14 }}>{new Date(selectedDay+"T00:00").toLocaleDateString("en-IN",{weekday:"long",month:"long",day:"numeric"})}</div>
              <div style={{ fontSize:12, color:"var(--text3)", marginTop:3 }}>{selDayTasks.length} tasks</div>
            </div>
            <div style={{ flex:1, overflowY:"auto", padding:"10px 12px", display:"flex", flexDirection:"column", gap:6 }}>
              {selDayTasks.map(t=>(
                <div key={t.id} style={{ padding:"8px 10px", background:"var(--surface2)", border:"1px solid #1E1E2E", borderLeft:`3px solid ${PRI_COLOR[t.priority]||"#FF6B35"}`, borderRadius:9 }}>
                  <div style={{ fontSize:12, fontWeight:600, color:t.done?"#6B7280":"#E5E7EB", textDecoration:t.done?"line-through":"none" }}>{t.title}</div>
                  <div style={{ fontSize:10, color:PRI_COLOR[t.priority], marginTop:3, fontWeight:700 }}>● {t.priority}</div>
                </div>
              ))}
              {selDayTasks.length===0 && <div style={{ textAlign:"center",color:"var(--text3)",fontSize:12,padding:"24px 0" }}>Nothing here yet</div>}
            </div>
            <div style={{ padding:"10px 12px", borderTop:"1px solid #1E1E2E" }}>
              <div style={{ display:"flex", gap:6 }}>
                <input value={quickAdd} onChange={e=>setQuickAdd(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addQuick()} placeholder="Quick add task..."
                  style={{ flex:1,background:"var(--surface2)",border:"1px solid #1E1E2E",borderRadius:8,color:"var(--text)",fontSize:12,padding:"7px 10px",fontFamily:"inherit",outline:"none" }} />
                <button onClick={addQuick} style={{ padding:"7px 10px",border:"none",borderRadius:8,background:"#FF6B35",color:"#fff",cursor:"pointer",fontWeight:700,fontSize:14,fontFamily:"inherit" }}>+</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
