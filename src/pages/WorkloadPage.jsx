// 👥 Workload View — Who is overloaded? ClickUp-style
import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { updateTask } from "../firebase/services";

const PRI_COLOR = { high:"#F43F5E", medium:"#F59E0B", low:"#10B981", urgent:"#F97316" };
const todayStr = () => new Date().toISOString().slice(0,10);
const fmt = d => { try { return new Date(d+"T00:00").toLocaleDateString("en-IN",{month:"short",day:"numeric"}); } catch { return d||""; } };

function Avatar({ name, size=32 }) {
  const initials = (name||"?").split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();
  const colors = ["#FF6B35","#818CF8","#10B981","#F43F5E","#F59E0B","#06B6D4","#8B5CF6"];
  const color = colors[(name||"").charCodeAt(0)%colors.length];
  return <div style={{width:size,height:size,borderRadius:"50%",background:color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:size*0.36,fontWeight:800,color:"#fff",flexShrink:0}}>{initials}</div>;
}

function LoadBar({ pct, max=100 }) {
  const color = pct>80?"#F43F5E":pct>50?"#F59E0B":"#10B981";
  return (
    <div style={{position:"relative",height:8,background:"rgba(255,255,255,0.05)",borderRadius:8,overflow:"hidden",flex:1}}>
      <div style={{position:"absolute",left:0,top:0,bottom:0,width:`${Math.min(pct,100)}%`,background:color,borderRadius:8,transition:"width 1s ease",boxShadow:`0 0 8px ${color}44`}}/>
    </div>
  );
}

