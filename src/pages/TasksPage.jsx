// 📋 TasksPage v7 — ULTIMATE GOD MODE
// List · Kanban · Calendar · Timeline/Gantt · Table · MyTasks · Inbox
// Subtasks · Dependencies · Recurring · Time Tracking · Custom Fields · Relations
// NLP · Bulk Actions · Drag-Drop · 20+ Filters · Templates · Activity Log
import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { useAuth } from "../hooks/useAuth";
import { addTask, updateTask, deleteTask } from "../firebase/services";

// ─── UTILS ────────────────────────────────────────────────────────────────────
const uid  = () => Math.random().toString(36).slice(2,10);
const today = () => new Date().toISOString().split("T")[0];
const fmt   = d => { if (!d) return ""; try { return new Date(d+"T00:00").toLocaleDateString("en-IN",{month:"short",day:"numeric"}); } catch { return d; }};
const fmtFull = d => { if (!d) return ""; try { return new Date(d+"T00:00").toLocaleDateString("en-IN",{month:"short",day:"numeric",year:"numeric"}); } catch { return d; }};
const isOverdue = d => d && d < today();
const daysLeft  = d => { if (!d) return null; const diff = Math.ceil((new Date(d+"T00:00") - new Date()) / 86400000); return diff; };
const fmtMins = m => { if (!m) return "0m"; if (m < 60) return `${m}m`; return `${Math.floor(m/60)}h ${m%60}m`; };

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const PRIORITIES = [
  { id:"urgent", label:"Urgent",  color:"#F97316", bg:"rgba(249,115,22,0.12)" },
  { id:"high",   label:"High",    color:"#F43F5E", bg:"rgba(244,63,94,0.12)"  },
  { id:"medium", label:"Medium",  color:"#F59E0B", bg:"rgba(245,158,11,0.12)" },
  { id:"low",    label:"Low",     color:"#10B981", bg:"rgba(16,185,129,0.12)" },
  { id:"none",   label:"None",    color:"#6B7280", bg:"rgba(107,114,128,0.08)"},
];
const PRI = Object.fromEntries(PRIORITIES.map(p => [p.id, p]));

const DEFAULT_STATUSES = [
  { id:"inbox",       label:"Inbox",       color:"#6B7280", icon:"📥" },
  { id:"todo",        label:"To Do",       color:"#818CF8", icon:"⬜" },
  { id:"in-progress", label:"In Progress", color:"#F59E0B", icon:"🔄" },
  { id:"review",      label:"In Review",   color:"#06B6D4", icon:"👁" },
  { id:"blocked",     label:"Blocked",     color:"#F43F5E", icon:"🚫" },
  { id:"done",        label:"Done",        color:"#10B981", icon:"✅" },
];
const ST = Object.fromEntries(DEFAULT_STATUSES.map(s => [s.id, s]));

const TAGS_COLORS = ["#F43F5E","#F97316","#F59E0B","#10B981","#06B6D4","#818CF8","#8B5CF6","#EC4899","#14B8A6","#84CC16"];

const TEMPLATES = [
  { icon:"🐛", label:"Bug Report",    priority:"high",   tags:["bug"],       estimatedTime:60,  desc:"**Steps to reproduce:**\n1. \n\n**Expected:**\n\n**Actual:**" },
  { icon:"✨", label:"Feature",       priority:"medium", tags:["feature"],   estimatedTime:120, desc:"**User story:** As a user, I want to...\n\n**Acceptance criteria:**\n- " },
  { icon:"📝", label:"Documentation", priority:"low",    tags:["docs"],      estimatedTime:30,  desc:"**Document:**\n\n**Sections:**\n1. " },
  { icon:"🔍", label:"Research",      priority:"medium", tags:["research"],  estimatedTime:90,  desc:"**Goal:**\n\n**Key questions:**\n1. " },
  { icon:"📞", label:"Meeting",       priority:"medium", tags:["meeting"],   estimatedTime:45,  desc:"**Agenda:**\n1. \n\n**Action items:**\n- " },
  { icon:"🚀", label:"Release",       priority:"urgent", tags:["release"],   estimatedTime:180, desc:"**Version:**\n\n**Changelog:**\n- " },
  { icon:"🎯", label:"Goal",          priority:"high",   tags:["goal"],      estimatedTime:0,   desc:"**Objective:**\n\n**Key Results:**\n1. \n2. \n3. " },
  { icon:"📊", label:"Report",        priority:"medium", tags:["report"],    estimatedTime:120, desc:"**Report Title:**\n\n**Summary:**\n\n**Key Findings:**\n- " },
];

const RECURRENCE = ["none","daily","weekdays","weekly","biweekly","monthly","yearly"];

const RELATION_TYPES = [
  { id:"blocks",    label:"Blocks",      icon:"🚧" },
  { id:"blocked_by",label:"Blocked by",  icon:"🚫" },
  { id:"related",   label:"Related to",  icon:"🔗" },
  { id:"duplicate", label:"Duplicate of",icon:"📋" },
  { id:"parent",    label:"Parent of",   icon:"📂" },
  { id:"child",     label:"Child of",    icon:"📄" },
];

const CUSTOM_FIELD_TYPES = [
  { id:"text",        label:"Text",        icon:"T" },
  { id:"number",      label:"Number",      icon:"#" },
  { id:"date",        label:"Date",        icon:"📅" },
  { id:"checkbox",    label:"Checkbox",    icon:"☑" },
  { id:"url",         label:"URL",         icon:"🔗" },
  { id:"select",      label:"Select",      icon:"▾" },
];

