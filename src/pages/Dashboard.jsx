// 🏠 Dashboard v4 — Enterprise Gradient Theme (ClickUp/Linear/Vercel inspired)
import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";

// ─── ANIMATED COUNTER ─────────────────────────────────────────────────────────
function Counter({ to, suffix="" }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!to) return;
    let start = 0; const step = Math.ceil(to/20);
    const t = setInterval(()=>{ start=Math.min(start+step,to); setVal(start); if(start>=to)clearInterval(t); }, 40);
    return ()=>clearInterval(t);
  }, [to]);
  return <>{val}{suffix}</>;
}

// ─── BENTO CARD ───────────────────────────────────────────────────────────────
function BentoCard({ children, style={}, gradient, glow, span }) {
  return (
    <div style={{
      background: gradient || "#0F0F1C",
      border: "1px solid rgba(255,255,255,0.06)",
      borderRadius: 18,
      padding: 22,
      position: "relative",
      overflow: "hidden",
      gridColumn: span ? `span ${span}` : undefined,
      boxShadow: glow ? `0 0 30px ${glow}` : "0 4px 20px rgba(0,0,0,0.4)",
      transition: "transform 0.2s, box-shadow 0.2s",
      ...style,
    }}
    onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow=glow?`0 8px 40px ${glow}`:"0 12px 32px rgba(0,0,0,0.5)";}}
    onMouseLeave={e=>{e.currentTarget.style.transform="none";e.currentTarget.style.boxShadow=glow?`0 0 30px ${glow}`:"0 4px 20px rgba(0,0,0,0.4)";}}>
      {/* Subtle noise texture overlay */}
      <div style={{ position:"absolute",inset:0,backgroundImage:"url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E\")",borderRadius:18,pointerEvents:"none" }} />
      {children}
    </div>
  );
}