export default function WorkloadPage({ tasks=[], projects=[] }) {
  const { user } = useAuth();
  const [range, setRange] = useState("week");

  // Simulate team members from task assignees + current user
  const { user: authUser } = useAuth ? {user:null} : {};

  // Group tasks by assignee / category as "team member simulation"
  const CATEGORIES = ["work","study","personal","health","finance","creative","other"];
  const members = CATEGORIES.map(cat => {
    const catTasks = tasks.filter(t=>t.category===cat);
    const pending = catTasks.filter(t=>!t.done);
    const overdue = pending.filter(t=>t.due&&t.due<todayStr());
    const totalPoints = catTasks.reduce((s,t)=>s+(t.points||0),0);
    const totalTime = catTasks.reduce((s,t)=>s+(t.estimatedTime||0),0);
    const doneTime = catTasks.filter(t=>t.done).reduce((s,t)=>s+(t.estimatedTime||0),0);
    return { id:cat, name:cat.charAt(0).toUpperCase()+cat.slice(1), tasks:catTasks, pending, overdue, totalPoints, totalTime, doneTime };
  }).filter(m=>m.tasks.length>0);

  const maxTasks = Math.max(...members.map(m=>m.pending.length),1);

  // Timeline: next 14 days
  const days = Array.from({length:14},(_,i)=>{
    const d=new Date(); d.setDate(d.getDate()+i);
    return { date:d.toISOString().slice(0,10), label:d.toLocaleDateString("en-IN",{weekday:"short",day:"numeric"}) };
  });

  return (
    <div style={{maxWidth:1100,margin:"0 auto"}}>
      {/* Header */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:24}}>
        <div>
          <h1 style={{fontFamily:"'Cabinet Grotesk',sans-serif",fontSize:26,fontWeight:900,margin:0,letterSpacing:"-1px"}}>👥 Workload</h1>
          <p style={{color:"#6B7280",fontSize:13,margin:"4px 0 0"}}>Track capacity & prevent burnout across categories</p>
        </div>
        <div style={{display:"flex",gap:6}}>
          {[["week","This Week"],["month","This Month"]].map(([v,l])=>(
            <button key={v} onClick={()=>setRange(v)} style={{padding:"6px 14px",border:"1px solid",borderColor:range===v?"#FF6B35":"rgba(255,255,255,0.08)",borderRadius:20,background:range===v?"rgba(255,107,53,0.1)":"transparent",color:range===v?"#FF6B35":"#6B7280",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>{l}</button>
          ))}
        </div>
      </div>

      {/* Workload cards */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:20}}>
        {members.map(m=>{
          const loadPct = Math.round((m.pending.length/Math.max(maxTasks,1))*100);
          const status = loadPct>75?"🔴 Overloaded":loadPct>40?"🟡 Moderate":"🟢 Healthy";
          return (
            <div key={m.id} style={{background:"#0F0F1C",border:`1px solid ${loadPct>75?"rgba(244,63,94,0.2)":loadPct>40?"rgba(245,158,11,0.1)":"rgba(16,185,129,0.1)"}`,borderRadius:16,padding:"18px 20px",transition:"all 0.2s"}}
              onMouseEnter={e=>e.currentTarget.style.transform="translateY(-2px)"}
              onMouseLeave={e=>e.currentTarget.style.transform="none"}>
              <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14}}>
                <Avatar name={m.name} size={38}/>
                <div>
                  <div style={{fontFamily:"'Cabinet Grotesk',sans-serif",fontSize:15,fontWeight:800}}>{m.name}</div>
                  <div style={{fontSize:11,color:"#6B7280"}}>{status}</div>
                </div>
              </div>
              {/* Load bar */}
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
                <LoadBar pct={loadPct}/>
                <span style={{fontSize:12,fontWeight:800,color:loadPct>75?"#F43F5E":loadPct>40?"#F59E0B":"#10B981",minWidth:34}}>{loadPct}%</span>
              </div>
              {/* Stats */}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
                {[
                  {label:"Pending",val:m.pending.length,color:"#818CF8"},
                  {label:"Overdue",val:m.overdue.length,color:"#F43F5E"},
                  {label:"Est. hrs",val:m.totalTime?`${Math.round(m.totalTime/60)}h`:"—",color:"#F59E0B"},
                ].map(s=>(
                  <div key={s.label} style={{textAlign:"center",background:"rgba(255,255,255,0.02)",borderRadius:10,padding:"8px 4px"}}>
                    <div style={{fontFamily:"'Cabinet Grotesk',sans-serif",fontSize:20,fontWeight:900,color:s.color}}>{s.val}</div>
                    <div style={{fontSize:10,color:"#4B5563"}}>{s.label}</div>
                  </div>
                ))}
              </div>
              {/* Task list preview */}
              {m.pending.slice(0,3).map(t=>(
                <div key={t.id} style={{display:"flex",alignItems:"center",gap:8,marginTop:8,padding:"5px 0",borderTop:"1px solid rgba(255,255,255,0.03)"}}>
                  <div style={{width:6,height:6,borderRadius:"50%",background:PRI_COLOR[t.priority]||"#6B7280",flexShrink:0}}/>
                  <span style={{fontSize:11,color:"#9CA3AF",flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.title}</span>
                  {t.due&&<span style={{fontSize:10,color:t.due<todayStr()?"#F43F5E":"#4B5563",flexShrink:0}}>{fmt(t.due)}</span>}
                </div>
              ))}
              {m.pending.length>3&&<div style={{fontSize:11,color:"#4B5563",marginTop:6,textAlign:"center"}}>+{m.pending.length-3} more tasks</div>}
            </div>
          );
        })}
        {members.length===0&&(
          <div style={{gridColumn:"1/-1",textAlign:"center",padding:"60px 20px",color:"#4B5563"}}>
            <div style={{fontSize:40,marginBottom:8}}>👥</div>
            <div style={{fontSize:14}}>Add tasks with categories to see workload</div>
          </div>
        )}
      </div>

      {/* Timeline heatmap */}
      <div style={{background:"#0F0F1C",border:"1px solid rgba(255,255,255,0.06)",borderRadius:16,padding:"20px 22px"}}>
        <div style={{fontSize:13,fontWeight:800,color:"#F3F4F6",marginBottom:16}}>📅 Task Timeline — Next 14 Days</div>
        <div style={{overflowX:"auto"}}>
          <div style={{display:"grid",gridTemplateColumns:`120px repeat(14,1fr)`,gap:4,minWidth:700}}>
            {/* Header row */}
            <div/>
            {days.map(d=>(
              <div key={d.date} style={{textAlign:"center",fontSize:10,fontWeight:d.date===todayStr()?800:500,color:d.date===todayStr()?"#FF6B35":"#4B5563",padding:"4px 2px"}}>
                {d.label}
              </div>
            ))}
            {/* Member rows */}
            {members.map(m=>(
              <>
                <div key={m.id+"-label"} style={{display:"flex",alignItems:"center",gap:8,paddingRight:8}}>
                  <Avatar name={m.name} size={22}/>
                  <span style={{fontSize:12,color:"#9CA3AF",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{m.name}</span>
                </div>
                {days.map(d=>{
                  const dayTasks = m.tasks.filter(t=>t.due===d.date&&!t.done);
                  const intensity = Math.min(dayTasks.length,5);
                  const bg = intensity===0?"rgba(255,255,255,0.02)":
                             intensity===1?"rgba(16,185,129,0.15)":
                             intensity===2?"rgba(245,158,11,0.2)":
                             intensity===3?"rgba(249,115,22,0.25)":"rgba(244,63,94,0.3)";
                  return (
                    <div key={d.date} title={`${dayTasks.length} tasks`} style={{height:28,borderRadius:5,background:bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,color:intensity>0?"#fff":"transparent",cursor:dayTasks.length?"pointer":"default",border:d.date===todayStr()?"1px solid rgba(255,107,53,0.3)":"1px solid transparent"}}>
                      {intensity>0?intensity:""}
                    </div>
                  );
                })}
              </>
            ))}
          </div>
        </div>
        <div style={{display:"flex",gap:12,marginTop:12,alignItems:"center",justifyContent:"flex-end"}}>
          <span style={{fontSize:11,color:"#4B5563"}}>Intensity:</span>
          {[["rgba(16,185,129,0.3)","1"],["rgba(245,158,11,0.3)","2-3"],["rgba(244,63,94,0.3)","4+"]].map(([bg,label])=>(
            <div key={label} style={{display:"flex",alignItems:"center",gap:5}}>
              <div style={{width:12,height:12,borderRadius:3,background:bg}}/>
              <span style={{fontSize:10,color:"#4B5563"}}>{label} tasks</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
