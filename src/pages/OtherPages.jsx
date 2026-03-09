// 📦 OtherPages v2 — Habits, Notes, Calendar, Timer, Settings with i18n
import { useState, useEffect, useRef } from "react";
import { useAuth } from "../hooks/useAuth";
import { addHabit, updateHabit, deleteHabit, addNote, updateNote, deleteNote } from "../firebase/services";
import { Modal, Btn, Input, Empty, Card, ProgressBar, SectionHeader, StatCard, Toggle, Loader } from "../components/UI";
import { toast } from "../components/UI";
import { useLang } from "../i18n/translations.jsx";

const todayStr = () => new Date().toISOString().split("T")[0];
const fmt = d => { try { return new Date(d).toLocaleDateString("en-IN",{month:"short",day:"numeric"}); } catch { return ""; } };
const fmtFull = d => { try { return new Date(d).toLocaleDateString("en-IN",{weekday:"long",month:"long",day:"numeric",year:"numeric"}); } catch { return ""; } };

// ─── HABITS ───────────────────────────────────────────────────────────────────
export function HabitsPage({ habits, loading }) {
  const { user } = useAuth(); const { t } = useLang();
  const [showForm, setShowForm] = useState(false);
  const [newH, setNewH] = useState({ name: "", emoji: "📌", color: "#FF6B35" });
  const [saving, setSaving] = useState(false);
  const td = todayStr();
  const last7 = Array.from({length:7},(_,i)=>{ const d=new Date(); d.setDate(d.getDate()-6+i); return d.toISOString().split("T")[0]; });
  const WDAYS = ["S","M","T","W","T","F","S"];
  const calcStreak = (logs={}) => { let s=0; const d=new Date(); while(true){const ds=d.toISOString().split("T")[0]; if(!logs[ds])break; s++; d.setDate(d.getDate()-1);} return s; };
  const toggleDay = async (h,ds) => { const logs={...(h.logs||{})}; logs[ds]?delete logs[ds]:(logs[ds]=true); try{await updateHabit(user.uid,h.id,{logs});}catch{toast("Error","error");} };
  const addH = async () => { if(!newH.name.trim()){toast("Naam daalo!","error");return;} setSaving(true); try{await addHabit(user.uid,{...newH,logs:{}});toast(t("addHabit")+" ✅","success");setShowForm(false);setNewH({name:"",emoji:"📌",color:"#FF6B35"});}catch{toast("Error","error");} setSaving(false); };
  const delH = async id => { if(!window.confirm("Delete?"))return; try{await deleteHabit(user.uid,id);toast("Deleted!");}catch{toast("Error","error");} };
  if(loading)return <Loader/>;
  return (
    <div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
        <div><div style={{fontFamily:"var(--font-head)",fontSize:18,fontWeight:700}}>{t("habitTracker")}</div><div style={{fontSize:13,color:"var(--text2)",marginTop:2}}>{t("habitSubtitle")}</div></div>
        <Btn onClick={()=>setShowForm(true)}>{t("addHabit")}</Btn>
      </div>
      {habits.length===0?<Empty emoji="🌱" text={t("noHabits")} sub={t("startTracking")}/>:(
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          {habits.map(h=>{
            const s=calcStreak(h.logs); const doneDays=last7.filter(d=>h.logs?.[d]).length; const pct=Math.round(doneDays/7*100);
            return (
              <div key={h.id} style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:14,padding:18}}>
                <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:14}}>
                  <span style={{fontSize:26}}>{h.emoji||"📌"}</span>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:700,fontSize:15,marginBottom:4}}>{h.name}</div>
                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <ProgressBar value={pct} color={h.color||"var(--accent)"} height={5}/>
                      <span style={{fontSize:11,color:"var(--text2)",whiteSpace:"nowrap"}}>{pct}% {t("thisWeek")}</span>
                    </div>
                  </div>
                  <div style={{textAlign:"center",background:"var(--surface2)",padding:"8px 14px",borderRadius:10}}>
                    <div style={{fontFamily:"var(--font-head)",fontSize:22,fontWeight:800,color:h.color||"var(--accent)",lineHeight:1}}>{s}</div>
                    <div style={{fontSize:10,color:"var(--text3)",fontWeight:600}}>{t("streak")}</div>
                  </div>
                  <button onClick={()=>delH(h.id)} style={{padding:"6px 8px",border:"none",borderRadius:8,background:"#FFF0F0",cursor:"pointer",fontSize:14}}>🗑️</button>
                </div>
                <div style={{display:"flex",gap:5}}>
                  {last7.map(d=>(
                    <div key={d} onClick={()=>toggleDay(h,d)} style={{flex:1,aspectRatio:"1",borderRadius:8,border:`1.5px solid ${h.logs?.[d]?(h.color||"var(--accent)"):"var(--border)"}`,background:h.logs?.[d]?(h.color||"var(--accent)"):"var(--surface2)",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:11,fontWeight:700,color:h.logs?.[d]?"#fff":"var(--text3)",transition:"all var(--t)"}}>
                      {WDAYS[new Date(d).getDay()]}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
      {showForm&&(
        <Modal title={t("addHabit")} onClose={()=>setShowForm(false)} footer={<><Btn variant="ghost" onClick={()=>setShowForm(false)}>{t("cancel")}</Btn><Btn onClick={addH} disabled={saving}>{saving?t("saving"):t("add")}</Btn></>}>
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            <Input label={t("habitName")} placeholder={t("habitNamePlaceholder")} value={newH.name} onChange={e=>setNewH(h=>({...h,name:e.target.value}))} autoFocus/>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <Input label={t("emoji")} placeholder="🏃" value={newH.emoji} onChange={e=>setNewH(h=>({...h,emoji:e.target.value}))}/>
              <div><label style={{fontSize:12,fontWeight:600,color:"var(--text2)",display:"block",marginBottom:5}}>{t("color")}</label><input type="color" value={newH.color} onChange={e=>setNewH(h=>({...h,color:e.target.value}))} style={{height:42,width:"100%",borderRadius:10,border:"1.5px solid var(--border)",padding:4,cursor:"pointer"}}/></div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── NOTES ────────────────────────────────────────────────────────────────────
const NOTE_COLORS=["#FFF8E7","#E8F5E9","#E3F2FD","#F3E5F5","#FBE9E7","#FFF3E0"];
export function NotesPage({ notes, loading }) {
  const { user } = useAuth(); const { t } = useLang();
  const [showForm,setShowForm]=useState(false);
  const [editNote,setEditNote]=useState(null);
  const [form,setForm]=useState({title:"",body:"",color:NOTE_COLORS[0]});
  const [search,setSearch]=useState("");
  const [saving,setSaving]=useState(false);
  const filtered=notes.filter(n=>!search||n.title?.toLowerCase().includes(search.toLowerCase())||n.body?.toLowerCase().includes(search.toLowerCase()));
  const openEdit=n=>{setEditNote(n);setForm({title:n.title||"",body:n.body||"",color:n.color||NOTE_COLORS[0]});setShowForm(true);};
  const handleSave=async()=>{
    if(!form.title.trim()&&!form.body.trim()){toast("Note khali hai!","error");return;}
    setSaving(true);
    try{if(editNote){await updateNote(user.uid,editNote.id,form);toast("Updated!");}else{await addNote(user.uid,form);toast("Saved! 📓","success");}setShowForm(false);}
    catch{toast("Error","error");}
    setSaving(false);
  };
  if(loading)return <Loader/>;
  return (
    <div>
      <div style={{display:"flex",gap:10,marginBottom:20}}>
        <div style={{flex:1,position:"relative"}}>
          <span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",color:"var(--text3)",fontSize:14,pointerEvents:"none"}}>🔍</span>
          <input placeholder={t("searchNotes")} value={search} onChange={e=>setSearch(e.target.value)} style={{background:"var(--surface2)",border:"1.5px solid var(--border)",borderRadius:10,color:"var(--text)",fontSize:14,padding:"10px 13px 10px 34px",fontFamily:"var(--font-body)",outline:"none",width:"100%"}}/>
        </div>
        <Btn onClick={()=>{setEditNote(null);setForm({title:"",body:"",color:NOTE_COLORS[0]});setShowForm(true);}}>{t("newNote")}</Btn>
      </div>
      {filtered.length===0?<Empty emoji="📓" text={t("noNotes")} sub={t("startWriting")}/>:(
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14}}>
          {filtered.map(n=>(
            <div key={n.id} onClick={()=>openEdit(n)} style={{background:n.color||NOTE_COLORS[0],border:"1px solid rgba(0,0,0,0.06)",borderRadius:14,padding:18,cursor:"pointer",minHeight:140,display:"flex",flexDirection:"column",transition:"all var(--t)"}}>
              <div style={{fontWeight:700,fontSize:15,marginBottom:8,color:"#1C1815"}}>{n.title||"Untitled"}</div>
              <div style={{fontSize:13,color:"#6B6459",flex:1,whiteSpace:"pre-wrap",overflow:"hidden",display:"-webkit-box",WebkitLineClamp:5,WebkitBoxOrient:"vertical"}}>{n.body}</div>
              <div style={{fontSize:11,color:"#9E9890",marginTop:12,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <span>{fmt(n.createdAt?.seconds?n.createdAt.seconds*1000:n.createdAt)}</span>
                <button onClick={e=>{e.stopPropagation();deleteNote(user.uid,n.id).then(()=>toast("Deleted!"));}} style={{fontSize:14,padding:"2px 6px",border:"none",borderRadius:6,background:"rgba(0,0,0,0.07)",cursor:"pointer",opacity:.7}}>🗑️</button>
              </div>
            </div>
          ))}
        </div>
      )}
      {showForm&&(
        <Modal title={editNote?"Edit Note":t("newNote")} onClose={()=>setShowForm(false)} footer={<><Btn variant="ghost" onClick={()=>setShowForm(false)}>{t("cancel")}</Btn>{editNote&&<Btn variant="danger" onClick={()=>{deleteNote(user.uid,editNote.id).then(()=>{setShowForm(false);toast("Deleted!");});}}>Delete</Btn>}<Btn onClick={handleSave} disabled={saving}>{saving?t("saving"):t("save")}</Btn></>}>
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            <Input label={t("noteTitle")} placeholder={t("noteTitlePlaceholder")} value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} autoFocus/>
            <Input label={t("content")} placeholder={t("contentPlaceholder")} value={form.body} onChange={e=>setForm(f=>({...f,body:e.target.value}))} rows={7}/>
            <div><label style={{fontSize:12,fontWeight:600,color:"var(--text2)",display:"block",marginBottom:8}}>{t("color")}</label>
              <div style={{display:"flex",gap:8}}>{NOTE_COLORS.map(c=><div key={c} onClick={()=>setForm(f=>({...f,color:c}))} style={{width:30,height:30,borderRadius:8,background:c,cursor:"pointer",border:`2.5px solid ${form.color===c?"var(--accent)":"transparent"}`,transition:"border-color var(--t)"}}/>)}</div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── CALENDAR ─────────────────────────────────────────────────────────────────
export function CalendarPage({ tasks, habits }) {
  const { t } = useLang();
  const now=new Date(); const [year,setYear]=useState(now.getFullYear()); const [month,setMonth]=useState(now.getMonth()); const [selected,setSelected]=useState(todayStr());
  const MONTHS=["January","February","March","April","May","June","July","August","September","October","November","December"];
  const DAYS=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  const td=todayStr(); const firstDay=new Date(year,month,1).getDay(); const dim=new Date(year,month+1,0).getDate();
  const ds=d=>`${year}-${String(month+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
  const prev=()=>{if(month===0){setMonth(11);setYear(y=>y-1);}else setMonth(m=>m-1);};
  const next=()=>{if(month===11){setMonth(0);setYear(y=>y+1);}else setMonth(m=>m+1);};
  const selTasks=tasks.filter(x=>x.due===selected); const selHabits=habits.filter(h=>h.logs?.[selected]);
  const PC={high:"var(--rose)",medium:"var(--gold)",low:"var(--teal)"};
  return (
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,alignItems:"start"}}>
      <Card>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
          <button onClick={prev} style={{background:"var(--surface2)",border:"none",borderRadius:8,padding:"6px 10px",cursor:"pointer",fontSize:16,color:"var(--text2)"}}>‹</button>
          <div style={{fontFamily:"var(--font-head)",fontWeight:700,fontSize:16}}>{MONTHS[month]} {year}</div>
          <button onClick={next} style={{background:"var(--surface2)",border:"none",borderRadius:8,padding:"6px 10px",cursor:"pointer",fontSize:16,color:"var(--text2)"}}>›</button>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",gap:3}}>
          {DAYS.map(d=><div key={d} style={{textAlign:"center",fontSize:10,fontWeight:700,color:"var(--text3)",padding:"5px 0",letterSpacing:"0.5px"}}>{d}</div>)}
          {Array.from({length:firstDay}).map((_,i)=><div key={`e${i}`}/>)}
          {Array.from({length:dim},(_,i)=>{
            const d=i+1; const dateStr=ds(d); const dayTasks=tasks.filter(x=>x.due===dateStr);
            const isToday=dateStr===td; const isSel=dateStr===selected;
            return (
              <div key={d} onClick={()=>setSelected(dateStr)} style={{aspectRatio:"1",borderRadius:8,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"flex-start",padding:"5px 2px",cursor:"pointer",transition:"all var(--t)",background:isSel?"var(--accent)":isToday?"rgba(255,107,53,0.1)":"var(--surface2)",border:`1.5px solid ${isToday&&!isSel?"var(--accent)":"transparent"}`,color:isSel?"#fff":undefined}}>
                <span style={{fontSize:12,fontWeight:isToday?800:500}}>{d}</span>
                {dayTasks.length>0&&<div style={{display:"flex",gap:2,marginTop:2,flexWrap:"wrap",justifyContent:"center"}}>{dayTasks.slice(0,3).map((x,ti)=><div key={ti} style={{width:4,height:4,borderRadius:"50%",background:isSel?"rgba(255,255,255,0.7)":(PC[x.priority]||"var(--accent)")}}/>)}</div>}
              </div>
            );
          })}
        </div>
      </Card>
      <Card>
        <div style={{fontFamily:"var(--font-head)",fontSize:15,fontWeight:700,marginBottom:4}}>{fmtFull(selected)}</div>
        <div style={{fontSize:12,color:"var(--text3)",marginBottom:16}}>{selTasks.length} tasks · {selHabits.length} habits done</div>
        {selTasks.length===0&&selHabits.length===0?<Empty emoji="🌿" text="Nothing scheduled"/>:(
          <>
            {selTasks.length>0&&(<>
              <div style={{fontSize:11,fontWeight:700,color:"var(--text3)",textTransform:"uppercase",letterSpacing:"0.8px",marginBottom:8}}>Tasks</div>
              <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:16}}>
                {selTasks.map(x=>(
                  <div key={x.id} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",background:"var(--surface2)",borderRadius:8}}>
                    <span>{x.done?"✅":"○"}</span><span style={{flex:1,fontSize:13,fontWeight:500}}>{x.title}</span>
                    <span style={{fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:20,background:x.priority==="high"?"#FFF0F5":"#FFF8E6",color:x.priority==="high"?"var(--rose)":"var(--gold)"}}>{x.priority}</span>
                  </div>
                ))}
              </div>
            </>)}
            {selHabits.length>0&&(<>
              <div style={{fontSize:11,fontWeight:700,color:"var(--text3)",textTransform:"uppercase",letterSpacing:"0.8px",marginBottom:8}}>Habits Done</div>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                {selHabits.map(h=><div key={h.id} style={{padding:"6px 12px",background:(h.color||"var(--accent)")+"20",color:h.color||"var(--accent)",borderRadius:20,fontSize:13,fontWeight:600}}>{h.emoji} {h.name}</div>)}
              </div>
            </>)}
          </>
        )}
      </Card>
    </div>
  );
}

// ─── FOCUS TIMER with White Noise ─────────────────────────────────────────────
export function FocusTimer() {
  const { t } = useLang();
  const MODES=[{label:t("focus"),duration:25*60,color:"var(--accent)"},{label:t("shortBreak"),duration:5*60,color:"var(--teal)"},{label:t("longBreak"),duration:15*60,color:"var(--gold)"}];
  const [mi,setMi]=useState(0); const [timeLeft,setTimeLeft]=useState(MODES[0].duration); const [running,setRunning]=useState(false); const [sessions,setSessions]=useState(0);
  const [noise,setNoise]=useState("off");
  const iRef=useRef(null); const audioRef=useRef(null);
  const mode=MODES[mi]; const pct=timeLeft/mode.duration*100; const R=110; const C=2*Math.PI*R;
  const mm=String(Math.floor(timeLeft/60)).padStart(2,"0"); const ss2=String(timeLeft%60).padStart(2,"0");

  useEffect(()=>{
    if(running){iRef.current=setInterval(()=>{setTimeLeft(t=>{if(t<=1){clearInterval(iRef.current);setRunning(false);if(mi===0)setSessions(s=>s+1);toast(`${mode.label} complete! 🎉`,"success");return 0;}return t-1;});},1000);}
    return()=>clearInterval(iRef.current);
  },[running,mi]);

  const switchMode=idx=>{clearInterval(iRef.current);setRunning(false);setMi(idx);setTimeLeft(MODES[idx].duration);};
  const toggle=()=>{if(timeLeft===0){setTimeLeft(mode.duration);return;}setRunning(r=>!r);};
  const reset=()=>{clearInterval(iRef.current);setRunning(false);setTimeLeft(mode.duration);};

  const NOISES=[{id:"off",label:t("off")},{id:"rain",label:t("rain")},{id:"forest",label:t("forest")},{id:"cafe",label:t("cafe")},{id:"waves",label:t("waves")}];

  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",maxWidth:480,margin:"0 auto"}}>
      <div style={{display:"flex",gap:8,marginBottom:32}}>
        {MODES.map((m,i)=><div key={m.label} onClick={()=>switchMode(i)} style={{padding:"7px 18px",borderRadius:20,fontSize:13,fontWeight:600,cursor:"pointer",border:`1.5px solid ${mi===i?m.color:"var(--border)"}`,background:mi===i?m.color:"var(--surface)",color:mi===i?"#fff":"var(--text2)",transition:"all var(--t)",userSelect:"none"}}>{m.label}</div>)}
      </div>
      <div style={{position:"relative",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:32}}>
        <svg width={260} height={260} style={{transform:"rotate(-90deg)"}}>
          <circle cx={130} cy={130} r={R} fill="none" stroke="var(--surface2)" strokeWidth={12}/>
          <circle cx={130} cy={130} r={R} fill="none" stroke={mode.color} strokeWidth={12} strokeDasharray={C} strokeDashoffset={C-(pct/100)*C} strokeLinecap="round" style={{transition:running?"stroke-dashoffset 1s linear":"stroke-dashoffset .3s ease"}}/>
        </svg>
        <div style={{position:"absolute",textAlign:"center",fontFamily:"var(--font-head)"}}>
          <div style={{fontSize:52,fontWeight:800,lineHeight:1,letterSpacing:-2,color:mode.color}}>{mm}:{ss2}</div>
          <div style={{fontSize:13,color:"var(--text2)",marginTop:6}}>{mode.label}</div>
        </div>
      </div>
      <div style={{display:"flex",gap:12,marginBottom:24}}>
        <Btn variant="ghost" onClick={reset}>{t("reset")}</Btn>
        <Btn style={{padding:"12px 40px",fontSize:15,background:mode.color}} onClick={toggle}>{running?t("pause"):timeLeft===0?t("restart"):t("start")}</Btn>
      </div>
      <Card style={{width:"100%",textAlign:"center",marginBottom:16}}>
        <div style={{display:"flex",justifyContent:"center",gap:8,marginBottom:8}}>
          {Array.from({length:Math.max(sessions,4)},(_,i)=><div key={i} style={{width:16,height:16,borderRadius:4,background:i<sessions?mode.color:"var(--surface2)",transition:"background .3s"}}/>)}
        </div>
        <div style={{fontSize:13,color:"var(--text2)"}}>{sessions} {t("sessionsToday")}</div>
      </Card>
      {/* White Noise */}
      <Card style={{width:"100%",marginBottom:16}}>
        <div style={{fontWeight:600,fontSize:14,marginBottom:10}}>🎵 {t("whiteNoise")}</div>
        <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
          {NOISES.map(n=><div key={n.id} onClick={()=>setNoise(n.id)} style={{padding:"6px 14px",borderRadius:20,fontSize:12,fontWeight:600,cursor:"pointer",border:`1.5px solid ${noise===n.id?"var(--accent)":"var(--border)"}`,background:noise===n.id?"var(--accent)":"var(--surface)",color:noise===n.id?"#fff":"var(--text2)",transition:"all var(--t)"}}>{n.label}</div>)}
        </div>
        {noise!=="off"&&<div style={{marginTop:10,fontSize:12,color:"var(--text3)",padding:"8px 12px",background:"var(--surface2)",borderRadius:8}}>🎵 {noise.charAt(0).toUpperCase()+noise.slice(1)} sounds playing... (Connect audio in production)</div>}
      </Card>
      <Card style={{width:"100%",background:"var(--surface2)",border:"none"}}>
        <div style={{fontSize:13,color:"var(--text2)",lineHeight:1.9}}><strong style={{color:"var(--text)"}}>💡 Pomodoro</strong><br/>{t("pomodoroTip")}</div>
      </Card>
    </div>
  );
}

// ─── SETTINGS ─────────────────────────────────────────────────────────────────
export function SettingsPage({ dark, setDark, tasks, habits, notes }) {
  const { user } = useAuth(); const { t, lang, toggleLang } = useLang();
  const reqNotif=()=>{if("Notification"in window)Notification.requestPermission().then(p=>toast(p==="granted"?"Notifications on! 🔔":"Permission denied.",p==="granted"?"success":"error"));else toast("Not supported.","error");};
  const exportData=()=>{const blob=new Blob([JSON.stringify({tasks,habits,notes,at:new Date().toISOString()},null,2)],{type:"application/json"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="karyika-backup.json";a.click();toast("Exported! 💾","success");};
  const ns="Notification"in window?Notification.permission:"unsupported";
  return (
    <div style={{maxWidth:600,display:"flex",flexDirection:"column",gap:16}}>
      {user&&<Card><SectionHeader title={`👤 ${t("profile")}`}/>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <div style={{width:52,height:52,borderRadius:"50%",background:"var(--accent)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:20,fontWeight:700,overflow:"hidden",flexShrink:0}}>
            {user.photoURL?<img src={user.photoURL} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:(user.displayName?.[0]||"U").toUpperCase()}
          </div>
          <div><div style={{fontWeight:700,fontSize:15}}>{user.displayName||"User"}</div><div style={{fontSize:13,color:"var(--text2)"}}>{user.email}</div></div>
        </div>
      </Card>}
      <Card><SectionHeader title={`🎨 ${t("appearance")}`}/>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 0",borderBottom:"1px solid var(--border)"}}>
          <div><div style={{fontWeight:600,fontSize:14}}>{t("darkMode")}</div><div style={{fontSize:12,color:"var(--text2)",marginTop:2}}>{t("darkModeDesc")}</div></div>
          <Toggle on={dark} onChange={setDark}/>
        </div>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",paddingTop:10}}>
          <div><div style={{fontWeight:600,fontSize:14}}>🌐 {t("language")}</div><div style={{fontSize:12,color:"var(--text2)",marginTop:2}}>Hindi / English</div></div>
          <button onClick={toggleLang} style={{padding:"6px 16px",border:"1.5px solid var(--border)",borderRadius:20,background:"var(--surface2)",cursor:"pointer",fontSize:13,fontWeight:700,color:"var(--text)",fontFamily:"var(--font-body)"}}>{lang==="en"?"हिंदी में":"In English"}</button>
        </div>
      </Card>
      <Card><SectionHeader title={`🔔 ${t("notifications")}`}/>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 0"}}>
          <div><div style={{fontWeight:600,fontSize:14}}>{t("browserNotifs")}</div><div style={{fontSize:12,color:"var(--text2)",marginTop:2}}>Status: <strong style={{color:ns==="granted"?"var(--teal)":"var(--rose)"}}>{ns}</strong></div></div>
          <Btn variant="ghost" onClick={reqNotif} size="sm">{t("enableNotifs")}</Btn>
        </div>
      </Card>
      <Card><SectionHeader title={`📊 ${t("yourData")}`}/>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12}}>
          {[{icon:"📋",val:tasks.length,label:t("totalTasks")},{icon:"🌱",val:habits.length,label:t("habits")},{icon:"📓",val:notes.length,label:t("notes")}].map(s=>(
            <div key={s.label} style={{textAlign:"center",padding:14,background:"var(--surface2)",borderRadius:12}}>
              <div style={{fontSize:24}}>{s.icon}</div>
              <div style={{fontFamily:"var(--font-head)",fontSize:26,fontWeight:800,color:"var(--accent)"}}>{s.val}</div>
              <div style={{fontSize:11,color:"var(--text2)"}}>{s.label}</div>
            </div>
          ))}
        </div>
      </Card>
      <Card><SectionHeader title={`💾 ${t("dataManagement")}`}/>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div><div style={{fontWeight:600,fontSize:14}}>{t("exportData")}</div><div style={{fontSize:12,color:"var(--text2)"}}>{t("exportDesc")}</div></div>
          <Btn variant="ghost" size="sm" onClick={exportData}>{t("export")}</Btn>
        </div>
        <div style={{marginTop:12,fontSize:12,color:"var(--text3)",lineHeight:1.8,padding:"10px 12px",background:"var(--surface2)",borderRadius:8}}>
          <strong>Karyika v2.0 Phase 1</strong> — React + Firebase<br/>
          Data Firebase Firestore mein save hota hai 🔥
        </div>
      </Card>
    </div>
  );
}
