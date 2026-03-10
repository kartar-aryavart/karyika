// 📋 TasksPage v5 — GOD MODE (ClickUp + Linear + Jira combined)
// Features: Custom statuses · Sprints · Story points · Bulk actions · Custom fields
//           Advanced filters · Task relations · Templates · Timeline · Board · Table
import { useState, useMemo, useRef, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { addTask, updateTask, deleteTask } from "../firebase/services";
import { toast } from "../components/UI";
import { useLang } from "../i18n/translations.jsx";

const todayStr = () => new Date().toISOString().split("T")[0];
const uid = () => Math.random().toString(36).slice(2,10);
const fmt = d => { try { return new Date(d+"T00:00").toLocaleDateString("en-IN",{month:"short",day:"numeric"}); } catch { return d||""; } };
const PRI_COLOR = { high:"#F43F5E", medium:"#F59E0B", low:"#10B981", urgent:"#F97316" };
const PRI_BG    = { high:"rgba(244,63,94,0.1)", medium:"rgba(245,158,11,0.1)", low:"rgba(16,185,129,0.1)", urgent:"rgba(249,115,22,0.1)" };

// ─── DEFAULT STATUSES (per project, customizable) ─────────────────────────────
const DEFAULT_STATUSES = [
  { id:"todo",        label:"To Do",       color:"#6B7280" },
  { id:"in-progress", label:"In Progress", color:"#F59E0B" },
  { id:"review",      label:"In Review",   color:"#818CF8" },
  { id:"blocked",     label:"Blocked",     color:"#F43F5E" },
  { id:"done",        label:"Done",        color:"#10B981" },
];

// ─── TASK TEMPLATES ───────────────────────────────────────────────────────────
const TASK_TEMPLATES = [
  { label:"🐛 Bug Report",   priority:"high",   tags:["bug"],       estimatedTime:60,  desc:"Steps to reproduce:\n1. \n\nExpected:\nActual:" },
  { label:"✨ Feature",      priority:"medium", tags:["feature"],   estimatedTime:120, desc:"User story: As a user, I want to..." },
  { label:"📝 Documentation",priority:"low",    tags:["docs"],      estimatedTime:30,  desc:"Document the following:" },
  { label:"🔍 Research",     priority:"medium", tags:["research"],  estimatedTime:90,  desc:"Research goal:\nKey questions:" },
  { label:"📞 Meeting",      priority:"medium", tags:["meeting"],   estimatedTime:45,  desc:"Agenda:\n1. \n\nAction items:" },
  { label:"🚀 Release",      priority:"urgent", tags:["release"],   estimatedTime:180, desc:"Version:\nChangelog:" },
];

// ─── INLINE INPUT STYLE ───────────────────────────────────────────────────────
const inp = { background:"#13131F", border:"1px solid rgba(255,255,255,0.08)", borderRadius:9, color:"#E5E7EB", fontSize:13, padding:"9px 13px", fontFamily:"inherit", outline:"none", width:"100%", boxSizing:"border-box" };
const lbl = { fontSize:11, fontWeight:700, color:"#6B7280", display:"block", marginBottom:5, textTransform:"uppercase", letterSpacing:"0.5px" };

// ─── TASK FORM MODAL (full featured) ─────────────────────────────────────────
function TaskFormModal({ initial, onSave, onClose, projects=[], statuses=DEFAULT_STATUSES }) {
  const EMPTY = { title:"", desc:"", due:"", dueTime:"", priority:"medium", status:"todo", category:"work", tags:[], subtasks:[], estimatedTime:"", points:0, assignees:[], reminder:"", recurring:"none", projectId:"", sprintId:"", customFields:{} };
  const [form, setForm] = useState(initial ? {...EMPTY,...initial} : EMPTY);
  const [tagInput, setTagInput] = useState("");
  const [subtaskInput, setSubtaskInput] = useState("");
  const [activeTab, setActiveTab] = useState("basic");
  const [saving, setSaving] = useState(false);
  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  const applyTemplate = (tpl) => setForm(f=>({...f,...tpl,title:f.title||tpl.label.split(" ").slice(1).join(" ")}));

  const handleSave = async () => {
    if (!form.title.trim()) { toast("Title required!","error"); return; }
    setSaving(true); await onSave(form); setSaving(false); onClose();
  };

  const TABS = [{id:"basic",label:"Basic"},{id:"details",label:"Details"},{id:"subtasks",label:`Subtasks (${(form.subtasks||[]).length})`},{id:"custom",label:"Fields"}];

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div style={{background:"#0F0F1C",border:"1px solid rgba(255,255,255,0.1)",borderRadius:20,width:"100%",maxWidth:600,maxHeight:"90vh",overflow:"hidden",display:"flex",flexDirection:"column",boxShadow:"0 30px 80px rgba(0,0,0,0.8)"}}>
        {/* Header */}
        <div style={{padding:"18px 22px 0",borderBottom:"1px solid rgba(255,255,255,0.06)"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
            <div style={{fontFamily:"'Cabinet Grotesk',sans-serif",fontSize:17,fontWeight:800}}>{initial?.id?"Edit Task":"New Task"}</div>
            <button onClick={onClose} style={{background:"transparent",border:"none",color:"#6B7280",cursor:"pointer",fontSize:22,lineHeight:1}}>×</button>
          </div>
          {/* Tabs */}
          <div style={{display:"flex",gap:0}}>
            {TABS.map(tab=>(
              <button key={tab.id} onClick={()=>setActiveTab(tab.id)} style={{padding:"8px 16px",border:"none",borderBottom:`2px solid ${activeTab===tab.id?"#FF6B35":"transparent"}`,background:"transparent",color:activeTab===tab.id?"#FF6B35":"#6B7280",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit",transition:"all 0.15s"}}>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div style={{flex:1,overflowY:"auto",padding:"18px 22px"}}>

          {/* BASIC TAB */}
          {activeTab==="basic"&&(
            <div style={{display:"flex",flexDirection:"column",gap:14}}>
              {/* Templates */}
              {!initial?.id&&(
                <div>
                  <div style={lbl}>Quick Templates</div>
                  <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                    {TASK_TEMPLATES.map(tpl=>(
                      <button key={tpl.label} onClick={()=>applyTemplate(tpl)} style={{padding:"4px 10px",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:20,color:"#9CA3AF",fontSize:11,cursor:"pointer",fontFamily:"inherit",transition:"all 0.15s"}}
                        onMouseEnter={e=>e.currentTarget.style.borderColor="#FF6B35"} onMouseLeave={e=>e.currentTarget.style.borderColor="rgba(255,255,255,0.08)"}>{tpl.label}</button>
                    ))}
                  </div>
                </div>
              )}
              {/* Title */}
              <div>
                <label style={lbl}>Title *</label>
                <input value={form.title} onChange={e=>set("title",e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleSave()} placeholder="What needs to be done?" autoFocus style={{...inp,fontSize:15,fontWeight:600}} />
              </div>
              {/* Description */}
              <div>
                <label style={lbl}>Description</label>
                <textarea value={form.desc} onChange={e=>set("desc",e.target.value)} placeholder="Add details, steps, notes..." rows={3} style={{...inp,resize:"vertical",lineHeight:1.6}} />
              </div>
              {/* Row: Priority + Status */}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                <div>
                  <label style={lbl}>Priority</label>
                  <select value={form.priority} onChange={e=>set("priority",e.target.value)} style={inp}>
                    <option value="urgent">🔴 Urgent</option>
                    <option value="high">🟠 High</option>
                    <option value="medium">🟡 Medium</option>
                    <option value="low">🟢 Low</option>
                  </select>
                </div>
                <div>
                  <label style={lbl}>Status</label>
                  <select value={form.status} onChange={e=>set("status",e.target.value)} style={inp}>
                    {statuses.map(s=><option key={s.id} value={s.id}>{s.label}</option>)}
                  </select>
                </div>
              </div>
              {/* Row: Due + Time */}
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                <div>
                  <label style={lbl}>Due Date</label>
                  <input type="date" value={form.due} onChange={e=>set("due",e.target.value)} style={{...inp,colorScheme:"dark"}} />
                </div>
                <div>
                  <label style={lbl}>Due Time</label>
                  <input type="time" value={form.dueTime||""} onChange={e=>set("dueTime",e.target.value)} style={{...inp,colorScheme:"dark"}} />
                </div>
              </div>
              {/* Project */}
              {projects.length>0&&(
                <div>
                  <label style={lbl}>Project</label>
                  <select value={form.projectId||""} onChange={e=>set("projectId",e.target.value)} style={inp}>
                    <option value="">No project</option>
                    {projects.map(p=><option key={p.id} value={p.id}>{p.emoji||"📁"} {p.name}</option>)}
                  </select>
                </div>
              )}
              {/* Tags */}
              <div>
                <label style={lbl}>Tags</label>
                <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:8}}>
                  {(form.tags||[]).map(tag=>(
                    <span key={tag} style={{padding:"3px 10px",background:"rgba(255,107,53,0.12)",color:"#FF6B35",borderRadius:20,fontSize:12,fontWeight:600,display:"flex",alignItems:"center",gap:5}}>
                      #{tag} <span onClick={()=>set("tags",(form.tags||[]).filter(t=>t!==tag))} style={{cursor:"pointer",opacity:0.6}}>×</span>
                    </span>
                  ))}
                </div>
                <div style={{display:"flex",gap:7}}>
                  <input value={tagInput} onChange={e=>setTagInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"||e.key===","){ e.preventDefault(); if(tagInput.trim()&&!(form.tags||[]).includes(tagInput.trim().toLowerCase())){set("tags",[...(form.tags||[]),tagInput.trim().toLowerCase()]);setTagInput("");}}} } placeholder="Add tag + Enter" style={{...inp,flex:1}} />
                </div>
              </div>
            </div>
          )}

          {/* DETAILS TAB */}
          {activeTab==="details"&&(
            <div style={{display:"flex",flexDirection:"column",gap:14}}>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                <div>
                  <label style={lbl}>Estimated Time (min)</label>
                  <input type="number" value={form.estimatedTime||""} onChange={e=>set("estimatedTime",parseInt(e.target.value)||0)} placeholder="e.g. 60" style={inp} />
                </div>
                <div>
                  <label style={lbl}>Story Points</label>
                  <select value={form.points||0} onChange={e=>set("points",parseInt(e.target.value))} style={inp}>
                    {[0,1,2,3,5,8,13,21].map(p=><option key={p} value={p}>{p===0?"No points":p+" pts"}</option>)}
                  </select>
                </div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                <div>
                  <label style={lbl}>Urgency</label>
                  <select value={form.urgency||"not-urgent"} onChange={e=>set("urgency",e.target.value)} style={inp}>
                    <option value="urgent">🔥 Urgent</option>
                    <option value="not-urgent">🕐 Not Urgent</option>
                  </select>
                </div>
                <div>
                  <label style={lbl}>Importance</label>
                  <select value={form.importance||"important"} onChange={e=>set("importance",e.target.value)} style={inp}>
                    <option value="important">⭐ Important</option>
                    <option value="not-important">• Not Important</option>
                  </select>
                </div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                <div>
                  <label style={lbl}>Recurring</label>
                  <select value={form.recurring||"none"} onChange={e=>set("recurring",e.target.value)} style={inp}>
                    <option value="none">No repeat</option>
                    <option value="daily">Daily</option>
                    <option value="weekdays">Weekdays</option>
                    <option value="weekly">Weekly</option>
                    <option value="biweekly">Bi-weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
                <div>
                  <label style={lbl}>Category</label>
                  <select value={form.category||"work"} onChange={e=>set("category",e.target.value)} style={inp}>
                    {["work","study","personal","health","finance","creative","other"].map(c=><option key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label style={lbl}>Reminder</label>
                <input type="datetime-local" value={form.reminder||""} onChange={e=>set("reminder",e.target.value)} style={{...inp,colorScheme:"dark"}} />
              </div>
              <div>
                <label style={lbl}>Cover Color</label>
                <div style={{display:"flex",gap:8}}>
                  {["","#FF6B35","#F43F5E","#10B981","#818CF8","#F59E0B","#06B6D4","#8B5CF6"].map(c=>(
                    <div key={c} onClick={()=>set("coverColor",c)} style={{width:24,height:24,borderRadius:6,background:c||"rgba(255,255,255,0.08)",cursor:"pointer",border:`2px solid ${form.coverColor===c?"#fff":"transparent"}`,transition:"border 0.15s"}} />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* SUBTASKS TAB */}
          {activeTab==="subtasks"&&(
            <div>
              <div style={{display:"flex",gap:7,marginBottom:14}}>
                <input value={subtaskInput} onChange={e=>setSubtaskInput(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&subtaskInput.trim()){set("subtasks",[...(form.subtasks||[]),{id:uid(),title:subtaskInput.trim(),done:false}]);setSubtaskInput("");}}} placeholder="Add subtask + Enter" style={{...inp,flex:1}} />
                <button onClick={()=>{if(subtaskInput.trim()){set("subtasks",[...(form.subtasks||[]),{id:uid(),title:subtaskInput.trim(),done:false}]);setSubtaskInput("");}}} style={{padding:"9px 16px",background:"#FF6B35",border:"none",borderRadius:9,color:"#fff",fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>+</button>
              </div>
              {(form.subtasks||[]).length===0&&<div style={{textAlign:"center",color:"#4B5563",padding:"24px 0",fontSize:13}}>No subtasks yet</div>}
              <div style={{display:"flex",flexDirection:"column",gap:6}}>
                {(form.subtasks||[]).map((s,i)=>(
                  <div key={s.id} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 12px",background:"#13131F",border:"1px solid rgba(255,255,255,0.06)",borderRadius:9}}>
                    <input type="checkbox" checked={s.done} onChange={()=>set("subtasks",(form.subtasks||[]).map(st=>st.id===s.id?{...st,done:!st.done}:st))} style={{accentColor:"#FF6B35",width:15,height:15,cursor:"pointer"}} />
                    <span style={{flex:1,fontSize:13,color:s.done?"#4B5563":"#E5E7EB",textDecoration:s.done?"line-through":"none"}}>{s.title}</span>
                    <button onClick={()=>set("subtasks",(form.subtasks||[]).filter(st=>st.id!==s.id))} style={{background:"transparent",border:"none",color:"#4B5563",cursor:"pointer",fontSize:14}} onMouseEnter={e=>e.currentTarget.style.color="#F43F5E"} onMouseLeave={e=>e.currentTarget.style.color="#4B5563"}>×</button>
                  </div>
                ))}
              </div>
              {(form.subtasks||[]).length>0&&(
                <div style={{marginTop:12}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                    <span style={{fontSize:12,color:"#6B7280"}}>Progress</span>
                    <span style={{fontSize:12,fontWeight:700,color:"#10B981"}}>{Math.round((form.subtasks||[]).filter(s=>s.done).length/(form.subtasks||[]).length*100)}%</span>
                  </div>
                  <div style={{height:4,background:"rgba(255,255,255,0.06)",borderRadius:4,overflow:"hidden"}}>
                    <div style={{height:"100%",background:"#10B981",borderRadius:4,width:`${Math.round((form.subtasks||[]).filter(s=>s.done).length/(form.subtasks||[]).length*100)}%`,transition:"width 0.5s"}} />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* CUSTOM FIELDS TAB */}
          {activeTab==="custom"&&(
            <div style={{display:"flex",flexDirection:"column",gap:12}}>
              {[
                {key:"url",label:"URL / Link",placeholder:"https://..."},
                {key:"phone",label:"Phone",placeholder:"+91 XXXXX XXXXX"},
                {key:"location",label:"Location",placeholder:"City, Country"},
                {key:"version",label:"Version",placeholder:"v1.0.0"},
              ].map(f=>(
                <div key={f.key}>
                  <label style={lbl}>{f.label}</label>
                  <input value={form.customFields?.[f.key]||""} onChange={e=>set("customFields",{...(form.customFields||{}),[f.key]:e.target.value})} placeholder={f.placeholder} style={inp} />
                </div>
              ))}
              <div>
                <label style={lbl}>Custom Note</label>
                <textarea value={form.customFields?.note||""} onChange={e=>set("customFields",{...(form.customFields||{}),note:e.target.value})} rows={3} placeholder="Any additional info..." style={{...inp,resize:"vertical"}} />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{padding:"14px 22px",borderTop:"1px solid rgba(255,255,255,0.06)",display:"flex",gap:10,justifyContent:"flex-end"}}>
          <button onClick={onClose} style={{padding:"9px 20px",background:"transparent",border:"1px solid rgba(255,255,255,0.08)",borderRadius:10,color:"#9CA3AF",cursor:"pointer",fontFamily:"inherit",fontWeight:600}}>Cancel</button>
          <button onClick={handleSave} disabled={saving} style={{padding:"9px 24px",background:"linear-gradient(135deg,#FF6B35,#FF8C5A)",border:"none",borderRadius:10,color:"#fff",fontWeight:800,cursor:saving?"not-allowed":"pointer",fontFamily:"inherit",opacity:saving?0.7:1,boxShadow:"0 4px 16px rgba(255,107,53,0.3)"}}>
            {saving?"Saving...":initial?.id?"Update Task":"Add Task"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── TASK ROW (list view) ─────────────────────────────────────────────────────
function TaskRow({ task, selected, onSelect, onToggle, onEdit, onDelete, statuses }) {
  const isOverdue = !task.done && task.due && task.due < todayStr();
  const isToday = task.due === todayStr();
  const subtaskDone = (task.subtasks||[]).filter(s=>s.done).length;
  const subtaskTotal = (task.subtasks||[]).length;
  const status = statuses.find(s=>s.id===task.status)||statuses[0];

  return (
    <div style={{display:"grid",gridTemplateColumns:"32px 20px 1fr 100px 80px 70px 60px 40px",gap:8,alignItems:"center",padding:"8px 14px",borderBottom:"1px solid rgba(255,255,255,0.03)",transition:"background 0.1s",background:selected?"rgba(255,107,53,0.05)":"transparent",borderLeft:`2px solid ${selected?"#FF6B35":"transparent"}`}}
      onMouseEnter={e=>!selected&&(e.currentTarget.style.background="rgba(255,255,255,0.02)")}
      onMouseLeave={e=>!selected&&(e.currentTarget.style.background="transparent")}>
      {/* Checkbox select */}
      <input type="checkbox" checked={selected} onChange={()=>onSelect(task.id)} style={{accentColor:"#FF6B35",width:14,height:14,cursor:"pointer"}} />
      {/* Done toggle */}
      <div onClick={()=>onToggle(task)} style={{width:18,height:18,borderRadius:"50%",border:`2px solid ${task.done?"#10B981":"rgba(255,255,255,0.2)"}`,background:task.done?"#10B981":"transparent",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",flexShrink:0,transition:"all 0.2s"}}>
        {task.done&&<span style={{color:"#fff",fontSize:10,fontWeight:900}}>✓</span>}
      </div>
      {/* Title */}
      <div onClick={()=>onEdit(task)} style={{cursor:"pointer",minWidth:0}}>
        <div style={{display:"flex",alignItems:"center",gap:7}}>
          {task.coverColor&&<div style={{width:8,height:8,borderRadius:"50%",background:task.coverColor,flexShrink:0}}/>}
          <span style={{fontSize:13,fontWeight:600,color:task.done?"#4B5563":"#E5E7EB",textDecoration:task.done?"line-through":"none",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{task.title}</span>
          {task.points>0&&<span style={{fontSize:9,padding:"1px 5px",background:"rgba(129,140,248,0.15)",color:"#818CF8",borderRadius:10,fontWeight:800,flexShrink:0}}>{task.points}pt</span>}
          {task.recurring&&task.recurring!=="none"&&<span style={{fontSize:9,color:"#6B7280"}}>🔄</span>}
        </div>
        <div style={{display:"flex",gap:5,marginTop:3,flexWrap:"wrap"}}>
          {(task.tags||[]).slice(0,3).map(tag=><span key={tag} style={{fontSize:10,padding:"1px 6px",background:"rgba(255,107,53,0.08)",color:"#FF8C5A",borderRadius:10}}>#{tag}</span>)}
          {subtaskTotal>0&&<span style={{fontSize:10,color:"#6B7280"}}>☐ {subtaskDone}/{subtaskTotal}</span>}
          {task.customFields?.url&&<span style={{fontSize:10,color:"#818CF8"}}>🔗</span>}
        </div>
      </div>
      {/* Status */}
      <span style={{fontSize:10,padding:"3px 8px",background:`${status.color}18`,color:status.color,borderRadius:20,fontWeight:700,textAlign:"center",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{status.label}</span>
      {/* Due */}
      <span style={{fontSize:11,color:isOverdue?"#F43F5E":isToday?"#F59E0B":"#6B7280",fontWeight:isOverdue||isToday?700:400}}>{task.due?fmt(task.due):"—"}</span>
      {/* Priority */}
      <span style={{fontSize:10,padding:"2px 8px",background:PRI_BG[task.priority]||"rgba(107,114,128,0.1)",color:PRI_COLOR[task.priority]||"#6B7280",borderRadius:20,fontWeight:700,textAlign:"center"}}>{task.priority}</span>
      {/* Est time */}
      <span style={{fontSize:11,color:"#6B7280"}}>{task.estimatedTime?`${task.estimatedTime}m`:"—"}</span>
      {/* Actions */}
      <div style={{display:"flex",gap:3}}>
        <button onClick={()=>onEdit(task)} style={{background:"transparent",border:"none",color:"#4B5563",cursor:"pointer",fontSize:13,padding:"2px",borderRadius:4,transition:"color 0.1s"}} onMouseEnter={e=>e.currentTarget.style.color="#818CF8"} onMouseLeave={e=>e.currentTarget.style.color="#4B5563"}>✏️</button>
        <button onClick={()=>onDelete(task.id)} style={{background:"transparent",border:"none",color:"#4B5563",cursor:"pointer",fontSize:13,padding:"2px",borderRadius:4,transition:"color 0.1s"}} onMouseEnter={e=>e.currentTarget.style.color="#F43F5E"} onMouseLeave={e=>e.currentTarget.style.color="#4B5563"}>🗑</button>
      </div>
    </div>
  );
}

// ─── KANBAN VIEW ─────────────────────────────────────────────────────────────
function KanbanView({ tasks, statuses, onEdit, onStatusChange, onToggle }) {
  const [dragging, setDragging] = useState(null);
  return (
    <div style={{display:"grid",gridTemplateColumns:`repeat(${statuses.length},1fr)`,gap:12,alignItems:"start"}}>
      {statuses.map(status=>{
        const cols = tasks.filter(t=>t.status===status.id||(status.id==="todo"&&!t.status));
        return (
          <div key={status.id}
            onDragOver={e=>e.preventDefault()}
            onDrop={e=>{e.preventDefault();if(dragging)onStatusChange(dragging,status.id);}}>
            {/* Column header */}
            <div style={{display:"flex",alignItems:"center",gap:8,padding:"10px 12px",marginBottom:8}}>
              <div style={{width:8,height:8,borderRadius:"50%",background:status.color}}/>
              <span style={{fontSize:12,fontWeight:800,color:"#9CA3AF",textTransform:"uppercase",letterSpacing:"0.5px"}}>{status.label}</span>
              <span style={{marginLeft:"auto",fontSize:10,background:"rgba(255,255,255,0.06)",color:"#6B7280",borderRadius:20,padding:"1px 7px",fontWeight:700}}>{cols.length}</span>
            </div>
            {/* Cards */}
            <div style={{display:"flex",flexDirection:"column",gap:8,minHeight:60}}>
              {cols.map(task=>(
                <div key={task.id} draggable onDragStart={()=>setDragging(task)} onDragEnd={()=>setDragging(null)}
                  onClick={()=>onEdit(task)}
                  style={{background:"#13131F",border:"1px solid rgba(255,255,255,0.06)",borderLeft:`3px solid ${PRI_COLOR[task.priority]||"#6B7280"}`,borderRadius:11,padding:"11px 13px",cursor:"pointer",transition:"all 0.15s",opacity:dragging?.id===task.id?0.4:1}}
                  onMouseEnter={e=>{e.currentTarget.style.background="#1A1A2E";e.currentTarget.style.borderColor="rgba(255,255,255,0.1)";}}
                  onMouseLeave={e=>{e.currentTarget.style.background="#13131F";e.currentTarget.style.borderColor="rgba(255,255,255,0.06)";}}>
                  {task.coverColor&&<div style={{height:3,borderRadius:3,background:task.coverColor,marginBottom:8,marginLeft:-13,marginRight:-13,marginTop:-11,borderRadius:"9px 9px 0 0"}}/>}
                  <div style={{fontSize:13,fontWeight:600,color:task.done?"#6B7280":"#E5E7EB",textDecoration:task.done?"line-through":"none",marginBottom:8,lineHeight:1.4}}>{task.title}</div>
                  <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:task.subtasks?.length?8:0}}>
                    {(task.tags||[]).slice(0,2).map(tag=><span key={tag} style={{fontSize:10,padding:"1px 7px",background:"rgba(255,107,53,0.08)",color:"#FF8C5A",borderRadius:10}}>#{tag}</span>)}
                    {task.points>0&&<span style={{fontSize:10,padding:"1px 6px",background:"rgba(129,140,248,0.12)",color:"#818CF8",borderRadius:10,fontWeight:700}}>{task.points}pt</span>}
                  </div>
                  {(task.subtasks||[]).length>0&&(
                    <div style={{marginBottom:8}}>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                        <span style={{fontSize:10,color:"#6B7280"}}>Subtasks</span>
                        <span style={{fontSize:10,color:"#10B981",fontWeight:700}}>{(task.subtasks||[]).filter(s=>s.done).length}/{(task.subtasks||[]).length}</span>
                      </div>
                      <div style={{height:3,background:"rgba(255,255,255,0.05)",borderRadius:3,overflow:"hidden"}}>
                        <div style={{height:"100%",background:"#10B981",borderRadius:3,width:`${(task.subtasks||[]).length?Math.round((task.subtasks||[]).filter(s=>s.done).length/(task.subtasks||[]).length*100):0}%`,transition:"width 0.4s"}}/>
                      </div>
                    </div>
                  )}
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                    <span style={{fontSize:10,color:task.due&&task.due<todayStr()?"#F43F5E":task.due===todayStr()?"#F59E0B":"#4B5563"}}>{task.due?fmt(task.due):"No due date"}</span>
                    <div style={{display:"flex",gap:4,alignItems:"center"}}>
                      {task.estimatedTime&&<span style={{fontSize:10,color:"#4B5563"}}>⏱{task.estimatedTime}m</span>}
                      <div onClick={e=>{e.stopPropagation();onToggle(task);}} style={{width:18,height:18,borderRadius:"50%",border:`1.5px solid ${task.done?"#10B981":"rgba(255,255,255,0.2)"}`,background:task.done?"#10B981":"transparent",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",transition:"all 0.2s"}}>
                        {task.done&&<span style={{color:"#fff",fontSize:9,fontWeight:900}}>✓</span>}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {cols.length===0&&<div style={{height:60,border:"1px dashed rgba(255,255,255,0.05)",borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",color:"#2A2A3A",fontSize:12}}>Drop here</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── SPRINT VIEW ──────────────────────────────────────────────────────────────
function SprintView({ tasks, onEdit, onToggle, statuses }) {
  const sprints = [
    {id:"backlog", label:"📦 Backlog", color:"#6B7280"},
    {id:"sprint-1",label:"🏃 Sprint 1", color:"#FF6B35"},
    {id:"sprint-2",label:"🏃 Sprint 2", color:"#818CF8"},
  ];
  const [open, setOpen] = useState({backlog:true,"sprint-1":true,"sprint-2":false});

  const getPoints = (tasks) => tasks.reduce((s,t)=>s+(t.points||0),0);

  return (
    <div style={{display:"flex",flexDirection:"column",gap:10}}>
      {sprints.map(sprint=>{
        const sprintTasks = sprint.id==="backlog"
          ? tasks.filter(t=>!t.sprintId||t.sprintId==="backlog")
          : tasks.filter(t=>t.sprintId===sprint.id);
        const doneTasks = sprintTasks.filter(t=>t.done);
        const totalPts = getPoints(sprintTasks);
        const donePts = getPoints(doneTasks);
        return (
          <div key={sprint.id} style={{background:"#0A0A14",border:"1px solid rgba(255,255,255,0.05)",borderRadius:14,overflow:"hidden"}}>
            <div onClick={()=>setOpen(o=>({...o,[sprint.id]:!o[sprint.id]}))} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 16px",cursor:"pointer",background:"rgba(255,255,255,0.01)"}}>
              <span style={{fontSize:12,color:"#4B5563",transition:"transform 0.2s",transform:open[sprint.id]?"rotate(90deg)":"none"}}>▶</span>
              <div style={{width:8,height:8,borderRadius:"50%",background:sprint.color}}/>
              <span style={{fontFamily:"'Cabinet Grotesk',sans-serif",fontSize:14,fontWeight:800,flex:1}}>{sprint.label}</span>
              <div style={{display:"flex",gap:10,fontSize:12,color:"#6B7280"}}>
                <span>{sprintTasks.length} tasks</span>
                {totalPts>0&&<span style={{color:"#818CF8",fontWeight:700}}>{donePts}/{totalPts} pts</span>}
                <span style={{color:sprint.id!=="backlog"?"#10B981":"#6B7280"}}>{sprintTasks.length?Math.round(doneTasks.length/sprintTasks.length*100):0}%</span>
              </div>
              {sprint.id!=="backlog"&&totalPts>0&&(
                <div style={{width:60,height:4,background:"rgba(255,255,255,0.05)",borderRadius:4,overflow:"hidden"}}>
                  <div style={{height:"100%",background:sprint.color,borderRadius:4,width:`${Math.round(donePts/totalPts*100)}%`}}/>
                </div>
              )}
            </div>
            {open[sprint.id]&&(
              <div>
                {sprintTasks.length===0&&<div style={{padding:"16px",textAlign:"center",color:"#2A2A3A",fontSize:12}}>No tasks in {sprint.label}</div>}
                {sprintTasks.map(task=>(
                  <div key={task.id} onClick={()=>onEdit(task)} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 16px",borderTop:"1px solid rgba(255,255,255,0.03)",cursor:"pointer",transition:"background 0.1s"}}
                    onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.02)"}
                    onMouseLeave={e=>e.currentTarget.style.background=""}>
                    <div onClick={e=>{e.stopPropagation();onToggle(task);}} style={{width:16,height:16,borderRadius:"50%",border:`1.5px solid ${task.done?"#10B981":"rgba(255,255,255,0.2)"}`,background:task.done?"#10B981":"transparent",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",flexShrink:0}}>
                      {task.done&&<span style={{color:"#fff",fontSize:8,fontWeight:900}}>✓</span>}
                    </div>
                    <span style={{fontSize:13,flex:1,color:task.done?"#4B5563":"#E5E7EB",textDecoration:task.done?"line-through":"none",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{task.title}</span>
                    {task.points>0&&<span style={{fontSize:10,padding:"1px 6px",background:"rgba(129,140,248,0.12)",color:"#818CF8",borderRadius:10,fontWeight:700,flexShrink:0}}>{task.points}pt</span>}
                    <span style={{fontSize:10,padding:"2px 7px",background:PRI_BG[task.priority],color:PRI_COLOR[task.priority],borderRadius:12,fontWeight:700,flexShrink:0}}>{task.priority}</span>
                    {task.due&&<span style={{fontSize:11,color:task.due<todayStr()?"#F43F5E":"#6B7280",flexShrink:0}}>{fmt(task.due)}</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── MATRIX (Eisenhower) ─────────────────────────────────────────────────────
function MatrixView({ tasks, onEdit, onToggle }) {
  const quadrants = [
    {u:"urgent",i:"important",      label:"DO FIRST 🔥",   color:"#F43F5E", bg:"rgba(244,63,94,0.06)"},
    {u:"not-urgent",i:"important",  label:"SCHEDULE 📅",   color:"#818CF8", bg:"rgba(129,140,248,0.06)"},
    {u:"urgent",i:"not-important",  label:"DELEGATE 👥",   color:"#F59E0B", bg:"rgba(245,158,11,0.06)"},
    {u:"not-urgent",i:"not-important",label:"ELIMINATE 🗑",color:"#6B7280", bg:"rgba(107,114,128,0.06)"},
  ];
  return (
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,height:500}}>
      {quadrants.map(q=>{
        const qTasks = tasks.filter(t=>(t.urgency||"not-urgent")===q.u&&(t.importance||"important")===q.i);
        return (
          <div key={q.label} style={{background:q.bg,border:`1px solid ${q.color}22`,borderRadius:14,padding:14,overflow:"auto"}}>
            <div style={{fontSize:11,fontWeight:900,color:q.color,textTransform:"uppercase",letterSpacing:"1px",marginBottom:12}}>{q.label} <span style={{opacity:0.6}}>({qTasks.length})</span></div>
            <div style={{display:"flex",flexDirection:"column",gap:7}}>
              {qTasks.map(t=>(
                <div key={t.id} onClick={()=>onEdit(t)} style={{display:"flex",alignItems:"center",gap:8,padding:"7px 10px",background:"rgba(0,0,0,0.3)",borderRadius:9,cursor:"pointer",transition:"background 0.1s"}}
                  onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.04)"}
                  onMouseLeave={e=>e.currentTarget.style.background="rgba(0,0,0,0.3)"}>
                  <div onClick={e=>{e.stopPropagation();onToggle(t);}} style={{width:16,height:16,borderRadius:"50%",border:`1.5px solid ${t.done?q.color:"rgba(255,255,255,0.2)"}`,background:t.done?q.color:"transparent",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",flexShrink:0}}>
                    {t.done&&<span style={{color:"#fff",fontSize:8,fontWeight:900}}>✓</span>}
                  </div>
                  <span style={{fontSize:12,flex:1,color:t.done?"#4B5563":"#E5E7EB",textDecoration:t.done?"line-through":"none",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.title}</span>
                  {t.due&&<span style={{fontSize:10,color:"#6B7280",flexShrink:0}}>{fmt(t.due)}</span>}
                </div>
              ))}
              {qTasks.length===0&&<div style={{textAlign:"center",color:q.color,opacity:0.3,fontSize:12,padding:"12px 0"}}>Empty</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── BULK ACTION BAR ──────────────────────────────────────────────────────────
function BulkBar({ count, onMarkDone, onDelete, onSetPriority, onClear }) {
  return (
    <div style={{position:"fixed",bottom:24,left:"50%",transform:"translateX(-50%)",background:"#1A1A2E",border:"1px solid rgba(255,255,255,0.12)",borderRadius:16,padding:"10px 18px",display:"flex",alignItems:"center",gap:12,boxShadow:"0 20px 60px rgba(0,0,0,0.7)",zIndex:999,animation:"slideUp 0.2s ease"}}>
      <span style={{fontSize:13,fontWeight:700,color:"#F3F4F6"}}>{count} selected</span>
      <div style={{width:1,height:20,background:"rgba(255,255,255,0.1)"}}/>
      <button onClick={onMarkDone} style={{padding:"6px 12px",background:"rgba(16,185,129,0.15)",border:"1px solid rgba(16,185,129,0.3)",borderRadius:8,color:"#10B981",cursor:"pointer",fontSize:12,fontWeight:700,fontFamily:"inherit"}}>✓ Mark Done</button>
      <select onChange={e=>{if(e.target.value)onSetPriority(e.target.value);}} defaultValue="" style={{padding:"6px 10px",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:8,color:"#9CA3AF",cursor:"pointer",fontFamily:"inherit",fontSize:12}}>
        <option value="">Set Priority...</option>
        <option value="urgent">🔴 Urgent</option>
        <option value="high">🟠 High</option>
        <option value="medium">🟡 Medium</option>
        <option value="low">🟢 Low</option>
      </select>
      <button onClick={onDelete} style={{padding:"6px 12px",background:"rgba(244,63,94,0.15)",border:"1px solid rgba(244,63,94,0.3)",borderRadius:8,color:"#F43F5E",cursor:"pointer",fontSize:12,fontWeight:700,fontFamily:"inherit"}}>🗑 Delete</button>
      <button onClick={onClear} style={{padding:"6px 10px",background:"transparent",border:"1px solid rgba(255,255,255,0.08)",borderRadius:8,color:"#6B7280",cursor:"pointer",fontSize:12,fontFamily:"inherit"}}>✕</button>
    </div>
  );
}

// ─── MAIN TASKS PAGE ──────────────────────────────────────────────────────────
export default function TasksPage({ tasks=[], projects=[], loading=false }) {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [projectFilter, setProjectFilter] = useState("all");
  const [tagFilter, setTagFilter] = useState("");
  const [sortBy, setSortBy] = useState("due");
  const [sortDir, setSortDir] = useState("asc");
  const [view, setView] = useState("list");
  const [selected, setSelected] = useState(new Set());
  const [groupBy, setGroupBy] = useState("none");
  const [statuses] = useState(DEFAULT_STATUSES);

  const allTags = useMemo(()=>[...new Set(tasks.flatMap(t=>t.tags||[]))],[tasks]);

  const openEdit = t => { setEditTask(t); setShowForm(true); };

  const handleSave = async (form) => {
    if (editTask?.id) { await updateTask(user.uid,editTask.id,form); toast("Updated! ✅"); }
    else { await addTask(user.uid,{...form,done:false}); toast("Task added! 🎉","success"); }
  };
  const handleToggle = async t => {
    const d = !t.done;
    await updateTask(user.uid,t.id,{done:d,status:d?"done":"todo",completedAt:d?new Date().toISOString():null});
  };
  const handleDelete = async id => {
    if(!window.confirm("Delete this task?")) return;
    await deleteTask(user.uid,id); toast("Deleted!");
    setSelected(s=>{const n=new Set(s);n.delete(id);return n;});
  };
  const handleStatusChange = async (t,status) => await updateTask(user.uid,t.id,{status,done:status==="done"});
  const toggleSelect = id => setSelected(s=>{const n=new Set(s);n.has(id)?n.delete(id):n.add(id);return n;});
  const selectAll = () => setSelected(new Set(filtered.map(t=>t.id)));
  const clearSelect = () => setSelected(new Set());

  const bulkDone = async () => {
    await Promise.all([...selected].map(id=>updateTask(user.uid,id,{done:true,status:"done"})));
    toast(`✅ ${selected.size} tasks marked done!`,"success"); clearSelect();
  };
  const bulkDelete = async () => {
    if(!window.confirm(`Delete ${selected.size} tasks?`)) return;
    await Promise.all([...selected].map(id=>deleteTask(user.uid,id)));
    toast(`🗑 ${selected.size} tasks deleted!`); clearSelect();
  };
  const bulkPriority = async (p) => {
    await Promise.all([...selected].map(id=>updateTask(user.uid,id,{priority:p})));
    toast(`Updated priority for ${selected.size} tasks!`,"success"); clearSelect();
  };

  // Filter & sort
  let filtered = tasks.filter(t=>{
    if(filter==="pending") return !t.done;
    if(filter==="completed") return t.done;
    if(filter==="overdue") return !t.done&&t.due&&t.due<todayStr();
    if(filter==="today") return t.due===todayStr();
    if(filter==="tomorrow") { const tm=new Date();tm.setDate(tm.getDate()+1);return t.due===tm.toISOString().slice(0,10); }
    if(filter==="no-due") return !t.due;
    return true;
  });
  if(priorityFilter!=="all") filtered=filtered.filter(t=>t.priority===priorityFilter);
  if(projectFilter!=="all") filtered=filtered.filter(t=>t.projectId===projectFilter);
  if(tagFilter) filtered=filtered.filter(t=>(t.tags||[]).includes(tagFilter));
  if(search) filtered=filtered.filter(t=>t.title?.toLowerCase().includes(search.toLowerCase())||t.desc?.toLowerCase().includes(search.toLowerCase())||(t.tags||[]).some(tag=>tag.includes(search.toLowerCase())));

  filtered = [...filtered].sort((a,b)=>{
    let cmp=0;
    if(sortBy==="due") cmp=(a.due||"zzzz").localeCompare(b.due||"zzzz");
    else if(sortBy==="priority") cmp=["urgent","high","medium","low"].indexOf(a.priority)-["urgent","high","medium","low"].indexOf(b.priority);
    else if(sortBy==="title") cmp=(a.title||"").localeCompare(b.title||"");
    else if(sortBy==="created") cmp=0;
    else if(sortBy==="points") cmp=(b.points||0)-(a.points||0);
    return sortDir==="asc"?cmp:-cmp;
  });

  const counts = {
    all:tasks.length, today:tasks.filter(t=>t.due===todayStr()).length,
    pending:tasks.filter(t=>!t.done).length, completed:tasks.filter(t=>t.done).length,
    overdue:tasks.filter(t=>!t.done&&t.due&&t.due<todayStr()).length,
  };
  const completionPct = tasks.length?Math.round(tasks.filter(t=>t.done).length/tasks.length*100):0;

  if(loading) return <div style={{display:"flex",justifyContent:"center",padding:40}}><div style={{width:32,height:32,borderRadius:"50%",border:"3px solid #1A1A26",borderTopColor:"#FF6B35",animation:"spin 0.7s linear infinite"}}/></div>;

  const VIEWS = [{id:"list",icon:"☰",label:"List"},{id:"kanban",icon:"⬛",label:"Board"},{id:"sprint",icon:"🏃",label:"Sprint"},{id:"matrix",icon:"⊞",label:"Matrix"}];

  return (
    <div style={{maxWidth:1200,margin:"0 auto"}}>
      {/* ── HEADER ── */}
      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:18,flexWrap:"wrap"}}>
        {/* Search */}
        <div style={{flex:1,minWidth:200,position:"relative"}}>
          <span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",color:"#4B5563",fontSize:14,pointerEvents:"none"}}>🔍</span>
          <input placeholder="Search tasks, tags, descriptions..." value={search} onChange={e=>setSearch(e.target.value)}
            style={{...inp,paddingLeft:36,fontSize:13}} />
        </div>
        {/* Filters */}
        <select value={priorityFilter} onChange={e=>setPriorityFilter(e.target.value)} style={{...inp,width:"auto",padding:"9px 12px",fontSize:12}}>
          <option value="all">All Priorities</option>
          <option value="urgent">🔴 Urgent</option>
          <option value="high">🟠 High</option>
          <option value="medium">🟡 Medium</option>
          <option value="low">🟢 Low</option>
        </select>
        {projects.length>0&&(
          <select value={projectFilter} onChange={e=>setProjectFilter(e.target.value)} style={{...inp,width:"auto",padding:"9px 12px",fontSize:12}}>
            <option value="all">All Projects</option>
            {projects.map(p=><option key={p.id} value={p.id}>{p.emoji||"📁"} {p.name}</option>)}
          </select>
        )}
        <select value={sortBy} onChange={e=>setSortBy(e.target.value)} style={{...inp,width:"auto",padding:"9px 12px",fontSize:12}}>
          <option value="due">Sort: Due Date</option>
          <option value="priority">Sort: Priority</option>
          <option value="title">Sort: Title</option>
          <option value="points">Sort: Points</option>
        </select>
        <button onClick={()=>setSortDir(d=>d==="asc"?"desc":"asc")} style={{padding:"9px 10px",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:9,color:"#6B7280",cursor:"pointer",fontSize:14}}>
          {sortDir==="asc"?"↑":"↓"}
        </button>
        {/* View switcher */}
        <div style={{display:"flex",background:"#13131F",borderRadius:10,padding:3,gap:2,border:"1px solid rgba(255,255,255,0.06)"}}>
          {VIEWS.map(v=>(
            <button key={v.id} onClick={()=>setView(v.id)} style={{padding:"6px 12px",border:"none",borderRadius:7,cursor:"pointer",background:view===v.id?"rgba(255,107,53,0.15)":"transparent",color:view===v.id?"#FF6B35":"#6B7280",fontSize:11,fontWeight:700,fontFamily:"inherit",transition:"all 0.15s"}}>{v.icon} {v.label}</button>
          ))}
        </div>
        <button onClick={()=>{setEditTask(null);setShowForm(true);}} style={{padding:"9px 20px",background:"linear-gradient(135deg,#FF6B35,#FF8C5A)",border:"none",borderRadius:10,color:"#fff",fontWeight:800,fontSize:13,cursor:"pointer",fontFamily:"inherit",boxShadow:"0 4px 16px rgba(255,107,53,0.25)",whiteSpace:"nowrap"}}>
          + New Task
        </button>
      </div>

      {/* ── STATS BAR ── */}
      <div style={{display:"flex",gap:10,marginBottom:14,flexWrap:"wrap"}}>
        {[
          {id:"all",label:"All",count:counts.all,color:"#6B7280"},
          {id:"today",label:"⏰ Today",count:counts.today,color:"#F59E0B"},
          {id:"pending",label:"⏳ Pending",count:counts.pending,color:"#818CF8"},
          {id:"overdue",label:"⚠️ Overdue",count:counts.overdue,color:"#F43F5E"},
          {id:"completed",label:"✅ Done",count:counts.completed,color:"#10B981"},
          {id:"no-due",label:"📭 No Due",count:tasks.filter(t=>!t.due).length,color:"#4B5563"},
        ].map(f=>(
          <button key={f.id} onClick={()=>setFilter(f.id)} style={{padding:"5px 12px",border:`1px solid`,borderColor:filter===f.id?f.color:"rgba(255,255,255,0.06)",borderRadius:20,background:filter===f.id?`${f.color}14`:"transparent",color:filter===f.id?f.color:"#6B7280",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit",transition:"all 0.15s"}}>
            {f.label} {f.count>0&&<span style={{opacity:0.7}}>({f.count})</span>}
          </button>
        ))}
        {allTags.length>0&&allTags.slice(0,5).map(tag=>(
          <button key={tag} onClick={()=>setTagFilter(tagFilter===tag?"":tag)} style={{padding:"5px 10px",border:"1px solid",borderColor:tagFilter===tag?"#FF6B35":"rgba(255,255,255,0.06)",borderRadius:20,background:tagFilter===tag?"rgba(255,107,53,0.1)":"transparent",color:tagFilter===tag?"#FF6B35":"#4B5563",fontSize:11,cursor:"pointer",fontFamily:"inherit"}}>
            #{tag}
          </button>
        ))}
      </div>

      {/* ── PROGRESS BAR ── */}
      {tasks.length>0&&(
        <div style={{marginBottom:16,padding:"10px 14px",background:"#0A0A14",border:"1px solid rgba(255,255,255,0.05)",borderRadius:12,display:"flex",alignItems:"center",gap:12}}>
          <span style={{fontSize:12,color:"#6B7280",fontWeight:600}}>Overall Progress</span>
          <div style={{flex:1,height:6,background:"rgba(255,255,255,0.05)",borderRadius:4,overflow:"hidden"}}>
            <div style={{height:"100%",background:"linear-gradient(90deg,#10B981,#06B6D4)",borderRadius:4,width:`${completionPct}%`,transition:"width 1s ease",boxShadow:"0 0 10px rgba(16,185,129,0.4)"}}/>
          </div>
          <span style={{fontSize:12,fontWeight:800,color:"#10B981"}}>{completionPct}%</span>
          <span style={{fontSize:11,color:"#4B5563"}}>{tasks.filter(t=>t.done).length}/{tasks.length}</span>
          {view==="list"&&<><div style={{width:1,height:16,background:"rgba(255,255,255,0.06)"}}/>
          <button onClick={()=>selected.size===filtered.length?clearSelect():selectAll()} style={{padding:"3px 10px",background:"transparent",border:"1px solid rgba(255,255,255,0.08)",borderRadius:8,color:"#6B7280",fontSize:11,cursor:"pointer",fontFamily:"inherit",fontWeight:600}}>{selected.size===filtered.length?"Deselect All":"Select All"}</button></>}
        </div>
      )}

      {/* ── TABLE HEADER (list view) ── */}
      {view==="list"&&filtered.length>0&&(
        <div style={{display:"grid",gridTemplateColumns:"32px 20px 1fr 100px 80px 70px 60px 40px",gap:8,padding:"6px 14px",marginBottom:4,fontSize:10,fontWeight:800,color:"#4B5563",textTransform:"uppercase",letterSpacing:"0.8px"}}>
          <div/>
          <div/>
          <div>TASK</div>
          <div>STATUS</div>
          <div>DUE</div>
          <div>PRIORITY</div>
          <div>EST</div>
          <div/>
        </div>
      )}

      {/* ── VIEWS ── */}
      {view==="list"&&(
        <div style={{background:"#0A0A14",border:"1px solid rgba(255,255,255,0.05)",borderRadius:14,overflow:"hidden"}}>
          {filtered.length===0&&<div style={{textAlign:"center",padding:"40px 20px",color:"#4B5563"}}><div style={{fontSize:40,marginBottom:8}}>📭</div><div style={{fontSize:14}}>No tasks found</div><div style={{fontSize:12,marginTop:4}}>{search?"Try a different search":"Add your first task!"}</div></div>}
          {filtered.map(task=>(
            <TaskRow key={task.id} task={task} selected={selected.has(task.id)} onSelect={toggleSelect} onToggle={handleToggle} onEdit={openEdit} onDelete={handleDelete} statuses={statuses} />
          ))}
        </div>
      )}
      {view==="kanban"&&<KanbanView tasks={filtered} statuses={statuses} onEdit={openEdit} onStatusChange={handleStatusChange} onToggle={handleToggle} />}
      {view==="sprint"&&<SprintView tasks={filtered} onEdit={openEdit} onToggle={handleToggle} statuses={statuses} />}
      {view==="matrix"&&<MatrixView tasks={filtered} onEdit={openEdit} onToggle={handleToggle} />}

      {/* ── BULK ACTION BAR ── */}
      {selected.size>0&&<BulkBar count={selected.size} onMarkDone={bulkDone} onDelete={bulkDelete} onSetPriority={bulkPriority} onClear={clearSelect} />}

      {/* ── TASK FORM ── */}
      {showForm&&<TaskFormModal initial={editTask} projects={projects} statuses={statuses} onSave={handleSave} onClose={()=>{setShowForm(false);setEditTask(null);}} />}
    </div>
  );
}
