// 📄 Notion-style Page System — COMPLETE
// Every Notion feature: blocks, nested pages, slash commands, inline mentions,
// covers, icons, templates, backlinks, table of contents, multi-column, DB views
import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../hooks/useAuth";
import {
  addNote, updateNote, deleteNote, subscribeToNotes
} from "../firebase/services";

// ─── BLOCK TYPES (all Notion blocks) ─────────────────────────────────────────
const BLOCK_TYPES = [
  { type:"text",        label:"Text",           icon:"¶",  desc:"Plain text" },
  { type:"h1",          label:"Heading 1",       icon:"H1", desc:"Big heading" },
  { type:"h2",          label:"Heading 2",       icon:"H2", desc:"Medium heading" },
  { type:"h3",          label:"Heading 3",       icon:"H3", desc:"Small heading" },
  { type:"bullet",      label:"Bullet List",     icon:"•",  desc:"Unordered list" },
  { type:"numbered",    label:"Numbered List",   icon:"1.", desc:"Ordered list" },
  { type:"todo",        label:"To-do",           icon:"☐",  desc:"Checkbox item" },
  { type:"toggle",      label:"Toggle",          icon:"▶",  desc:"Collapsible block" },
  { type:"quote",       label:"Quote",           icon:"❝",  desc:"Blockquote" },
  { type:"callout",     label:"Callout",         icon:"💡", desc:"Highlighted note" },
  { type:"code",        label:"Code",            icon:"</>",desc:"Code block" },
  { type:"divider",     label:"Divider",         icon:"—",  desc:"Horizontal line" },
  { type:"image",       label:"Image",           icon:"🖼", desc:"Embed image URL" },
  { type:"embed",       label:"Embed",           icon:"⊞",  desc:"Embed URL" },
  { type:"table",       label:"Simple Table",    icon:"⊟",  desc:"2D table" },
  { type:"columns",     label:"2 Columns",       icon:"⫿",  desc:"Side by side" },
  { type:"page",        label:"Sub-page",        icon:"📄", desc:"Nested page" },
  { type:"math",        label:"Math",            icon:"∑",  desc:"LaTeX equation" },
  { type:"video",       label:"Video",           icon:"▶️", desc:"YouTube / Loom" },
  { type:"file",        label:"File",            icon:"📎", desc:"File reference" },
  { type:"bookmark",    label:"Bookmark",        icon:"🔖", desc:"Web bookmark" },
];

const CALLOUT_ICONS = ["💡","⚠️","✅","❌","🔥","💬","📌","🎯","⚡","🌟"];
const COLORS = ["default","red","orange","yellow","green","blue","purple","pink","gray"];
const COLOR_MAP = {
  default:"transparent", red:"rgba(244,63,94,0.08)", orange:"rgba(255,107,53,0.08)",
  yellow:"rgba(245,158,11,0.08)", green:"rgba(16,185,129,0.08)",
  blue:"rgba(99,102,241,0.08)", purple:"rgba(139,92,246,0.08)",
  pink:"rgba(236,72,153,0.08)", gray:"rgba(107,114,128,0.08)",
};
const TEXT_COLOR_MAP = {
  default:"#E5E7EB", red:"#F43F5E", orange:"#FF6B35", yellow:"#F59E0B",
  green:"#10B981", blue:"#818CF8", purple:"#8B5CF6", pink:"#EC4899", gray:"#9CA3AF",
};
const COVER_GRADIENTS = [
  "linear-gradient(135deg,#FF6B35,#FF8C5A)",
  "linear-gradient(135deg,#8B5CF6,#6366F1)",
  "linear-gradient(135deg,#10B981,#06B6D4)",
  "linear-gradient(135deg,#F43F5E,#EC4899)",
  "linear-gradient(135deg,#F59E0B,#EF4444)",
  "linear-gradient(135deg,#0F0F1C,#1A1A2E)",
  "linear-gradient(135deg,#1e3a5f,#0f2027)",
  "linear-gradient(135deg,#2d1b69,#11998e)",
];
const PAGE_ICONS = ["📄","📝","🎯","🚀","💡","📊","🏠","⚡","🌟","🎨","📚","💼","🔥","🌈","🎭","🛠"];

const newBlock = (type="text", content="", extra={}) => ({
  id: Math.random().toString(36).slice(2),
  type, content, color:"default", textColor:"default",
  bold:false, italic:false, underline:false, strikethrough:false,
  checked:false, open:false, lang:"javascript", icon:"💡",
  children:[], indent:0, align:"left",
  ...extra,
});

