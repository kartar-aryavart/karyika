// 📊 Advanced Analytics — ClickUp/Notion style
import { useState, useMemo } from "react";
import { useAuth } from "../hooks/useAuth";

function MiniBar({ pct, color="#FF6B35", height=6 }) {
  return (
    <div style={{height,background:"rgba(255,255,255,0.05)",borderRadius:height,overflow:"hidden"}}>
      <div style={{height:"100%",width:`${Math.min(pct,100)}%`,background:color,borderRadius:height,transition:"width 1.2s ease",boxShadow:`0 0 8px ${color}44`}} />
    </div>
  );
}

function StatCard({ icon, label, value, sub, color="#FF6B35", trend }) {
  return (
    <div style={{background:"#0F0F1C",border:"1px solid rgba(255,255,255,0.06)",borderRadius:16,padding:"18px 20px",transition:"all 0.2s"}}
      onMouseEnter={e=>e.currentTarget.style.borderColor=`${color}44`}
      onMouseLeave={e=>e.currentTarget.style.borderColor="rgba(255,255,255,0.06)"}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
        <div>
          <div style={{fontSize:11,color:"#4B5563",fontWeight:700,textTransform:"uppercase",letterSpacing:"1px",marginBottom:10}}>{icon} {label}</div>
          <div style={{fontFamily:"'Cabinet Grotesk',sans-serif",fontSize:36,fontWeight:900,color:"#F9FAFB",letterSpacing:"-1.5px",lineHeight:1}}>{value}</div>
          {sub&&<div style={{fontSize:12,color:"#6B7280",marginTop:6}}>{sub}</div>}
        </div>
        {trend!==undefined&&<div style={{fontSize:12,fontWeight:800,color:trend>=0?"#10B981":"#F43F5E",background:trend>=0?"rgba(16,185,129,0.1)":"rgba(244,63,94,0.1)",padding:"3px 8px",borderRadius:20}}>{trend>=0?"↑":"↓"} {Math.abs(trend)}%</div>}
      </div>
    </div>
  );
}