// ─── MINI SPARKLINE ───────────────────────────────────────────────────────────
function Sparkline({ data, color="#FF6B35", height=36 }) {
  if (!data?.length) return null;
  const max = Math.max(...data,1);
  const w=120, h=height;
  const pts = data.map((v,i)=>`${(i/(data.length-1))*w},${h-(v/max)*h}`).join(" ");
  return (
    <svg width={w} height={h} style={{ overflow:"visible" }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <polyline points={`0,${h} ${pts} ${w},${h}`} fill={`${color}18`} stroke="none" />
    </svg>
  );
}

// ─── PROGRESS RING ────────────────────────────────────────────────────────────
function Ring({ pct, color, size=70, stroke=6 }) {
  const r = (size-stroke)/2, c = 2*Math.PI*r;
  return (
    <svg width={size} height={size} style={{ transform:"rotate(-90deg)" }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={stroke} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={c*(1-pct/100)} style={{ transition:"stroke-dashoffset 1.2s ease" }} />
    </svg>
  );
}

// ─── MAIN DASHBOARD ───────────────────────────────────────────────────────────
export default function Dashboard({ tasks=[], habits=[], projects=[], goals=[] }) {
  const { user } = useAuth();

  // Computed stats
  const pending   = tasks.filter(t=>!t.done);
  const done      = tasks.filter(t=>t.done);
  const overdue   = pending.filter(t=>t.due && t.due < new Date().toISOString().slice(0,10));
  const dueToday  = pending.filter(t=>t.due===new Date().toISOString().slice(0,10));
  const highPri   = pending.filter(t=>t.priority==="high");
  const totalTime = tasks.reduce((s,t)=>s+(t.timeSpent||0),0);
  const completionPct = tasks.length ? Math.round(done.length/tasks.length*100) : 0;

  // Weekly task completion sparkline (last 7 days)
  const weekData = Array.from({length:7},(_,i)=>{
    const d = new Date(); d.setDate(d.getDate()-6+i);
    const ds = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
    return done.filter(t=>t.completedAt?.toDate?.()?.toISOString?.()?.slice(0,10)===ds || t.due===ds).length;
  });

  // Habit streak stats
  const todayKey = new Date().toISOString().slice(0,10);
  const habitsToday = habits.filter(h=>h.logs?.[todayKey]);
  const habitPct = habits.length ? Math.round(habitsToday.length/habits.length*100) : 0;

  // Project health
  const activeProjs = projects.filter(p=>p.status==="active");

  const hr = new Date().getHours();
  const greeting = hr<12?"Good morning":"hr<17"?"Good afternoon":"Good evening";
  const greetEmoji = hr<12?"🌅":hr<17?"☀️":"🌙";
  const name = user?.displayName?.split(" ")[0] || "there";

  return (
    <div style={{ maxWidth:1200, margin:"0 auto" }}>

      {/* ── HERO GREETING ── */}
      <div style={{
        background:"linear-gradient(135deg,#0F0F1C 0%,#13102A 40%,#0F1A20 100%)",
        border:"1px solid rgba(255,255,255,0.06)",
        borderRadius:20, padding:"28px 32px", marginBottom:18,
        position:"relative", overflow:"hidden",
      }}>
        {/* Gradient orbs */}
        <div style={{ position:"absolute",top:-60,right:-60,width:200,height:200,borderRadius:"50%",background:"radial-gradient(circle,rgba(255,107,53,0.15),transparent 70%)",pointerEvents:"none" }} />
        <div style={{ position:"absolute",bottom:-40,left:100,width:160,height:160,borderRadius:"50%",background:"radial-gradient(circle,rgba(139,92,246,0.12),transparent 70%)",pointerEvents:"none" }} />
        <div style={{ position:"absolute",top:20,left:"40%",width:120,height:120,borderRadius:"50%",background:"radial-gradient(circle,rgba(16,185,129,0.08),transparent 70%)",pointerEvents:"none" }} />

        <div style={{ position:"relative", zIndex:1 }}>
          <div style={{ fontSize:13, color:"rgba(255,255,255,0.4)", fontWeight:600, marginBottom:6 }}>
            {greetEmoji} {new Date().toLocaleDateString("en-IN",{weekday:"long",month:"long",day:"numeric",year:"numeric"})}
          </div>
          <h1 style={{ fontFamily:"'Cabinet Grotesk',sans-serif", fontSize:32, fontWeight:900, margin:"0 0 8px",
            background:"linear-gradient(135deg,#FFFFFF 30%,rgba(255,107,53,0.9) 70%,rgba(139,92,246,0.8))",
            WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", letterSpacing:"-1.5px", lineHeight:1.1 }}>
            {hr<12?"Good morning":"Good evening"}, {name}! 👋
          </h1>
          <p style={{ fontSize:14, color:"rgba(255,255,255,0.4)", margin:0 }}>
            {pending.length>0 ? <>You have <span style={{ color:"#FF6B35",fontWeight:700 }}>{pending.length} tasks</span> pending{dueToday.length>0?<> · <span style={{ color:"#F59E0B",fontWeight:700 }}>{dueToday.length} due today</span></>:""}{overdue.length>0?<> · <span style={{ color:"#F43F5E",fontWeight:700 }}>{overdue.length} overdue</span></>:""}</> : "🎉 All caught up! Great work."}
          </p>
        </div>

        {/* Completion ring */}
        <div style={{ position:"absolute", right:32, top:"50%", transform:"translateY(-50%)", display:"flex", alignItems:"center", gap:14 }}>
          <div style={{ position:"relative", display:"inline-flex" }}>
            <Ring pct={completionPct} color="#FF6B35" size={78} stroke={7} />
            <div style={{ position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center" }}>
              <span style={{ fontFamily:"'Cabinet Grotesk',sans-serif",fontSize:18,fontWeight:900,color:"#F9FAFB" }}>{completionPct}%</span>
            </div>
          </div>
          <div>
            <div style={{ fontSize:12,fontWeight:800,color:"#F9FAFB" }}>Task Done</div>
            <div style={{ fontSize:11,color:"rgba(255,255,255,0.4)" }}>{done.length}/{tasks.length} total</div>
          </div>
        </div>
      </div>

      {/* ── BENTO GRID ── */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom:14 }}>

        {/* Tasks overview */}
        <BentoCard gradient="linear-gradient(135deg,#1A0A0E,#2A1015)" glow="rgba(244,63,94,0.12)">
          <div style={{ fontSize:11,fontWeight:800,color:"#F43F5E",textTransform:"uppercase",letterSpacing:"1.5px",marginBottom:14 }}>📋 TASKS</div>
          <div style={{ fontFamily:"'Cabinet Grotesk',sans-serif",fontSize:42,fontWeight:900,color:"#F9FAFB",letterSpacing:"-2px",lineHeight:1 }}><Counter to={pending.length} /></div>
          <div style={{ fontSize:12,color:"rgba(255,255,255,0.35)",marginTop:6 }}>pending</div>
          <div style={{ marginTop:14,display:"flex",gap:8 }}>
            {highPri.length>0&&<span style={{ fontSize:11,padding:"3px 8px",background:"rgba(244,63,94,0.15)",color:"#F43F5E",borderRadius:20,fontWeight:700 }}>🔴 {highPri.length} high</span>}
            {dueToday.length>0&&<span style={{ fontSize:11,padding:"3px 8px",background:"rgba(245,158,11,0.15)",color:"#F59E0B",borderRadius:20,fontWeight:700 }}>⏰ {dueToday.length} today</span>}
          </div>
        </BentoCard>

        {/* Projects */}
        <BentoCard gradient="linear-gradient(135deg,#0A0F1A,#10182A)" glow="rgba(99,102,241,0.12)">
          <div style={{ fontSize:11,fontWeight:800,color:"#818CF8",textTransform:"uppercase",letterSpacing:"1.5px",marginBottom:14 }}>📁 PROJECTS</div>
          <div style={{ fontFamily:"'Cabinet Grotesk',sans-serif",fontSize:42,fontWeight:900,color:"#F9FAFB",letterSpacing:"-2px",lineHeight:1 }}><Counter to={activeProjs.length} /></div>
          <div style={{ fontSize:12,color:"rgba(255,255,255,0.35)",marginTop:6 }}>active</div>
          <div style={{ marginTop:14,display:"flex",flexWrap:"wrap",gap:4 }}>
            {activeProjs.slice(0,3).map(p=>(
              <span key={p.id} style={{ fontSize:10,padding:"2px 8px",background:"rgba(99,102,241,0.12)",color:"#818CF8",borderRadius:12,fontWeight:600 }}>{p.emoji||"📁"} {p.name?.slice(0,10)}</span>
            ))}
          </div>
        </BentoCard>

        {/* Time tracked */}
        <BentoCard gradient="linear-gradient(135deg,#091A12,#102215)" glow="rgba(16,185,129,0.12)">
          <div style={{ fontSize:11,fontWeight:800,color:"#10B981",textTransform:"uppercase",letterSpacing:"1.5px",marginBottom:14 }}>⏱ TIME TRACKED</div>
          <div style={{ fontFamily:"'Cabinet Grotesk',sans-serif",fontSize:42,fontWeight:900,color:"#F9FAFB",letterSpacing:"-2px",lineHeight:1 }}>
            {totalTime>=60?<><Counter to={Math.floor(totalTime/60)} />h</>:<><Counter to={totalTime} />m</>}
          </div>
          <div style={{ fontSize:12,color:"rgba(255,255,255,0.35)",marginTop:6 }}>this session</div>
          <div style={{ marginTop:14 }}>
            <Sparkline data={weekData} color="#10B981" height={30} />
          </div>
        </BentoCard>

        {/* Habits */}
        <BentoCard gradient="linear-gradient(135deg,#1A0F0A,#221808)" glow="rgba(245,158,11,0.12)">
          <div style={{ fontSize:11,fontWeight:800,color:"#F59E0B",textTransform:"uppercase",letterSpacing:"1.5px",marginBottom:14 }}>🌱 HABITS</div>
          <div style={{ display:"flex",alignItems:"center",gap:14 }}>
            <div>
              <div style={{ fontFamily:"'Cabinet Grotesk',sans-serif",fontSize:42,fontWeight:900,color:"#F9FAFB",letterSpacing:"-2px",lineHeight:1 }}><Counter to={habitsToday.length} /></div>
              <div style={{ fontSize:12,color:"rgba(255,255,255,0.35)",marginTop:6 }}>of {habits.length} done</div>
            </div>
            <div style={{ position:"relative",display:"inline-flex" }}>
              <Ring pct={habitPct} color="#F59E0B" size={60} stroke={5} />
              <div style={{ position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center" }}>
                <span style={{ fontSize:14,fontWeight:900,color:"#F9FAFB" }}>{habitPct}%</span>
              </div>
            </div>
          </div>
        </BentoCard>
      </div>

      {/* ── SECOND ROW ── */}
      <div style={{ display:"grid", gridTemplateColumns:"1.6fr 1fr", gap:14, marginBottom:14 }}>

        {/* Priority breakdown */}
        <BentoCard gradient="linear-gradient(135deg,#0C0C1A,#111127)">
          <div style={{ fontSize:11,fontWeight:800,color:"rgba(255,255,255,0.5)",textTransform:"uppercase",letterSpacing:"1.5px",marginBottom:18 }}>⚡ PRIORITY BREAKDOWN</div>
          <div style={{ display:"flex",gap:16,marginBottom:20 }}>
            {[
              {label:"High",val:tasks.filter(t=>t.priority==="high"&&!t.done).length,color:"#F43F5E",bg:"rgba(244,63,94,0.1)"},
              {label:"Medium",val:tasks.filter(t=>t.priority==="medium"&&!t.done).length,color:"#F59E0B",bg:"rgba(245,158,11,0.1)"},
              {label:"Low",val:tasks.filter(t=>t.priority==="low"&&!t.done).length,color:"#10B981",bg:"rgba(16,185,129,0.1)"},
            ].map(s=>(
              <div key={s.label} style={{ flex:1,background:s.bg,border:`1px solid ${s.color}22`,borderRadius:14,padding:"14px 16px",textAlign:"center" }}>
                <div style={{ fontFamily:"'Cabinet Grotesk',sans-serif",fontSize:30,fontWeight:900,color:s.color }}>{s.val}</div>
                <div style={{ fontSize:11,color:"rgba(255,255,255,0.35)",marginTop:4,fontWeight:600 }}>{s.label}</div>
              </div>
            ))}
          </div>
          {/* Task status bar */}
          <div>
            <div style={{ fontSize:11,color:"rgba(255,255,255,0.35)",fontWeight:700,marginBottom:8 }}>COMPLETION STATUS</div>
            {[
              {label:"Todo",val:tasks.filter(t=>t.status==="todo"||(!t.status&&!t.done)).length,color:"#6B7280"},
              {label:"In Progress",val:tasks.filter(t=>t.status==="in-progress").length,color:"#F59E0B"},
              {label:"Done",val:done.length,color:"#10B981"},
            ].map(s=>(
              <div key={s.label} style={{ marginBottom:8 }}>
                <div style={{ display:"flex",justifyContent:"space-between",marginBottom:4 }}>
                  <span style={{ fontSize:12,color:"rgba(255,255,255,0.5)" }}>{s.label}</span>
                  <span style={{ fontSize:12,fontWeight:800,color:s.color }}>{s.val}</span>
                </div>
                <div style={{ height:4,background:"rgba(255,255,255,0.05)",borderRadius:4,overflow:"hidden" }}>
                  <div style={{ height:"100%",background:s.color,borderRadius:4,width:`${tasks.length?Math.round(s.val/tasks.length*100):0}%`,transition:"width 1.2s ease",boxShadow:`0 0 8px ${s.color}66` }} />
                </div>
              </div>
            ))}
          </div>
        </BentoCard>

        {/* Goals panel */}
        <BentoCard gradient="linear-gradient(135deg,#0A0A1A,#0F0F2A)">
          <div style={{ fontSize:11,fontWeight:800,color:"rgba(255,255,255,0.5)",textTransform:"uppercase",letterSpacing:"1.5px",marginBottom:16 }}>🎯 GOALS & OKRs</div>
          {goals.length===0 ? (
            <div style={{ textAlign:"center",padding:"28px 0",color:"rgba(255,255,255,0.2)" }}>
              <div style={{ fontSize:32,marginBottom:8 }}>🎯</div>
              <div style={{ fontSize:12 }}>Set your first goal</div>
            </div>
          ) : goals.slice(0,4).map(g=>{
            const pct = Math.min(Math.round((g.current/Math.max(g.target,1))*100),100);
            return (
              <div key={g.id} style={{ marginBottom:14 }}>
                <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:6 }}>
                  <div style={{ width:8,height:8,borderRadius:"50%",background:g.color||"#FF6B35",flexShrink:0 }} />
                  <span style={{ fontSize:12,fontWeight:600,flex:1,color:"#E5E7EB",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{g.title}</span>
                  <span style={{ fontSize:12,fontWeight:800,color:g.color||"#FF6B35" }}>{pct}%</span>
                </div>
                <div style={{ height:5,background:"rgba(255,255,255,0.05)",borderRadius:4,overflow:"hidden" }}>
                  <div style={{ height:"100%",background:`linear-gradient(90deg,${g.color||"#FF6B35"},${g.color||"#FF6B35"}99)`,borderRadius:4,width:`${pct}%`,transition:"width 1.4s ease",boxShadow:`0 0 10px ${g.color||"#FF6B35"}44` }} />
                </div>
              </div>
            );
          })}
        </BentoCard>
      </div>

      {/* ── THIRD ROW ── */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:14 }}>

        {/* Upcoming tasks */}
        <BentoCard gradient="linear-gradient(135deg,#0C0C1A,#111127)">
          <div style={{ fontSize:11,fontWeight:800,color:"rgba(255,255,255,0.5)",textTransform:"uppercase",letterSpacing:"1.5px",marginBottom:16 }}>🔥 UPCOMING</div>
          <div style={{ display:"flex",flexDirection:"column",gap:7 }}>
            {pending.filter(t=>t.due).sort((a,b)=>a.due.localeCompare(b.due)).slice(0,5).map(t=>{
              const isOD = t.due < new Date().toISOString().slice(0,10);
              const isToday = t.due === new Date().toISOString().slice(0,10);
              const PRI = {high:"#F43F5E",medium:"#F59E0B",low:"#10B981"};
              return (
                <div key={t.id} style={{ display:"flex",alignItems:"center",gap:9,padding:"8px 10px",background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.05)",borderLeft:`3px solid ${PRI[t.priority]||"#FF6B35"}`,borderRadius:9 }}>
                  <div style={{ flex:1,minWidth:0 }}>
                    <div style={{ fontSize:12,fontWeight:600,color:isOD?"#F43F5E":"#E5E7EB",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{t.title}</div>
                    <div style={{ fontSize:10,color:isOD?"#F43F5E":isToday?"#F59E0B":"rgba(255,255,255,0.3)",marginTop:2,fontWeight:600 }}>{isOD?"⚠️ Overdue":isToday?"⏰ Today":t.due}</div>
                  </div>
                  <div style={{ width:6,height:6,borderRadius:"50%",background:PRI[t.priority]||"#FF6B35",flexShrink:0 }} />
                </div>
              );
            })}
            {pending.filter(t=>t.due).length===0&&<div style={{ textAlign:"center",color:"rgba(255,255,255,0.2)",fontSize:12,padding:"16px 0" }}>No upcoming deadlines</div>}
          </div>
        </BentoCard>

        {/* Habit tracker grid */}
        <BentoCard gradient="linear-gradient(135deg,#0C1A0C,#111F11)">
          <div style={{ fontSize:11,fontWeight:800,color:"rgba(255,255,255,0.5)",textTransform:"uppercase",letterSpacing:"1.5px",marginBottom:16 }}>🌱 HABIT STREAKS</div>
          <div style={{ display:"flex",flexDirection:"column",gap:8 }}>
            {habits.slice(0,5).map(h=>{
              const streak = h.streak||0;
              return (
                <div key={h.id} style={{ display:"flex",alignItems:"center",gap:10 }}>
                  <span style={{ fontSize:18 }}>{h.emoji||"✨"}</span>
                  <div style={{ flex:1,minWidth:0 }}>
                    <div style={{ fontSize:12,fontWeight:600,color:"#E5E7EB",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{h.name}</div>
                  </div>
                  <div style={{ display:"flex",gap:3 }}>
                    {Array.from({length:7},(_,i)=>{
                      const d=new Date(); d.setDate(d.getDate()-6+i);
                      const key=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
                      const done=!!h.logs?.[key];
                      return <div key={i} style={{ width:10,height:10,borderRadius:2,background:done?(h.color||"#10B981"):"rgba(255,255,255,0.07)",transition:"all 0.3s" }} />;
                    })}
                  </div>
                  {streak>0&&<span style={{ fontSize:11,color:"#F59E0B",fontWeight:800 }}>🔥{streak}</span>}
                </div>
              );
            })}
            {habits.length===0&&<div style={{ textAlign:"center",color:"rgba(255,255,255,0.2)",fontSize:12,padding:"16px 0" }}>No habits yet</div>}
          </div>
        </BentoCard>

        {/* Quick stats + overdue alert */}
        <BentoCard gradient="linear-gradient(135deg,#1A0A0A,#250F0F)">
          <div style={{ fontSize:11,fontWeight:800,color:"rgba(255,255,255,0.5)",textTransform:"uppercase",letterSpacing:"1.5px",marginBottom:16 }}>📊 INSIGHTS</div>
          <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
            {overdue.length>0 && (
              <div style={{ padding:"10px 14px",background:"rgba(244,63,94,0.1)",border:"1px solid rgba(244,63,94,0.25)",borderRadius:12 }}>
                <div style={{ fontSize:12,fontWeight:800,color:"#F43F5E" }}>⚠️ {overdue.length} overdue tasks</div>
                <div style={{ fontSize:11,color:"rgba(255,255,255,0.4)",marginTop:3 }}>Review and reschedule</div>
              </div>
            )}
            {[
              {icon:"⏱",label:"Time logged today",val:totalTime>=60?`${Math.floor(totalTime/60)}h ${totalTime%60}m`:`${totalTime}m`,color:"#10B981"},
              {icon:"📋",label:"Categories",val:[...new Set(tasks.map(t=>t.category).filter(Boolean))].length,color:"#818CF8"},
              {icon:"🏷️",label:"Tags used",val:[...new Set(tasks.flatMap(t=>t.tags||[]))].length,color:"#F59E0B"},
              {icon:"💬",label:"Comments",val:tasks.reduce((s,t)=>s+(t.comments?.length||0),0),color:"#FB923C"},
            ].map(s=>(
              <div key={s.label} style={{ display:"flex",alignItems:"center",gap:10,padding:"7px 0",borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
                <span style={{ fontSize:16 }}>{s.icon}</span>
                <span style={{ fontSize:12,color:"rgba(255,255,255,0.4)",flex:1 }}>{s.label}</span>
                <span style={{ fontSize:14,fontWeight:800,color:s.color }}>{s.val}</span>
              </div>
            ))}
          </div>
        </BentoCard>
      </div>

      {/* ── FOOTER BRAND BAR ── */}
      <div style={{ marginTop:18,padding:"14px 20px",background:"linear-gradient(135deg,rgba(255,107,53,0.04),rgba(139,92,246,0.04))",border:"1px solid rgba(255,255,255,0.04)",borderRadius:14,display:"flex",alignItems:"center",justifyContent:"space-between" }}>
        <div style={{ display:"flex",alignItems:"center",gap:10 }}>
          <div style={{ fontFamily:"'Cabinet Grotesk',sans-serif",fontSize:15,fontWeight:900,background:"linear-gradient(135deg,#FF6B35,#FF8C5A)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent" }}>Karyika Enterprise</div>
          <span style={{ fontSize:10,padding:"2px 8px",background:"rgba(139,92,246,0.15)",color:"#8B5CF6",borderRadius:12,fontWeight:800,letterSpacing:"0.5px",border:"1px solid rgba(139,92,246,0.2)" }}>PHASE 3</span>
        </div>
        <div style={{ display:"flex",gap:16 }}>
          {[{icon:"⚡",label:"AI Assistant"},{icon:"⌨️",label:"Cmd+K"},{icon:"📊",label:"Gantt"},{icon:"🤖",label:"Automations"}].map(f=>(
            <div key={f.label} style={{ fontSize:11,color:"rgba(255,255,255,0.25)",display:"flex",alignItems:"center",gap:4 }}>{f.icon} {f.label}</div>
          ))}
        </div>
      </div>
    </div>
  );
}
