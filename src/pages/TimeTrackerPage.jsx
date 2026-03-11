// ⏱ Time Tracker — Per-task tracking with detailed analytics
import { useState, useEffect, useRef } from "react";
import { useAuth } from "../hooks/useAuth";
import { updateTask } from "../firebase/services";

export default function TimeTrackerPage({ tasks=[] }) {
  const { user } = useAuth();
  const [activeId, setActiveId] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [note, setNote] = useState("");
  const [toast, setToast] = useState("");
  const interval = useRef(null);
  const pending = tasks.filter(t=>!t.done);
  const active = tasks.find(t=>t.id===activeId);

  useEffect(() => {
    if (activeId && startTime) { interval.current = setInterval(()=>setElapsed(Date.now()-startTime),1000); }
    else clearInterval(interval.current);
    return ()=>clearInterval(interval.current);
  }, [activeId,startTime]);

  const fmt = ms => { const s=Math.floor(ms/1000),m=Math.floor(s/60),h=Math.floor(m/60); return h>0?`${h}:${String(m%60).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`:`${m}:${String(s%60).padStart(2,"0")}`; };
  const fmtMin = min => { if(!min) return "—"; return min<60?`${min}m`:`${Math.floor(min/60)}h ${min%60}m`; };

  const start = (id) => { if(activeId) stop(); setActiveId(id); setStartTime(Date.now()); setElapsed(0); };
  const stop = async () => {
    if (!activeId||!startTime) return;
    const mins = Math.round((Date.now()-startTime)/60000);
    if (mins > 0) {
      const task = tasks.find(t=>t.id===activeId);
      const logs = [...(task?.timeLogs||[]), {minutes:mins,note:note.trim(),at:new Date().toISOString(),id:Math.random().toString(36).slice(2)}];
      await updateTask(user.uid, activeId, { timeLogs:logs, timeSpent:(task?.timeSpent||0)+mins });
      setToast(`✅ ${mins}m logged for "${task?.title?.slice(0,30)}"`);
      setTimeout(()=>setToast(""),3000);
    }
    setActiveId(null); setStartTime(null); setElapsed(0); setNote("");
  };

  const totalTime = tasks.reduce((s,t)=>s+(t.timeSpent||0),0);
  const byPri = { high: tasks.filter(t=>t.priority==="high").reduce((s,t)=>s+(t.timeSpent||0),0), medium: tasks.filter(t=>t.priority==="medium").reduce((s,t)=>s+(t.timeSpent||0),0), low: tasks.filter(t=>t.priority==="low").reduce((s,t)=>s+(t.timeSpent||0),0) };
  const topTasks = [...tasks].filter(t=>t.timeSpent>0).sort((a,b)=>(b.timeSpent||0)-(a.timeSpent||0)).slice(0,6);

  const Card = ({children,style={}}) => <div style={{ background:"var(--surface2)",border:"1px solid #1E1E2E",borderRadius:14,padding:18,...style }}>{children}</div>;

  return (
    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, alignItems:"start" }}>
      {toast && <div style={{ position:"fixed",bottom:24,right:24,background:"#10B981",color:"#fff",padding:"12px 20px",borderRadius:12,fontWeight:700,fontSize:14,zIndex:9999,boxShadow:"0 8px 20px rgba(16,185,129,0.4)" }}>{toast}</div>}

      {/* Left */}
      <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
        {/* Active timer */}
        {activeId && (
          <div style={{ background:"linear-gradient(135deg,rgba(255,107,53,0.12),rgba(255,107,53,0.05))",border:"1px solid rgba(255,107,53,0.35)",borderRadius:14,padding:20 }}>
            <div style={{ fontSize:10,color:"#FF6B35",fontWeight:800,textTransform:"uppercase",letterSpacing:"1.5px",marginBottom:8 }}>⏺ Recording</div>
            <div style={{ fontWeight:700,fontSize:14,color:"var(--text)",marginBottom:10 }}>{active?.title}</div>
            <div style={{ fontFamily:"'Cabinet Grotesk',sans-serif",fontSize:52,fontWeight:800,color:"#FF6B35",letterSpacing:"-3px",lineHeight:1,marginBottom:14 }}>{fmt(elapsed)}</div>
            <input value={note} onChange={e=>setNote(e.target.value)} placeholder="Session note (optional)..."
              style={{ width:"100%",background:"rgba(0,0,0,0.2)",border:"1px solid rgba(255,107,53,0.2)",borderRadius:8,color:"var(--text)",fontSize:12,padding:"7px 12px",fontFamily:"inherit",outline:"none",marginBottom:12,boxSizing:"border-box" }} />
            <button onClick={stop} style={{ padding:"9px 20px",border:"none",borderRadius:10,background:"#F43F5E",color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit" }}>⏹ Stop & Save</button>
          </div>
        )}

        {/* Task list */}
        <Card>
          <div style={{ fontFamily:"'Cabinet Grotesk',sans-serif",fontWeight:800,fontSize:15,marginBottom:14 }}>⏱ Track Time</div>
          <div style={{ display:"flex",flexDirection:"column",gap:6 }}>
            {pending.length===0&&<div style={{ textAlign:"center",padding:20,color:"var(--text3)",fontSize:13 }}>Koi pending task nahi!</div>}
            {pending.map(task => {
              const isAct = task.id===activeId;
              const PRI = {high:"#F43F5E",medium:"#F59E0B",low:"#10B981"};
              return (
                <div key={task.id} style={{ display:"flex",alignItems:"center",gap:10,padding:"10px 12px",background:isAct?"rgba(255,107,53,0.08)":"#0D0D18",border:`1px solid ${isAct?"rgba(255,107,53,0.3)":"#1E1E2E"}`,borderRadius:10,borderLeft:`3px solid ${PRI[task.priority]||"#FF6B35"}`,transition:"all 0.2s" }}>
                  <div style={{ flex:1,minWidth:0 }}>
                    <div style={{ fontWeight:500,fontSize:13,color:"var(--text)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{task.title}</div>
                    <div style={{ fontSize:11,color:"var(--text3)",marginTop:2 }}>
                      {task.timeSpent?`⏱ ${fmtMin(task.timeSpent)} logged`:"No time logged"}
                      {task.estimatedTime?` · Est: ${fmtMin(task.estimatedTime)}`:""}
                    </div>
                  </div>
                  <button onClick={()=>isAct?stop():start(task.id)}
                    style={{ padding:"5px 12px",border:"none",borderRadius:8,background:isAct?"#F43F5E":"#FF6B35",color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer",flexShrink:0,fontFamily:"inherit" }}>
                    {isAct?"⏹":"▶"}
                  </button>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Right — Analytics */}
      <div style={{ display:"flex",flexDirection:"column",gap:14 }}>
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10 }}>
          {[
            {icon:"⏱",val:fmtMin(totalTime),label:"Total Logged",c:"#FF6B35"},
            {icon:"✅",val:fmtMin(tasks.filter(t=>t.done).reduce((s,t)=>s+(t.timeSpent||0),0)),label:"Completed",c:"#10B981"},
            {icon:"📋",val:tasks.filter(t=>t.timeSpent>0).length,label:"Tasks Tracked",c:"#8B5CF6"},
            {icon:"🔥",val:fmtMin(Math.round(totalTime/Math.max(tasks.filter(t=>t.timeSpent>0).length,1))),label:"Avg / Task",c:"#F59E0B"},
          ].map(s=>(
            <Card key={s.label} style={{ textAlign:"center",padding:14 }}>
              <div style={{ fontSize:24 }}>{s.icon}</div>
              <div style={{ fontFamily:"'Cabinet Grotesk',sans-serif",fontSize:22,fontWeight:800,color:s.c,marginTop:4 }}>{s.val}</div>
              <div style={{ fontSize:11,color:"var(--text3)",marginTop:2 }}>{s.label}</div>
            </Card>
          ))}
        </div>

        {/* Priority breakdown */}
        <Card>
          <div style={{ fontFamily:"'Cabinet Grotesk',sans-serif",fontWeight:800,fontSize:14,marginBottom:14 }}>📊 Time by Priority</div>
          {[["high","🔴 High","#F43F5E"],["medium","🟡 Medium","#F59E0B"],["low","🟢 Low","#10B981"]].map(([k,label,c])=>(
            <div key={k} style={{ marginBottom:12 }}>
              <div style={{ display:"flex",justifyContent:"space-between",marginBottom:5 }}>
                <span style={{ fontSize:13,fontWeight:500,color:"var(--text)" }}>{label}</span>
                <span style={{ fontSize:12,fontWeight:700,color:c }}>{fmtMin(byPri[k])}</span>
              </div>
              <div style={{ height:6,background:"#1A1A26",borderRadius:3,overflow:"hidden" }}>
                <div style={{ height:"100%",background:c,borderRadius:3,width:`${totalTime>0?Math.round(byPri[k]/totalTime*100):0}%`,transition:"width 0.6s" }} />
              </div>
            </div>
          ))}
        </Card>

        {/* Top tasks */}
        <Card>
          <div style={{ fontFamily:"'Cabinet Grotesk',sans-serif",fontWeight:800,fontSize:14,marginBottom:14 }}>🏆 Most Time Spent</div>
          {topTasks.length===0?<div style={{ textAlign:"center",color:"var(--text3)",fontSize:13,padding:12 }}>Abhi tak koi log nahi hua</div>:
            topTasks.map((t,i)=>(
              <div key={t.id} style={{ display:"flex",alignItems:"center",gap:9,marginBottom:10 }}>
                <div style={{ width:22,height:22,borderRadius:"50%",background:"#1A1A26",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:800,color:"var(--text3)",flexShrink:0 }}>{i+1}</div>
                <div style={{ flex:1,minWidth:0 }}>
                  <div style={{ fontSize:12,fontWeight:500,color:"var(--text)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{t.title}</div>
                  <div style={{ height:3,background:"#1A1A26",borderRadius:2,marginTop:4,overflow:"hidden" }}>
                    <div style={{ height:"100%",background:"#FF6B35",borderRadius:2,width:`${Math.round((t.timeSpent||0)/Math.max(...topTasks.map(x=>x.timeSpent||0),1)*100)}%` }} />
                  </div>
                </div>
                <span style={{ fontSize:12,fontWeight:700,color:"#FF6B35",flexShrink:0 }}>{fmtMin(t.timeSpent)}</span>
              </div>
            ))
          }
        </Card>
      </div>
    </div>
  );
}
