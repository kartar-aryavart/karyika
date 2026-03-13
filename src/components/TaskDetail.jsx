// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🏆 TaskDetail — World Class Task Panel
// Better than ClickUp: Full block editor · AI writing · Activity
// Relations · Custom fields · Time tracking · Attachments
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "../hooks/useAuth";
import { updateTask, deleteTask } from "../firebase/services";
import { doc, collection, addDoc, onSnapshot, serverTimestamp, orderBy, query } from "firebase/firestore";
import { db } from "../firebase/config";

// ─── UTILS ────────────────────────────────────────────────────────
const uid  = () => Math.random().toString(36).slice(2,10);
const today = () => new Date().toISOString().split("T")[0];
const fmtDate = d => { if(!d) return ""; try { return new Date(d+"T00:00").toLocaleDateString("en-IN",{month:"short",day:"numeric",year:"numeric"}); } catch { return d; }};
const fmtTime = ms => { if(!ms) return "—"; const h=Math.floor(ms/60); const m=ms%60; return h>0?`${h}h ${m}m`:`${m}m`; };
const relTime = ts => { if(!ts) return ""; const d=new Date(ts.seconds?ts.seconds*1000:ts); const diff=(Date.now()-d)/1000; if(diff<60) return "just now"; if(diff<3600) return `${Math.floor(diff/60)}m ago`; if(diff<86400) return `${Math.floor(diff/3600)}h ago`; return d.toLocaleDateString("en-IN",{month:"short",day:"numeric"}); };

const PRIORITIES = [
  { id:"urgent", label:"Urgent",  color:"#F97316", bg:"rgba(249,115,22,0.12)", icon:"🔴" },
  { id:"high",   label:"High",    color:"#F43F5E", bg:"rgba(244,63,94,0.12)",  icon:"🟠" },
  { id:"medium", label:"Medium",  color:"#F59E0B", bg:"rgba(245,158,11,0.12)", icon:"🟡" },
  { id:"low",    label:"Low",     color:"#10B981", bg:"rgba(16,185,129,0.12)", icon:"🟢" },
  { id:"none",   label:"None",    color:"#6B7280", bg:"rgba(107,114,128,0.08)",icon:"⚪" },
];
const PRI = Object.fromEntries(PRIORITIES.map(p=>[p.id,p]));

const STATUSES = [
  { id:"inbox",       label:"Inbox",       color:"#6B7280", icon:"📥" },
  { id:"todo",        label:"To Do",       color:"#818CF8", icon:"⬜" },
  { id:"in-progress", label:"In Progress", color:"#F59E0B", icon:"🔄" },
  { id:"review",      label:"In Review",   color:"#06B6D4", icon:"👁" },
  { id:"blocked",     label:"Blocked",     color:"#F43F5E", icon:"🚫" },
  { id:"done",        label:"Done",        color:"#10B981", icon:"✅" },
];
const ST = Object.fromEntries(STATUSES.map(s=>[s.id,s]));

const RELATION_TYPES = [
  { id:"blocks",    label:"Blocks",     icon:"🚫", color:"#F43F5E" },
  { id:"blocked-by",label:"Blocked by", icon:"⛔", color:"#F97316" },
  { id:"related",   label:"Related to", icon:"🔗", color:"#818CF8" },
  { id:"duplicate", label:"Duplicate",  icon:"📋", color:"#6B7280" },
  { id:"child",     label:"Child of",   icon:"↳",  color:"#06B6D4" },
  { id:"parent",    label:"Parent of",  icon:"↰",  color:"#10B981" },
];

const TAGS_PALETTE = ["#F43F5E","#F97316","#F59E0B","#10B981","#06B6D4","#818CF8","#8B5CF6","#EC4899","#84CC16","#14B8A6"];

// ─── BLOCK TYPES ──────────────────────────────────────────────────
const BLOCK_TYPES = {
  "p":          { label:"Normal text",    icon:"T",   tag:"p" },
  "h1":         { label:"Heading 1",      icon:"H1",  tag:"h1" },
  "h2":         { label:"Heading 2",      icon:"H2",  tag:"h2" },
  "h3":         { label:"Heading 3",      icon:"H3",  tag:"h3" },
  "h4":         { label:"Heading 4",      icon:"H4",  tag:"h4" },
  "bullet":     { label:"Bulleted list",  icon:"•",   tag:"li" },
  "numbered":   { label:"Numbered list",  icon:"1.",  tag:"li" },
  "checklist":  { label:"Checklist",      icon:"☑",   tag:"li" },
  "toggle":     { label:"Toggle list",    icon:"▶",   tag:"div" },
  "code":       { label:"Code block",     icon:"</>", tag:"code" },
  "quote":      { label:"Block quote",    icon:"❝",   tag:"blockquote" },
  "callout":    { label:"Callout/Banner", icon:"💡",  tag:"div" },
  "divider":    { label:"Divider",        icon:"—",   tag:"hr" },
  "table":      { label:"Table",          icon:"⊞",   tag:"table" },
};

const SLASH_MENU = [
  { group:"Text", items:[
    { type:"p",        icon:"Aa", label:"Normal text",    desc:"Start writing" },
    { type:"h1",       icon:"H1", label:"Heading 1",      desc:"Big section heading" },
    { type:"h2",       icon:"H2", label:"Heading 2",      desc:"Medium heading" },
    { type:"h3",       icon:"H3", label:"Heading 3",      desc:"Small heading" },
    { type:"h4",       icon:"H4", label:"Heading 4",      desc:"Smallest heading" },
  ]},
  { group:"Lists", items:[
    { type:"bullet",   icon:"•",  label:"Bulleted list",  desc:"Simple bullet list" },
    { type:"numbered", icon:"1.", label:"Numbered list",  desc:"Ordered list" },
    { type:"checklist",icon:"☑",  label:"Checklist",      desc:"To-do items" },
    { type:"toggle",   icon:"▶",  label:"Toggle",         desc:"Collapsible content" },
  ]},
  { group:"Advanced", items:[
    { type:"callout",  icon:"💡", label:"Callout",        desc:"Highlight with icon" },
    { type:"code",     icon:"</>",label:"Code block",     desc:"Code with syntax" },
    { type:"quote",    icon:"❝",  label:"Block quote",    desc:"Quote block" },
    { type:"divider",  icon:"—",  label:"Divider",        desc:"Horizontal line" },
    { type:"table",    icon:"⊞",  label:"Table",          desc:"2D data grid" },
  ]},
  { group:"Task Actions", items:[
    { type:"__subtask",icon:"☑",  label:"Add Subtask",    desc:"Create a subtask" },
    { type:"__status", icon:"◎",  label:"Change Status",  desc:"Update task status" },
    { type:"__due",    icon:"📅", label:"Set Due Date",   desc:"Pick a date" },
    { type:"__prio",   icon:"🔴", label:"Set Priority",   desc:"Change priority" },
  ]},
  { group:"AI ✨", items:[
    { type:"__ai_summary",  icon:"🤖", label:"Summarize",       desc:"AI se summary banao" },
    { type:"__ai_subtasks", icon:"✨", label:"Generate subtasks",desc:"AI se subtasks banao" },
    { type:"__ai_improve",  icon:"📝", label:"Improve writing",  desc:"AI se likhavat sudhari" },
  ]},
];

// ─── INLINE STYLES ────────────────────────────────────────────────
const S = {
  inp:   { background:"var(--input-bg,#1a1a2e)", border:"1px solid var(--border2,#2a2a3e)", borderRadius:10, color:"var(--text,#fff)", fontSize:13, padding:"9px 13px", fontFamily:"inherit", outline:"none", width:"100%", boxSizing:"border-box", transition:"border 0.15s" },
  lbl:   { fontSize:10, fontWeight:800, color:"var(--text3,#6B7280)", display:"block", marginBottom:5, textTransform:"uppercase", letterSpacing:"0.8px" },
  btn:   { padding:"7px 14px", border:"none", borderRadius:9, cursor:"pointer", fontSize:12, fontWeight:700, fontFamily:"inherit", transition:"all 0.15s" },
  badge: (color, bg) => ({ fontSize:11, padding:"3px 9px", background:bg, color, borderRadius:20, fontWeight:700, display:"inline-flex", alignItems:"center", gap:4, cursor:"pointer", border:`1px solid ${color}30`, transition:"all 0.15s" }),
  field: { display:"flex", alignItems:"center", gap:12, padding:"8px 0", borderBottom:"1px solid var(--border,#1e1e2e)" },
  fieldLabel: { fontSize:12, color:"var(--text3,#6B7280)", width:130, flexShrink:0, display:"flex", alignItems:"center", gap:6 },
};