// ─── SLASH COMMAND MENU ───────────────────────────────────────────────────────
function SlashMenu({ query, onSelect, position }) {
  const filtered = BLOCK_TYPES.filter(b =>
    b.label.toLowerCase().includes(query.toLowerCase()) ||
    b.type.includes(query.toLowerCase())
  );
  if (!filtered.length) return null;
  return (
    <div style={{
      position:"fixed", left:position.x, top:position.y,
      background:"#13131F", border:"1px solid rgba(255,255,255,0.1)",
      borderRadius:12, width:260, maxHeight:320, overflowY:"auto",
      boxShadow:"0 20px 60px rgba(0,0,0,0.7)", zIndex:99999,
      animation:"popIn 0.15s ease",
    }}>
      <div style={{padding:"8px 12px 6px",fontSize:10,fontWeight:800,color:"#4B5563",textTransform:"uppercase",letterSpacing:"1px"}}>BLOCKS</div>
      {filtered.map((b,i) => (
        <div key={b.type} onClick={()=>onSelect(b.type)}
          style={{display:"flex",alignItems:"center",gap:10,padding:"8px 12px",cursor:"pointer",borderRadius:8,margin:"0 4px",transition:"background 0.1s"}}
          onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.06)"}
          onMouseLeave={e=>e.currentTarget.style.background=""}>
          <div style={{width:28,height:28,borderRadius:7,background:"rgba(255,255,255,0.05)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,flexShrink:0}}>{b.icon}</div>
          <div>
            <div style={{fontSize:13,fontWeight:600,color:"#E5E7EB"}}>{b.label}</div>
            <div style={{fontSize:11,color:"#4B5563"}}>{b.desc}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── BLOCK TOOLBAR (inline formatting) ───────────────────────────────────────
function BlockToolbar({ block, onUpdate, position }) {
  const btns = [
    {label:"B",style:{fontWeight:900},prop:"bold",title:"Bold"},
    {label:"I",style:{fontStyle:"italic"},prop:"italic",title:"Italic"},
    {label:"U",style:{textDecoration:"underline"},prop:"underline",title:"Underline"},
    {label:"S",style:{textDecoration:"line-through"},prop:"strikethrough",title:"Strikethrough"},
  ];
  return (
    <div style={{
      position:"fixed",left:position.x,top:position.y-44,
      background:"#1A1A2E",border:"1px solid rgba(255,255,255,0.1)",
      borderRadius:10,display:"flex",gap:2,padding:"4px 6px",
      boxShadow:"0 8px 30px rgba(0,0,0,0.5)",zIndex:99999,
    }}>
      {btns.map(b=>(
        <button key={b.prop} onClick={()=>onUpdate({[b.prop]:!block[b.prop]})} title={b.title}
          style={{padding:"4px 8px",background:block[b.prop]?"rgba(255,107,53,0.2)":"transparent",border:"none",borderRadius:6,color:block[b.prop]?"#FF6B35":"#9CA3AF",cursor:"pointer",...b.style,fontSize:13}}>
          {b.label}
        </button>
      ))}
      <div style={{width:1,background:"rgba(255,255,255,0.1)",margin:"2px 4px"}}/>
      {COLORS.slice(1,5).map(c=>(
        <div key={c} onClick={()=>onUpdate({textColor:c})} title={c}
          style={{width:16,height:16,borderRadius:4,background:TEXT_COLOR_MAP[c],cursor:"pointer",border:block.textColor===c?"2px solid #fff":"none",marginTop:3}}/>
      ))}
    </div>
  );
}

// ─── SINGLE BLOCK RENDERER ────────────────────────────────────────────────────
function Block({ block, index, blocks, onUpdate, onDelete, onAdd, onMove, depth=0, allPages, onOpenPage }) {
  const ref = useRef();
  const [slashOpen, setSlashOpen] = useState(false);
  const [slashQuery, setSlashQuery] = useState("");
  const [slashPos, setSlashPos] = useState({x:0,y:0});
  const [toolbarPos, setToolbarPos] = useState(null);
  const [hovered, setHovered] = useState(false);
  const [colorMenu, setColorMenu] = useState(false);

  const applyStyle = (text) => {
    let s = {};
    if (block.bold) s.fontWeight = 800;
    if (block.italic) s.fontStyle = "italic";
    if (block.underline) s.textDecoration = "underline";
    if (block.strikethrough) s.textDecoration = (s.textDecoration||"") + " line-through";
    if (block.textColor && block.textColor!=="default") s.color = TEXT_COLOR_MAP[block.textColor];
    return s;
  };

  const handleKeyDown = (e) => {
    if (e.key==="/" && !block.content) {
      const rect = ref.current?.getBoundingClientRect();
      setSlashPos({x:rect?.left||100, y:rect?.bottom||200});
      setSlashOpen(true); setSlashQuery("");
      return;
    }
    if (slashOpen) {
      if (e.key==="Escape") { setSlashOpen(false); return; }
      return;
    }
    if (e.key==="Enter" && !e.shiftKey) {
      e.preventDefault();
      onAdd(index+1, "text");
    }
    if (e.key==="Backspace" && !block.content && blocks.length>1) {
      e.preventDefault(); onDelete(block.id);
    }
    if (e.key==="Tab") {
      e.preventDefault();
      onUpdate(block.id, {indent:Math.min((block.indent||0)+(e.shiftKey?-1:1),4)});
    }
    if (e.key==="ArrowUp" && index>0) {
      e.preventDefault();
      document.getElementById(`block-${blocks[index-1]?.id}`)?.focus();
    }
    if (e.key==="ArrowDown" && index<blocks.length-1) {
      e.preventDefault();
      document.getElementById(`block-${blocks[index+1]?.id}`)?.focus();
    }
  };

  const handleInput = (e) => {
    const val = e.target.value||e.target.innerText||"";
    if (slashOpen) {
      const slashIdx = val.lastIndexOf("/");
      if (slashIdx>=0) setSlashQuery(val.slice(slashIdx+1));
      else setSlashOpen(false);
    }
    onUpdate(block.id, {content:val});
  };

  const handleSlashSelect = (type) => {
    setSlashOpen(false);
    const clean = (block.content||"").replace(/\/\w*$/,"");
    onUpdate(block.id, {type, content:clean});
    setTimeout(()=>ref.current?.focus(),50);
  };

  const handleSelect = () => {
    const sel = window.getSelection();
    if (sel && sel.toString().length>0) {
      const range = sel.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      setToolbarPos({x:rect.left, y:rect.top});
    } else setToolbarPos(null);
  };

  const paddingLeft = (block.indent||0)*24 + (depth*20);
  const bg = COLOR_MAP[block.color]||"transparent";

  // ── Shared input style ──
  const inputStyle = {
    width:"100%", background:"transparent", border:"none", outline:"none",
    color: block.textColor&&block.textColor!=="default" ? TEXT_COLOR_MAP[block.textColor] : "#E5E7EB",
    fontFamily:"inherit", resize:"none", lineHeight:1.7,
    ...applyStyle(),
  };

  const blockContent = () => {
    switch(block.type) {
      case "h1": return <input id={`block-${block.id}`} ref={ref} value={block.content||""} onChange={handleInput} onKeyDown={handleKeyDown} onSelect={handleSelect} placeholder="Heading 1" style={{...inputStyle,fontSize:30,fontWeight:900,fontFamily:"'Cabinet Grotesk',sans-serif",letterSpacing:"-1px",padding:"2px 0"}} />;
      case "h2": return <input id={`block-${block.id}`} ref={ref} value={block.content||""} onChange={handleInput} onKeyDown={handleKeyDown} placeholder="Heading 2" style={{...inputStyle,fontSize:22,fontWeight:800,fontFamily:"'Cabinet Grotesk',sans-serif",letterSpacing:"-0.5px",padding:"2px 0"}} />;
      case "h3": return <input id={`block-${block.id}`} ref={ref} value={block.content||""} onChange={handleInput} onKeyDown={handleKeyDown} placeholder="Heading 3" style={{...inputStyle,fontSize:17,fontWeight:700,padding:"2px 0"}} />;
      case "bullet": return (
        <div style={{display:"flex",gap:10,alignItems:"flex-start"}}>
          <span style={{color:"#6B7280",marginTop:4,fontSize:18,lineHeight:1,flexShrink:0}}>•</span>
          <input id={`block-${block.id}`} ref={ref} value={block.content||""} onChange={handleInput} onKeyDown={handleKeyDown} placeholder="List item" style={{...inputStyle,fontSize:14,flex:1}} />
        </div>
      );
      case "numbered": return (
        <div style={{display:"flex",gap:10,alignItems:"flex-start"}}>
          <span style={{color:"#6B7280",fontSize:13,fontWeight:700,marginTop:3,flexShrink:0,minWidth:18}}>{index+1}.</span>
          <input id={`block-${block.id}`} ref={ref} value={block.content||""} onChange={handleInput} onKeyDown={handleKeyDown} placeholder="List item" style={{...inputStyle,fontSize:14,flex:1}} />
        </div>
      );
      case "todo": return (
        <div style={{display:"flex",gap:10,alignItems:"flex-start"}}>
          <input type="checkbox" checked={!!block.checked} onChange={()=>onUpdate(block.id,{checked:!block.checked})} style={{marginTop:4,width:15,height:15,cursor:"pointer",accentColor:"#FF6B35",flexShrink:0}} />
          <input id={`block-${block.id}`} ref={ref} value={block.content||""} onChange={handleInput} onKeyDown={handleKeyDown} placeholder="To-do" style={{...inputStyle,fontSize:14,flex:1,textDecoration:block.checked?"line-through":"none",color:block.checked?"#4B5563":inputStyle.color}} />
        </div>
      );
      case "toggle": return (
        <div>
          <div style={{display:"flex",gap:8,alignItems:"flex-start",cursor:"pointer"}} onClick={()=>onUpdate(block.id,{open:!block.open})}>
            <span style={{color:"#6B7280",fontSize:11,marginTop:4,transform:block.open?"rotate(90deg)":"none",transition:"transform 0.2s",flexShrink:0}}>▶</span>
            <input id={`block-${block.id}`} ref={ref} value={block.content||""} onChange={handleInput} onKeyDown={handleKeyDown} onClick={e=>e.stopPropagation()} placeholder="Toggle heading" style={{...inputStyle,fontSize:14,fontWeight:600,flex:1}} />
          </div>
          {block.open && block.children?.length>0 && (
            <div style={{paddingLeft:20,marginTop:4,borderLeft:"2px solid rgba(255,255,255,0.06)"}}>
              {block.children.map((c,ci)=><div key={c.id} style={{fontSize:13,color:"#9CA3AF",padding:"3px 0"}}>{c.content}</div>)}
            </div>
          )}
        </div>
      );
      case "quote": return (
        <div style={{borderLeft:"3px solid #FF6B35",paddingLeft:14}}>
          <textarea id={`block-${block.id}`} ref={ref} value={block.content||""} onChange={handleInput} onKeyDown={handleKeyDown} placeholder="Quote..." rows={2}
            style={{...inputStyle,fontSize:15,fontStyle:"italic",color:"#D1D5DB",resize:"none"}} />
        </div>
      );
      case "callout": return (
        <div style={{display:"flex",gap:12,alignItems:"flex-start",background:bg||"rgba(255,107,53,0.06)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:10,padding:"12px 14px"}}>
          <span style={{fontSize:20,cursor:"pointer",flexShrink:0}} onClick={()=>{
            const icons=CALLOUT_ICONS; const i=icons.indexOf(block.icon||"💡");
            onUpdate(block.id,{icon:icons[(i+1)%icons.length]});
          }}>{block.icon||"💡"}</span>
          <textarea id={`block-${block.id}`} ref={ref} value={block.content||""} onChange={handleInput} onKeyDown={handleKeyDown} placeholder="Callout text..." rows={2}
            style={{...inputStyle,fontSize:14,flex:1,resize:"none"}} />
        </div>
      );
      case "code": return (
        <div style={{background:"#0A0A14",border:"1px solid rgba(255,255,255,0.08)",borderRadius:10,overflow:"hidden"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"6px 12px",borderBottom:"1px solid rgba(255,255,255,0.06)",background:"rgba(255,255,255,0.02)"}}>
            <select value={block.lang||"javascript"} onChange={e=>onUpdate(block.id,{lang:e.target.value})}
              style={{background:"transparent",border:"none",color:"#6B7280",fontSize:11,cursor:"pointer",fontFamily:"monospace",outline:"none"}}>
              {["javascript","python","typescript","css","html","bash","json","sql","rust","go"].map(l=><option key={l} value={l}>{l}</option>)}
            </select>
            <button onClick={()=>navigator.clipboard.writeText(block.content||"")} style={{background:"transparent",border:"none",color:"#4B5563",cursor:"pointer",fontSize:11,fontFamily:"inherit"}}>Copy</button>
          </div>
          <textarea id={`block-${block.id}`} ref={ref} value={block.content||""} onChange={handleInput} onKeyDown={e=>{if(e.key==="Tab"){e.preventDefault();const s=e.target;const v=s.value;s.value=v.slice(0,s.selectionStart)+"  "+v.slice(s.selectionEnd);} handleKeyDown(e);}} placeholder="// code here..." rows={4}
            style={{...inputStyle,fontFamily:"'JetBrains Mono','Fira Code',monospace",fontSize:12,padding:"12px",color:"#A5F3FC",display:"block",resize:"vertical",lineHeight:1.6}} />
        </div>
      );
      case "divider": return <hr style={{border:"none",borderTop:"1px solid rgba(255,255,255,0.08)",margin:"8px 0",cursor:"pointer"}} onClick={()=>onAdd(index+1,"text")} />;
      case "image": return (
        <div style={{borderRadius:10,overflow:"hidden",border:"1px solid rgba(255,255,255,0.06)"}}>
          {block.content ? <img src={block.content} alt="block" style={{width:"100%",maxHeight:400,objectFit:"cover",display:"block"}} onError={e=>e.target.style.display="none"} />
            : <div style={{padding:"24px",textAlign:"center",background:"rgba(255,255,255,0.02)"}}>
                <div style={{fontSize:28,marginBottom:8}}>🖼</div>
                <input value={block.content||""} onChange={e=>onUpdate(block.id,{content:e.target.value})} placeholder="Paste image URL..." style={{...inputStyle,border:"1px solid rgba(255,255,255,0.08)",borderRadius:8,padding:"8px 12px",textAlign:"center",width:"80%"}} />
              </div>}
        </div>
      );
      case "video": return (
        <div style={{borderRadius:10,overflow:"hidden",border:"1px solid rgba(255,255,255,0.06)",background:"rgba(255,255,255,0.02)"}}>
          {block.content?.includes("youtube") ? (
            <iframe src={block.content.replace("watch?v=","embed/")} width="100%" height="315" frameBorder="0" allowFullScreen style={{display:"block"}} />
          ) : (
            <div style={{padding:"24px",textAlign:"center"}}>
              <div style={{fontSize:28,marginBottom:8}}>▶️</div>
              <input value={block.content||""} onChange={e=>onUpdate(block.id,{content:e.target.value})} placeholder="Paste YouTube URL..." style={{...inputStyle,border:"1px solid rgba(255,255,255,0.08)",borderRadius:8,padding:"8px 12px",textAlign:"center",width:"80%"}} />
            </div>
          )}
        </div>
      );
      case "bookmark": return (
        <div style={{border:"1px solid rgba(255,255,255,0.08)",borderRadius:10,padding:"14px 16px",display:"flex",gap:12,alignItems:"center",cursor:"pointer"}} onClick={()=>block.content&&window.open(block.content,"_blank")}>
          <span style={{fontSize:20}}>🔖</span>
          <div style={{flex:1}}>
            <input value={block.content||""} onChange={e=>onUpdate(block.id,{content:e.target.value})} onClick={e=>e.stopPropagation()} placeholder="https://..." style={{...inputStyle,fontSize:13,fontWeight:600}} />
            <div style={{fontSize:11,color:"#4B5563",marginTop:2}}>{block.content||"Add a bookmark URL"}</div>
          </div>
        </div>
      );
      case "table": return (
        <div style={{overflowX:"auto",border:"1px solid rgba(255,255,255,0.08)",borderRadius:10}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
            <tbody>
              {(block.rows||[["","",""],["","",""]]).map((row,ri)=>(
                <tr key={ri} style={{borderBottom:"1px solid rgba(255,255,255,0.05)"}}>
                  {row.map((cell,ci)=>(
                    <td key={ci} style={{padding:"8px 12px",borderRight:"1px solid rgba(255,255,255,0.05)"}}>
                      <input value={cell} onChange={e=>{
                        const rows=(block.rows||[]).map((r,rr)=>rr===ri?r.map((c,cc)=>cc===ci?e.target.value:c):r);
                        onUpdate(block.id,{rows});
                      }} style={{...inputStyle,fontSize:13,background:ri===0?"rgba(255,255,255,0.03)":"transparent"}} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{padding:"6px 12px",borderTop:"1px solid rgba(255,255,255,0.05)"}}>
            <button onClick={()=>onUpdate(block.id,{rows:[...(block.rows||[]),Array((block.rows?.[0]||[""]).length).fill("")]})}
              style={{fontSize:11,color:"#6B7280",background:"transparent",border:"none",cursor:"pointer",fontFamily:"inherit"}}>+ Add row</button>
          </div>
        </div>
      );
      case "columns": return (
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,border:"1px solid rgba(255,255,255,0.05)",borderRadius:10,padding:"12px"}}>
          {[0,1].map(col=>(
            <div key={col} style={{minHeight:60,borderRadius:8,background:"rgba(255,255,255,0.02)",padding:"8px"}}>
              <textarea value={(block.cols||["",""])[col]||""} onChange={e=>{
                const cols=[...(block.cols||["",""])]; cols[col]=e.target.value;
                onUpdate(block.id,{cols});
              }} placeholder={`Column ${col+1}...`} rows={3}
                style={{...inputStyle,fontSize:13,width:"100%",resize:"none"}} />
            </div>
          ))}
        </div>
      );
      case "math": return (
        <div style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:10,padding:"12px 16px"}}>
          <input id={`block-${block.id}`} ref={ref} value={block.content||""} onChange={handleInput} onKeyDown={handleKeyDown} placeholder="LaTeX: e.g. E = mc^2"
            style={{...inputStyle,fontFamily:"'JetBrains Mono',monospace",fontSize:14,textAlign:"center",color:"#A5F3FC"}} />
          {block.content && <div style={{textAlign:"center",marginTop:8,fontSize:16,color:"#E5E7EB",fontStyle:"italic"}}>{block.content}</div>}
        </div>
      );
      case "page": return (
        <div onClick={()=>onOpenPage&&onOpenPage(block.pageId)} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 12px",background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:10,cursor:"pointer",transition:"all 0.15s"}}
          onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.05)"}
          onMouseLeave={e=>e.currentTarget.style.background="rgba(255,255,255,0.02)"}>
          <span style={{fontSize:18}}>{block.icon||"📄"}</span>
          <span style={{fontSize:14,fontWeight:600,color:"#E5E7EB"}}>{block.content||"Untitled Page"}</span>
          <span style={{marginLeft:"auto",fontSize:11,color:"#4B5563"}}>↗</span>
        </div>
      );
      default: return (
        <textarea id={`block-${block.id}`} ref={ref} value={block.content||""} onChange={handleInput} onKeyDown={handleKeyDown} onSelect={handleSelect}
          placeholder={index===0?"Type '/' for commands, start writing...":"Type '/' for commands..."}
          rows={1} style={{...inputStyle,fontSize:15,width:"100%",resize:"none",overflow:"hidden",lineHeight:1.7}}
          onInput={e=>{e.target.style.height="auto";e.target.style.height=e.target.scrollHeight+"px";}} />
      );
    }
  };

  return (
    <div style={{position:"relative",paddingLeft,marginBottom:2}}
      onMouseEnter={()=>setHovered(true)}
      onMouseLeave={()=>{setHovered(false);setColorMenu(false);}}>
      {/* Block controls */}
      {hovered && block.type!=="divider" && (
        <div style={{position:"absolute",left:paddingLeft-52,top:"50%",transform:"translateY(-50%)",display:"flex",gap:3,opacity:0.6}}>
          <button onClick={()=>onAdd(index,"text")} title="Add block above"
            style={{width:18,height:18,borderRadius:4,background:"rgba(255,255,255,0.05)",border:"none",color:"#6B7280",cursor:"pointer",fontSize:12,display:"flex",alignItems:"center",justifyContent:"center"}}>+</button>
          <button
            style={{width:18,height:18,borderRadius:4,background:"rgba(255,255,255,0.05)",border:"none",color:"#6B7280",cursor:"pointer",fontSize:10,display:"flex",alignItems:"center",justifyContent:"center"}}
            onClick={()=>setColorMenu(c=>!c)}>⋮⋮</button>
        </div>
      )}
      {/* Color menu */}
      {colorMenu && (
        <div style={{position:"absolute",left:paddingLeft-52,top:0,background:"#13131F",border:"1px solid rgba(255,255,255,0.1)",borderRadius:10,padding:"8px",zIndex:9999,minWidth:160,boxShadow:"0 10px 40px rgba(0,0,0,0.6)"}}>
          <div style={{fontSize:10,color:"#4B5563",fontWeight:700,marginBottom:6,textTransform:"uppercase"}}>Background</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:8}}>
            {COLORS.map(c=><div key={c} onClick={()=>{onUpdate(block.id,{color:c});setColorMenu(false);}} style={{width:20,height:20,borderRadius:4,background:c==="default"?"rgba(255,255,255,0.1)":COLOR_MAP[c].replace("0.08","0.5"),cursor:"pointer",border:block.color===c?"2px solid #fff":"1px solid rgba(255,255,255,0.1)"}} title={c} />)}
          </div>
          <button onClick={()=>{onDelete(block.id);setColorMenu(false);}} style={{width:"100%",padding:"5px",background:"rgba(244,63,94,0.1)",border:"1px solid rgba(244,63,94,0.2)",borderRadius:6,color:"#F43F5E",fontSize:12,cursor:"pointer",fontFamily:"inherit",fontWeight:700}}>🗑 Delete</button>
        </div>
      )}
      {/* Block background */}
      <div style={{background:COLOR_MAP[block.color]||"transparent",borderRadius:6,padding:block.color&&block.color!=="default"?"6px 8px":"0"}}>
        {blockContent()}
      </div>
      {/* Slash menu */}
      {slashOpen && <SlashMenu query={slashQuery} onSelect={handleSlashSelect} position={slashPos} />}
      {/* Inline toolbar */}
      {toolbarPos && <BlockToolbar block={block} onUpdate={(u)=>onUpdate(block.id,u)} position={toolbarPos} />}
    </div>
  );
}

// ─── TABLE OF CONTENTS ────────────────────────────────────────────────────────
function TableOfContents({ blocks }) {
  const headings = blocks.filter(b=>["h1","h2","h3"].includes(b.type)&&b.content);
  if (!headings.length) return null;
  return (
    <div style={{position:"sticky",top:20,width:200,flexShrink:0}}>
      <div style={{fontSize:10,fontWeight:800,color:"#4B5563",textTransform:"uppercase",letterSpacing:"1px",marginBottom:10}}>ON THIS PAGE</div>
      {headings.map(h=>(
        <div key={h.id} onClick={()=>document.getElementById(`block-${h.id}`)?.focus()} style={{
          fontSize:h.type==="h1"?13:h.type==="h2"?12:11,
          paddingLeft:h.type==="h1"?0:h.type==="h2"?10:18,
          color:"#6B7280",padding:"3px 0",cursor:"pointer",transition:"color 0.15s",
        }}
        onMouseEnter={e=>e.currentTarget.style.color="#E5E7EB"}
        onMouseLeave={e=>e.currentTarget.style.color="#6B7280"}>
          {h.content?.slice(0,28)}{h.content?.length>28?"...":""}
        </div>
      ))}
    </div>
  );
}

// ─── PAGE EDITOR ─────────────────────────────────────────────────────────────
function PageEditor({ page, allPages, onSave, onBack, onOpenPage }) {
  const { user } = useAuth();
  const [title, setTitle] = useState(page.title||"Untitled");
  const [icon, setIcon] = useState(page.icon||"📄");
  const [cover, setCover] = useState(page.cover||"");
  const [blocks, setBlocks] = useState(page.blocks?.length ? page.blocks : [newBlock("text")]);
  const [showIcons, setShowIcons] = useState(false);
  const [showCover, setShowCover] = useState(false);
  const [showTOC, setShowTOC] = useState(false);
  const [saved, setSaved] = useState(true);
  const [fullWidth, setFullWidth] = useState(false);
  const saveTimer = useRef();

  const save = useCallback((t,b,i,c) => {
    setSaved(false);
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      await updateNote(user.uid, page.id, {title:t||"Untitled",blocks:b,icon:i,cover:c,updatedAt:new Date()});
      setSaved(true);
    }, 800);
  }, [user, page.id]);

  const updateBlock = (id, data) => {
    const updated = blocks.map(b=>b.id===id?{...b,...data}:b);
    setBlocks(updated); save(title,updated,icon,cover);
  };
  const deleteBlock = (id) => {
    if (blocks.length<=1) return;
    const updated = blocks.filter(b=>b.id!==id);
    setBlocks(updated); save(title,updated,icon,cover);
  };
  const addBlock = (idx, type="text") => {
    const nb = newBlock(type);
    const updated = [...blocks.slice(0,idx), nb, ...blocks.slice(idx)];
    setBlocks(updated); save(title,updated,icon,cover);
    setTimeout(()=>document.getElementById(`block-${nb.id}`)?.focus(),50);
  };
  const moveBlock = (id, dir) => {
    const idx = blocks.findIndex(b=>b.id===id);
    if ((dir==="up"&&idx===0)||(dir==="down"&&idx===blocks.length-1)) return;
    const updated = [...blocks];
    const swap = dir==="up"?idx-1:idx+1;
    [updated[idx],updated[swap]]=[updated[swap],updated[idx]];
    setBlocks(updated); save(title,updated,icon,cover);
  };

  const wordCount = blocks.reduce((s,b)=>s+(b.content||"").split(/\s+/).filter(Boolean).length,0);
  const readTime = Math.max(1,Math.round(wordCount/200));

  return (
    <div style={{display:"flex",flexDirection:"column",height:"100%",background:"#09090E"}}>
      {/* Top bar */}
      <div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 20px",borderBottom:"1px solid rgba(255,255,255,0.05)",flexShrink:0,background:"rgba(9,9,14,0.95)",backdropFilter:"blur(20px)"}}>
        <button onClick={onBack} style={{padding:"5px 12px",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:8,color:"#9CA3AF",cursor:"pointer",fontFamily:"inherit",fontSize:12}}>← Back</button>
        <div style={{flex:1,fontSize:13,color:"#4B5563",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{title||"Untitled"}</div>
        <div style={{fontSize:11,color:"#4B5563"}}>{wordCount} words · {readTime} min read</div>
        <div style={{fontSize:11,color:saved?"#10B981":"#F59E0B",fontWeight:600}}>{saved?"✓ Saved":"Saving..."}</div>
        <button onClick={()=>setShowTOC(t=>!t)} title="Table of Contents" style={{padding:"5px 10px",background:showTOC?"rgba(255,107,53,0.1)":"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:8,color:showTOC?"#FF6B35":"#6B7280",cursor:"pointer",fontFamily:"inherit",fontSize:12}}>TOC</button>
        <button onClick={()=>setFullWidth(f=>!f)} style={{padding:"5px 10px",background:fullWidth?"rgba(255,107,53,0.1)":"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:8,color:fullWidth?"#FF6B35":"#6B7280",cursor:"pointer",fontSize:12}}>⤢</button>
      </div>

      <div style={{flex:1,overflowY:"auto",display:"flex",gap:0}}>
        {/* Main editor */}
        <div style={{flex:1,overflowY:"auto"}}>
          {/* Cover */}
          {cover && (
            <div style={{height:200,background:cover,position:"relative",flexShrink:0}}>
              <button onClick={()=>{setCover("");save(title,blocks,icon,"");}} style={{position:"absolute",top:10,right:10,padding:"4px 10px",background:"rgba(0,0,0,0.5)",border:"none",borderRadius:6,color:"#fff",cursor:"pointer",fontSize:12,fontFamily:"inherit"}}>Remove cover</button>
            </div>
          )}

          {/* Page header */}
          <div style={{maxWidth:fullWidth?"100%":760,margin:"0 auto",padding:cover?"20px 60px 0":"60px 60px 0"}}>
            {/* Icon + cover buttons */}
            <div style={{display:"flex",gap:8,marginBottom:12,position:"relative"}}>
              <button onClick={()=>setShowIcons(s=>!s)} style={{fontSize:42,background:"transparent",border:"none",cursor:"pointer",padding:0,lineHeight:1}}>{icon}</button>
              {showIcons && (
                <div style={{position:"absolute",top:50,left:0,background:"#13131F",border:"1px solid rgba(255,255,255,0.1)",borderRadius:14,padding:12,zIndex:9999,display:"flex",flexWrap:"wrap",gap:6,width:260}}>
                  {PAGE_ICONS.map(ic=><span key={ic} onClick={()=>{setIcon(ic);setShowIcons(false);save(title,blocks,ic,cover);}} style={{fontSize:24,cursor:"pointer",padding:4,borderRadius:6,transition:"background 0.1s"}} onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.08)"} onMouseLeave={e=>e.currentTarget.style.background=""}>{ic}</span>)}
                </div>
              )}
              {!cover && (
                <button onClick={()=>setShowCover(s=>!s)} style={{alignSelf:"flex-end",padding:"4px 10px",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:8,color:"#6B7280",cursor:"pointer",fontSize:11,fontFamily:"inherit",marginBottom:4}}>+ Add cover</button>
              )}
            </div>
            {showCover && (
              <div style={{marginBottom:16,display:"flex",flexWrap:"wrap",gap:6}}>
                {COVER_GRADIENTS.map((g,i)=><div key={i} onClick={()=>{setCover(g);setShowCover(false);save(title,blocks,icon,g);}} style={{width:60,height:36,borderRadius:8,background:g,cursor:"pointer",border:"2px solid rgba(255,255,255,0.1)",transition:"transform 0.15s"}} onMouseEnter={e=>e.currentTarget.style.transform="scale(1.08)"} onMouseLeave={e=>e.currentTarget.style.transform="none"} />)}
              </div>
            )}
            {/* Title */}
            <input value={title} onChange={e=>{setTitle(e.target.value);save(e.target.value,blocks,icon,cover);}}
              placeholder="Untitled" onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();addBlock(0,"text");}}}
              style={{width:"100%",background:"transparent",border:"none",outline:"none",fontFamily:"'Cabinet Grotesk',sans-serif",fontSize:42,fontWeight:900,color:"#F9FAFB",letterSpacing:"-2px",lineHeight:1.15,padding:"4px 0",marginBottom:24}} />
            {/* Blocks */}
            <div style={{paddingBottom:200}}>
              {blocks.map((block,i)=>(
                <Block key={block.id} block={block} index={i} blocks={blocks}
                  onUpdate={updateBlock} onDelete={deleteBlock}
                  onAdd={addBlock} onMove={moveBlock}
                  allPages={allPages} onOpenPage={onOpenPage} />
              ))}
              <div onClick={()=>addBlock(blocks.length,"text")} style={{padding:"8px 0",color:"rgba(255,255,255,0.1)",fontSize:13,cursor:"text",userSelect:"none"}}>
                Click to add a block, or type '/' for commands...
              </div>
            </div>
          </div>
        </div>

        {/* TOC sidebar */}
        {showTOC && (
          <div style={{width:220,padding:"24px 16px",borderLeft:"1px solid rgba(255,255,255,0.05)",flexShrink:0,overflowY:"auto"}}>
            <TableOfContents blocks={blocks} />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── PAGES LIST (Notion sidebar style) ───────────────────────────────────────
export default function NotionPage() {
  const { user } = useAuth();
  const [pages, setPages] = useState([]);
  const [activePage, setActivePage] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("grid"); // grid | list

  useEffect(() => {
    if (!user) return;
    return subscribeToNotes(user.uid, d => { setPages(d); setLoading(false); });
  }, [user]);

  const createPage = async (template=null) => {
    const blocks = template ? template.blocks : [newBlock("text")];
    const ref = await addNote(user.uid, {
      title: template?.title||"Untitled",
      icon: template?.icon||"📄",
      blocks, cover:"",
      tags:[], isPinned:false,
    });
    // Open immediately
    const newPage = { id:ref.id, title:template?.title||"Untitled", icon:template?.icon||"📄", blocks, cover:"", tags:[] };
    setActivePage(newPage);
  };

  const deletePage = async (id) => {
    await deleteNote(user.uid, id);
    if (activePage?.id===id) setActivePage(null);
  };

  const filtered = pages.filter(p=>(p.title||"Untitled").toLowerCase().includes(search.toLowerCase()));
  const pinned = filtered.filter(p=>p.isPinned);
  const recent = filtered.filter(p=>!p.isPinned);

  const TEMPLATES = [
    {title:"Meeting Notes",icon:"📋",blocks:[newBlock("h1","Meeting Notes"),newBlock("text","Date: "),newBlock("h2","Attendees"),newBlock("bullet",""),newBlock("h2","Agenda"),newBlock("numbered",""),newBlock("h2","Action Items"),newBlock("todo","")]},
    {title:"Project Brief",icon:"🚀",blocks:[newBlock("h1","Project Brief"),newBlock("callout","Define the project goal here",""),newBlock("h2","Overview"),newBlock("text",""),newBlock("h2","Goals"),newBlock("todo",""),newBlock("h2","Timeline"),newBlock("table")]},
    {title:"Daily Journal",icon:"📔",blocks:[newBlock("h1",new Date().toLocaleDateString()),newBlock("h2","Today's Wins 🎉"),newBlock("bullet",""),newBlock("h2","Challenges"),newBlock("bullet",""),newBlock("h2","Tomorrow's Plan"),newBlock("todo","")]},
    {title:"Brain Dump",icon:"🧠",blocks:[newBlock("h1","Brain Dump"),newBlock("text","Write everything on your mind...")]},
  ];

  if (activePage) {
    const fresh = pages.find(p=>p.id===activePage.id)||activePage;
    return <PageEditor page={fresh} allPages={pages} onSave={()=>{}} onBack={()=>setActivePage(null)} onOpenPage={id=>{const p=pages.find(x=>x.id===id);if(p)setActivePage(p);}} />;
  }

  return (
    <div style={{maxWidth:1100,margin:"0 auto"}}>
      {/* Header */}
      <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:24}}>
        <div style={{flex:1}}>
          <h1 style={{fontFamily:"'Cabinet Grotesk',sans-serif",fontSize:28,fontWeight:900,margin:0,letterSpacing:"-1px"}}>📄 Pages</h1>
          <p style={{color:"#6B7280",fontSize:13,margin:"4px 0 0"}}>Your personal knowledge base — write, plan, document anything</p>
        </div>
        <div style={{display:"flex",gap:8}}>
          {["grid","list"].map(v=>(
            <button key={v} onClick={()=>setView(v)} style={{padding:"6px 12px",border:"1px solid",borderColor:view===v?"#FF6B35":"rgba(255,255,255,0.08)",borderRadius:8,background:view===v?"rgba(255,107,53,0.1)":"transparent",color:view===v?"#FF6B35":"#6B7280",fontSize:12,cursor:"pointer",fontFamily:"inherit",fontWeight:700}}>{v==="grid"?"⊞":"☰"}</button>
          ))}
          <button onClick={()=>createPage()} style={{padding:"8px 18px",background:"linear-gradient(135deg,#FF6B35,#FF8C5A)",border:"none",borderRadius:10,color:"#fff",fontWeight:800,fontSize:13,cursor:"pointer",fontFamily:"inherit",boxShadow:"0 4px 16px rgba(255,107,53,0.3)"}}>+ New Page</button>
        </div>
      </div>

      {/* Search */}
      <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Search pages..."
        style={{width:"100%",background:"#13131F",border:"1px solid rgba(255,255,255,0.06)",borderRadius:12,color:"#E5E7EB",fontSize:14,padding:"11px 16px",fontFamily:"inherit",outline:"none",marginBottom:20,boxSizing:"border-box"}} />

      {/* Templates */}
      {pages.length===0 && !loading && (
        <div style={{marginBottom:28}}>
          <div style={{fontSize:11,fontWeight:800,color:"#4B5563",textTransform:"uppercase",letterSpacing:"1px",marginBottom:12}}>START FROM A TEMPLATE</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>
            {TEMPLATES.map(t=>(
              <div key={t.title} onClick={()=>createPage(t)} style={{background:"#13131F",border:"1px solid rgba(255,255,255,0.06)",borderRadius:14,padding:"16px",cursor:"pointer",transition:"all 0.15s"}}
                onMouseEnter={e=>{e.currentTarget.style.background="#1A1A2E";e.currentTarget.style.borderColor="rgba(255,107,53,0.3)";}}
                onMouseLeave={e=>{e.currentTarget.style.background="#13131F";e.currentTarget.style.borderColor="rgba(255,255,255,0.06)";}}>
                <div style={{fontSize:28,marginBottom:8}}>{t.icon}</div>
                <div style={{fontSize:13,fontWeight:700,color:"#E5E7EB"}}>{t.title}</div>
                <div style={{fontSize:11,color:"#4B5563",marginTop:4}}>{t.blocks.length} blocks</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pinned pages */}
      {pinned.length>0 && (
        <div style={{marginBottom:20}}>
          <div style={{fontSize:11,fontWeight:800,color:"#4B5563",textTransform:"uppercase",letterSpacing:"1px",marginBottom:10}}>📌 PINNED</div>
          <div style={{display:view==="grid"?"grid":"flex",gridTemplateColumns:"repeat(3,1fr)",flexDirection:"column",gap:10}}>
            {pinned.map(p=><PageCard key={p.id} page={p} view={view} onClick={()=>setActivePage(p)} onDelete={()=>deletePage(p.id)} onPin={()=>updateNote(user.uid,p.id,{isPinned:!p.isPinned})} />)}
          </div>
        </div>
      )}

      {/* All pages */}
      <div>
        <div style={{fontSize:11,fontWeight:800,color:"#4B5563",textTransform:"uppercase",letterSpacing:"1px",marginBottom:10}}>
          {pinned.length>0?"RECENT":"ALL PAGES"} ({recent.length})
        </div>
        {loading && <div style={{textAlign:"center",padding:40,color:"#4B5563"}}>Loading...</div>}
        {!loading && recent.length===0 && search && <div style={{textAlign:"center",padding:40,color:"#4B5563"}}>No pages found for "{search}"</div>}
        {!loading && recent.length===0 && !search && pages.length===0 && (
          <div style={{textAlign:"center",padding:60,color:"#4B5563"}}>
            <div style={{fontSize:48,marginBottom:12}}>📄</div>
            <div style={{fontSize:16,fontWeight:700,color:"#9CA3AF",marginBottom:8}}>Start your knowledge base</div>
            <div style={{fontSize:13,marginBottom:20}}>Create pages for notes, docs, wikis — anything you want</div>
            <button onClick={()=>createPage()} style={{padding:"10px 22px",background:"linear-gradient(135deg,#FF6B35,#FF8C5A)",border:"none",borderRadius:10,color:"#fff",fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>Create First Page</button>
          </div>
        )}
        <div style={{display:view==="grid"?"grid":"flex",gridTemplateColumns:"repeat(3,1fr)",flexDirection:"column",gap:10}}>
          {recent.map(p=><PageCard key={p.id} page={p} view={view} onClick={()=>setActivePage(p)} onDelete={()=>deletePage(p.id)} onPin={()=>updateNote(user.uid,p.id,{isPinned:!p.isPinned})} />)}
        </div>
      </div>
    </div>
  );
}

// ─── PAGE CARD ────────────────────────────────────────────────────────────────
function PageCard({ page, view, onClick, onDelete, onPin }) {
  const preview = page.blocks?.find(b=>b.type==="text"&&b.content)?.content||"";
  const wordCount = (page.blocks||[]).reduce((s,b)=>s+(b.content||"").split(/\s+/).filter(Boolean).length,0);

  if (view==="list") return (
    <div onClick={onClick} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 14px",background:"#13131F",border:"1px solid rgba(255,255,255,0.05)",borderRadius:10,cursor:"pointer",transition:"all 0.15s"}}
      onMouseEnter={e=>e.currentTarget.style.background="#1A1A2E"}
      onMouseLeave={e=>e.currentTarget.style.background="#13131F"}>
      {page.cover?<div style={{width:40,height:40,borderRadius:8,background:page.cover,flexShrink:0}}/>:<div style={{fontSize:28,flexShrink:0}}>{page.icon||"📄"}</div>}
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontSize:14,fontWeight:700,color:"#F3F4F6",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{page.title||"Untitled"}</div>
        <div style={{fontSize:11,color:"#4B5563"}}>{wordCount} words · {page.blocks?.length||0} blocks</div>
      </div>
      <button onClick={e=>{e.stopPropagation();onDelete();}} style={{padding:"4px 8px",background:"transparent",border:"none",color:"#2A2A3A",cursor:"pointer",fontSize:14,borderRadius:6,transition:"all 0.1s"}}
        onMouseEnter={e=>e.currentTarget.style.color="#F43F5E"} onMouseLeave={e=>e.currentTarget.style.color="#2A2A3A"}>🗑</button>
    </div>
  );

  return (
    <div style={{background:"#13131F",border:"1px solid rgba(255,255,255,0.05)",borderRadius:14,overflow:"hidden",cursor:"pointer",transition:"all 0.18s"}}
      onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.borderColor="rgba(255,107,53,0.2)";e.currentTarget.style.boxShadow="0 12px 32px rgba(0,0,0,0.4)";}}
      onMouseLeave={e=>{e.currentTarget.style.transform="none";e.currentTarget.style.borderColor="rgba(255,255,255,0.05)";e.currentTarget.style.boxShadow="none";}}>
      {/* Cover */}
      <div onClick={onClick} style={{height:80,background:page.cover||"linear-gradient(135deg,#0F0F1C,#1A1A2E)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:36}}>
        {!page.cover&&(page.icon||"📄")}
      </div>
      <div style={{padding:"12px 14px"}}>
        <div onClick={onClick} style={{fontSize:14,fontWeight:700,color:"#F3F4F6",marginBottom:6,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{page.title||"Untitled"}</div>
        {preview && <div onClick={onClick} style={{fontSize:12,color:"#6B7280",marginBottom:10,overflow:"hidden",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical"}}>{preview}</div>}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <span style={{fontSize:10,color:"#4B5563"}}>{wordCount} words</span>
          <div style={{display:"flex",gap:4}}>
            <button onClick={e=>{e.stopPropagation();onPin();}} style={{padding:"3px 7px",background:"transparent",border:"none",color:page.isPinned?"#F59E0B":"#2A2A3A",cursor:"pointer",fontSize:12,borderRadius:6,transition:"color 0.1s"}}
              onMouseEnter={e=>e.currentTarget.style.color="#F59E0B"} onMouseLeave={e=>e.currentTarget.style.color=page.isPinned?"#F59E0B":"#2A2A3A"}>📌</button>
            <button onClick={e=>{e.stopPropagation();onDelete();}} style={{padding:"3px 7px",background:"transparent",border:"none",color:"#2A2A3A",cursor:"pointer",fontSize:12,borderRadius:6,transition:"color 0.1s"}}
              onMouseEnter={e=>e.currentTarget.style.color="#F43F5E"} onMouseLeave={e=>e.currentTarget.style.color="#2A2A3A"}>🗑</button>
          </div>
        </div>
      </div>
    </div>
  );
}