// ─── NLP PARSER ───────────────────────────────────────────────────────────────
function parseNLP(text) {
  let result = { title: text, due: "", priority: "medium", tags: [] };
  const t = text.toLowerCase();
  if (/urgent|asap|critical/.test(t)) result.priority = "urgent";
  else if (/\bhigh\b|important/.test(t)) result.priority = "high";
  else if (/\blow\b|someday|eventually/.test(t)) result.priority = "low";
  result.title = result.title.replace(/\b(urgent|asap|critical|high priority|low priority)\b/gi, "").trim();
  const now = new Date();
  if (/today/.test(t)) result.due = today();
  else if (/tomorrow/.test(t)) { const d = new Date(now); d.setDate(d.getDate()+1); result.due = d.toISOString().split("T")[0]; }
  else if (/next week/.test(t)) { const d = new Date(now); d.setDate(d.getDate()+7); result.due = d.toISOString().split("T")[0]; }
  else if (/monday|mon\b/.test(t)) { const d = new Date(now); d.setDate(d.getDate()+((1+7-d.getDay())%7||7)); result.due = d.toISOString().split("T")[0]; }
  else if (/tuesday|tue\b/.test(t)) { const d = new Date(now); d.setDate(d.getDate()+((2+7-d.getDay())%7||7)); result.due = d.toISOString().split("T")[0]; }
  else if (/wednesday|wed\b/.test(t)) { const d = new Date(now); d.setDate(d.getDate()+((3+7-d.getDay())%7||7)); result.due = d.toISOString().split("T")[0]; }
  else if (/thursday|thu\b/.test(t)) { const d = new Date(now); d.setDate(d.getDate()+((4+7-d.getDay())%7||7)); result.due = d.toISOString().split("T")[0]; }
  else if (/friday|fri\b/.test(t)) { const d = new Date(now); d.setDate(d.getDate()+((5+7-d.getDay())%7||7)); result.due = d.toISOString().split("T")[0]; }
  else if (/saturday|sat\b/.test(t)) { const d = new Date(now); d.setDate(d.getDate()+((6+7-d.getDay())%7||7)); result.due = d.toISOString().split("T")[0]; }
  const hashtags = text.match(/#(\w+)/g);
  if (hashtags) { result.tags = hashtags.map(h => h.slice(1)); result.title = result.title.replace(/#\w+/g, "").trim(); }
  result.title = result.title.replace(/\b(today|tomorrow|next week|next month|monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thu|fri|sat|sun)\b/gi, "").trim();
  result.title = result.title.replace(/\s+/g, " ").trim();
  return result;
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const inp = { background:"var(--input-bg)", border:"1px solid var(--border2)", borderRadius:10, color:"var(--text)", fontSize:13, padding:"9px 13px", fontFamily:"inherit", outline:"none", width:"100%", boxSizing:"border-box", transition:"border 0.15s" };
const lbl = { fontSize:11, fontWeight:700, color:"var(--text3)", display:"block", marginBottom:5, textTransform:"uppercase", letterSpacing:"0.5px" };
const btn = { padding:"8px 16px", border:"none", borderRadius:9, cursor:"pointer", fontSize:12, fontWeight:700, fontFamily:"inherit", transition:"all 0.15s" };

// ─── QUICK ADD ────────────────────────────────────────────────────────────────
function QuickAdd({ onAdd, projects }) {
  const [val, setVal] = useState("");
  const [nlp, setNlp] = useState(null);
  const [priority, setPriority] = useState("medium");
  const [priOpen, setPriOpen] = useState(false);
  const [projectId, setProjectId] = useState("");
  const ref = useRef();

  function handleChange(e) {
    setVal(e.target.value);
    if (e.target.value.length > 2) setNlp(parseNLP(e.target.value));
    else setNlp(null);
  }

  function handleSubmit(e) {
    e?.preventDefault();
    if (!val.trim()) return;
    const parsed = parseNLP(val);
    onAdd({ ...parsed, priority: priority !== "medium" ? priority : parsed.priority, projectId, status:"inbox" });
    setVal(""); setNlp(null); setPriority("medium");
    ref.current?.focus();
  }

  return (
    <form onSubmit={handleSubmit}
      style={{ display:"flex", gap:8, alignItems:"center", background:"var(--surface)", border:"2px solid var(--border2)", borderRadius:14, padding:"10px 14px", marginBottom:16, transition:"border 0.2s" }}
      onFocus={e => e.currentTarget.style.borderColor = "rgba(255,107,53,0.4)"}
      onBlur={e => e.currentTarget.style.borderColor = "var(--border2)"}>
      <span style={{ fontSize:18, color:"var(--accent)", flexShrink:0, lineHeight:1 }}>+</span>
      <input ref={ref} value={val} onChange={handleChange} className="quick-add-input"
        placeholder='Task add karo... "Meeting kal #work urgent"'
        style={{ flex:1, background:"transparent", border:"none", outline:"none", color:"var(--text)", fontSize:14, fontFamily:"inherit" }} />
      {nlp?.due && <span style={{ fontSize:11, padding:"2px 8px", background:"rgba(16,185,129,0.1)", color:"#10B981", borderRadius:20, fontWeight:700, flexShrink:0 }}>📅 {fmt(nlp.due)}</span>}
      {nlp?.tags?.length > 0 && nlp.tags.map(t => <span key={t} style={{ fontSize:11, padding:"2px 7px", background:"rgba(129,140,248,0.12)", color:"#818CF8", borderRadius:20, fontWeight:700, flexShrink:0 }}>#{t}</span>)}
      {/* Priority */}
      <div style={{ position:"relative", flexShrink:0 }}>
        <button type="button" onClick={() => setPriOpen(o => !o)}
          style={{ padding:"5px 10px", borderRadius:8, border:`1.5px solid ${PRI[priority]?.color}40`, background:PRI[priority]?.bg, color:PRI[priority]?.color, fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
          {PRI[priority]?.label} ▾
        </button>
        {priOpen && (
          <div style={{ position:"absolute", top:"calc(100% + 6px)", right:0, background:"var(--modal-bg)", border:"1px solid var(--border2)", borderRadius:10, overflow:"hidden", zIndex:999, boxShadow:"var(--shadow)", minWidth:110 }}>
            {PRIORITIES.map(p => (
              <div key={p.id} onClick={() => { setPriority(p.id); setPriOpen(false); }}
                style={{ padding:"8px 12px", cursor:"pointer", fontSize:12, fontWeight:700, color:p.color }}
                onMouseEnter={e => e.currentTarget.style.background="var(--hover-bg)"}
                onMouseLeave={e => e.currentTarget.style.background=""}>
                ● {p.label}
              </div>
            ))}
          </div>
        )}
      </div>
      {projects?.length > 0 && (
        <select value={projectId} onChange={e => setProjectId(e.target.value)}
          style={{ padding:"5px 8px", background:"var(--input-bg)", border:"1px solid var(--border)", borderRadius:8, color:"var(--text2)", fontSize:11, cursor:"pointer", fontFamily:"inherit", outline:"none", flexShrink:0 }}>
          <option value="">No Project</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      )}
      <button type="submit" style={{ ...btn, background:"var(--accent)", color:"#fff", padding:"7px 16px", flexShrink:0, boxShadow:"0 2px 10px rgba(255,107,53,0.3)" }}>Add</button>
    </form>
  );
}

// ─── TASK DETAIL DRAWER ───────────────────────────────────────────────────────
function TaskDrawer({ task, allTasks, projects, onSave, onDelete, onClose }) {
  const [form, setForm] = useState({ ...task });
  const [subtaskInput, setSubtaskInput] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [activeTab, setActiveTab] = useState("details");
  const [saving, setSaving] = useState(false);
  const [timeLogMin, setTimeLogMin] = useState("");
  const [timeLogNote, setTimeLogNote] = useState("");
  const [relType, setRelType] = useState("related");
  const [cfName, setCfName] = useState("");
  const [cfType, setCfType] = useState("text");
  const [cfValue, setCfValue] = useState("");
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function handleSave() {
    setSaving(true);
    await onSave(form);
    setSaving(false);
  }

  function addSubtask() {
    if (!subtaskInput.trim()) return;
    const st = { id:uid(), title:subtaskInput.trim(), done:false, createdAt:new Date().toISOString() };
    set("subtasks", [...(form.subtasks||[]), st]);
    setSubtaskInput("");
  }
  function toggleSubtask(id) { set("subtasks", (form.subtasks||[]).map(s => s.id===id ? {...s,done:!s.done} : s)); }
  function deleteSubtask(id) { set("subtasks", (form.subtasks||[]).filter(s => s.id!==id)); }

  function addTag() {
    const t = tagInput.trim().toLowerCase().replace(/\s+/g,"-");
    if (!t || (form.tags||[]).includes(t)) { setTagInput(""); return; }
    set("tags", [...(form.tags||[]), t]);
    setTagInput("");
  }

  function logTime() {
    if (!timeLogMin) return;
    const log = { id:uid(), minutes:parseInt(timeLogMin), note:timeLogNote, at:new Date().toISOString() };
    const newLogs = [...(form.timeLogs||[]), log];
    set("timeLogs", newLogs);
    set("timeSpent", newLogs.reduce((s,l) => s+l.minutes, 0));
    setTimeLogMin(""); setTimeLogNote("");
  }

  function addRelation(taskId) {
    if (!taskId) return;
    const rel = { id:uid(), taskId, type:relType };
    set("relations", [...(form.relations||[]), rel]);
  }

  function addCustomField() {
    if (!cfName.trim()) return;
    const cf = { id:uid(), name:cfName.trim(), type:cfType, value:cfValue };
    set("customFields", [...(form.customFields||[]), cf]);
    setCfName(""); setCfValue("");
  }

  function updateCfValue(id, value) {
    set("customFields", (form.customFields||[]).map(cf => cf.id===id ? {...cf,value} : cf));
  }

  const subtaskDone = (form.subtasks||[]).filter(s=>s.done).length;
  const subtaskTotal = (form.subtasks||[]).length;
  const subtaskPct = subtaskTotal ? Math.round(subtaskDone/subtaskTotal*100) : 0;

  const TABS = [
    { id:"details",  icon:"📋", label:"Details" },
    { id:"subtasks", icon:"☑",  label:`Sub${subtaskTotal ? ` (${subtaskDone}/${subtaskTotal})` : ""}` },
    { id:"relations",icon:"🔗", label:"Relations" },
    { id:"time",     icon:"⏱", label:"Time" },
    { id:"fields",   icon:"⚙", label:"Fields" },
    { id:"activity", icon:"📜", label:"Activity" },
  ];

  return (
    <div style={{ position:"fixed", inset:0, zIndex:9000, display:"flex" }} onClick={onClose}>
      <div style={{ flex:1, background:"rgba(0,0,0,0.5)", backdropFilter:"blur(4px)" }} />
      <div onClick={e => e.stopPropagation()}
        style={{ width:540, background:"var(--surface)", borderLeft:"1px solid var(--border)", display:"flex", flexDirection:"column", height:"100%", overflow:"hidden", animation:"slideInRight 0.22s ease" }}>

        {/* Header */}
        <div style={{ padding:"16px 20px", borderBottom:"1px solid var(--border)", display:"flex", alignItems:"flex-start", gap:10, flexShrink:0 }}>
          <div onClick={() => set("done", !form.done)}
            style={{ width:22, height:22, borderRadius:6, border:`2px solid ${form.done?"#10B981":"var(--border2)"}`, background:form.done?"#10B981":"transparent", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", flexShrink:0, transition:"all 0.15s", marginTop:2 }}>
            {form.done && <span style={{ color:"#fff", fontSize:11, fontWeight:900 }}>✓</span>}
          </div>
          <div style={{ flex:1 }}>
            <input value={form.title} onChange={e => set("title", e.target.value)}
              style={{ width:"100%", background:"transparent", border:"none", outline:"none", color:"var(--text)", fontSize:17, fontWeight:800, fontFamily:"inherit", textDecoration:form.done?"line-through":"none", opacity:form.done?0.5:1, boxSizing:"border-box" }} />
            <div style={{ display:"flex", gap:6, marginTop:5, flexWrap:"wrap" }}>
              <span style={{ fontSize:11, padding:"2px 8px", background:PRI[form.priority||"medium"]?.bg, color:PRI[form.priority||"medium"]?.color, borderRadius:20, fontWeight:700 }}>
                ● {PRI[form.priority||"medium"]?.label}
              </span>
              <span style={{ fontSize:11, padding:"2px 8px", background:`${ST[form.status||"inbox"]?.color}18`, color:ST[form.status||"inbox"]?.color, borderRadius:20, fontWeight:700 }}>
                {ST[form.status||"inbox"]?.icon} {ST[form.status||"inbox"]?.label}
              </span>
              {form.due && <span style={{ fontSize:11, color:isOverdue(form.due)?"#F43F5E":"var(--text3)" }}>📅 {fmt(form.due)}</span>}
              {form.recurring && form.recurring!=="none" && <span style={{ fontSize:11, color:"#818CF8" }}>🔄 {form.recurring}</span>}
            </div>
          </div>
          <button onClick={onClose} style={{ background:"transparent", border:"none", color:"var(--text3)", cursor:"pointer", fontSize:22, lineHeight:1, padding:4, flexShrink:0 }}>×</button>
        </div>

        {/* Tabs */}
        <div style={{ display:"flex", borderBottom:"1px solid var(--border)", flexShrink:0, overflowX:"auto" }}>
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              style={{ flex:"none", padding:"10px 12px", border:"none", background:"transparent", color:activeTab===tab.id?"var(--accent)":"var(--text3)", fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:"inherit", borderBottom:activeTab===tab.id?"2px solid var(--accent)":"2px solid transparent", transition:"all 0.15s", whiteSpace:"nowrap" }}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex:1, overflowY:"auto", padding:"16px 20px" }}>

          {/* DETAILS TAB */}
          {activeTab === "details" && (
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
              <div>
                <label style={lbl}>Description</label>
                <textarea value={form.desc||""} onChange={e => set("desc", e.target.value)}
                  placeholder="Task description, notes, links..."
                  style={{ ...inp, minHeight:80, resize:"vertical", lineHeight:1.6 }} />
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                <div>
                  <label style={lbl}>Status</label>
                  <select value={form.status||"inbox"} onChange={e => set("status", e.target.value)} style={inp}>
                    {DEFAULT_STATUSES.map(s => <option key={s.id} value={s.id} style={{ background:"var(--modal-bg)" }}>{s.icon} {s.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Priority</label>
                  <select value={form.priority||"medium"} onChange={e => set("priority", e.target.value)} style={{ ...inp, color:PRI[form.priority||"medium"]?.color }}>
                    {PRIORITIES.map(p => <option key={p.id} value={p.id} style={{ background:"var(--modal-bg)" }}>● {p.label}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                <div>
                  <label style={lbl}>Due Date</label>
                  <input type="date" value={form.due||""} onChange={e => set("due", e.target.value)} style={inp} />
                </div>
                <div>
                  <label style={lbl}>Due Time</label>
                  <input type="time" value={form.dueTime||""} onChange={e => set("dueTime", e.target.value)} style={inp} />
                </div>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                <div>
                  <label style={lbl}>Start Date</label>
                  <input type="date" value={form.startDate||""} onChange={e => set("startDate", e.target.value)} style={inp} />
                </div>
                <div>
                  <label style={lbl}>Recurring</label>
                  <select value={form.recurring||"none"} onChange={e => set("recurring", e.target.value)} style={inp}>
                    {RECURRENCE.map(r => <option key={r} value={r} style={{ background:"var(--modal-bg)", textTransform:"capitalize" }}>{r.charAt(0).toUpperCase()+r.slice(1)}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                <div>
                  <label style={lbl}>Project</label>
                  <select value={form.projectId||""} onChange={e => set("projectId", e.target.value)} style={inp}>
                    <option value="">No Project</option>
                    {projects?.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Assignee</label>
                  <input value={form.assignee||""} onChange={e => set("assignee", e.target.value)} placeholder="Name or email" style={inp} />
                </div>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                <div>
                  <label style={lbl}>Estimate (mins)</label>
                  <input type="number" min="0" value={form.estimatedTime||""} onChange={e => set("estimatedTime", parseInt(e.target.value)||0)} placeholder="e.g. 60" style={inp} />
                </div>
                <div>
                  <label style={lbl}>Story Points</label>
                  <input type="number" min="0" max="100" value={form.points||""} onChange={e => set("points", parseInt(e.target.value)||0)} placeholder="e.g. 5" style={inp} />
                </div>
              </div>
              {/* Tags */}
              <div>
                <label style={lbl}>Tags</label>
                <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:8 }}>
                  {(form.tags||[]).map((tag, i) => (
                    <span key={tag} style={{ fontSize:12, padding:"3px 10px", background:`${TAGS_COLORS[i%TAGS_COLORS.length]}18`, color:TAGS_COLORS[i%TAGS_COLORS.length], borderRadius:20, fontWeight:700, display:"flex", alignItems:"center", gap:5 }}>
                      #{tag}
                      <span onClick={() => set("tags", (form.tags||[]).filter(t=>t!==tag))} style={{ cursor:"pointer", opacity:0.7, fontSize:14 }}>×</span>
                    </span>
                  ))}
                </div>
                <div style={{ display:"flex", gap:8 }}>
                  <input value={tagInput} onChange={e => setTagInput(e.target.value)}
                    onKeyDown={e => { if (e.key==="Enter"||e.key===",") { e.preventDefault(); addTag(); } }}
                    placeholder="Tag add karo (Enter se)..." style={{ ...inp, flex:1 }} />
                  <button onClick={addTag} style={{ ...btn, background:"var(--surface3)", color:"var(--text2)" }}>Add</button>
                </div>
              </div>
            </div>
          )}

          {/* SUBTASKS TAB */}
          {activeTab === "subtasks" && (
            <div>
              {subtaskTotal > 0 && (
                <div style={{ marginBottom:16 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                    <span style={{ fontSize:12, color:"var(--text3)" }}>{subtaskDone}/{subtaskTotal} complete</span>
                    <span style={{ fontSize:12, fontWeight:700, color:"#10B981" }}>{subtaskPct}%</span>
                  </div>
                  <div style={{ height:6, background:"var(--surface3)", borderRadius:6, overflow:"hidden" }}>
                    <div style={{ height:"100%", width:`${subtaskPct}%`, background:"linear-gradient(90deg,#10B981,#06B6D4)", borderRadius:6, transition:"width 0.4s" }} />
                  </div>
                </div>
              )}
              <div style={{ display:"flex", flexDirection:"column", gap:6, marginBottom:14 }}>
                {(form.subtasks||[]).map(st => (
                  <div key={st.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 12px", background:"var(--surface2)", borderRadius:10, border:"1px solid var(--border)" }}>
                    <div onClick={() => toggleSubtask(st.id)}
                      style={{ width:16, height:16, borderRadius:4, border:`2px solid ${st.done?"#10B981":"var(--border2)"}`, background:st.done?"#10B981":"transparent", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", flexShrink:0 }}>
                      {st.done && <span style={{ color:"#fff", fontSize:9, fontWeight:900 }}>✓</span>}
                    </div>
                    <span style={{ flex:1, fontSize:13, color:"var(--text)", textDecoration:st.done?"line-through":"none", opacity:st.done?0.5:1 }}>{st.title}</span>
                    <button onClick={() => deleteSubtask(st.id)} style={{ background:"transparent", border:"none", color:"var(--text3)", cursor:"pointer", fontSize:15 }}
                      onMouseEnter={e => e.currentTarget.style.color="#F43F5E"}
                      onMouseLeave={e => e.currentTarget.style.color="var(--text3)"}>×</button>
                  </div>
                ))}
              </div>
              <div style={{ display:"flex", gap:8 }}>
                <input value={subtaskInput} onChange={e => setSubtaskInput(e.target.value)}
                  onKeyDown={e => { if (e.key==="Enter") { e.preventDefault(); addSubtask(); }}}
                  placeholder="Subtask add karo..." style={{ ...inp, flex:1 }} autoFocus />
                <button onClick={addSubtask} style={{ ...btn, background:"var(--accent)", color:"#fff" }}>Add</button>
              </div>
            </div>
          )}

          {/* RELATIONS TAB */}
          {activeTab === "relations" && (
            <div>
              <div style={{ marginBottom:16, padding:"12px", background:"var(--surface2)", borderRadius:12, border:"1px solid var(--border)" }}>
                <div style={{ fontSize:12, fontWeight:700, color:"var(--text2)", marginBottom:10 }}>🔗 Relation Add Karo</div>
                <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                  <select value={relType} onChange={e => setRelType(e.target.value)}
                    style={{ ...inp, flex:"0 0 auto", width:"auto" }}>
                    {RELATION_TYPES.map(r => <option key={r.id} value={r.id}>{r.icon} {r.label}</option>)}
                  </select>
                  <select onChange={e => { addRelation(e.target.value); e.target.value=""; }}
                    style={{ ...inp, flex:1 }}>
                    <option value="">— Task select karo —</option>
                    {allTasks.filter(t => t.id !== form.id).map(t => (
                      <option key={t.id} value={t.id} style={{ background:"var(--modal-bg)" }}>{t.title?.slice(0,40)}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {(form.relations||[]).length === 0 && (
                  <div style={{ textAlign:"center", padding:30, color:"var(--text3)", fontSize:13 }}>Koi relation nahi hai abhi</div>
                )}
                {(form.relations||[]).map(rel => {
                  const relTask = allTasks.find(t => t.id === rel.taskId);
                  const relMeta = RELATION_TYPES.find(r => r.id === rel.type);
                  return relTask ? (
                    <div key={rel.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 12px", background:"var(--surface2)", borderRadius:10, border:"1px solid var(--border)" }}>
                      <span style={{ fontSize:16 }}>{relMeta?.icon}</span>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:11, color:"var(--text3)", fontWeight:600, textTransform:"uppercase" }}>{relMeta?.label}</div>
                        <div style={{ fontSize:13, color:"var(--text)", marginTop:2 }}>{relTask.title}</div>
                      </div>
                      <span style={{ fontSize:11, padding:"2px 7px", background:PRI[relTask.priority||"none"]?.bg, color:PRI[relTask.priority||"none"]?.color, borderRadius:20, fontWeight:700 }}>{PRI[relTask.priority||"none"]?.label}</span>
                      <button onClick={() => set("relations", (form.relations||[]).filter(r => r.id!==rel.id))}
                        style={{ background:"transparent", border:"none", color:"var(--text3)", cursor:"pointer", fontSize:15 }}>×</button>
                    </div>
                  ) : null;
                })}
              </div>
            </div>
          )}

          {/* TIME TRACKING TAB */}
          {activeTab === "time" && (
            <div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10, marginBottom:16 }}>
                {[
                  { label:"Estimated", val:fmtMins(form.estimatedTime), color:"#818CF8" },
                  { label:"Logged",    val:fmtMins(form.timeSpent),     color:"#06B6D4" },
                  { label:"Remaining", val:fmtMins(Math.max(0,(form.estimatedTime||0)-(form.timeSpent||0))), color:"#FF6B35" },
                ].map(s => (
                  <div key={s.label} style={{ padding:"12px", background:"var(--surface2)", borderRadius:10, border:"1px solid var(--border)", textAlign:"center" }}>
                    <div style={{ fontSize:18, fontWeight:900, color:s.color }}>{s.val}</div>
                    <div style={{ fontSize:10, color:"var(--text3)", marginTop:3, textTransform:"uppercase", letterSpacing:"0.5px" }}>{s.label}</div>
                  </div>
                ))}
              </div>
              {form.estimatedTime > 0 && (
                <div style={{ marginBottom:16 }}>
                  <div style={{ height:8, background:"var(--surface3)", borderRadius:6, overflow:"hidden" }}>
                    <div style={{ height:"100%", width:`${Math.min(100,Math.round((form.timeSpent||0)/form.estimatedTime*100))}%`, background:"linear-gradient(90deg,#10B981,#06B6D4)", borderRadius:6, transition:"width 0.4s" }} />
                  </div>
                  <div style={{ fontSize:11, color:"var(--text3)", marginTop:4, textAlign:"right" }}>{Math.min(100,Math.round((form.timeSpent||0)/(form.estimatedTime)*100))}% complete</div>
                </div>
              )}
              <div style={{ padding:"14px", background:"var(--surface2)", borderRadius:12, border:"1px solid var(--border)", marginBottom:16 }}>
                <div style={{ fontSize:12, fontWeight:700, color:"var(--text2)", marginBottom:10 }}>⏱ Time Log Karo</div>
                <div style={{ display:"flex", gap:8, marginBottom:8 }}>
                  <input type="number" min="1" value={timeLogMin} onChange={e => setTimeLogMin(e.target.value)}
                    placeholder="Mins" style={{ ...inp, width:80, flex:"none" }} />
                  <input value={timeLogNote} onChange={e => setTimeLogNote(e.target.value)}
                    onKeyDown={e => e.key==="Enter" && logTime()}
                    placeholder="Note (optional)" style={{ ...inp, flex:1 }} />
                  <button onClick={logTime} style={{ ...btn, background:"#06B6D4", color:"#fff", flexShrink:0 }}>Log</button>
                </div>
              </div>
              {(form.timeLogs||[]).length > 0 && (
                <div>
                  <div style={{ fontSize:11, fontWeight:700, color:"var(--text3)", marginBottom:8, textTransform:"uppercase" }}>History</div>
                  {[...(form.timeLogs||[])].reverse().map(log => (
                    <div key={log.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 12px", borderBottom:"1px solid var(--border)" }}>
                      <span style={{ fontSize:13, fontWeight:700, color:"#06B6D4", minWidth:42 }}>{fmtMins(log.minutes)}</span>
                      <span style={{ flex:1, fontSize:12, color:"var(--text2)" }}>{log.note || "—"}</span>
                      <span style={{ fontSize:11, color:"var(--text3)" }}>{new Date(log.at).toLocaleDateString("en-IN",{month:"short",day:"numeric"})}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* CUSTOM FIELDS TAB */}
          {activeTab === "fields" && (
            <div>
              <div style={{ marginBottom:16, padding:"12px", background:"var(--surface2)", borderRadius:12, border:"1px solid var(--border)" }}>
                <div style={{ fontSize:12, fontWeight:700, color:"var(--text2)", marginBottom:10 }}>⚙ Custom Field Add Karo</div>
                <div style={{ display:"flex", gap:8, marginBottom:8 }}>
                  <input value={cfName} onChange={e => setCfName(e.target.value)} placeholder="Field name" style={{ ...inp, flex:2 }} />
                  <select value={cfType} onChange={e => setCfType(e.target.value)} style={{ ...inp, flex:1 }}>
                    {CUSTOM_FIELD_TYPES.map(t => <option key={t.id} value={t.id}>{t.icon} {t.label}</option>)}
                  </select>
                </div>
                <button onClick={addCustomField} style={{ ...btn, background:"var(--accent)", color:"#fff", width:"100%" }}>+ Field Add Karo</button>
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {(form.customFields||[]).length === 0 && (
                  <div style={{ textAlign:"center", padding:30, color:"var(--text3)", fontSize:13 }}>Koi custom field nahi — upar se add karo</div>
                )}
                {(form.customFields||[]).map(cf => (
                  <div key={cf.id} style={{ padding:"12px", background:"var(--surface2)", borderRadius:10, border:"1px solid var(--border)" }}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
                      <label style={{ ...lbl, marginBottom:0 }}>{CUSTOM_FIELD_TYPES.find(t=>t.id===cf.type)?.icon} {cf.name}</label>
                      <button onClick={() => set("customFields", (form.customFields||[]).filter(f=>f.id!==cf.id))}
                        style={{ background:"transparent", border:"none", color:"var(--text3)", cursor:"pointer", fontSize:13 }}>×</button>
                    </div>
                    {cf.type==="checkbox" ? (
                      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                        <div onClick={() => updateCfValue(cf.id, !cf.value)}
                          style={{ width:18, height:18, borderRadius:5, border:`2px solid ${cf.value?"#10B981":"var(--border2)"}`, background:cf.value?"#10B981":"transparent", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
                          {cf.value && <span style={{ color:"#fff", fontSize:10 }}>✓</span>}
                        </div>
                        <span style={{ fontSize:13, color:"var(--text2)" }}>{cf.value ? "Yes" : "No"}</span>
                      </div>
                    ) : (
                      <input type={cf.type==="number"?"number":cf.type==="date"?"date":"text"}
                        value={cf.value||""}
                        onChange={e => updateCfValue(cf.id, cf.type==="number" ? parseFloat(e.target.value)||0 : e.target.value)}
                        style={inp} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ACTIVITY TAB */}
          {activeTab === "activity" && (
            <div style={{ display:"flex", flexDirection:"column", gap:2 }}>
              {[
                { icon:"✅", text:"Task create kiya gaya", time:task.createdAt },
                task.updatedAt && { icon:"✏️", text:"Task update kiya gaya", time:task.updatedAt },
                form.done && { icon:"🎉", text:"Task complete mark kiya", time:form.completedAt||new Date().toISOString() },
                (task.timeLogs||[]).length > 0 && { icon:"⏱", text:`${(task.timeLogs||[]).length} time log entries`, time:(task.timeLogs||[])[task.timeLogs.length-1]?.at },
                (task.subtasks||[]).length > 0 && { icon:"☑", text:`${(task.subtasks||[]).filter(s=>s.done).length}/${(task.subtasks||[]).length} subtasks done`, time:null },
              ].filter(Boolean).map((a, i) => (
                <div key={i} style={{ display:"flex", gap:12, padding:"12px 0", borderBottom:"1px solid var(--border)" }}>
                  <div style={{ width:28, height:28, borderRadius:8, background:"var(--surface2)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, fontSize:14 }}>{a.icon}</div>
                  <div>
                    <div style={{ fontSize:13, color:"var(--text)", fontWeight:500 }}>{a.text}</div>
                    {a.time && (
                      <div style={{ fontSize:11, color:"var(--text3)", marginTop:3 }}>
                        {new Date(typeof a.time==="string" ? a.time : a.time?.seconds ? a.time.seconds*1000 : 0).toLocaleString("en-IN",{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"})}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding:"14px 20px", borderTop:"1px solid var(--border)", display:"flex", gap:10, flexShrink:0, background:"var(--surface)" }}>
          <button onClick={() => { if(window.confirm("Delete this task?")) { onDelete(form.id); onClose(); }}}
            style={{ ...btn, background:"rgba(244,63,94,0.1)", color:"#F43F5E", border:"1px solid rgba(244,63,94,0.2)" }}>🗑 Delete</button>
          {/* Duplicate */}
          <button onClick={() => { onSave({...form, id:undefined, title:form.title+" (copy)", createdAt:new Date().toISOString()}); }}
            style={{ ...btn, background:"var(--surface3)", color:"var(--text2)" }}>📋 Duplicate</button>
          <div style={{ flex:1 }} />
          <button onClick={onClose} style={{ ...btn, background:"var(--surface3)", color:"var(--text2)" }}>Cancel</button>
          <button onClick={handleSave} disabled={saving}
            style={{ ...btn, background:"linear-gradient(135deg,#FF6B35,#FF8C5A)", color:"#fff", padding:"8px 24px", opacity:saving?0.7:1, boxShadow:"0 4px 16px rgba(255,107,53,0.3)" }}>
            {saving ? "Saving..." : "💾 Save"}
          </button>
        </div>
      </div>
      <style>{`@keyframes slideInRight { from{transform:translateX(100%)} to{transform:none} }`}</style>
    </div>
  );
}

// ─── LIST VIEW ────────────────────────────────────────────────────────────────
function ListView({ tasks, onEdit, onToggle, onDelete, selected, onSelect, allTasks }) {
  const grouped = useMemo(() => {
    const g = {};
    DEFAULT_STATUSES.forEach(s => { g[s.id] = []; });
    tasks.forEach(t => { const sid = t.status||"inbox"; if (g[sid]) g[sid].push(t); else g["inbox"].push(t); });
    return g;
  }, [tasks]);

  return (
    <div>
      {DEFAULT_STATUSES.map(status => {
        const list = grouped[status.id] || [];
        if (!list.length) return null;
        return (
          <div key={status.id} style={{ marginBottom:22 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8, padding:"6px 0", borderBottom:`2px solid ${status.color}30` }}>
              <span style={{ fontSize:14 }}>{status.icon}</span>
              <span style={{ fontSize:11, fontWeight:800, color:status.color, textTransform:"uppercase", letterSpacing:"1px" }}>{status.label}</span>
              <span style={{ fontSize:11, padding:"1px 7px", background:`${status.color}18`, color:status.color, borderRadius:20, fontWeight:700 }}>{list.length}</span>
            </div>
            {list.map(task => <TaskRow key={task.id} task={task} onEdit={onEdit} onToggle={onToggle} onDelete={onDelete} selected={selected.has(task.id)} onSelect={onSelect} allTasks={allTasks} />)}
          </div>
        );
      })}
    </div>
  );
}

function TaskRow({ task, onEdit, onToggle, onDelete, selected, onSelect, allTasks }) {
  const pri = PRI[task.priority||"none"];
  const dl = daysLeft(task.due);
  const overdue = isOverdue(task.due) && !task.done;
  const subtaskDone = (task.subtasks||[]).filter(s=>s.done).length;
  const subtaskTotal = (task.subtasks||[]).length;
  const isBlocked = (task.blockedBy||[]).some(depId => {
    const dep = allTasks?.find(t => t.id===depId);
    return dep && !dep.done;
  });
  const isBlockedByRelation = (task.relations||[]).some(rel => {
    if (rel.type !== "blocked_by") return false;
    const dep = allTasks?.find(t => t.id===rel.taskId);
    return dep && !dep.done;
  });

  return (
    <div className="task-row"
      style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 12px", background:selected?"rgba(255,107,53,0.05)":"var(--surface)", border:`1px solid ${selected?"rgba(255,107,53,0.3)":"var(--border)"}`, borderLeft:`3px solid ${pri?.color||"var(--border)"}`, borderRadius:10, marginBottom:5, cursor:"pointer", transition:"all 0.12s" }}
      onMouseEnter={e => { if(!selected) { e.currentTarget.style.borderColor="var(--border2)"; e.currentTarget.style.transform="translateX(2px)"; }}}
      onMouseLeave={e => { if(!selected) { e.currentTarget.style.borderColor="var(--border)"; e.currentTarget.style.transform="none"; }}}
      onClick={() => onEdit(task)}>
      {/* Select */}
      <div onClick={e => { e.stopPropagation(); onSelect(task.id); }}
        style={{ width:14, height:14, border:"1.5px solid var(--border2)", borderRadius:3, cursor:"pointer", flexShrink:0, background:selected?"var(--accent)":"transparent", display:"flex", alignItems:"center", justifyContent:"center" }}>
        {selected && <span style={{ color:"#fff", fontSize:8 }}>✓</span>}
      </div>
      {/* Done toggle */}
      <div onClick={e => { e.stopPropagation(); onToggle(task); }}
        style={{ width:18, height:18, borderRadius:5, border:`2px solid ${task.done?"#10B981":"var(--border2)"}`, background:task.done?"#10B981":"transparent", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", flexShrink:0, transition:"all 0.15s" }}>
        {task.done && <span style={{ color:"#fff", fontSize:10, fontWeight:900 }}>✓</span>}
      </div>
      {/* Title */}
      <span style={{ flex:1, fontSize:14, fontWeight:500, color:"var(--text)", textDecoration:task.done?"line-through":"none", opacity:task.done?0.45:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
        {(isBlocked||isBlockedByRelation) && <span title="Blocked" style={{ marginRight:4 }}>🚫</span>}
        {task.recurring && task.recurring!=="none" && <span title="Recurring" style={{ marginRight:4, fontSize:12 }}>🔄</span>}
        {task.title}
      </span>
      {/* Subtasks mini */}
      {subtaskTotal > 0 && (
        <span style={{ fontSize:11, color:subtaskDone===subtaskTotal?"#10B981":"var(--text3)", fontWeight:600, flexShrink:0 }}>
          ☑ {subtaskDone}/{subtaskTotal}
        </span>
      )}
      {/* Tags */}
      {(task.tags||[]).slice(0,2).map((tag, i) => (
        <span key={tag} style={{ fontSize:11, padding:"2px 7px", background:`${TAGS_COLORS[i%TAGS_COLORS.length]}15`, color:TAGS_COLORS[i%TAGS_COLORS.length], borderRadius:20, fontWeight:700, flexShrink:0 }}>#{tag}</span>
      ))}
      {/* Time */}
      {task.timeSpent > 0 && <span style={{ fontSize:11, color:"var(--text3)", flexShrink:0 }}>⏱ {fmtMins(task.timeSpent)}</span>}
      {/* Story points */}
      {task.points > 0 && <span style={{ fontSize:11, padding:"2px 6px", background:"rgba(129,140,248,0.1)", color:"#818CF8", borderRadius:6, fontWeight:700, flexShrink:0 }}>{task.points}pt</span>}
      {/* Due date */}
      {task.due && (
        <span style={{ fontSize:11, padding:"2px 8px", background:overdue?"rgba(244,63,94,0.12)":dl===0?"rgba(245,158,11,0.12)":"rgba(99,102,241,0.1)", color:overdue?"#F43F5E":dl===0?"#F59E0B":"var(--indigo)", borderRadius:20, fontWeight:700, flexShrink:0 }}>
          {overdue ? "⚠ Overdue" : dl===0 ? "Today" : dl===1 ? "Tomorrow" : fmt(task.due)}
        </span>
      )}
      {/* Priority */}
      <span style={{ fontSize:11, padding:"2px 8px", background:pri?.bg, color:pri?.color, borderRadius:20, fontWeight:700, flexShrink:0 }}>{pri?.label||"None"}</span>
      {/* Delete */}
      <button onClick={e => { e.stopPropagation(); if(window.confirm("Delete?")) onDelete(task.id); }}
        className="task-del"
        style={{ background:"transparent", border:"none", color:"var(--text3)", cursor:"pointer", fontSize:14, opacity:0, transition:"opacity 0.15s", padding:2, flexShrink:0 }}
        onMouseEnter={e => e.currentTarget.style.color="#F43F5E"}
        onMouseLeave={e => e.currentTarget.style.color="var(--text3)"}>×</button>
    </div>
  );
}

// ─── KANBAN VIEW ──────────────────────────────────────────────────────────────
function KanbanView({ tasks, onEdit, onStatusChange, onToggle }) {
  const [dragging, setDragging] = useState(null);
  const [dragOver, setDragOver] = useState(null);

  return (
    <div style={{ display:"flex", gap:12, overflowX:"auto", paddingBottom:16, minHeight:400 }}>
      {DEFAULT_STATUSES.map(status => {
        const cols = tasks.filter(t => (t.status||"inbox") === status.id);
        return (
          <div key={status.id}
            onDragOver={e => { e.preventDefault(); setDragOver(status.id); }}
            onDrop={e => { e.preventDefault(); if(dragging) onStatusChange(dragging, status.id); setDragging(null); setDragOver(null); }}
            onDragLeave={() => setDragOver(null)}
            style={{ minWidth:230, maxWidth:270, flexShrink:0, background:dragOver===status.id ? `${status.color}08` : "var(--surface2)", border:`2px solid ${dragOver===status.id?status.color:"var(--border)"}`, borderRadius:14, padding:"12px", transition:"all 0.15s" }}>
            <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:12, padding:"0 0 8px 0", borderBottom:`1px solid ${status.color}25` }}>
              <span style={{ fontSize:14 }}>{status.icon}</span>
              <span style={{ fontSize:12, fontWeight:800, color:status.color, flex:1, textTransform:"uppercase", letterSpacing:"0.5px" }}>{status.label}</span>
              <span style={{ fontSize:11, padding:"1px 7px", background:`${status.color}18`, color:status.color, borderRadius:20, fontWeight:700 }}>{cols.length}</span>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:8, minHeight:100 }}>
              {cols.map(task => {
                const pri = PRI[task.priority||"none"];
                const overdue = isOverdue(task.due) && !task.done;
                const subtaskDone = (task.subtasks||[]).filter(s=>s.done).length;
                const subtaskTotal = (task.subtasks||[]).length;
                return (
                  <div key={task.id} draggable
                    onDragStart={() => setDragging(task)}
                    onDragEnd={() => { setDragging(null); setDragOver(null); }}
                    onClick={() => onEdit(task)}
                    style={{ background:"var(--surface)", border:"1px solid var(--border)", borderTop:`3px solid ${pri?.color||"var(--border)"}`, borderRadius:10, padding:"10px 12px", cursor:"grab", opacity:dragging?.id===task.id?0.4:1, transition:"all 0.15s" }}
                    onMouseEnter={e => { e.currentTarget.style.boxShadow="var(--shadow)"; e.currentTarget.style.transform="translateY(-2px)"; }}
                    onMouseLeave={e => { e.currentTarget.style.boxShadow="none"; e.currentTarget.style.transform="none"; }}>
                    <div style={{ fontSize:13, fontWeight:600, color:"var(--text)", marginBottom:8, lineHeight:1.4 }}>
                      {task.done && "✅ "}
                      {task.title}
                    </div>
                    {task.desc && <div style={{ fontSize:11, color:"var(--text3)", marginBottom:8, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{task.desc}</div>}
                    <div style={{ display:"flex", flexWrap:"wrap", gap:5, alignItems:"center", marginBottom:6 }}>
                      {task.due && <span style={{ fontSize:10, color:overdue?"#F43F5E":"var(--text3)", fontWeight:600 }}>📅 {fmt(task.due)}</span>}
                      {subtaskTotal > 0 && <span style={{ fontSize:10, color:"var(--text3)" }}>☑ {subtaskDone}/{subtaskTotal}</span>}
                      {task.timeSpent > 0 && <span style={{ fontSize:10, color:"var(--text3)" }}>⏱ {fmtMins(task.timeSpent)}</span>}
                      {task.points > 0 && <span style={{ fontSize:10, color:"#818CF8", fontWeight:700 }}>{task.points}pt</span>}
                    </div>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                      <div style={{ display:"flex", gap:4 }}>
                        <span style={{ fontSize:10, padding:"2px 7px", background:pri?.bg, color:pri?.color, borderRadius:20, fontWeight:700 }}>{pri?.label}</span>
                        {(task.tags||[]).slice(0,1).map((tag,i) => <span key={tag} style={{ fontSize:10, padding:"1px 6px", background:`${TAGS_COLORS[i]}18`, color:TAGS_COLORS[i], borderRadius:20, fontWeight:700 }}>#{tag}</span>)}
                      </div>
                      <div onClick={e => { e.stopPropagation(); onToggle(task); }}
                        style={{ width:16, height:16, borderRadius:4, border:`2px solid ${task.done?"#10B981":"var(--border2)"}`, background:task.done?"#10B981":"transparent", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
                        {task.done && <span style={{ color:"#fff", fontSize:9 }}>✓</span>}
                      </div>
                    </div>
                  </div>
                );
              })}
              {cols.length === 0 && (
                <div style={{ textAlign:"center", padding:"24px 0", color:"var(--text3)", fontSize:12, opacity:0.5 }}>Drop here</div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── TABLE VIEW ───────────────────────────────────────────────────────────────
function TableView({ tasks, onEdit, onToggle, onDelete }) {
  const [editCell, setEditCell] = useState(null); // { taskId, field }

  const COLS = [
    { id:"done",     label:"",         width:30  },
    { id:"title",    label:"Title",    width:240 },
    { id:"status",   label:"Status",   width:110 },
    { id:"priority", label:"Priority", width:90  },
    { id:"due",      label:"Due Date", width:100 },
    { id:"tags",     label:"Tags",     width:120 },
    { id:"timeSpent",label:"Logged",   width:70  },
    { id:"points",   label:"Points",   width:60  },
    { id:"actions",  label:"",         width:40  },
  ];

  return (
    <div style={{ overflowX:"auto", border:"1px solid var(--border)", borderRadius:14 }}>
      <table style={{ width:"100%", borderCollapse:"collapse", fontFamily:"inherit" }}>
        <thead>
          <tr style={{ background:"var(--surface2)" }}>
            {COLS.map(col => (
              <th key={col.id} style={{ padding:"10px 12px", textAlign:"left", fontSize:11, fontWeight:800, color:"var(--text3)", textTransform:"uppercase", letterSpacing:"0.5px", borderBottom:"1px solid var(--border)", width:col.width, whiteSpace:"nowrap" }}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tasks.map(task => {
            const pri = PRI[task.priority||"none"];
            const st = ST[task.status||"inbox"];
            const overdue = isOverdue(task.due) && !task.done;
            return (
              <tr key={task.id}
                style={{ borderBottom:"1px solid var(--border)", transition:"background 0.1s" }}
                onMouseEnter={e => e.currentTarget.style.background="var(--hover-bg)"}
                onMouseLeave={e => e.currentTarget.style.background=""}>
                {/* Done */}
                <td style={{ padding:"8px 12px" }}>
                  <div onClick={() => onToggle(task)}
                    style={{ width:16, height:16, borderRadius:4, border:`2px solid ${task.done?"#10B981":"var(--border2)"}`, background:task.done?"#10B981":"transparent", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer" }}>
                    {task.done && <span style={{ color:"#fff", fontSize:9 }}>✓</span>}
                  </div>
                </td>
                {/* Title */}
                <td style={{ padding:"8px 12px", maxWidth:240 }}>
                  <span onClick={() => onEdit(task)}
                    style={{ fontSize:13, fontWeight:500, color:"var(--text)", cursor:"pointer", textDecoration:task.done?"line-through":"none", opacity:task.done?0.5:1, display:"block", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                    {task.title}
                  </span>
                  {task.desc && <span style={{ fontSize:11, color:"var(--text3)", display:"block", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{task.desc}</span>}
                </td>
                {/* Status */}
                <td style={{ padding:"8px 12px" }}>
                  <span style={{ fontSize:11, padding:"2px 8px", background:`${st?.color}18`, color:st?.color, borderRadius:20, fontWeight:700, whiteSpace:"nowrap" }}>
                    {st?.icon} {st?.label}
                  </span>
                </td>
                {/* Priority */}
                <td style={{ padding:"8px 12px" }}>
                  <span style={{ fontSize:11, padding:"2px 8px", background:pri?.bg, color:pri?.color, borderRadius:20, fontWeight:700 }}>
                    {pri?.label}
                  </span>
                </td>
                {/* Due */}
                <td style={{ padding:"8px 12px" }}>
                  {task.due && (
                    <span style={{ fontSize:12, color:overdue?"#F43F5E":"var(--text2)", fontWeight:overdue?700:400 }}>
                      {overdue && "⚠ "}{fmt(task.due)}
                    </span>
                  )}
                </td>
                {/* Tags */}
                <td style={{ padding:"8px 12px" }}>
                  <div style={{ display:"flex", gap:4 }}>
                    {(task.tags||[]).slice(0,2).map((tag,i) => (
                      <span key={tag} style={{ fontSize:10, padding:"1px 6px", background:`${TAGS_COLORS[i%TAGS_COLORS.length]}18`, color:TAGS_COLORS[i%TAGS_COLORS.length], borderRadius:20, fontWeight:700 }}>#{tag}</span>
                    ))}
                  </div>
                </td>
                {/* Time logged */}
                <td style={{ padding:"8px 12px", fontSize:12, color:"var(--text3)" }}>
                  {task.timeSpent ? fmtMins(task.timeSpent) : "—"}
                </td>
                {/* Points */}
                <td style={{ padding:"8px 12px", fontSize:12, color:"#818CF8", fontWeight:700, textAlign:"center" }}>
                  {task.points || "—"}
                </td>
                {/* Actions */}
                <td style={{ padding:"8px 12px" }}>
                  <button onClick={() => { if(window.confirm("Delete?")) onDelete(task.id); }}
                    style={{ background:"transparent", border:"none", color:"var(--text3)", cursor:"pointer", fontSize:14, padding:2, opacity:0.4, transition:"opacity 0.15s" }}
                    onMouseEnter={e => { e.currentTarget.style.color="#F43F5E"; e.currentTarget.style.opacity="1"; }}
                    onMouseLeave={e => { e.currentTarget.style.color="var(--text3)"; e.currentTarget.style.opacity="0.4"; }}>×</button>
                </td>
              </tr>
            );
          })}
          {tasks.length === 0 && (
            <tr><td colSpan={COLS.length} style={{ textAlign:"center", padding:40, color:"var(--text3)", fontSize:13 }}>Koi task nahi</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}


// ─── CALENDAR VIEW ────────────────────────────────────────────────────────────
function CalendarView({ tasks, onEdit }) {
  const [month, setMonth] = useState(new Date().getMonth());
  const [year, setYear]   = useState(new Date().getFullYear());
  const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const DAYS   = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  const daysInMonth = new Date(year, month+1, 0).getDate();
  const firstDay    = new Date(year, month, 1).getDay();
  const todayDate   = new Date().getDate();
  const todayMonth  = new Date().getMonth();
  const todayYear   = new Date().getFullYear();

  const tasksByDay = {};
  tasks.forEach(t => {
    if (t.due) {
      const parts = t.due.split("-");
      if (parseInt(parts[1])-1===month && parseInt(parts[0])===year) {
        const day = parseInt(parts[2]);
        if (!tasksByDay[day]) tasksByDay[day] = [];
        tasksByDay[day].push(t);
      }
    }
  });

  const cells = Array.from({length:42}, (_, i) => {
    const day = i - firstDay + 1;
    return day > 0 && day <= daysInMonth ? day : null;
  });

  return (
    <div>
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16 }}>
        <button onClick={() => { if(month===0){setMonth(11);setYear(y=>y-1);}else setMonth(m=>m-1); }}
          style={{ ...btn, background:"var(--surface2)", color:"var(--text)", fontSize:16, padding:"6px 12px" }}>‹</button>
        <span style={{ fontWeight:800, fontSize:16, color:"var(--text)", flex:1, textAlign:"center" }}>{MONTHS[month]} {year}</span>
        <button onClick={() => { setMonth(new Date().getMonth()); setYear(new Date().getFullYear()); }}
          style={{ ...btn, background:"var(--surface2)", color:"var(--text2)", fontSize:12, padding:"6px 12px" }}>Today</button>
        <button onClick={() => { if(month===11){setMonth(0);setYear(y=>y+1);}else setMonth(m=>m+1); }}
          style={{ ...btn, background:"var(--surface2)", color:"var(--text)", fontSize:16, padding:"6px 12px" }}>›</button>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:2, marginBottom:4 }}>
        {DAYS.map(d => <div key={d} style={{ textAlign:"center", fontSize:11, fontWeight:700, color:"var(--text3)", padding:"6px 0", textTransform:"uppercase" }}>{d}</div>)}
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:3 }}>
        {cells.map((day, i) => {
          const isToday = day && day===todayDate && month===todayMonth && year===todayYear;
          const dayTasks = day ? (tasksByDay[day]||[]) : [];
          const hasOverdue = dayTasks.some(t => !t.done);
          return (
            <div key={i} style={{ minHeight:80, padding:"4px 6px", background:day?"var(--surface)":"transparent", border:day?`1px solid ${isToday?"var(--accent)":"var(--border)"}`:"none", borderRadius:8 }}>
              {day && (
                <>
                  <div style={{ fontSize:12, fontWeight:isToday?900:400, color:isToday?"#fff":"var(--text2)", width:22, height:22, borderRadius:"50%", background:isToday?"var(--accent)":"transparent", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:2 }}>{day}</div>
                  {dayTasks.slice(0,3).map(t => {
                    const pri = PRI[t.priority||"none"];
                    return (
                      <div key={t.id} onClick={() => onEdit(t)}
                        style={{ fontSize:10, padding:"1px 5px", background:`${pri?.color||"#6B7280"}18`, color:pri?.color||"#6B7280", borderRadius:4, marginBottom:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", cursor:"pointer", fontWeight:600 }}
                        title={t.title}>
                        {t.done?"✓ ":""}{t.title}
                      </div>
                    );
                  })}
                  {dayTasks.length>3 && <div style={{ fontSize:9, color:"var(--text3)", fontWeight:700 }}>+{dayTasks.length-3} more</div>}
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── TIMELINE / GANTT VIEW ────────────────────────────────────────────────────
function TimelineView({ tasks, onEdit }) {
  const now = new Date();
  const [startOffset, setStartOffset] = useState(0); // weeks from today

  const WEEKS = 8;
  const DAY_WIDTH = 28;

  // Only tasks with due or startDate
  const scheduledTasks = tasks.filter(t => t.due || t.startDate).slice(0, 40);

  // Build date range
  const rangeStart = new Date(now);
  rangeStart.setDate(rangeStart.getDate() + startOffset * 7);
  rangeStart.setDate(rangeStart.getDate() - rangeStart.getDay()); // Start of week

  const totalDays = WEEKS * 7;
  const days = Array.from({length: totalDays}, (_, i) => {
    const d = new Date(rangeStart);
    d.setDate(rangeStart.getDate() + i);
    return d;
  });

  const weeks = Array.from({length: WEEKS}, (_, i) => {
    const d = new Date(rangeStart);
    d.setDate(rangeStart.getDate() + i*7);
    return d;
  });

  function getTaskBar(task) {
    const startD = task.startDate ? new Date(task.startDate+"T00:00") : (task.due ? new Date(new Date(task.due+"T00:00").getTime() - 86400000) : null);
    const endD = task.due ? new Date(task.due+"T00:00") : startD;
    if (!startD || !endD) return null;

    const diffStart = Math.round((startD - rangeStart) / 86400000);
    const diffEnd = Math.round((endD - rangeStart) / 86400000);

    if (diffEnd < 0 || diffStart > totalDays) return null;

    const left = Math.max(0, diffStart) * DAY_WIDTH;
    const width = Math.max(DAY_WIDTH, (Math.min(totalDays, diffEnd+1) - Math.max(0, diffStart)) * DAY_WIDTH);
    return { left, width };
  }

  const todayOffset = Math.round((new Date().setHours(0,0,0,0) - rangeStart.setHours(0,0,0,0)) / 86400000);

  return (
    <div style={{ overflowX:"auto" }}>
      {/* Controls */}
      <div style={{ display:"flex", gap:8, marginBottom:12, alignItems:"center" }}>
        <button onClick={() => setStartOffset(s => s-1)} style={{ ...btn, background:"var(--surface2)", color:"var(--text)" }}>← Peeche</button>
        <button onClick={() => setStartOffset(0)} style={{ ...btn, background:"var(--accent)", color:"#fff" }}>Today</button>
        <button onClick={() => setStartOffset(s => s+1)} style={{ ...btn, background:"var(--surface2)", color:"var(--text)" }}>Aage →</button>
        <span style={{ fontSize:12, color:"var(--text3)", marginLeft:8 }}>
          {scheduledTasks.length} tasks shown | Scroll karo ↔
        </span>
      </div>

      <div style={{ display:"flex", border:"1px solid var(--border)", borderRadius:14, overflow:"hidden" }}>
        {/* Left: task names */}
        <div style={{ width:200, flexShrink:0, borderRight:"1px solid var(--border)" }}>
          <div style={{ height:54, background:"var(--surface2)", borderBottom:"1px solid var(--border)", display:"flex", alignItems:"center", padding:"0 14px" }}>
            <span style={{ fontSize:11, fontWeight:800, color:"var(--text3)", textTransform:"uppercase" }}>Task</span>
          </div>
          {scheduledTasks.map(task => {
            const pri = PRI[task.priority||"none"];
            return (
              <div key={task.id}
                onClick={() => onEdit(task)}
                style={{ height:44, display:"flex", alignItems:"center", padding:"0 14px", borderBottom:"1px solid var(--border)", cursor:"pointer", gap:8 }}
                onMouseEnter={e => e.currentTarget.style.background="var(--hover-bg)"}
                onMouseLeave={e => e.currentTarget.style.background=""}>
                <div style={{ width:3, height:24, borderRadius:3, background:pri?.color, flexShrink:0 }} />
                <span style={{ fontSize:12, color:"var(--text)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", textDecoration:task.done?"line-through":"none", opacity:task.done?0.5:1 }}>{task.title}</span>
              </div>
            );
          })}
          {scheduledTasks.length === 0 && (
            <div style={{ padding:24, textAlign:"center", color:"var(--text3)", fontSize:12 }}>Due date wale tasks nahi hain</div>
          )}
        </div>

        {/* Right: timeline grid */}
        <div style={{ overflowX:"auto", flex:1 }}>
          {/* Week headers */}
          <div style={{ display:"flex", height:28, background:"var(--surface2)", borderBottom:"1px solid var(--border)" }}>
            {weeks.map((w, i) => (
              <div key={i} style={{ width:DAY_WIDTH*7, flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700, color:"var(--text3)", borderRight:"1px solid var(--border)" }}>
                {w.toLocaleDateString("en-IN",{month:"short",day:"numeric"})}
              </div>
            ))}
          </div>
          {/* Day headers */}
          <div style={{ display:"flex", height:26, background:"var(--surface3)", borderBottom:"1px solid var(--border)" }}>
            {days.map((d, i) => {
              const isToday = i === todayOffset;
              return (
                <div key={i} style={{ width:DAY_WIDTH, flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", fontSize:10, color:isToday?"var(--accent)":"var(--text3)", fontWeight:isToday?900:400, background:isToday?"rgba(255,107,53,0.08)":"transparent" }}>
                  {d.getDate()}
                </div>
              );
            })}
          </div>
          {/* Task bars */}
          {scheduledTasks.map(task => {
            const bar = getTaskBar(task);
            const pri = PRI[task.priority||"none"];
            return (
              <div key={task.id} style={{ height:44, position:"relative", borderBottom:"1px solid var(--border)", background:"transparent" }}>
                {/* Today line */}
                {todayOffset >= 0 && todayOffset < totalDays && (
                  <div style={{ position:"absolute", left:todayOffset*DAY_WIDTH+DAY_WIDTH/2, top:0, bottom:0, width:1, background:"rgba(255,107,53,0.3)", pointerEvents:"none", zIndex:1 }} />
                )}
                {/* Weekend shading */}
                {days.map((d, i) => d.getDay()===0||d.getDay()===6 ? (
                  <div key={i} style={{ position:"absolute", left:i*DAY_WIDTH, top:0, bottom:0, width:DAY_WIDTH, background:"rgba(255,255,255,0.015)", pointerEvents:"none" }} />
                ) : null)}
                {/* Bar */}
                {bar && (
                  <div onClick={() => onEdit(task)}
                    style={{ position:"absolute", left:bar.left, width:bar.width, top:8, height:28, background:`linear-gradient(90deg,${pri?.color}cc,${pri?.color}88)`, borderRadius:6, cursor:"pointer", display:"flex", alignItems:"center", padding:"0 8px", overflow:"hidden", boxSizing:"border-box", zIndex:2 }}
                    title={task.title}>
                    <span style={{ fontSize:11, color:"#fff", fontWeight:700, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                      {task.done && "✓ "}{task.title}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── INBOX VIEW ───────────────────────────────────────────────────────────────
function InboxView({ tasks, onEdit, onToggle, onDelete }) {
  const inbox = tasks.filter(t => !t.due && !t.done && (t.status==="inbox"||!t.status));
  const unscheduled = tasks.filter(t => !t.due && !t.done && t.status && t.status!=="inbox" && t.status!=="done");

  function Section({ title, items, icon, color }) {
    if (!items.length) return null;
    return (
      <div style={{ marginBottom:24 }}>
        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:10, padding:"6px 0", borderBottom:`2px solid ${color}30` }}>
          <span style={{ fontSize:15 }}>{icon}</span>
          <span style={{ fontSize:12, fontWeight:800, color, textTransform:"uppercase", letterSpacing:"1px" }}>{title}</span>
          <span style={{ fontSize:11, padding:"1px 7px", background:`${color}18`, color, borderRadius:20, fontWeight:700 }}>{items.length}</span>
        </div>
        {items.map(task => {
          const pri = PRI[task.priority||"none"];
          return (
            <div key={task.id}
              style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px", background:"var(--surface)", border:"1px solid var(--border)", borderLeft:`3px solid ${pri?.color||"var(--border)"}`, borderRadius:10, marginBottom:6, cursor:"pointer" }}
              onClick={() => onEdit(task)}
              onMouseEnter={e => e.currentTarget.style.borderColor="var(--border2)"}
              onMouseLeave={e => e.currentTarget.style.borderColor="var(--border)"}>
              <div onClick={e => { e.stopPropagation(); onToggle(task); }}
                style={{ width:18, height:18, borderRadius:5, border:"2px solid var(--border2)", background:"transparent", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", flexShrink:0 }} />
              <span style={{ flex:1, fontSize:14, fontWeight:500, color:"var(--text)" }}>{task.title}</span>
              {(task.tags||[]).slice(0,2).map((tag,i) => (
                <span key={tag} style={{ fontSize:11, padding:"2px 7px", background:`${TAGS_COLORS[i%TAGS_COLORS.length]}15`, color:TAGS_COLORS[i%TAGS_COLORS.length], borderRadius:20, fontWeight:700 }}>#{tag}</span>
              ))}
              <span style={{ fontSize:11, padding:"2px 8px", background:pri?.bg, color:pri?.color, borderRadius:20, fontWeight:700 }}>{pri?.label}</span>
              <button onClick={e => { e.stopPropagation(); if(window.confirm("Delete?")) onDelete(task.id); }}
                style={{ background:"transparent", border:"none", color:"var(--text3)", cursor:"pointer", fontSize:14, opacity:0.4 }}
                onMouseEnter={e => { e.currentTarget.style.color="#F43F5E"; e.currentTarget.style.opacity="1"; }}
                onMouseLeave={e => { e.currentTarget.style.color="var(--text3)"; e.currentTarget.style.opacity="0.4"; }}>×</button>
            </div>
          );
        })}
      </div>
    );
  }

  if (inbox.length===0 && unscheduled.length===0) {
    return (
      <div style={{ textAlign:"center", padding:"60px 20px", color:"var(--text3)" }}>
        <div style={{ fontSize:60, marginBottom:16 }}>📥</div>
        <div style={{ fontSize:18, fontWeight:800, color:"var(--text2)", marginBottom:8 }}>Inbox Khali Hai!</div>
        <div style={{ fontSize:14 }}>Saari tasks scheduled hain 🎉</div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ padding:"12px 16px", background:"rgba(245,158,11,0.06)", border:"1px solid rgba(245,158,11,0.15)", borderRadius:12, marginBottom:20, fontSize:13, color:"var(--text2)" }}>
        💡 <strong>Inbox</strong> = Unscheduled tasks. In tasks ko koi due date nahi diya gaya. Inhe organize karo!
      </div>
      <Section title="Inbox — No Date" items={inbox} icon="📥" color="#F59E0B" />
      <Section title="Unscheduled" items={unscheduled} icon="📌" color="#818CF8" />
    </div>
  );
}

// ─── MY TASKS VIEW ────────────────────────────────────────────────────────────
function MyTasksView({ tasks, onEdit, onToggle }) {
  const overdueT   = tasks.filter(t => !t.done && isOverdue(t.due));
  const todayT     = tasks.filter(t => !t.done && t.due===today());
  const tomorrowD  = new Date(); tomorrowD.setDate(tomorrowD.getDate()+1);
  const tomorrowS  = tomorrowD.toISOString().split("T")[0];
  const tomorrowT  = tasks.filter(t => !t.done && t.due===tomorrowS);
  const upcomingT  = tasks.filter(t => !t.done && t.due && t.due>tomorrowS).slice(0,10);
  const noDueT     = tasks.filter(t => !t.done && !t.due).slice(0,8);
  const doneT      = tasks.filter(t => t.done).slice(0,5);

  function Section({ title, color, items, icon, emptyText }) {
    const [open, setOpen] = useState(true);
    if (!items.length && !emptyText) return null;
    return (
      <div style={{ marginBottom:20 }}>
        <div onClick={() => setOpen(o=>!o)}
          style={{ display:"flex", alignItems:"center", gap:8, marginBottom:open?10:0, padding:"8px 0", borderBottom:`2px solid ${color}30`, cursor:"pointer" }}>
          <span style={{ fontSize:14 }}>{icon}</span>
          <span style={{ fontSize:12, fontWeight:800, color, textTransform:"uppercase", letterSpacing:"1px", flex:1 }}>{title}</span>
          {items.length > 0 && <span style={{ fontSize:11, padding:"1px 7px", background:`${color}18`, color, borderRadius:20, fontWeight:700 }}>{items.length}</span>}
          <span style={{ fontSize:12, color:"var(--text3)" }}>{open?"▴":"▾"}</span>
        </div>
        {open && (
          <>
            {items.map(task => {
              const pri = PRI[task.priority||"none"];
              return (
                <div key={task.id}
                  style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 12px", background:task.done?"transparent":"var(--surface)", border:`1px solid ${task.done?"var(--border)":"var(--border)"}`, borderLeft:`3px solid ${pri?.color||"var(--border)"}`, borderRadius:9, marginBottom:5, cursor:"pointer", opacity:task.done?0.45:1 }}
                  onClick={() => onEdit(task)}
                  onMouseEnter={e => e.currentTarget.style.borderColor="var(--border2)"}
                  onMouseLeave={e => e.currentTarget.style.borderColor="var(--border)"}>
                  <div onClick={e => { e.stopPropagation(); onToggle(task); }}
                    style={{ width:18, height:18, borderRadius:5, border:`2px solid ${task.done?"#10B981":"var(--border2)"}`, background:task.done?"#10B981":"transparent", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", flexShrink:0, transition:"all 0.15s" }}>
                    {task.done && <span style={{ color:"#fff", fontSize:10, fontWeight:900 }}>✓</span>}
                  </div>
                  <span style={{ flex:1, fontSize:14, color:"var(--text)", textDecoration:task.done?"line-through":"none", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{task.title}</span>
                  {task.due && <span style={{ fontSize:11, color:"var(--text3)" }}>{fmt(task.due)}</span>}
                  <span style={{ fontSize:11, padding:"2px 8px", background:pri?.bg, color:pri?.color, borderRadius:20, fontWeight:700, flexShrink:0 }}>{pri?.label}</span>
                </div>
              );
            })}
            {items.length===0 && emptyText && <div style={{ fontSize:13, color:"var(--text3)", padding:"8px 0", textAlign:"center" }}>{emptyText}</div>}
          </>
        )}
      </div>
    );
  }

  return (
    <div>
      <Section title="Overdue" color="#F43F5E" items={overdueT} icon="⚠" />
      <Section title="Today" color="#F59E0B" items={todayT} icon="☀" emptyText="✅ Aaj koi task nahi!" />
      <Section title="Tomorrow" color="#F97316" items={tomorrowT} icon="🌅" />
      <Section title="Upcoming" color="#818CF8" items={upcomingT} icon="📅" />
      <Section title="No Due Date" color="#6B7280" items={noDueT} icon="📌" />
      <Section title="Completed (Recent)" color="#10B981" items={doneT} icon="✅" />
    </div>
  );
}

// ─── BULK ACTION BAR ──────────────────────────────────────────────────────────
function BulkBar({ count, onMarkDone, onDelete, onSetPriority, onSetStatus, onClear }) {
  const [priOpen, setPriOpen] = useState(false);
  const [stOpen, setStOpen] = useState(false);
  return (
    <div style={{ position:"fixed", bottom:24, left:"50%", transform:"translateX(-50%)", background:"var(--modal-bg)", border:"1px solid var(--border2)", borderRadius:16, padding:"12px 20px", display:"flex", alignItems:"center", gap:10, zIndex:8000, boxShadow:"0 8px 40px rgba(0,0,0,0.5)", backdropFilter:"blur(16px)", animation:"slideUp 0.2s ease" }}>
      <span style={{ fontSize:13, fontWeight:800, color:"var(--accent)" }}>{count} selected</span>
      <div style={{ width:1, height:20, background:"var(--border2)" }} />
      <button onClick={onMarkDone} style={{ ...btn, background:"rgba(16,185,129,0.15)", color:"#10B981", fontSize:12 }}>✓ Done Mark Karo</button>
      {/* Priority bulk */}
      <div style={{ position:"relative" }}>
        <button onClick={() => { setPriOpen(o=>!o); setStOpen(false); }} style={{ ...btn, background:"var(--surface3)", color:"var(--text2)", fontSize:12 }}>Priority ▾</button>
        {priOpen && (
          <div style={{ position:"absolute", bottom:"calc(100% + 8px)", left:0, background:"var(--modal-bg)", border:"1px solid var(--border2)", borderRadius:10, overflow:"hidden", zIndex:999, boxShadow:"var(--shadow)", minWidth:120 }}>
            {PRIORITIES.map(p => (
              <div key={p.id} onClick={() => { onSetPriority(p.id); setPriOpen(false); }}
                style={{ padding:"8px 14px", cursor:"pointer", fontSize:12, fontWeight:700, color:p.color }}
                onMouseEnter={e => e.currentTarget.style.background="var(--hover-bg)"}
                onMouseLeave={e => e.currentTarget.style.background=""}>● {p.label}</div>
            ))}
          </div>
        )}
      </div>
      {/* Status bulk */}
      <div style={{ position:"relative" }}>
        <button onClick={() => { setStOpen(o=>!o); setPriOpen(false); }} style={{ ...btn, background:"var(--surface3)", color:"var(--text2)", fontSize:12 }}>Status ▾</button>
        {stOpen && (
          <div style={{ position:"absolute", bottom:"calc(100% + 8px)", left:0, background:"var(--modal-bg)", border:"1px solid var(--border2)", borderRadius:10, overflow:"hidden", zIndex:999, boxShadow:"var(--shadow)", minWidth:140 }}>
            {DEFAULT_STATUSES.map(s => (
              <div key={s.id} onClick={() => { onSetStatus(s.id); setStOpen(false); }}
                style={{ padding:"8px 14px", cursor:"pointer", fontSize:12, fontWeight:700, color:s.color }}
                onMouseEnter={e => e.currentTarget.style.background="var(--hover-bg)"}
                onMouseLeave={e => e.currentTarget.style.background=""}>{s.icon} {s.label}</div>
            ))}
          </div>
        )}
      </div>
      <button onClick={onDelete} style={{ ...btn, background:"rgba(244,63,94,0.12)", color:"#F43F5E", fontSize:12 }}>🗑 Delete</button>
      <div style={{ width:1, height:20, background:"var(--border2)" }} />
      <button onClick={onClear} style={{ ...btn, background:"transparent", color:"var(--text3)", fontSize:12, padding:"6px 8px" }}>✕</button>
    </div>
  );
}

// ─── FILTERS PANEL ────────────────────────────────────────────────────────────
function FiltersPanel({ filters, setFilters, projects, allTags, onClose }) {
  const set = (k, v) => setFilters(f => ({ ...f, [k]: v }));
  const clear = () => setFilters({ search:"", priority:"all", status:"all", project:"all", tag:"", sort:"due", dateFrom:"", dateTo:"", showDone:true, showBlocked:false, minPoints:0 });

  return (
    <div style={{ position:"fixed", inset:0, zIndex:8500, display:"flex", alignItems:"flex-start", justifyContent:"flex-end" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ width:320, height:"100%", background:"var(--surface)", borderLeft:"1px solid var(--border)", padding:"20px", overflowY:"auto" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
          <h3 style={{ margin:0, fontSize:16, fontWeight:900, color:"var(--text)" }}>🔍 Filters</h3>
          <div style={{ display:"flex", gap:8 }}>
            <button onClick={clear} style={{ ...btn, background:"var(--surface3)", color:"var(--text3)", fontSize:11, padding:"5px 10px" }}>Clear All</button>
            <button onClick={onClose} style={{ background:"transparent", border:"none", color:"var(--text3)", cursor:"pointer", fontSize:20 }}>×</button>
          </div>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
          <div>
            <label style={lbl}>Search</label>
            <input value={filters.search} onChange={e => set("search", e.target.value)} placeholder="Title, description, tags..." style={inp} />
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            <div>
              <label style={lbl}>Priority</label>
              <select value={filters.priority} onChange={e => set("priority", e.target.value)} style={inp}>
                <option value="all">All</option>
                {PRIORITIES.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Status</label>
              <select value={filters.status} onChange={e => set("status", e.target.value)} style={inp}>
                <option value="all">All</option>
                {DEFAULT_STATUSES.map(s => <option key={s.id} value={s.id}>{s.icon} {s.label}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label style={lbl}>Project</label>
            <select value={filters.project} onChange={e => set("project", e.target.value)} style={inp}>
              <option value="all">All Projects</option>
              <option value="none">No Project</option>
              {projects?.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label style={lbl}>Tag</label>
            <select value={filters.tag} onChange={e => set("tag", e.target.value)} style={inp}>
              <option value="">All Tags</option>
              {allTags.map(t => <option key={t} value={t}>#{t}</option>)}
            </select>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            <div>
              <label style={lbl}>Due From</label>
              <input type="date" value={filters.dateFrom||""} onChange={e => set("dateFrom", e.target.value)} style={inp} />
            </div>
            <div>
              <label style={lbl}>Due To</label>
              <input type="date" value={filters.dateTo||""} onChange={e => set("dateTo", e.target.value)} style={inp} />
            </div>
          </div>
          <div>
            <label style={lbl}>Sort By</label>
            <select value={filters.sort} onChange={e => set("sort", e.target.value)} style={inp}>
              <option value="due">Due Date</option>
              <option value="priority">Priority</option>
              <option value="title">Title (A-Z)</option>
              <option value="created">Date Created</option>
              <option value="updated">Last Updated</option>
              <option value="points">Story Points</option>
              <option value="timeSpent">Time Logged</option>
            </select>
          </div>
          <div>
            <label style={lbl}>Min Story Points</label>
            <input type="number" min="0" value={filters.minPoints||""} onChange={e => set("minPoints", parseInt(e.target.value)||0)} placeholder="0 = all" style={inp} />
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            <label style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer" }}>
              <input type="checkbox" checked={filters.showDone} onChange={e => set("showDone", e.target.checked)} />
              <span style={{ fontSize:13, color:"var(--text2)" }}>Show Completed Tasks</span>
            </label>
            <label style={{ display:"flex", alignItems:"center", gap:8, cursor:"pointer" }}>
              <input type="checkbox" checked={filters.showBlocked} onChange={e => set("showBlocked", e.target.checked)} />
              <span style={{ fontSize:13, color:"var(--text2)" }}>Show Blocked Only</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN PAGE ─────────────────────────────────────────────────────────────────
export default function TasksPage({ tasks = [], projects = [], loading }) {
  const { user } = useAuth();
  const [view, setView] = useState("list");
  const [filters, setFilters] = useState({
    search:"", priority:"all", status:"all", project:"all", tag:"",
    sort:"due", dateFrom:"", dateTo:"", showDone:true, showBlocked:false, minPoints:0
  });
  const [selected, setSelected] = useState(new Set());
  const [activeTask, setActiveTask] = useState(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const VIEWS = [
    { id:"list",     icon:"☰",  label:"List"     },
    { id:"kanban",   icon:"▦",  label:"Board"    },
    { id:"calendar", icon:"📅", label:"Calendar" },
    { id:"timeline", icon:"📊", label:"Timeline" },
    { id:"table",    icon:"⊞",  label:"Table"    },
    { id:"mytasks",  icon:"👤", label:"My Tasks" },
    { id:"inbox",    icon:"📥", label:"Inbox"    },
  ];

  // All unique tags
  const allTags = useMemo(() => {
    const set = new Set();
    tasks.forEach(t => (t.tags||[]).forEach(tag => set.add(tag)));
    return [...set];
  }, [tasks]);

  // Active filter count
  const activeFilterCount = [
    filters.search, filters.priority!=="all", filters.status!=="all",
    filters.project!=="all", filters.tag, filters.dateFrom, filters.dateTo,
    !filters.showDone, filters.showBlocked, filters.minPoints>0
  ].filter(Boolean).length;

  // ── Filtered + Sorted ──
  const filtered = useMemo(() => {
    let t = [...tasks];
    if (filters.search) {
      const s = filters.search.toLowerCase();
      t = t.filter(x => x.title?.toLowerCase().includes(s) || x.desc?.toLowerCase().includes(s) || (x.tags||[]).some(tag => tag.includes(s)));
    }
    if (filters.priority !== "all") t = t.filter(x => x.priority===filters.priority);
    if (filters.status !== "all") t = t.filter(x => (x.status||"inbox")===filters.status);
    if (filters.project !== "all") {
      if (filters.project==="none") t = t.filter(x => !x.projectId);
      else t = t.filter(x => x.projectId===filters.project);
    }
    if (filters.tag) t = t.filter(x => (x.tags||[]).includes(filters.tag));
    if (filters.dateFrom) t = t.filter(x => x.due && x.due >= filters.dateFrom);
    if (filters.dateTo) t = t.filter(x => x.due && x.due <= filters.dateTo);
    if (!filters.showDone) t = t.filter(x => !x.done);
    if (filters.showBlocked) t = t.filter(x => (x.relations||[]).some(r=>r.type==="blocked_by") || (x.blockedBy||[]).length>0);
    if (filters.minPoints > 0) t = t.filter(x => (x.points||0) >= filters.minPoints);

    const PO = {urgent:0,high:1,medium:2,low:3,none:4};
    t.sort((a, b) => {
      if (filters.sort==="due")       return (a.due||"9999") < (b.due||"9999") ? -1 : 1;
      if (filters.sort==="priority")  return (PO[a.priority]||2) - (PO[b.priority]||2);
      if (filters.sort==="title")     return (a.title||"").localeCompare(b.title||"");
      if (filters.sort==="points")    return (b.points||0) - (a.points||0);
      if (filters.sort==="timeSpent") return (b.timeSpent||0) - (a.timeSpent||0);
      if (filters.sort==="created") {
        const at = typeof a.createdAt==="string" ? new Date(a.createdAt).getTime() : (a.createdAt?.seconds||0)*1000;
        const bt = typeof b.createdAt==="string" ? new Date(b.createdAt).getTime() : (b.createdAt?.seconds||0)*1000;
        return bt - at;
      }
      return 0;
    });
    return t;
  }, [tasks, filters]);

  const done    = tasks.filter(t => t.done).length;
  const total   = tasks.length;
  const overdue = tasks.filter(t => !t.done && isOverdue(t.due)).length;
  const todayC  = tasks.filter(t => !t.done && t.due===today()).length;
  const inboxC  = tasks.filter(t => !t.due && !t.done && (t.status==="inbox"||!t.status)).length;

  // ── Handlers ──
  async function handleAdd(taskData) {
    if (!user || !taskData.title?.trim()) return;
    await addTask(user.uid, { ...taskData, createdAt: new Date().toISOString() });
  }

  async function handleSave(form) {
    if (!user) return;
    if (!form.id) { await addTask(user.uid, { ...form, createdAt:new Date().toISOString() }); }
    else {
      const { id, ...data } = form;
      await updateTask(user.uid, id, { ...data, updatedAt:new Date().toISOString() });
    }
    setActiveTask(null);
  }

  async function handleToggle(task) {
    if (!user) return;
    await updateTask(user.uid, task.id, { done:!task.done, status:!task.done?"done":(task.status==="done"?"todo":task.status), completedAt:!task.done?new Date().toISOString():null, updatedAt:new Date().toISOString() });
  }

  async function handleDelete(id) {
    if (!user) return;
    await deleteTask(user.uid, id);
  }

  async function handleStatusChange(task, status) {
    if (!user) return;
    await updateTask(user.uid, task.id, { status, done:status==="done", updatedAt:new Date().toISOString() });
  }

  function toggleSelect(id) { setSelected(s => { const n=new Set(s); n.has(id)?n.delete(id):n.add(id); return n; }); }

  async function bulkMarkDone() {
    for (const id of selected) await updateTask(user.uid, id, { done:true, status:"done", updatedAt:new Date().toISOString() });
    setSelected(new Set());
  }
  async function bulkDelete() {
    if (!window.confirm(`${selected.size} tasks delete karo?`)) return;
    for (const id of selected) await deleteTask(user.uid, id);
    setSelected(new Set());
  }
  async function bulkSetPriority(priority) {
    for (const id of selected) await updateTask(user.uid, id, { priority });
    setSelected(new Set());
  }
  async function bulkSetStatus(status) {
    for (const id of selected) await updateTask(user.uid, id, { status, done:status==="done" });
    setSelected(new Set());
  }

  // Keyboard: 'n' = quick add focus, Esc = close drawer
  useEffect(() => {
    function onKey(e) {
      if (e.key==="Escape") { setActiveTask(null); setShowFilters(false); return; }
      if (e.key==="n" && !e.ctrlKey && !e.metaKey && !e.shiftKey && document.activeElement.tagName!=="INPUT" && document.activeElement.tagName!=="TEXTAREA") {
        document.querySelector(".quick-add-input")?.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div style={{ maxWidth:1200, margin:"0 auto" }}>
      {/* Header */}
      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:16, flexWrap:"wrap", gap:10 }}>
        <div>
          <h1 style={{ fontFamily:"var(--font-head)", fontSize:26, fontWeight:900, color:"var(--text)", letterSpacing:"-0.5px", margin:0 }}>📋 Tasks</h1>
          <div style={{ display:"flex", gap:12, marginTop:5, flexWrap:"wrap" }}>
            <span style={{ fontSize:12, color:"var(--text3)" }}>{total} total</span>
            <span style={{ fontSize:12, color:"#10B981", fontWeight:700 }}>✓ {done} done</span>
            {overdue > 0 && <span style={{ fontSize:12, color:"#F43F5E", fontWeight:700 }}>⚠ {overdue} overdue</span>}
            {todayC > 0 && <span style={{ fontSize:12, color:"#F59E0B", fontWeight:700 }}>☀ {todayC} today</span>}
            {inboxC > 0 && <span style={{ fontSize:12, color:"var(--text3)" }}>📥 {inboxC} inbox</span>}
            {total > 0 && <span style={{ fontSize:12, color:"var(--text3)" }}>{Math.round(done/total*100)}% complete</span>}
          </div>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <button onClick={() => setShowTemplates(t => !t)}
            style={{ ...btn, background:showTemplates?"var(--accent)":"var(--surface2)", color:showTemplates?"#fff":"var(--text2)", border:"1px solid var(--border)" }}>
            📄 Templates
          </button>
        </div>
      </div>

      {/* Quick Add */}
      <QuickAdd onAdd={handleAdd} projects={projects} />

      {/* Templates */}
      {showTemplates && (
        <div style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:14, padding:"14px", marginBottom:14, display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))", gap:8 }}>
          {TEMPLATES.map(tpl => (
            <button key={tpl.label} onClick={() => { handleAdd({ title:tpl.label, ...tpl, status:"inbox" }); setShowTemplates(false); }}
              style={{ padding:"12px 10px", background:"var(--surface2)", border:"1px solid var(--border)", borderRadius:10, cursor:"pointer", textAlign:"left", fontFamily:"inherit", transition:"all 0.15s" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor="var(--accent)"; e.currentTarget.style.transform="translateY(-2px)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor="var(--border)"; e.currentTarget.style.transform="none"; }}>
              <div style={{ fontSize:20, marginBottom:5 }}>{tpl.icon}</div>
              <div style={{ fontSize:12, fontWeight:700, color:"var(--text)" }}>{tpl.label}</div>
              <div style={{ fontSize:10, color:"var(--text3)", marginTop:3 }}>~{tpl.estimatedTime}m</div>
            </button>
          ))}
        </div>
      )}

      {/* Toolbar */}
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14, flexWrap:"wrap" }}>
        {/* View tabs */}
        <div style={{ display:"flex", background:"var(--surface2)", borderRadius:10, padding:3, border:"1px solid var(--border)", flexWrap:"nowrap", overflowX:"auto" }}>
          {VIEWS.map(v => (
            <button key={v.id} onClick={() => setView(v.id)}
              style={{ padding:"6px 10px", border:"none", borderRadius:8, background:view===v.id?"var(--accent)":"transparent", color:view===v.id?"#fff":"var(--text3)", fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:"inherit", transition:"all 0.15s", whiteSpace:"nowrap" }}>
              {v.icon} {v.label}
            </button>
          ))}
        </div>

        {/* Filter button */}
        <button onClick={() => setShowFilters(true)}
          style={{ ...btn, background:activeFilterCount>0?"var(--accent)":"var(--surface2)", color:activeFilterCount>0?"#fff":"var(--text2)", border:`1px solid ${activeFilterCount>0?"var(--accent)":"var(--border)"}`, fontSize:12, position:"relative" }}>
          🔍 Filters {activeFilterCount > 0 && `(${activeFilterCount})`}
        </button>

        {/* Quick search */}
        <input value={filters.search} onChange={e => setFilters(f=>({...f,search:e.target.value}))}
          placeholder="Search..." className="quick-add-input"
          style={{ ...inp, width:160, fontSize:12 }} />

        {/* Select all */}
        {view==="list" && (
          <button onClick={() => selected.size===filtered.length ? setSelected(new Set()) : setSelected(new Set(filtered.map(t=>t.id)))}
            style={{ ...btn, background:"var(--surface2)", color:"var(--text3)", border:"1px solid var(--border)", fontSize:11 }}>
            {selected.size===filtered.length ? "Deselect All" : "Select All"}
          </button>
        )}

        <div style={{ flex:1 }} />
        <span style={{ fontSize:12, color:"var(--text3)" }}>{filtered.length} tasks</span>
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ display:"flex", gap:12, flexDirection:"column" }}>
          {[1,2,3,4,5].map(i => <div key={i} className="skeleton" style={{ height:48, borderRadius:10 }} />)}
        </div>
      )}

      {/* Empty */}
      {!loading && filtered.length===0 && view!=="inbox" && (
        <div style={{ textAlign:"center", padding:"60px 20px", color:"var(--text3)" }}>
          <div style={{ fontSize:60, marginBottom:14 }}>📋</div>
          <div style={{ fontSize:18, fontWeight:800, color:"var(--text2)", marginBottom:6 }}>
            {activeFilterCount>0 ? "Koi match nahi mila" : "Koi task nahi hai"}
          </div>
          <div style={{ fontSize:14, marginBottom:20 }}>
            {activeFilterCount>0 ? "Filters clear karo" : 'Upar se task add karo ya "n" dabao'}
          </div>
          {activeFilterCount>0 && (
            <button onClick={() => setFilters(f=>({...f,search:"",priority:"all",status:"all",project:"all",tag:"",dateFrom:"",dateTo:"",showDone:true,showBlocked:false,minPoints:0}))}
              style={{ ...btn, background:"var(--accent)", color:"#fff", padding:"10px 20px" }}>Clear Filters</button>
          )}
        </div>
      )}

      {/* Views */}
      {!loading && (
        <>
          {view==="list"     && filtered.length>0 && <ListView tasks={filtered} onEdit={setActiveTask} onToggle={handleToggle} onDelete={handleDelete} selected={selected} onSelect={toggleSelect} allTasks={tasks} />}
          {view==="kanban"   && <KanbanView tasks={filtered} onEdit={setActiveTask} onStatusChange={handleStatusChange} onToggle={handleToggle} />}
          {view==="calendar" && <CalendarView tasks={filtered} onEdit={setActiveTask} />}
          {view==="timeline" && <TimelineView tasks={filtered} onEdit={setActiveTask} />}
          {view==="table"    && <TableView tasks={filtered} onEdit={setActiveTask} onToggle={handleToggle} onDelete={handleDelete} />}
          {view==="mytasks"  && <MyTasksView tasks={filtered} onEdit={setActiveTask} onToggle={handleToggle} />}
          {view==="inbox"    && <InboxView tasks={tasks} onEdit={setActiveTask} onToggle={handleToggle} onDelete={handleDelete} />}
        </>
      )}

      {/* Bulk bar */}
      {selected.size > 0 && (
        <BulkBar count={selected.size} onMarkDone={bulkMarkDone} onDelete={bulkDelete} onSetPriority={bulkSetPriority} onSetStatus={bulkSetStatus} onClear={() => setSelected(new Set())} />
      )}

      {/* Filters panel */}
      {showFilters && <FiltersPanel filters={filters} setFilters={setFilters} projects={projects} allTags={allTags} onClose={() => setShowFilters(false)} />}

      {/* Task drawer */}
      {activeTask && (
        <TaskDrawer task={activeTask} allTasks={tasks} projects={projects} onSave={handleSave} onDelete={handleDelete} onClose={() => setActiveTask(null)} />
      )}

      <style>{`
        .task-row:hover .task-del { opacity: 1 !important; }
        @keyframes slideUp { from{opacity:0;transform:translateY(16px) translateX(-50%)} to{opacity:1;transform:translateY(0) translateX(-50%)} }
        @keyframes slideInRight { from{transform:translateX(100%)} to{transform:none} }
      `}</style>
    </div>
  );
}