export default function AnalyticsPage({ tasks=[], habits=[], projects=[], goals=[] }) {
  const [range, setRange] = useState("30"); // 7, 30, 90

  const days = parseInt(range);
  const now = new Date();

  const dateRange = Array.from({length:days},(_,i)=>{
    const d=new Date(now); d.setDate(d.getDate()-days+1+i);
    return d.toISOString().slice(0,10);
  });

  const done = tasks.filter(t=>t.done);
  const pending = tasks.filter(t=>!t.done);
  const overdue = pending.filter(t=>t.due&&t.due<now.toISOString().slice(0,10));
  const completionRate = tasks.length?Math.round(done.length/tasks.length*100):0;

  const tasksByDay = dateRange.map(d=>({
    date:d,
    created: tasks.filter(t=>t.createdAt?.toDate?.()?.toISOString?.()?.slice(0,10)===d).length,
    completed: done.filter(t=>t.due===d).length,
  }));

  const byPriority = ["high","medium","low"].map(p=>({
    label:p, total:tasks.filter(t=>t.priority===p).length,
    done:done.filter(t=>t.priority===p).length,
    color:p==="high"?"#F43F5E":p==="medium"?"#F59E0B":"#10B981",
  }));

  const byProject = projects.map(p=>({
    name:p.name, emoji:p.emoji||"📁",
    total:tasks.filter(t=>t.projectId===p.id).length,
    done:done.filter(t=>t.projectId===p.id).length,
    color:p.color||"#FF6B35",
  })).filter(p=>p.total>0).sort((a,b)=>b.total-a.total);

  const totalTime = tasks.reduce((s,t)=>s+(t.timeSpent||0),0);
  const avgTime = done.length?Math.round(totalTime/done.length):0;
  const byTag = [...new Set(tasks.flatMap(t=>t.tags||[]))].map(tag=>({
    tag, count:tasks.filter(t=>t.tags?.includes(tag)).length
  })).sort((a,b)=>b.count-a.count).slice(0,8);

  const todayStr = now.toISOString().slice(0,10);
  const habitsToday = habits.filter(h=>h.logs?.[todayStr]);
  const bestStreak = habits.length?Math.max(...habits.map(h=>h.streak||0)):0;
  const goalsPct = goals.length?Math.round(goals.reduce((s,g)=>s+Math.min((g.current/Math.max(g.target,1))*100,100),0)/goals.length):0;

  const maxBar = Math.max(...tasksByDay.map(d=>Math.max(d.created,d.completed)),1);

  return (
    <div style={{maxWidth:1100,margin:"0 auto"}}>
      {/* Header */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:24}}>
        <div>
          <h1 style={{fontFamily:"'Cabinet Grotesk',sans-serif",fontSize:26,fontWeight:900,margin:0,letterSpacing:"-1px"}}>📊 Analytics</h1>
          <p style={{color:"#6B7280",fontSize:13,margin:"4px 0 0"}}>Your productivity insights at a glance</p>
        </div>
        <div style={{display:"flex",gap:6}}>
          {[["7","7D"],["30","30D"],["90","90D"]].map(([v,l])=>(
            <button key={v} onClick={()=>setRange(v)} style={{padding:"6px 14px",border:"1px solid",borderColor:range===v?"#FF6B35":"rgba(255,255,255,0.08)",borderRadius:20,background:range===v?"rgba(255,107,53,0.1)":"transparent",color:range===v?"#FF6B35":"#6B7280",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>{l}</button>
          ))}
        </div>
      </div>

      {/* KPI row */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:16}}>
        <StatCard icon="✅" label="Completion Rate" value={`${completionRate}%`} sub={`${done.length}/${tasks.length} tasks`} color="#10B981" trend={completionRate>50?8:-3} />
        <StatCard icon="⚡" label="Tasks Pending" value={pending.length} sub={overdue.length>0?`${overdue.length} overdue`:"All on track"} color="#F59E0B" />
        <StatCard icon="⏱" label="Time Logged" value={totalTime>=60?`${Math.floor(totalTime/60)}h`:`${totalTime}m`} sub={`~${avgTime}m avg/task`} color="#818CF8" />
        <StatCard icon="🎯" label="Goals Progress" value={`${goalsPct}%`} sub={`${goals.length} active goals`} color="#FF6B35" trend={goalsPct>60?5:-2} />
      </div>

      {/* Chart row */}
      <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:12,marginBottom:16}}>
        {/* Activity chart */}
        <div style={{background:"#0F0F1C",border:"1px solid rgba(255,255,255,0.06)",borderRadius:16,padding:"20px 22px"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
            <div style={{fontSize:13,fontWeight:800,color:"#F3F4F6"}}>Task Activity — last {days} days</div>
            <div style={{display:"flex",gap:12}}>
              <div style={{display:"flex",alignItems:"center",gap:5}}><div style={{width:10,height:10,borderRadius:2,background:"#FF6B35"}}/><span style={{fontSize:11,color:"#6B7280"}}>Completed</span></div>
              <div style={{display:"flex",alignItems:"center",gap:5}}><div style={{width:10,height:10,borderRadius:2,background:"#818CF8"}}/><span style={{fontSize:11,color:"#6B7280"}}>Created</span></div>
            </div>
          </div>
          <div style={{display:"flex",alignItems:"flex-end",gap:2,height:100}}>
            {tasksByDay.map((d,i)=>(
              <div key={d.date} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:2,position:"relative"}} title={`${d.date}: ${d.completed} done, ${d.created} created`}>
                <div style={{width:"100%",display:"flex",gap:1,alignItems:"flex-end",height:90}}>
                  <div style={{flex:1,background:"#818CF8",borderRadius:"2px 2px 0 0",height:`${(d.created/maxBar)*90}px`,minHeight:d.created?3:0,transition:"height 0.8s ease"}} />
                  <div style={{flex:1,background:"#FF6B35",borderRadius:"2px 2px 0 0",height:`${(d.completed/maxBar)*90}px`,minHeight:d.completed?3:0,transition:"height 0.8s ease",boxShadow:d.completed?"0 0 6px rgba(255,107,53,0.4)":""}} />
                </div>
                {(days<=30&&i%(days<=7?1:5)===0)&&<div style={{fontSize:8,color:"#2A2A3A",marginTop:2,whiteSpace:"nowrap"}}>{d.date.slice(5)}</div>}
              </div>
            ))}
          </div>
        </div>

        {/* Priority breakdown */}
        <div style={{background:"#0F0F1C",border:"1px solid rgba(255,255,255,0.06)",borderRadius:16,padding:"20px 22px"}}>
          <div style={{fontSize:13,fontWeight:800,color:"#F3F4F6",marginBottom:20}}>Priority Breakdown</div>
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            {byPriority.map(p=>(
              <div key={p.label}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                  <span style={{fontSize:12,color:"#9CA3AF",textTransform:"capitalize",fontWeight:600}}>{p.label}</span>
                  <span style={{fontSize:12,fontWeight:800,color:p.color}}>{p.done}/{p.total}</span>
                </div>
                <MiniBar pct={p.total?Math.round(p.done/p.total*100):0} color={p.color} height={8} />
              </div>
            ))}
          </div>
          {/* Donut-style visual */}
          <div style={{marginTop:20,display:"flex",justifyContent:"center"}}>
            <svg width={100} height={100} viewBox="-50 -50 100 100" style={{transform:"rotate(-90deg)"}}>
              {byPriority.reduce((acc,p,i)=>{
                const total=tasks.length||1;
                const pct=(p.total/total)*100;
                const prev=acc.prev;
                const r=38,c=2*Math.PI*r;
                const offset=c*(1-pct/100);
                const dash=c*(pct/100);
                const start=prev*(c/100);
                acc.els.push(<circle key={p.label} cx="0" cy="0" r={r} fill="none" stroke={p.color} strokeWidth={14} strokeLinecap="round"
                  strokeDasharray={`${dash} ${c-dash}`} strokeDashoffset={-start+c} opacity={0.8} />);
                acc.prev+=pct;
                return acc;
              },{els:[],prev:0}).els}
              <circle cx="0" cy="0" r="26" fill="#0F0F1C" />
            </svg>
          </div>
        </div>
      </div>

      {/* Second row */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}>
        {/* By Project */}
        <div style={{background:"#0F0F1C",border:"1px solid rgba(255,255,255,0.06)",borderRadius:16,padding:"20px 22px"}}>
          <div style={{fontSize:13,fontWeight:800,color:"#F3F4F6",marginBottom:16}}>By Project</div>
          {byProject.length===0&&<div style={{textAlign:"center",color:"#2A2A3A",padding:"20px 0",fontSize:13}}>No projects yet</div>}
          {byProject.slice(0,6).map(p=>(
            <div key={p.name} style={{marginBottom:12}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:5}}>
                <span style={{fontSize:14}}>{p.emoji}</span>
                <span style={{fontSize:12,color:"#D1D5DB",flex:1,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.name}</span>
                <span style={{fontSize:12,fontWeight:700,color:p.color}}>{p.done}/{p.total}</span>
              </div>
              <MiniBar pct={p.total?Math.round(p.done/p.total*100):0} color={p.color} />
            </div>
          ))}
        </div>

        {/* Habits analytics */}
        <div style={{background:"#0F0F1C",border:"1px solid rgba(255,255,255,0.06)",borderRadius:16,padding:"20px 22px"}}>
          <div style={{fontSize:13,fontWeight:800,color:"#F3F4F6",marginBottom:16}}>Habit Health</div>
          <div style={{display:"flex",gap:10,marginBottom:16}}>
            <div style={{flex:1,textAlign:"center",background:"rgba(16,185,129,0.08)",border:"1px solid rgba(16,185,129,0.15)",borderRadius:12,padding:"12px 8px"}}>
              <div style={{fontFamily:"'Cabinet Grotesk',sans-serif",fontSize:28,fontWeight:900,color:"#10B981"}}>{habitsToday.length}</div>
              <div style={{fontSize:11,color:"#6B7280"}}>today</div>
            </div>
            <div style={{flex:1,textAlign:"center",background:"rgba(245,158,11,0.08)",border:"1px solid rgba(245,158,11,0.15)",borderRadius:12,padding:"12px 8px"}}>
              <div style={{fontFamily:"'Cabinet Grotesk',sans-serif",fontSize:28,fontWeight:900,color:"#F59E0B"}}>{bestStreak}</div>
              <div style={{fontSize:11,color:"#6B7280"}}>best streak 🔥</div>
            </div>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {habits.slice(0,5).map(h=>{
              const logs=Object.values(h.logs||{}).filter(Boolean).length;
              const pct=Math.round(logs/Math.max(days,1)*100);
              return (
                <div key={h.id} style={{display:"flex",alignItems:"center",gap:8}}>
                  <span style={{fontSize:16}}>{h.emoji||"✨"}</span>
                  <div style={{flex:1}}>
                    <div style={{fontSize:11,color:"#9CA3AF",marginBottom:3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{h.name}</div>
                    <MiniBar pct={pct} color={h.color||"#10B981"} height={5} />
                  </div>
                  <span style={{fontSize:11,fontWeight:700,color:h.color||"#10B981"}}>{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Tags cloud */}
        <div style={{background:"#0F0F1C",border:"1px solid rgba(255,255,255,0.06)",borderRadius:16,padding:"20px 22px"}}>
          <div style={{fontSize:13,fontWeight:800,color:"#F3F4F6",marginBottom:16}}>Tag Usage</div>
          {byTag.length===0&&<div style={{textAlign:"center",color:"#2A2A3A",padding:"20px 0",fontSize:13}}>No tags yet</div>}
          <div style={{display:"flex",flexWrap:"wrap",gap:7}}>
            {byTag.map((t,i)=>{
              const colors=["#FF6B35","#818CF8","#10B981","#F43F5E","#F59E0B","#06B6D4","#8B5CF6","#EC4899"];
              const c=colors[i%colors.length];
              const max=byTag[0]?.count||1;
              const size=10+Math.round((t.count/max)*6);
              return <span key={t.tag} style={{fontSize:size,padding:"4px 10px",background:`${c}15`,color:c,borderRadius:20,fontWeight:700,border:`1px solid ${c}33`}}>#{t.tag} <span style={{opacity:0.6,fontSize:10}}>{t.count}</span></span>;
            })}
          </div>
          {/* Goals summary */}
          {goals.length>0&&(
            <div style={{marginTop:20,borderTop:"1px solid rgba(255,255,255,0.05)",paddingTop:16}}>
              <div style={{fontSize:11,fontWeight:800,color:"#4B5563",marginBottom:10,textTransform:"uppercase",letterSpacing:"1px"}}>Goal Progress</div>
              {goals.slice(0,3).map(g=>{
                const pct=Math.min(Math.round((g.current/Math.max(g.target,1))*100),100);
                return <div key={g.id} style={{marginBottom:8}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                    <span style={{fontSize:11,color:"#9CA3AF",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",flex:1,marginRight:8}}>{g.title}</span>
                    <span style={{fontSize:11,fontWeight:800,color:g.color||"#FF6B35",flexShrink:0}}>{pct}%</span>
                  </div>
                  <MiniBar pct={pct} color={g.color||"#FF6B35"} />
                </div>;
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