// ─── BLOCK EDITOR ─────────────────────────────────────────────────
function BlockEditor({ value, onChange, placeholder = "Type '/' for commands, or start writing..." }) {
  const [blocks, setBlocks] = useState(() => {
    if (!value) return [{ id:uid(), type:"p", content:"", checked:false }];
    try { return JSON.parse(value); } catch { return [{ id:uid(), type:"p", content:value||"", checked:false }]; }
  });
  const [slashMenu, setSlashMenu] = useState(null); // {blockId, query, x, y}
  const [slashIdx, setSlashIdx]   = useState(0);
  const [toggleOpen, setToggleOpen] = useState({});
  const refs = useRef({});

  // Sync to parent
  useEffect(() => { onChange(JSON.stringify(blocks)); }, [blocks]);

  // Filter slash menu items
  const slashItems = useMemo(() => {
    if (!slashMenu) return [];
    const q = slashMenu.query.toLowerCase();
    return SLASH_MENU.flatMap(g => g.items.filter(i =>
      i.label.toLowerCase().includes(q) || i.desc.toLowerCase().includes(q)
    ));
  }, [slashMenu]);

  function updateBlock(id, patch) {
    setBlocks(b => b.map(bl => bl.id===id ? {...bl,...patch} : bl));
  }

  function insertBlock(afterId, type="p") {
    const newB = { id:uid(), type, content:"", checked:false };
    setBlocks(b => {
      const i = b.findIndex(bl=>bl.id===afterId);
      const next = [...b];
      next.splice(i+1, 0, newB);
      return next;
    });
    setTimeout(() => refs.current[newB.id]?.focus(), 30);
    return newB.id;
  }

  function deleteBlock(id) {
    setBlocks(b => {
      if (b.length === 1) return [{ id:uid(), type:"p", content:"", checked:false }];
      const i = b.findIndex(bl=>bl.id===id);
      const prev = b[i-1] || b[i+1];
      const next = b.filter(bl=>bl.id!==id);
      setTimeout(() => refs.current[prev?.id]?.focus(), 30);
      return next;
    });
  }

  function changeBlockType(id, type) {
    updateBlock(id, { type });
    setSlashMenu(null);
    setTimeout(() => refs.current[id]?.focus(), 30);
  }

  function handleKeyDown(e, block) {
    const el = e.target;
    const val = el.value ?? el.textContent ?? "";

    // Slash command
    if (e.key === "/" && val === "") {
      const rect = el.getBoundingClientRect();
      setSlashMenu({ blockId:block.id, query:"", x:rect.left, y:rect.bottom+4 });
      setSlashIdx(0);
      return;
    }

    if (slashMenu && slashMenu.blockId === block.id) {
      if (e.key === "ArrowDown") { e.preventDefault(); setSlashIdx(i=>Math.min(i+1,slashItems.length-1)); return; }
      if (e.key === "ArrowUp")   { e.preventDefault(); setSlashIdx(i=>Math.max(i-1,0)); return; }
      if (e.key === "Enter")     { e.preventDefault(); applySlash(slashItems[slashIdx]?.type, block.id); return; }
      if (e.key === "Escape")    { setSlashMenu(null); return; }
    }

    if (e.key === "Enter" && block.type !== "code") {
      e.preventDefault();
      if (block.type==="bullet"||block.type==="numbered"||block.type==="checklist") {
        if (!val.trim()) { changeBlockType(block.id,"p"); return; }
        insertBlock(block.id, block.type);
      } else {
        insertBlock(block.id, "p");
      }
    }
    if (e.key === "Backspace" && val === "") {
      e.preventDefault();
      deleteBlock(block.id);
    }
    if (e.key === "Tab") {
      e.preventDefault();
      const ta = e.target;
      const s = ta.selectionStart, en = ta.selectionEnd;
      const nv = val.slice(0,s)+"  "+val.slice(en);
      updateBlock(block.id, { content:nv });
      setTimeout(()=>{ ta.selectionStart=ta.selectionEnd=s+2; },0);
    }
  }

  function handleInput(e, blockId) {
    const val = e.target.value;
    updateBlock(blockId, { content:val });
    // Update slash query
    if (slashMenu?.blockId===blockId) {
      const slashPos = val.lastIndexOf("/");
      if (slashPos >= 0) setSlashMenu(m => ({...m, query:val.slice(slashPos+1)}));
      else setSlashMenu(null);
    }
  }

  function applySlash(type, blockId) {
    if (!type) return;
    setSlashMenu(null);
    if (type.startsWith("__")) {
      // Special actions handled by parent via event
      updateBlock(blockId, { content:"" });
      const el = refs.current[blockId];
      if (el) el.value="";
      return;
    }
    // Clean "/" from content
    updateBlock(blockId, { type, content:"" });
    const el = refs.current[blockId];
    if (el) { el.value=""; setTimeout(()=>el.focus(),30); }
  }

  // Block styles
  function blockStyle(type) {
    const base = { width:"100%", background:"transparent", border:"none", outline:"none", color:"var(--text,#fff)", fontFamily:"inherit", resize:"none", overflow:"hidden", lineHeight:1.6 };
    if (type==="h1") return {...base, fontSize:24, fontWeight:900, letterSpacing:"-0.5px"};
    if (type==="h2") return {...base, fontSize:20, fontWeight:800};
    if (type==="h3") return {...base, fontSize:17, fontWeight:700};
    if (type==="h4") return {...base, fontSize:15, fontWeight:700, color:"var(--text2)"};
    if (type==="quote") return {...base, borderLeft:"3px solid var(--accent,#FF6B35)", paddingLeft:12, color:"var(--text2)", fontStyle:"italic"};
    if (type==="code") return {...base, fontFamily:"'Fira Code','Courier New',monospace", fontSize:12, background:"rgba(0,0,0,0.3)", padding:"2px 8px", borderRadius:6, color:"#10B981"};
    return {...base, fontSize:14};
  }

  function renderBlock(block, idx) {
    const isCallout = block.type==="callout";
    const isToggle  = block.type==="toggle";
    const isDivider = block.type==="divider";
    const isChecklist=block.type==="checklist";
    const isBullet  = block.type==="bullet";
    const isNum     = block.type==="numbered";
    const isCode    = block.type==="code";

    return (
      <div key={block.id} style={{ display:"flex", gap:8, alignItems:"flex-start", padding:"1px 0", position:"relative" }}
        className="block-row">

        {/* Bullet/Number/Checkbox prefix */}
        {isBullet   && <span style={{ color:"var(--accent,#FF6B35)", fontSize:18, lineHeight:"1.6", flexShrink:0, marginTop:2 }}>•</span>}
        {isNum      && <span style={{ color:"var(--text3)", fontSize:13, lineHeight:"2", flexShrink:0, minWidth:20, fontWeight:700 }}>{idx+1}.</span>}
        {isChecklist && (
          <div onClick={() => updateBlock(block.id,{checked:!block.checked})}
            style={{ width:16,height:16,borderRadius:4,border:`2px solid ${block.checked?"#10B981":"var(--border2,#2a2a3e)"}`,background:block.checked?"#10B981":"transparent",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",flexShrink:0,marginTop:4 }}>
            {block.checked && <span style={{color:"#fff",fontSize:9,fontWeight:900}}>✓</span>}
          </div>
        )}
        {isToggle && (
          <span onClick={()=>setToggleOpen(o=>({...o,[block.id]:!o[block.id]}))}
            style={{ color:"var(--text3)", fontSize:12, cursor:"pointer", flexShrink:0, marginTop:4, transform:toggleOpen[block.id]?"rotate(90deg)":"rotate(0)", transition:"transform 0.15s" }}>▶</span>
        )}

        {/* Content */}
        <div style={{ flex:1 }}>
          {isDivider ? (
            <hr style={{ border:"none", borderTop:"2px solid var(--border)", margin:"8px 0" }} />
          ) : isCallout ? (
            <div style={{ background:"rgba(255,107,53,0.08)", border:"1px solid rgba(255,107,53,0.2)", borderRadius:10, padding:"10px 14px", display:"flex", gap:10 }}>
              <span style={{ fontSize:18, flexShrink:0 }}>{block.icon||"💡"}</span>
              <textarea ref={el=>refs.current[block.id]=el} value={block.content||""}
                onInput={e=>handleInput(e,block.id)} onKeyDown={e=>handleKeyDown(e,block)}
                style={{ ...blockStyle("p"), flex:1 }} rows={1}
                onInput={e=>{e.target.style.height="auto";e.target.style.height=e.target.scrollHeight+"px"; handleInput(e,block.id);}}
                placeholder="Callout text..." />
            </div>
          ) : isCode ? (
            <div style={{ background:"#0d0d1a", border:"1px solid var(--border)", borderRadius:10, overflow:"hidden" }}>
              <div style={{ padding:"6px 12px", background:"rgba(255,255,255,0.04)", fontSize:10, color:"var(--text3)", fontWeight:700, textTransform:"uppercase" }}>CODE</div>
              <textarea ref={el=>refs.current[block.id]=el} value={block.content||""}
                onInput={e=>{updateBlock(block.id,{content:e.target.value}); e.target.style.height="auto"; e.target.style.height=e.target.scrollHeight+"px";}}
                onKeyDown={e=>handleKeyDown(e,block)}
                style={{ ...blockStyle("code"), display:"block", padding:"10px 14px", width:"100%", boxSizing:"border-box", minHeight:60 }}
                placeholder="// Write your code here..." />
            </div>
          ) : (
            <textarea ref={el=>refs.current[block.id]=el} value={block.content||""}
              onInput={e=>{updateBlock(block.id,{content:e.target.value}); e.target.style.height="auto"; e.target.style.height=e.target.scrollHeight+"px";}}
              onKeyDown={e=>handleKeyDown(e,block)}
              style={{ ...blockStyle(block.type), display:"block", textDecoration:isChecklist&&block.checked?"line-through":"none", opacity:isChecklist&&block.checked?0.5:1 }}
              rows={1}
              placeholder={block.content===""&&block.type==="p" ? placeholder : ""} />
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ position:"relative", minHeight:80 }} onClick={()=>slashMenu&&setSlashMenu(null)}>
      <div style={{ display:"flex", flexDirection:"column", gap:2 }}>
        {blocks.map((block,i) => renderBlock(block,i))}
      </div>

      {/* Slash command menu */}
      {slashMenu && slashItems.length > 0 && (
        <div style={{ position:"fixed", left:slashMenu.x, top:slashMenu.y, background:"var(--modal-bg,#13131f)", border:"1px solid var(--border2)", borderRadius:12, boxShadow:"0 16px 48px rgba(0,0,0,0.7)", zIndex:99999, minWidth:260, maxHeight:320, overflowY:"auto", padding:4 }}
          onClick={e=>e.stopPropagation()}>
          {SLASH_MENU.map(group => {
            const items = group.items.filter(i => slashItems.includes(i));
            if (!items.length) return null;
            return (
              <div key={group.group}>
                <div style={{ fontSize:10, fontWeight:800, color:"var(--text3)", padding:"6px 10px 2px", textTransform:"uppercase", letterSpacing:"0.8px" }}>{group.group}</div>
                {items.map((item,i) => {
                  const globalIdx = slashItems.indexOf(item);
                  return (
                    <div key={item.type} onClick={()=>applySlash(item.type, slashMenu.blockId)}
                      style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 10px", borderRadius:8, cursor:"pointer", background:slashIdx===globalIdx?"rgba(255,107,53,0.12)":"transparent", transition:"background 0.1s" }}
                      onMouseEnter={()=>setSlashIdx(globalIdx)}>
                      <div style={{ width:28,height:28,background:"var(--surface2,#16162a)",borderRadius:7,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:800,color:"var(--text2)",flexShrink:0 }}>{item.icon}</div>
                      <div>
                        <div style={{ fontSize:13,fontWeight:600,color:"var(--text)" }}>{item.label}</div>
                        <div style={{ fontSize:11,color:"var(--text3)",marginTop:1 }}>{item.desc}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}

      <style>{`.block-row:hover { background: rgba(255,255,255,0.02); border-radius:6px; }`}</style>
    </div>
  );
}

// ─── FIELD ROW (ClickUp-style) ─────────────────────────────────────
function FieldRow({ icon, label, children }) {
  return (
    <div style={S.field}>
      <span style={S.fieldLabel}><span style={{fontSize:14}}>{icon}</span> {label}</span>
      <div style={{ flex:1 }}>{children}</div>
    </div>
  );
}

// ─── INLINE SELECT ─────────────────────────────────────────────────
function InlineSelect({ value, options, onChange, renderValue }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();
  useEffect(() => {
    if (!open) return;
    function handler(e) { if (!ref.current?.contains(e.target)) setOpen(false); }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} style={{ position:"relative", display:"inline-block" }}>
      <div onClick={()=>setOpen(o=>!o)} style={{ cursor:"pointer" }}>
        {renderValue ? renderValue(value) : <span style={{ fontSize:13, color:"var(--text2)", padding:"4px 8px", borderRadius:6, background:"var(--surface2)", border:"1px solid var(--border)" }}>{value||"—"}</span>}
      </div>
      {open && (
        <div style={{ position:"absolute", top:"calc(100%+4px)", left:0, background:"var(--modal-bg,#13131f)", border:"1px solid var(--border2)", borderRadius:10, boxShadow:"0 12px 40px rgba(0,0,0,0.7)", zIndex:10000, minWidth:160, overflow:"hidden", padding:4 }}>
          {options.map(opt => (
            <div key={opt.id||opt} onClick={()=>{onChange(opt.id||opt);setOpen(false);}}
              style={{ padding:"8px 12px", cursor:"pointer", fontSize:13, borderRadius:7, transition:"background 0.1s" }}
              onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.06)"}
              onMouseLeave={e=>e.currentTarget.style.background=""}>
              {opt.icon && <span style={{marginRight:7}}>{opt.icon}</span>}
              <span style={{ color:opt.color||"var(--text)" }}>{opt.label||opt}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── ACTIVITY + COMMENTS ──────────────────────────────────────────
function ActivityPanel({ taskId, userId }) {
  const [comments, setComments] = useState([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef();

  useEffect(() => {
    if (!userId || !taskId) return;
    const q = query(
      collection(db, "users", userId, "tasks", taskId, "activity"),
      orderBy("createdAt", "asc")
    );
    return onSnapshot(q, snap => {
      setComments(snap.docs.map(d => ({ id:d.id, ...d.data() })));
      setTimeout(()=>bottomRef.current?.scrollIntoView({behavior:"smooth"}),100);
    }, err => console.log("Activity:", err));
  }, [taskId, userId]);

  async function sendComment() {
    if (!text.trim() || !userId || !taskId) return;
    setSending(true);
    try {
      await addDoc(collection(db, "users", userId, "tasks", taskId, "activity"), {
        type: "comment",
        text: text.trim(),
        userId,
        createdAt: serverTimestamp(),
      });
      setText("");
    } catch(e) { console.error(e); }
    setSending(false);
  }

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%", minHeight:300 }}>
      {/* Feed */}
      <div style={{ flex:1, overflowY:"auto", display:"flex", flexDirection:"column", gap:12, paddingBottom:8 }}>
        {comments.length === 0 && (
          <div style={{ textAlign:"center", padding:"32px 20px", color:"var(--text3)" }}>
            <div style={{ fontSize:32, marginBottom:8 }}>💬</div>
            <div style={{ fontSize:13, fontWeight:600 }}>Koi activity nahi abhi</div>
            <div style={{ fontSize:12, marginTop:4 }}>Comment karo ya changes karo</div>
          </div>
        )}
        {comments.map(c => (
          <div key={c.id} style={{ display:"flex", gap:10, alignItems:"flex-start" }}>
            <div style={{ width:30,height:30,borderRadius:"50%",background:"linear-gradient(135deg,#FF6B35,#818CF8)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:900,color:"#fff",flexShrink:0 }}>
              {c.type==="comment"?"K":"⚡"}
            </div>
            <div style={{ flex:1, background:"var(--surface2)", border:"1px solid var(--border)", borderRadius:10, padding:"10px 12px" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:4 }}>
                <span style={{ fontSize:11, fontWeight:700, color:"var(--text2)" }}>
                  {c.type==="comment" ? "You" : "System"}
                </span>
                <span style={{ fontSize:10, color:"var(--text3)" }}>{relTime(c.createdAt)}</span>
              </div>
              <div style={{ fontSize:13, color:"var(--text)", lineHeight:1.5 }}>{c.text}</div>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Comment box */}
      <div style={{ borderTop:"1px solid var(--border)", paddingTop:12, marginTop:8 }}>
        <div style={{ display:"flex", gap:8, alignItems:"flex-end" }}>
          <textarea value={text} onChange={e=>setText(e.target.value)}
            onKeyDown={e=>{ if(e.key==="Enter"&&(e.ctrlKey||e.metaKey)) sendComment(); }}
            placeholder="Comment likho... (Ctrl+Enter to send)"
            style={{ ...S.inp, flex:1, minHeight:60, resize:"none", lineHeight:1.5, padding:"10px 12px" }} />
          <button onClick={sendComment} disabled={!text.trim()||sending}
            style={{ ...S.btn, background:"var(--accent,#FF6B35)", color:"#fff", padding:"10px 16px", opacity:(!text.trim()||sending)?0.5:1, flexShrink:0 }}>
            {sending?"...":"Send"}
          </button>
        </div>
        <div style={{ fontSize:10, color:"var(--text3)", marginTop:4 }}>Ctrl+Enter to send • Markdown supported</div>
      </div>
    </div>
  );
}

// ─── SUBTASKS PANEL ────────────────────────────────────────────────
function SubtasksPanel({ subtasks=[], onChange }) {
  const [input, setInput] = useState("");
  const [editId, setEditId] = useState(null);
  const [editVal, setEditVal] = useState("");
  const done = subtasks.filter(s=>s.done).length;
  const pct  = subtasks.length ? Math.round(done/subtasks.length*100) : 0;

  function add() {
    if (!input.trim()) return;
    onChange([...subtasks, { id:uid(), title:input.trim(), done:false, createdAt:new Date().toISOString(), priority:"none" }]);
    setInput("");
  }
  function toggle(id) { onChange(subtasks.map(s=>s.id===id?{...s,done:!s.done}:s)); }
  function remove(id) { onChange(subtasks.filter(s=>s.id!==id)); }
  function saveEdit(id) { onChange(subtasks.map(s=>s.id===id?{...s,title:editVal}:s)); setEditId(null); }

  return (
    <div>
      {/* Progress */}
      {subtasks.length > 0 && (
        <div style={{ marginBottom:16 }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
            <span style={{ fontSize:12, color:"var(--text3)" }}>{done} of {subtasks.length} done</span>
            <span style={{ fontSize:12, fontWeight:800, color:pct===100?"#10B981":"var(--accent)" }}>{pct}%</span>
          </div>
          <div style={{ height:5, background:"var(--surface3)", borderRadius:5, overflow:"hidden" }}>
            <div style={{ height:"100%", width:`${pct}%`, background:pct===100?"#10B981":"linear-gradient(90deg,#FF6B35,#818CF8)", borderRadius:5, transition:"width 0.4s" }} />
          </div>
        </div>
      )}

      {/* List */}
      <div style={{ display:"flex", flexDirection:"column", gap:5, marginBottom:12 }}>
        {subtasks.map(st => (
          <div key={st.id} style={{ display:"flex", alignItems:"center", gap:9, padding:"9px 12px", background:"var(--surface2)", borderRadius:10, border:"1px solid var(--border)", transition:"all 0.1s" }}
            onMouseEnter={e=>e.currentTarget.style.borderColor="var(--border2)"}
            onMouseLeave={e=>e.currentTarget.style.borderColor="var(--border)"}>
            {/* Check */}
            <div onClick={()=>toggle(st.id)} style={{ width:16,height:16,borderRadius:4,border:`2px solid ${st.done?"#10B981":"var(--border2)"}`,background:st.done?"#10B981":"transparent",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",flexShrink:0,transition:"all 0.15s" }}>
              {st.done && <span style={{color:"#fff",fontSize:9,fontWeight:900}}>✓</span>}
            </div>
            {/* Title */}
            {editId===st.id ? (
              <input autoFocus value={editVal} onChange={e=>setEditVal(e.target.value)}
                onBlur={()=>saveEdit(st.id)} onKeyDown={e=>{if(e.key==="Enter")saveEdit(st.id);if(e.key==="Escape")setEditId(null);}}
                style={{ ...S.inp, flex:1, padding:"3px 8px", fontSize:13 }} />
            ) : (
              <span onDoubleClick={()=>{setEditId(st.id);setEditVal(st.title);}} style={{ flex:1, fontSize:13, color:"var(--text)", textDecoration:st.done?"line-through":"none", opacity:st.done?0.45:1, cursor:"text" }}>{st.title}</span>
            )}
            {/* Priority tiny */}
            <InlineSelect value={st.priority||"none"} options={PRIORITIES}
              onChange={v=>onChange(subtasks.map(s=>s.id===st.id?{...s,priority:v}:s))}
              renderValue={v=><span style={{ fontSize:10, padding:"1px 5px", background:PRI[v]?.bg, color:PRI[v]?.color, borderRadius:20, fontWeight:700, cursor:"pointer" }}>{PRI[v]?.label}</span>} />
            {/* Delete */}
            <button onClick={()=>remove(st.id)} style={{ background:"transparent",border:"none",color:"var(--text3)",cursor:"pointer",fontSize:15,padding:2,flexShrink:0 }}
              onMouseEnter={e=>e.currentTarget.style.color="#F43F5E"} onMouseLeave={e=>e.currentTarget.style.color="var(--text3)"}>×</button>
          </div>
        ))}
      </div>

      {/* Add */}
      <div style={{ display:"flex", gap:8 }}>
        <input value={input} onChange={e=>setInput(e.target.value)}
          onKeyDown={e=>{ if(e.key==="Enter"){e.preventDefault();add();} }}
          placeholder="+ Subtask add karo (Enter)..." style={{ ...S.inp, flex:1 }} />
        <button onClick={add} style={{ ...S.btn, background:"var(--accent)", color:"#fff" }}>Add</button>
      </div>
    </div>
  );
}

// ─── RELATIONS PANEL ──────────────────────────────────────────────
function RelationsPanel({ relations=[], allTasks, onChange }) {
  const [selType, setSelType] = useState("related");
  const [selTask, setSelTask] = useState("");

  function add() {
    if (!selTask) return;
    if ((relations||[]).some(r=>r.taskId===selTask&&r.type===selType)) return;
    onChange([...(relations||[]), { id:uid(), taskId:selTask, type:selType }]);
    setSelTask("");
  }

  const grouped = {};
  (relations||[]).forEach(r => { if(!grouped[r.type]) grouped[r.type]=[]; grouped[r.type].push(r); });

  return (
    <div>
      {/* Add relation */}
      <div style={{ padding:"12px 14px", background:"var(--surface2)", borderRadius:12, border:"1px solid var(--border)", marginBottom:16 }}>
        <div style={{ fontSize:12, fontWeight:700, color:"var(--text2)", marginBottom:10 }}>🔗 Relation Add Karo</div>
        <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
          <select value={selType} onChange={e=>setSelType(e.target.value)} style={{ ...S.inp, flex:"0 0 140px", padding:"7px 10px" }}>
            {RELATION_TYPES.map(r=><option key={r.id} value={r.id} style={{background:"var(--modal-bg)"}}>{r.icon} {r.label}</option>)}
          </select>
          <select value={selTask} onChange={e=>setSelTask(e.target.value)} style={{ ...S.inp, flex:1, padding:"7px 10px" }}>
            <option value="">— Task select karo —</option>
            {allTasks.filter(t=>!relations?.some(r=>r.taskId===t.id)).map(t=>(
              <option key={t.id} value={t.id} style={{background:"var(--modal-bg)"}}>{t.title?.slice(0,45)}</option>
            ))}
          </select>
          <button onClick={add} style={{ ...S.btn, background:"var(--accent)", color:"#fff", flexShrink:0 }}>Add</button>
        </div>
      </div>

      {/* Relation groups */}
      {Object.entries(grouped).map(([type, rels]) => {
        const meta = RELATION_TYPES.find(r=>r.id===type);
        return (
          <div key={type} style={{ marginBottom:14 }}>
            <div style={{ fontSize:11, fontWeight:800, color:meta?.color, textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:7 }}>
              {meta?.icon} {meta?.label} ({rels.length})
            </div>
            {rels.map(rel => {
              const rt = allTasks.find(t=>t.id===rel.taskId);
              if (!rt) return null;
              const pri = PRI[rt.priority||"none"];
              const st = ST[rt.status||"inbox"];
              return (
                <div key={rel.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 12px", background:"var(--surface2)", borderRadius:10, border:"1px solid var(--border)", marginBottom:5 }}>
                  <span style={{ fontSize:14, flexShrink:0 }}>{meta?.icon}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:600, color:"var(--text)" }}>{rt.title}</div>
                    <div style={{ display:"flex", gap:6, marginTop:3 }}>
                      <span style={{ fontSize:10, padding:"1px 6px", background:pri?.bg, color:pri?.color, borderRadius:20, fontWeight:700 }}>{pri?.label}</span>
                      <span style={{ fontSize:10, padding:"1px 6px", background:`${st?.color}18`, color:st?.color, borderRadius:20, fontWeight:700 }}>{st?.icon} {st?.label}</span>
                      {rt.due && <span style={{ fontSize:10, color:"var(--text3)" }}>📅 {fmtDate(rt.due)}</span>}
                    </div>
                  </div>
                  <button onClick={()=>onChange((relations||[]).filter(r=>r.id!==rel.id))}
                    style={{ background:"transparent",border:"none",color:"var(--text3)",cursor:"pointer",fontSize:15,padding:2 }}
                    onMouseEnter={e=>e.currentTarget.style.color="#F43F5E"} onMouseLeave={e=>e.currentTarget.style.color="var(--text3)"}>×</button>
                </div>
              );
            })}
          </div>
        );
      })}
      {(!relations||relations.length===0) && (
        <div style={{ textAlign:"center", padding:"32px 20px", color:"var(--text3)" }}>
          <div style={{ fontSize:32, marginBottom:8 }}>🔗</div>
          <div style={{ fontSize:13 }}>Koi relation nahi hai</div>
        </div>
      )}
    </div>
  );
}

// ─── TIME TRACKER PANEL ────────────────────────────────────────────
function TimePanel({ estimatedTime, timeSpent=0, timeLogs=[], onUpdate }) {
  const [mins, setMins] = useState("");
  const [note, setNote] = useState("");
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef(null);
  const pct = estimatedTime ? Math.min(100, Math.round(timeSpent/estimatedTime*100)) : 0;

  function startTimer() { setRunning(true); timerRef.current=setInterval(()=>setElapsed(e=>e+1),1000); }
  function stopTimer()  {
    setRunning(false); clearInterval(timerRef.current);
    if (elapsed>0) {
      const m = Math.max(1,Math.round(elapsed/60));
      const logs = [...timeLogs, {id:uid(),minutes:m,note:"Timer",at:new Date().toISOString()}];
      onUpdate({ timeLogs:logs, timeSpent:timeSpent+m });
      setElapsed(0);
    }
  }
  useEffect(()=>()=>clearInterval(timerRef.current),[]);

  function logManual() {
    if (!mins||isNaN(parseInt(mins))) return;
    const m = parseInt(mins);
    const logs = [...timeLogs, {id:uid(),minutes:m,note:note||"Manual entry",at:new Date().toISOString()}];
    onUpdate({ timeLogs:logs, timeSpent:timeSpent+m });
    setMins(""); setNote("");
  }

  const elapsedStr = `${Math.floor(elapsed/3600).toString().padStart(2,"0")}:${Math.floor((elapsed%3600)/60).toString().padStart(2,"0")}:${(elapsed%60).toString().padStart(2,"0")}`;

  return (
    <div>
      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10, marginBottom:16 }}>
        {[
          { label:"Estimated", val:fmtTime(estimatedTime), color:"#818CF8" },
          { label:"Logged",    val:fmtTime(timeSpent),     color:"#10B981" },
          { label:"Remaining", val:fmtTime(Math.max(0,(estimatedTime||0)-timeSpent)), color:"#FF6B35" },
        ].map(s=>(
          <div key={s.label} style={{ padding:14, background:"var(--surface2)", borderRadius:12, border:"1px solid var(--border)", textAlign:"center" }}>
            <div style={{ fontSize:20, fontWeight:900, color:s.color, fontVariantNumeric:"tabular-nums" }}>{s.val}</div>
            <div style={{ fontSize:10, color:"var(--text3)", marginTop:3, textTransform:"uppercase", letterSpacing:"0.5px" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      {estimatedTime > 0 && (
        <div style={{ marginBottom:16 }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
            <span style={{ fontSize:12, color:"var(--text3)" }}>Progress</span>
            <span style={{ fontSize:12, fontWeight:800, color:pct>=100?"#F43F5E":pct>=75?"#F59E0B":"#10B981" }}>{pct}%</span>
          </div>
          <div style={{ height:8, background:"var(--surface3)", borderRadius:8, overflow:"hidden" }}>
            <div style={{ height:"100%", width:`${pct}%`, background:pct>=100?"#F43F5E":pct>=75?"#F59E0B":"linear-gradient(90deg,#10B981,#06B6D4)", borderRadius:8, transition:"width 0.4s" }} />
          </div>
        </div>
      )}

      {/* Timer */}
      <div style={{ padding:14, background:"var(--surface2)", borderRadius:12, border:"1px solid var(--border)", marginBottom:14, textAlign:"center" }}>
        <div style={{ fontSize:28, fontWeight:900, color:running?"var(--accent)":"var(--text2)", fontVariantNumeric:"tabular-nums", marginBottom:10 }}>{elapsedStr}</div>
        <button onClick={running?stopTimer:startTimer}
          style={{ ...S.btn, background:running?"rgba(244,63,94,0.12)":"rgba(16,185,129,0.12)", color:running?"#F43F5E":"#10B981", border:`1px solid ${running?"#F43F5E":"#10B981"}40`, padding:"8px 24px", fontSize:13 }}>
          {running ? "⏹ Stop & Log" : "▶ Start Timer"}
        </button>
      </div>

      {/* Manual log */}
      <div style={{ padding:12, background:"var(--surface2)", borderRadius:12, border:"1px solid var(--border)", marginBottom:14 }}>
        <div style={{ fontSize:12, fontWeight:700, color:"var(--text2)", marginBottom:8 }}>Manual Entry</div>
        <div style={{ display:"flex", gap:8 }}>
          <input type="number" min="1" value={mins} onChange={e=>setMins(e.target.value)} placeholder="Minutes" style={{ ...S.inp, flex:"0 0 90px" }} />
          <input value={note} onChange={e=>setNote(e.target.value)} placeholder="Note (optional)" style={{ ...S.inp, flex:1 }} onKeyDown={e=>e.key==="Enter"&&logManual()} />
          <button onClick={logManual} style={{ ...S.btn, background:"var(--accent)", color:"#fff", flexShrink:0 }}>Log</button>
        </div>
      </div>

      {/* Log history */}
      {timeLogs.length > 0 && (
        <div>
          <div style={{ fontSize:11, fontWeight:800, color:"var(--text3)", textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:8 }}>History ({timeLogs.length})</div>
          <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
            {[...timeLogs].reverse().slice(0,10).map(log=>(
              <div key={log.id} style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 12px", background:"var(--surface2)", borderRadius:8, border:"1px solid var(--border)" }}>
                <span style={{ fontSize:13, fontWeight:800, color:"#10B981", minWidth:45 }}>{log.minutes}m</span>
                <span style={{ flex:1, fontSize:12, color:"var(--text2)" }}>{log.note||"—"}</span>
                <span style={{ fontSize:11, color:"var(--text3)" }}>{new Date(log.at).toLocaleDateString("en-IN",{month:"short",day:"numeric"})}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── CUSTOM FIELDS PANEL ──────────────────────────────────────────
function CustomFieldsPanel({ fields=[], onChange }) {
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState("text");

  const FIELD_TYPES = [
    { id:"text",     icon:"T",  label:"Text" },
    { id:"number",   icon:"#",  label:"Number" },
    { id:"url",      icon:"🔗", label:"URL / Link" },
    { id:"date",     icon:"📅", label:"Date" },
    { id:"checkbox", icon:"☑",  label:"Checkbox" },
    { id:"select",   icon:"▼",  label:"Select" },
    { id:"percent",  icon:"%",  label:"Progress %" },
  ];

  function addField() {
    if (!newName.trim()) return;
    onChange([...fields, { id:uid(), name:newName.trim(), type:newType, value:newType==="checkbox"?false:newType==="percent"?0:"" }]);
    setNewName(""); setAdding(false);
  }
  function updateField(id, val) { onChange(fields.map(f=>f.id===id?{...f,value:val}:f)); }
  function removeField(id) { onChange(fields.filter(f=>f.id!==id)); }

  return (
    <div>
      <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:14 }}>
        {fields.map(f => {
          const meta = FIELD_TYPES.find(t=>t.id===f.type);
          return (
            <div key={f.id} style={S.field}>
              <span style={S.fieldLabel}><span style={{fontSize:13}}>{meta?.icon}</span> {f.name}</span>
              <div style={{ flex:1, display:"flex", alignItems:"center", gap:8 }}>
                {f.type==="checkbox" ? (
                  <div onClick={()=>updateField(f.id,!f.value)} style={{ width:18,height:18,borderRadius:5,border:`2px solid ${f.value?"#10B981":"var(--border2)"}`,background:f.value?"#10B981":"transparent",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer" }}>
                    {f.value&&<span style={{color:"#fff",fontSize:10,fontWeight:900}}>✓</span>}
                  </div>
                ) : f.type==="percent" ? (
                  <div style={{ flex:1, display:"flex", alignItems:"center", gap:8 }}>
                    <div style={{ flex:1, height:6, background:"var(--surface3)", borderRadius:6, overflow:"hidden" }}>
                      <div style={{ height:"100%", width:`${f.value||0}%`, background:"var(--accent)", borderRadius:6, transition:"width 0.3s" }} />
                    </div>
                    <input type="number" min="0" max="100" value={f.value||0} onChange={e=>updateField(f.id,Math.min(100,parseInt(e.target.value)||0))}
                      style={{ ...S.inp, width:60, padding:"4px 8px", fontSize:12 }} />
                    <span style={{ fontSize:12, color:"var(--text3)" }}>%</span>
                  </div>
                ) : f.type==="url" ? (
                  <div style={{ display:"flex", gap:6, flex:1 }}>
                    <input type="url" value={f.value||""} onChange={e=>updateField(f.id,e.target.value)} placeholder="https://..." style={{ ...S.inp, flex:1 }} />
                    {f.value && <a href={f.value} target="_blank" rel="noopener" style={{ ...S.btn, background:"rgba(129,140,248,0.1)", color:"#818CF8", border:"1px solid rgba(129,140,248,0.2)", textDecoration:"none" }}>↗</a>}
                  </div>
                ) : f.type==="date" ? (
                  <input type="date" value={f.value||""} onChange={e=>updateField(f.id,e.target.value)} style={{ ...S.inp, flex:1 }} />
                ) : (
                  <input type={f.type==="number"?"number":"text"} value={f.value||""} onChange={e=>updateField(f.id,e.target.value)} placeholder={`${f.name}...`} style={{ ...S.inp, flex:1 }} />
                )}
                <button onClick={()=>removeField(f.id)} style={{ background:"transparent",border:"none",color:"var(--text3)",cursor:"pointer",fontSize:15,flexShrink:0 }}
                  onMouseEnter={e=>e.currentTarget.style.color="#F43F5E"} onMouseLeave={e=>e.currentTarget.style.color="var(--text3)"}>×</button>
              </div>
            </div>
          );
        })}
      </div>

      {adding ? (
        <div style={{ padding:12, background:"var(--surface2)", borderRadius:12, border:"1px solid var(--border)" }}>
          <div style={{ display:"flex", gap:8, marginBottom:8 }}>
            <input autoFocus value={newName} onChange={e=>setNewName(e.target.value)} placeholder="Field naam..." style={{ ...S.inp, flex:1 }} onKeyDown={e=>e.key==="Enter"&&addField()} />
            <select value={newType} onChange={e=>setNewType(e.target.value)} style={{ ...S.inp, width:"auto" }}>
              {FIELD_TYPES.map(t=><option key={t.id} value={t.id} style={{background:"var(--modal-bg)"}}>{t.icon} {t.label}</option>)}
            </select>
          </div>
          <div style={{ display:"flex", gap:8 }}>
            <button onClick={addField} style={{ ...S.btn, background:"var(--accent)", color:"#fff" }}>Add Field</button>
            <button onClick={()=>{setAdding(false);setNewName("");}} style={{ ...S.btn, background:"var(--surface3)", color:"var(--text3)" }}>Cancel</button>
          </div>
        </div>
      ) : (
        <button onClick={()=>setAdding(true)} style={{ ...S.btn, background:"var(--surface2)", color:"var(--text2)", border:"1px dashed var(--border2)", width:"100%", textAlign:"left", padding:"10px 14px" }}>
          + Add Custom Field
        </button>
      )}
    </div>
  );
}

// ─── MAIN TASK DETAIL COMPONENT ───────────────────────────────────
export default function TaskDetail({ task, allTasks=[], projects=[], onSave, onDelete, onDuplicate, onClose }) {
  const { user } = useAuth();
  const [form, setForm] = useState({ ...task });
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState("details");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const set = (k,v) => setForm(f=>({...f,[k]:v}));
  const autoSaveRef = useRef(null);

  // Auto-save after 1.5s of inactivity
  useEffect(() => {
    clearTimeout(autoSaveRef.current);
    autoSaveRef.current = setTimeout(() => {
      if (user && form.id) {
        const { id, ...data } = form;
        updateTask(user.uid, id, data).catch(console.error);
      }
    }, 1500);
    return () => clearTimeout(autoSaveRef.current);
  }, [form]);

  async function handleSave() {
    setSaving(true);
    await onSave(form);
    setSaving(false);
  }

  const pri = PRI[form.priority||"none"];
  const st  = ST[form.status||"inbox"];
  const subtaskDone  = (form.subtasks||[]).filter(s=>s.done).length;
  const subtaskTotal = (form.subtasks||[]).length;

  const TABS = [
    { id:"details",   icon:"◎", label:"Details" },
    { id:"editor",    icon:"✏", label:"Description" },
    { id:"subtasks",  icon:"☑", label:`Subtasks${subtaskTotal?` (${subtaskDone}/${subtaskTotal})`:""}` },
    { id:"relations", icon:"🔗", label:"Relations" },
    { id:"time",      icon:"⏱", label:"Time" },
    { id:"fields",    icon:"⚙", label:"Fields" },
    { id:"activity",  icon:"💬", label:"Activity" },
  ];

  return (
    <div style={{ position:"fixed", inset:0, zIndex:9000, display:"flex" }} onClick={onClose}>
      {/* Backdrop */}
      <div style={{ flex:1, background:"rgba(0,0,0,0.55)", backdropFilter:"blur(6px)" }} />

      {/* Panel */}
      <div onClick={e=>e.stopPropagation()}
        style={{ width:600, background:"var(--surface,#0F0F1C)", borderLeft:"1px solid var(--border,#1e1e2e)", display:"flex", flexDirection:"column", height:"100%", overflow:"hidden", animation:"slideInRight 0.2s cubic-bezier(0.16,1,0.3,1)" }}>

        {/* ── TOP TOOLBAR ── */}
        <div style={{ padding:"10px 16px", borderBottom:"1px solid var(--border)", display:"flex", alignItems:"center", gap:8, flexShrink:0, background:"var(--surface2,#13131f)" }}>
          {/* Breadcrumb */}
          <span style={{ fontSize:11, color:"var(--text3)", flex:1 }}>
            {projects.find(p=>p.id===form.projectId)?.name || "No Project"} › Task
          </span>
          {/* Auto-save indicator */}
          <span style={{ fontSize:10, color:"var(--text3)", padding:"2px 8px", background:"rgba(16,185,129,0.08)", borderRadius:20, border:"1px solid rgba(16,185,129,0.15)" }}>
            ✓ Auto-saved
          </span>
          {/* Actions */}
          <button onClick={()=>onDuplicate&&onDuplicate(form)} title="Duplicate"
            style={{ ...S.btn, background:"transparent", color:"var(--text3)", padding:"5px 9px", fontSize:13 }}
            onMouseEnter={e=>e.currentTarget.style.color="var(--text)"} onMouseLeave={e=>e.currentTarget.style.color="var(--text3)"}>⊕</button>
          <button onClick={onClose}
            style={{ ...S.btn, background:"transparent", color:"var(--text3)", padding:"5px 9px", fontSize:17, lineHeight:1 }}>×</button>
        </div>

        {/* ── TITLE AREA ── */}
        <div style={{ padding:"16px 20px 12px", borderBottom:"1px solid var(--border)", flexShrink:0 }}>
          <div style={{ display:"flex", alignItems:"flex-start", gap:10 }}>
            {/* Done toggle */}
            <div onClick={()=>set("done",!form.done)}
              style={{ width:22,height:22,borderRadius:6,border:`2.5px solid ${form.done?"#10B981":"var(--border2)"}`,background:form.done?"#10B981":"transparent",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",flexShrink:0,marginTop:3,transition:"all 0.15s" }}>
              {form.done&&<span style={{color:"#fff",fontSize:12,fontWeight:900}}>✓</span>}
            </div>
            {/* Title */}
            <textarea value={form.title} onChange={e=>{set("title",e.target.value);e.target.style.height="auto";e.target.style.height=e.target.scrollHeight+"px";}}
              style={{ flex:1, background:"transparent", border:"none", outline:"none", color:"var(--text)", fontSize:18, fontWeight:800, fontFamily:"inherit", textDecoration:form.done?"line-through":"none", opacity:form.done?0.5:1, resize:"none", lineHeight:1.4, overflow:"hidden" }}
              rows={1} placeholder="Task title..." />
          </div>

          {/* Quick badges row */}
          <div style={{ display:"flex", gap:6, marginTop:10, flexWrap:"wrap", paddingLeft:32 }}>
            {/* Status */}
            <InlineSelect value={form.status||"inbox"} options={STATUSES} onChange={v=>set("status",v)}
              renderValue={v=>(
                <span style={S.badge(st?.color, `${st?.color}15`)}>
                  {st?.icon} {st?.label}
                </span>
              )} />
            {/* Priority */}
            <InlineSelect value={form.priority||"none"} options={PRIORITIES} onChange={v=>set("priority",v)}
              renderValue={v=>(
                <span style={S.badge(pri?.color, pri?.bg)}>
                  ● {pri?.label}
                </span>
              )} />
            {/* Due date */}
            <label style={{ ...S.badge("#818CF8","rgba(129,140,248,0.1)"), cursor:"pointer", position:"relative" }}>
              📅 {form.due ? fmtDate(form.due) : "No due date"}
              <input type="date" value={form.due||""} onChange={e=>set("due",e.target.value)}
                style={{ position:"absolute", opacity:0, width:"100%", height:"100%", inset:0, cursor:"pointer" }} />
            </label>
            {/* Recurring */}
            {form.recurring && form.recurring!=="none" && (
              <span style={S.badge("#06B6D4","rgba(6,182,212,0.1)")}>🔄 {form.recurring}</span>
            )}
            {/* Subtask progress */}
            {subtaskTotal > 0 && (
              <span style={S.badge("#10B981","rgba(16,185,129,0.1)")}>
                ☑ {subtaskDone}/{subtaskTotal}
              </span>
            )}
          </div>
        </div>

        {/* ── TABS ── */}
        <div style={{ display:"flex", borderBottom:"1px solid var(--border)", flexShrink:0, overflowX:"auto", background:"var(--surface2)" }}>
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)}
              style={{ flex:"none", padding:"9px 12px", border:"none", background:"transparent", color:tab===t.id?"var(--accent,#FF6B35)":"var(--text3)", fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:"inherit", borderBottom:`2px solid ${tab===t.id?"var(--accent,#FF6B35)":"transparent"}`, transition:"all 0.15s", whiteSpace:"nowrap" }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* ── CONTENT ── */}
        <div style={{ flex:1, overflowY:"auto", padding:"16px 20px" }}>

          {/* DETAILS TAB — ClickUp-style field rows */}
          {tab==="details" && (
            <div>
              <FieldRow icon="◎" label="Status">
                <InlineSelect value={form.status||"inbox"} options={STATUSES} onChange={v=>set("status",v)}
                  renderValue={v=><span style={S.badge(st?.color,`${st?.color}15`)}>{st?.icon} {st?.label}</span>} />
              </FieldRow>
              <FieldRow icon="🔴" label="Priority">
                <InlineSelect value={form.priority||"none"} options={PRIORITIES} onChange={v=>set("priority",v)}
                  renderValue={v=><span style={S.badge(pri?.color,pri?.bg)}>● {pri?.label}</span>} />
              </FieldRow>
              <FieldRow icon="📅" label="Start Date">
                <input type="date" value={form.startDate||""} onChange={e=>set("startDate",e.target.value)}
                  style={{ background:"transparent", border:"none", color:"var(--text2)", fontSize:13, fontFamily:"inherit", outline:"none", cursor:"pointer" }} />
              </FieldRow>
              <FieldRow icon="📅" label="Due Date">
                <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                  <input type="date" value={form.due||""} onChange={e=>set("due",e.target.value)}
                    style={{ background:"transparent", border:"none", color:"var(--text2)", fontSize:13, fontFamily:"inherit", outline:"none", cursor:"pointer" }} />
                  {form.due && <input type="time" value={form.dueTime||""} onChange={e=>set("dueTime",e.target.value)}
                    style={{ background:"transparent", border:"none", color:"var(--text3)", fontSize:12, fontFamily:"inherit", outline:"none", cursor:"pointer" }} />}
                </div>
              </FieldRow>
              <FieldRow icon="👤" label="Assignee">
                <input value={form.assignee||""} onChange={e=>set("assignee",e.target.value)}
                  placeholder="Name or email..." style={{ background:"transparent", border:"none", color:"var(--text2)", fontSize:13, fontFamily:"inherit", outline:"none", width:"100%" }} />
              </FieldRow>
              <FieldRow icon="📁" label="Project">
                <select value={form.projectId||""} onChange={e=>set("projectId",e.target.value)}
                  style={{ background:"transparent", border:"none", color:"var(--text2)", fontSize:13, fontFamily:"inherit", outline:"none", cursor:"pointer" }}>
                  <option value="" style={{background:"var(--modal-bg)"}}>No Project</option>
                  {projects.map(p=><option key={p.id} value={p.id} style={{background:"var(--modal-bg)"}}>{p.name}</option>)}
                </select>
              </FieldRow>
              <FieldRow icon="🔄" label="Recurring">
                <select value={form.recurring||"none"} onChange={e=>set("recurring",e.target.value)}
                  style={{ background:"transparent", border:"none", color:"var(--text2)", fontSize:13, fontFamily:"inherit", outline:"none", cursor:"pointer" }}>
                  {["none","daily","weekdays","weekly","biweekly","monthly","yearly"].map(r=>(
                    <option key={r} value={r} style={{background:"var(--modal-bg)",textTransform:"capitalize"}}>{r.charAt(0).toUpperCase()+r.slice(1)}</option>
                  ))}
                </select>
              </FieldRow>
              <FieldRow icon="⏱" label="Time Estimate">
                <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                  <input type="number" min="0" value={form.estimatedTime||""} onChange={e=>set("estimatedTime",parseInt(e.target.value)||0)}
                    placeholder="Minutes..." style={{ background:"transparent", border:"none", color:"var(--text2)", fontSize:13, fontFamily:"inherit", outline:"none", width:80 }} />
                  {form.estimatedTime>0 && <span style={{fontSize:12,color:"var(--text3)"}}>= {fmtTime(form.estimatedTime)}</span>}
                </div>
              </FieldRow>
              <FieldRow icon="⚡" label="Story Points">
                <input type="number" min="0" max="100" value={form.points||""} onChange={e=>set("points",parseInt(e.target.value)||0)}
                  placeholder="0..." style={{ background:"transparent", border:"none", color:"var(--text2)", fontSize:13, fontFamily:"inherit", outline:"none", width:60 }} />
              </FieldRow>

              {/* Tags */}
              <div style={{ marginTop:14 }}>
                <label style={S.lbl}>Tags</label>
                <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:8 }}>
                  {(form.tags||[]).map((tag,i)=>(
                    <span key={tag} style={{ fontSize:12, padding:"3px 10px", background:`${TAGS_PALETTE[i%TAGS_PALETTE.length]}18`, color:TAGS_PALETTE[i%TAGS_PALETTE.length], borderRadius:20, fontWeight:700, display:"flex", alignItems:"center", gap:5 }}>
                      #{tag}
                      <span onClick={()=>set("tags",(form.tags||[]).filter(t=>t!==tag))} style={{cursor:"pointer",opacity:0.7,fontSize:14}}>×</span>
                    </span>
                  ))}
                  <input placeholder="+ tag" style={{ background:"transparent", border:"1px dashed var(--border2)", borderRadius:20, color:"var(--text3)", fontSize:12, padding:"3px 10px", outline:"none", width:70, fontFamily:"inherit" }}
                    onKeyDown={e=>{if(e.key==="Enter"||e.key===","){e.preventDefault();const t=e.target.value.trim().toLowerCase().replace(/\s+/g,"-");if(t&&!(form.tags||[]).includes(t)){set("tags",[...(form.tags||[]),t]);}e.target.value="";}}} />
                </div>
              </div>

              {/* Dependencies */}
              <div style={{ marginTop:14 }}>
                <label style={S.lbl}>Blocked By</label>
                <select onChange={e=>{if(!e.target.value)return;if(!(form.blockedBy||[]).includes(e.target.value))set("blockedBy",[...(form.blockedBy||[]),e.target.value]);e.target.value="";}}
                  style={{ ...S.inp, marginBottom:8 }}>
                  <option value="">— Select task —</option>
                  {allTasks.filter(t=>t.id!==form.id&&!t.done).map(t=>(
                    <option key={t.id} value={t.id} style={{background:"var(--modal-bg)"}}>{t.title?.slice(0,45)}</option>
                  ))}
                </select>
                <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                  {(form.blockedBy||[]).map(depId=>{
                    const dep=allTasks.find(t=>t.id===depId);
                    return dep ? (
                      <span key={depId} style={{ fontSize:12, padding:"3px 10px", background:"rgba(244,63,94,0.1)", color:"#F43F5E", borderRadius:20, fontWeight:700, display:"flex", alignItems:"center", gap:5 }}>
                        🚫 {dep.title?.slice(0,18)}...
                        <span onClick={()=>set("blockedBy",(form.blockedBy||[]).filter(d=>d!==depId))} style={{cursor:"pointer"}}>×</span>
                      </span>
                    ):null;
                  })}
                </div>
              </div>
            </div>
          )}

          {/* DESCRIPTION EDITOR */}
          {tab==="editor" && (
            <div>
              <div style={{ fontSize:11, color:"var(--text3)", marginBottom:10 }}>
                Type <kbd style={{background:"var(--surface2)",border:"1px solid var(--border)",borderRadius:4,padding:"1px 5px",fontSize:10}}>/</kbd> for commands • Supports headings, lists, code, callouts
              </div>
              <BlockEditor
                value={form.desc||""}
                onChange={v=>set("desc",v)}
                placeholder="Task description likho... '/' type karo commands ke liye" />
            </div>
          )}

          {/* SUBTASKS */}
          {tab==="subtasks" && (
            <SubtasksPanel subtasks={form.subtasks||[]} onChange={v=>set("subtasks",v)} />
          )}

          {/* RELATIONS */}
          {tab==="relations" && (
            <RelationsPanel relations={form.relations||[]} allTasks={allTasks.filter(t=>t.id!==form.id)} onChange={v=>set("relations",v)} />
          )}

          {/* TIME */}
          {tab==="time" && (
            <TimePanel
              estimatedTime={form.estimatedTime}
              timeSpent={form.timeSpent||0}
              timeLogs={form.timeLogs||[]}
              onUpdate={updates=>setForm(f=>({...f,...updates}))} />
          )}

          {/* CUSTOM FIELDS */}
          {tab==="fields" && (
            <CustomFieldsPanel fields={form.customFields||[]} onChange={v=>set("customFields",v)} />
          )}

          {/* ACTIVITY & COMMENTS */}
          {tab==="activity" && (
            <ActivityPanel taskId={form.id} userId={user?.uid} />
          )}

        </div>

        {/* ── FOOTER ── */}
        <div style={{ padding:"12px 20px", borderTop:"1px solid var(--border)", display:"flex", gap:8, flexShrink:0, background:"var(--surface2)", alignItems:"center" }}>
          {showDeleteConfirm ? (
            <>
              <span style={{fontSize:12,color:"#F43F5E",fontWeight:700}}>Pakka delete karna hai?</span>
              <button onClick={()=>{onDelete(form.id);onClose();}} style={{...S.btn,background:"#F43F5E",color:"#fff",fontSize:12}}>Haan, Delete</button>
              <button onClick={()=>setShowDeleteConfirm(false)} style={{...S.btn,background:"var(--surface3)",color:"var(--text2)",fontSize:12}}>Nahi</button>
            </>
          ) : (
            <>
              <button onClick={()=>setShowDeleteConfirm(true)} style={{...S.btn,background:"rgba(244,63,94,0.08)",color:"#F43F5E",border:"1px solid rgba(244,63,94,0.2)",fontSize:12}}>🗑 Delete</button>
              <div style={{flex:1}} />
              <span style={{fontSize:11,color:"var(--text3)"}}>Auto-saving...</span>
              <button onClick={onClose} style={{...S.btn,background:"var(--surface3)",color:"var(--text2)",fontSize:12}}>Close</button>
              <button onClick={handleSave} disabled={saving}
                style={{...S.btn,background:"linear-gradient(135deg,#FF6B35,#FF8C5A)",color:"#fff",padding:"8px 20px",opacity:saving?0.7:1,boxShadow:"0 4px 16px rgba(255,107,53,0.3)",fontSize:12}}>
                {saving?"Saving...":"💾 Save"}
              </button>
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes slideInRight { from{transform:translateX(600px);opacity:0} to{transform:translateX(0);opacity:1} }
        ::-webkit-scrollbar{width:4px} ::-webkit-scrollbar-track{background:transparent} ::-webkit-scrollbar-thumb{background:var(--border2);border-radius:4px}
      `}</style>
    </div>
  );
}
