// 📊 Gantt Chart + Task Dependencies — ClickUp-style
import { useState, useMemo } from "react";
import { useAuth } from "../hooks/useAuth";
import { updateTask, addDependency, removeDependency } from "../firebase/services";

function GanttBar({ task, startDate, totalDays, onUpdate }) {
  const { user } = useAuth();
  const start = task.due ? new Date(task.due) : null;
  const end   = task.endDate ? new Date(task.endDate) : start;
  if (!start) return null;

  const dayOffset = Math.max(0, Math.floor((start - startDate) / 86400000));
  const duration  = Math.max(1, end ? Math.ceil((end - start) / 86400000) + 1 : 1);
  const left  = (dayOffset / totalDays) * 100;
  const width = Math.min((duration / totalDays) * 100, 100 - left);

  const PRI_COLOR = { high:"#F43F5E", medium:"#F59E0B", low:"#10B981" };
  const color = PRI_COLOR[task.priority] || "#FF6B35";

  return (
    <div style={{ position:"absolute", left:`${left}%`, width:`${width}%`, height:24, borderRadius:6, background:`${color}22`, border:`1.5px solid ${color}`, display:"flex", alignItems:"center", paddingLeft:6, overflow:"hidden", cursor:"pointer", transition:"all 0.2s", top:"50%", transform:"translateY(-50%)" }}
      title={`${task.title} — ${start.toLocaleDateString()}`}
      onMouseEnter={e=>{ e.currentTarget.style.background=`${color}44`; e.currentTarget.style.boxShadow=`0 0 10px ${color}44`; }}
      onMouseLeave={e=>{ e.currentTarget.style.background=`${color}22`; e.currentTarget.style.boxShadow="none"; }}>
      <span style={{ fontSize:11, fontWeight:700, color, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{task.title}</span>
    </div>
  );
}

export default function GanttPage({ tasks=[], projects=[] }) {
  const { user } = useAuth();
  const [view, setView] = useState("gantt");
  const [selectedTask, setSelectedTask] = useState(null);
  const [depModal, setDepModal] = useState(null);
  const [toast, setToast] = useState("");

  const showToast = (msg) => { setToast(msg); setTimeout(()=>setToast(""),3000); };

  // Gantt timeline setup — next 30 days
  const today = new Date(); today.setHours(0,0,0,0);
  const totalDays = 30;
  const days = Array.from({length:totalDays},(_,i)=>{ const d=new Date(today); d.setDate(d.getDate()+i); return d; });

  const tasksWithDates = tasks.filter(t => t.due);

  const addDep = async (taskId, dependsOnId) => {
    if (taskId === dependsOnId) return;
    await addDependency(user.uid, taskId, dependsOnId);
    showToast("🔗 Dependency added!");
    setDepModal(null);
  };

  const removeDep = async (taskId, depId) => {
    await removeDependency(user.uid, taskId, depId);
    showToast("✅ Dependency removed");
  };

  const isBlocked = (task) => {
    return (task.dependencies||[]).some(depId => {
      const dep = tasks.find(t=>t.id===depId);
      return dep && !dep.done;
    });
  };

  const Card = ({children,style={}}) => <div style={{ background:"var(--surface2)",border:"1px solid #1E1E2E",borderRadius:14,padding:18,...style }}>{children}</div>;
  const PRI = { high:"#F43F5E", medium:"#F59E0B", low:"#10B981" };

  return (
    <div>
      {toast && <div style={{ position:"fixed",bottom:24,right:24,background:"#10B981",color:"#fff",padding:"12px 20px",borderRadius:12,fontWeight:700,fontSize:14,zIndex:9999 }}>{toast}</div>}

      {/* Header */}
      <div style={{ display:"flex",alignItems:"center",gap:12,marginBottom:20 }}>
        <div style={{ fontFamily:"'Cabinet Grotesk',sans-serif",fontSize:20,fontWeight:800 }}>📊 Project Timeline</div>
        <div style={{ marginLeft:"auto",display:"flex",gap:8 }}>
          {["gantt","deps"].map(v=>(
            <button key={v} onClick={()=>setView(v)} style={{ padding:"7px 16px",border:"1px solid",borderRadius:8,borderColor:view===v?"#FF6B35":"#2A2A3A",background:view===v?"rgba(255,107,53,0.1)":"transparent",color:view===v?"#FF6B35":"#9CA3AF",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit" }}>
              {v==="gantt"?"📊 Gantt":"🔗 Dependencies"}
            </button>
          ))}
        </div>
      </div>

      {view === "gantt" ? (
        <Card style={{ padding:0,overflow:"hidden" }}>
          {/* Days header */}
          <div style={{ display:"flex",borderBottom:"1px solid #1E1E2E" }}>
            <div style={{ width:220,flexShrink:0,padding:"10px 16px",fontSize:11,fontWeight:700,color:"var(--text3)",background:"#0D0D18",borderRight:"1px solid #1E1E2E" }}>TASK</div>
            <div style={{ flex:1,display:"flex",overflow:"hidden" }}>
              {days.filter((_,i)=>i%3===0).map((d,i)=>(
                <div key={i} style={{ flex:3,textAlign:"center",padding:"10px 4px",fontSize:10,fontWeight:700,color:d.toDateString()===today.toDateString()?"#FF6B35":"#6B7280",borderRight:"1px solid #1E1E2E",background:d.toDateString()===today.toDateString()?"rgba(255,107,53,0.05)":"transparent" }}>
                  {d.toLocaleDateString("en-IN",{month:"short",day:"numeric"})}
                </div>
              ))}
            </div>
          </div>

          {tasksWithDates.length === 0 ? (
            <div style={{ textAlign:"center",padding:"40px 20px",color:"var(--text3)" }}>
              <div style={{ fontSize:32,marginBottom:10 }}>📅</div>
              <div>Tasks mein due dates add karo Gantt view ke liye</div>
            </div>
          ) : (
            tasksWithDates.slice(0,20).map(task => {
              const blocked = isBlocked(task);
              return (
                <div key={task.id} style={{ display:"flex",borderBottom:"1px solid #1A1A2E",minHeight:44 }}>
                  <div style={{ width:220,flexShrink:0,padding:"10px 16px",display:"flex",alignItems:"center",gap:8,borderRight:"1px solid #1E1E2E",background:"#0D0D18" }}>
                    {blocked && <span title="Blocked by dependency" style={{ fontSize:14 }}>🚫</span>}
                    {task.done && <span style={{ fontSize:14 }}>✅</span>}
                    <div style={{ minWidth:0 }}>
                      <div style={{ fontSize:12,fontWeight:600,color:task.done?"#6B7280":"#E5E7EB",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",textDecoration:task.done?"line-through":"none" }}>{task.title}</div>
                      <div style={{ fontSize:10,color:PRI[task.priority],marginTop:1,fontWeight:700 }}>● {task.priority}</div>
                    </div>
                  </div>
                  <div style={{ flex:1,position:"relative" }}>
                    {/* Today marker */}
                    <div style={{ position:"absolute",left:`${(0/totalDays)*100}%`,top:0,bottom:0,width:2,background:"rgba(255,107,53,0.4)",zIndex:1 }} />
                    <GanttBar task={task} startDate={today} totalDays={totalDays} />
                  </div>
                </div>
              );
            })
          )}
        </Card>
      ) : (
        /* Dependencies View */
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:14 }}>
          <Card>
            <div style={{ fontFamily:"'Cabinet Grotesk',sans-serif",fontWeight:800,fontSize:15,marginBottom:14 }}>🔗 Task Dependencies</div>
            <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
              {tasks.filter(t=>!t.done).map(task => {
                const deps = (task.dependencies||[]).map(id=>tasks.find(t=>t.id===id)).filter(Boolean);
                const blocked = deps.some(d=>!d.done);
                return (
                  <div key={task.id} style={{ padding:"12px 14px",background:"#0D0D18",border:`1px solid ${blocked?"rgba(244,63,94,0.3)":"#1E1E2E"}`,borderRadius:10 }}>
                    <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:deps.length?8:0 }}>
                      <span style={{ fontSize:14 }}>{blocked?"🚫":"○"}</span>
                      <span style={{ fontSize:13,fontWeight:600,color:"var(--text)",flex:1 }}>{task.title}</span>
                      <button onClick={()=>setDepModal(task.id)} style={{ padding:"3px 9px",border:"1px solid #2A2A3A",borderRadius:6,background:"transparent",color:"var(--text2)",fontSize:11,cursor:"pointer",fontFamily:"inherit" }}>+ Dep</button>
                    </div>
                    {deps.map(dep=>(
                      <div key={dep.id} style={{ display:"flex",alignItems:"center",gap:6,marginLeft:22,marginBottom:4,fontSize:12 }}>
                        <span style={{ color:dep.done?"#10B981":"#F59E0B" }}>→ {dep.done?"✓":""} {dep.title}</span>
                        <button onClick={()=>removeDep(task.id,dep.id)} style={{ marginLeft:"auto",border:"none",background:"transparent",color:"#F43F5E",cursor:"pointer",fontSize:14,lineHeight:1 }}>×</button>
                      </div>
                    ))}
                    {blocked && <div style={{ fontSize:11,color:"#F43F5E",marginLeft:22,marginTop:4 }}>⚠️ Blocked — complete dependencies first</div>}
                  </div>
                );
              })}
              {tasks.filter(t=>!t.done).length===0 && <div style={{ textAlign:"center",color:"var(--text3)",fontSize:13,padding:16 }}>Koi pending task nahi</div>}
            </div>
          </Card>

          <Card>
            <div style={{ fontFamily:"'Cabinet Grotesk',sans-serif",fontWeight:800,fontSize:15,marginBottom:14 }}>📈 Dependency Stats</div>
            {[
              {label:"Total tasks",val:tasks.length,icon:"📋"},
              {label:"Blocked tasks",val:tasks.filter(t=>!t.done&&isBlocked(t)).length,icon:"🚫",color:"#F43F5E"},
              {label:"Tasks with deps",val:tasks.filter(t=>(t.dependencies||[]).length>0).length,icon:"🔗",color:"#8B5CF6"},
              {label:"Completed",val:tasks.filter(t=>t.done).length,icon:"✅",color:"#10B981"},
            ].map(s=>(
              <div key={s.label} style={{ display:"flex",alignItems:"center",gap:12,padding:"10px 0",borderBottom:"1px solid #1A1A2E" }}>
                <span style={{ fontSize:20 }}>{s.icon}</span>
                <span style={{ fontSize:13,color:"var(--text2)",flex:1 }}>{s.label}</span>
                <span style={{ fontFamily:"'Cabinet Grotesk',sans-serif",fontSize:22,fontWeight:800,color:s.color||"#F9FAFB" }}>{s.val}</span>
              </div>
            ))}
          </Card>
        </div>
      )}

      {/* Dependency modal */}
      {depModal && (
        <div onClick={e=>e.target===e.currentTarget&&setDepModal(null)} style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.8)",backdropFilter:"blur(8px)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:9999 }}>
          <div style={{ background:"#0D0D18",border:"1px solid #2A2A3A",borderRadius:16,padding:24,width:"100%",maxWidth:440 }}>
            <div style={{ fontFamily:"'Cabinet Grotesk',sans-serif",fontWeight:800,fontSize:16,marginBottom:14 }}>🔗 Add Dependency</div>
            <div style={{ fontSize:13,color:"var(--text2)",marginBottom:14 }}>"{tasks.find(t=>t.id===depModal)?.title}" must complete AFTER:</div>
            <div style={{ display:"flex",flexDirection:"column",gap:7,maxHeight:300,overflowY:"auto" }}>
              {tasks.filter(t=>t.id!==depModal&&!t.done&&!(tasks.find(x=>x.id===depModal)?.dependencies||[]).includes(t.id)).map(t=>(
                <div key={t.id} onClick={()=>addDep(depModal,t.id)} style={{ padding:"10px 14px",background:"var(--surface2)",border:"1px solid #1E1E2E",borderRadius:10,cursor:"pointer",transition:"all 0.15s" }}
                  onMouseEnter={e=>e.currentTarget.style.borderColor="#FF6B35"} onMouseLeave={e=>e.currentTarget.style.borderColor="#1E1E2E"}>
                  <div style={{ fontSize:13,fontWeight:500,color:"var(--text)" }}>{t.title}</div>
                  <div style={{ fontSize:11,color:PRI[t.priority],marginTop:2 }}>● {t.priority}</div>
                </div>
              ))}
            </div>
            <button onClick={()=>setDepModal(null)} style={{ marginTop:14,width:"100%",padding:10,border:"1px solid #2A2A3A",borderRadius:10,background:"transparent",color:"var(--text2)",cursor:"pointer",fontFamily:"inherit",fontWeight:600 }}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
