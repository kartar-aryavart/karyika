// ⌨️ Command Palette — Cmd+K Global Search
import { useState, useEffect, useRef } from "react";
import { useAuth } from "../hooks/useAuth";
import { addTask } from "../firebase/services";

export default function CommandPalette({ tasks=[], projects=[], habits=[], notes=[], onNavigate, onClose }) {
  const { user } = useAuth();
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(0);
  const inputRef = useRef(null);
  useEffect(() => { inputRef.current?.focus(); }, []);

  const PAGES = [
    {id:"dashboard",icon:"🏠",label:"Dashboard"},{id:"tasks",icon:"📋",label:"Tasks"},
    {id:"projects",icon:"📁",label:"Projects"},{id:"goals",icon:"🎯",label:"Goals"},
    {id:"habits",icon:"🌱",label:"Habits"},{id:"calendar",icon:"📅",label:"Calendar"},
    {id:"timer",icon:"⏱",label:"Focus Timer"},{id:"notes",icon:"📓",label:"Notes"},
    {id:"ai",icon:"⚡",label:"AI Assistant"},{id:"timetracker",icon:"⏰",label:"Time Tracker"},
    {id:"automations",icon:"🤖",label:"Automations"},{id:"settings",icon:"⚙️",label:"Settings"},
  ];

  const getResults = () => {
    if (!q) return [
      { group:"Navigation", items:PAGES.slice(0,8) },
      { group:"Quick Actions", items:[
        {icon:"➕",label:"Add new task",type:"action",action:async()=>{ if(q.length>2){ await addTask(user.uid,{title:q.replace(/^(add|new|create)\s+/i,"").trim()||"New Task",priority:"medium",category:"personal",done:false,status:"todo",tags:[],subtasks:[]}); } onClose(); }},
        {icon:"⚡",label:"Ask AI assistant",type:"action",action:()=>{onNavigate("ai");onClose();}},
      ]}
    ];
    const lq = q.toLowerCase();
    const res = [];
    const navM = PAGES.filter(p=>p.label.toLowerCase().includes(lq));
    if (navM.length) res.push({group:"Pages",items:navM});
    const taskM = tasks.filter(t=>t.title?.toLowerCase().includes(lq)&&!t.done).slice(0,5).map(t=>({icon:t.priority==="high"?"🔴":t.priority==="medium"?"🟡":"🟢",label:t.title,sub:`${t.priority} · ${t.category||""}`,type:"task",action:()=>{onNavigate("tasks");onClose();}}));
    if (taskM.length) res.push({group:"Tasks",items:taskM});
    const projM = projects.filter(p=>p.name?.toLowerCase().includes(lq)).slice(0,3).map(p=>({icon:p.emoji||"📁",label:p.name,sub:"Project",type:"project",action:()=>{onNavigate("projects");onClose();}}));
    if (projM.length) res.push({group:"Projects",items:projM});
    const noteM = notes.filter(n=>n.title?.toLowerCase().includes(lq)).slice(0,3).map(n=>({icon:"📓",label:n.title,sub:"Note",type:"note",action:()=>{onNavigate("notes");onClose();}}));
    if (noteM.length) res.push({group:"Notes",items:noteM});
    res.push({group:"Create",items:[{icon:"➕",label:`Add task: "${q}"`,type:"action",action:async()=>{ await addTask(user.uid,{title:q,priority:"medium",category:"personal",done:false,status:"todo",tags:[],subtasks:[]}); onClose(); }}]});
    return res;
  };

  const results = getResults();
  const all = results.flatMap(g=>g.items);

  const handleKey = (e) => {
    if (e.key==="ArrowDown"){e.preventDefault();setSel(s=>Math.min(s+1,all.length-1));}
    if (e.key==="ArrowUp"){e.preventDefault();setSel(s=>Math.max(s-1,0));}
    if (e.key==="Enter"){e.preventDefault();const item=all[sel];if(item){item.type==="nav"||!item.type?(onNavigate(item.id),onClose()):item.action?.();}}
    if (e.key==="Escape") onClose();
  };

  let gi = 0;
  return (
    <div onClick={e=>e.target===e.currentTarget&&onClose()} style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.8)",backdropFilter:"blur(8px)",display:"flex",alignItems:"flex-start",justifyContent:"center",zIndex:9999,paddingTop:"14vh" }}>
      <div style={{ width:"100%",maxWidth:600,background:"#0D0D18",border:"1px solid #2A2A3A",borderRadius:16,boxShadow:"0 25px 60px rgba(0,0,0,0.8)",overflow:"hidden" }}>
        <div style={{ display:"flex",alignItems:"center",gap:10,padding:"13px 18px",borderBottom:"1px solid #1E1E2E" }}>
          <span style={{ fontSize:18,opacity:0.5 }}>🔍</span>
          <input ref={inputRef} value={q} onChange={e=>{setQ(e.target.value);setSel(0);}} onKeyDown={handleKey}
            placeholder="Search tasks, pages, or type to create..." style={{ flex:1,background:"none",border:"none",color:"#E5E7EB",fontSize:16,fontFamily:"inherit",outline:"none" }} />
          <kbd style={{ padding:"3px 8px",background:"#1A1A26",border:"1px solid #2A2A3A",borderRadius:6,fontSize:11,color:"#6B7280",fontFamily:"monospace" }}>ESC</kbd>
        </div>
        <div style={{ maxHeight:420,overflowY:"auto",padding:"6px 0" }}>
          {results.map(grp => (
            <div key={grp.group}>
              <div style={{ padding:"8px 18px 3px",fontSize:10,fontWeight:800,color:"#4B5563",textTransform:"uppercase",letterSpacing:"1.2px" }}>{grp.group}</div>
              {grp.items.map(item => {
                const idx=gi++;const isSel=sel===idx;
                return (
                  <div key={item.label} onClick={()=>item.type==="nav"||!item.type?(onNavigate(item.id),onClose()):item.action?.()}
                    style={{ display:"flex",alignItems:"center",gap:11,padding:"9px 18px",cursor:"pointer",background:isSel?"rgba(255,107,53,0.1)":"transparent",borderLeft:`3px solid ${isSel?"#FF6B35":"transparent"}`,transition:"all 0.1s" }}>
                    <span style={{ fontSize:18,width:24,textAlign:"center" }}>{item.icon}</span>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:13,fontWeight:500,color:isSel?"#FF6B35":"#E5E7EB" }}>{item.label}</div>
                      {item.sub && <div style={{ fontSize:11,color:"#6B7280" }}>{item.sub}</div>}
                    </div>
                    {isSel && <kbd style={{ padding:"2px 7px",background:"#1A1A26",borderRadius:5,fontSize:10,color:"#6B7280",border:"1px solid #2A2A3A" }}>↵</kbd>}
                  </div>
                );
              })}
            </div>
          ))}
          {results.length===0&&<div style={{ padding:32,textAlign:"center",color:"#6B7280",fontSize:13 }}>Kuch nahi mila "{q}" ke liye</div>}
        </div>
        <div style={{ padding:"7px 18px",borderTop:"1px solid #1E1E2E",display:"flex",gap:14,fontSize:11,color:"#4B5563" }}>
          <span>↑↓ Navigate</span><span>↵ Select</span><span>ESC Close</span>
        </div>
      </div>
    </div>
  );
}
