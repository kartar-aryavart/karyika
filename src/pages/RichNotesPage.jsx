// 📝 Rich Notes — Notion-style block editor
import { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "../hooks/useAuth";
import { addNote, updateNote, deleteNote } from "../firebase/services";

// Block types supported
const BLOCK_TYPES = [
  { id:"text",    icon:"¶",  label:"Text" },
  { id:"h1",      icon:"H1", label:"Heading 1" },
  { id:"h2",      icon:"H2", label:"Heading 2" },
  { id:"bullet",  icon:"•",  label:"Bullet list" },
  { id:"numbered",icon:"1.", label:"Numbered list" },
  { id:"todo",    icon:"☐",  label:"Todo" },
  { id:"quote",   icon:'"',  label:"Quote" },
  { id:"code",    icon:"</>",label:"Code" },
  { id:"divider", icon:"—",  label:"Divider" },
];

const NOTE_COLORS = [
  { bg:"#13131F", border:"#2A2A3A", name:"Dark" },
  { bg:"#1A1A0D", border:"#3A3A1A", name:"Warm" },
  { bg:"#0D1A1A", border:"#1A3A3A", name:"Cool" },
  { bg:"#1A0D1A", border:"#3A1A3A", name:"Purple" },
  { bg:"#1A0D0D", border:"#3A1A1A", name:"Rose" },
];

function Block({ block, onChange, onDelete, onKeyDown, index, autoFocus }) {
  const ref = useRef(null);
  useEffect(() => { if (autoFocus && ref.current) { ref.current.focus(); } }, [autoFocus]);

  const styles = {
    text:     { fontSize:14, lineHeight:1.7, color:"#D1D5DB" },
    h1:       { fontSize:26, fontWeight:800, fontFamily:"'Cabinet Grotesk',sans-serif", color:"#F9FAFB", lineHeight:1.3 },
    h2:       { fontSize:20, fontWeight:700, fontFamily:"'Cabinet Grotesk',sans-serif", color:"#F3F4F6" },
    bullet:   { fontSize:14, lineHeight:1.7, color:"#D1D5DB" },
    numbered: { fontSize:14, lineHeight:1.7, color:"#D1D5DB" },
    todo:     { fontSize:14, lineHeight:1.7, color: block.checked ? "#6B7280" : "#D1D5DB", textDecoration: block.checked ? "line-through" : "none" },
    quote:    { fontSize:14, lineHeight:1.7, color:"#9CA3AF", fontStyle:"italic" },
    code:     { fontSize:13, lineHeight:1.6, color:"#10B981", fontFamily:"'JetBrains Mono',monospace" },
  };

  if (block.type === "divider") return <hr style={{ border:"none",borderTop:"1px solid #2A2A3A",margin:"8px 0" }} />;

  return (
    <div style={{ display:"flex",alignItems:"flex-start",gap:8,padding:"2px 0",position:"relative" }} className="block-row">
      {/* Prefix */}
      <div style={{ flexShrink:0,width:20,textAlign:"right",marginTop:block.type==="h1"?6:block.type==="h2"?4:3,fontSize:12,color:"#4B5563",userSelect:"none" }}>
        {block.type==="bullet"?"•":block.type==="numbered"?`${index+1}.`:block.type==="todo"?(
          <input type="checkbox" checked={!!block.checked} onChange={()=>onChange({...block,checked:!block.checked})} style={{ cursor:"pointer",accentColor:"#FF6B35",width:14,height:14 }} />
        ):null}
      </div>
      {/* Content */}
      {block.type==="code" ? (
        <textarea ref={ref} value={block.content} onChange={e=>onChange({...block,content:e.target.value})}
          style={{ flex:1,background:"#0A0A14",border:"1px solid #1E1E2E",borderRadius:8,padding:"10px 12px",...styles.code,resize:"none",minHeight:60,outline:"none",fontFamily:"'JetBrains Mono',monospace" }}
          onKeyDown={e=>onKeyDown(e,block,index)} rows={Math.max(2,(block.content||"").split("\n").length)} />
      ) : (
        <div ref={ref} contentEditable suppressContentEditableWarning
          onInput={e=>onChange({...block,content:e.currentTarget.textContent})}
          onKeyDown={e=>onKeyDown(e,block,index)}
          data-placeholder={block.type==="h1"?"Heading 1":block.type==="h2"?"Heading 2":block.type==="quote"?"Quote...":block.type==="todo"?"Todo item...":block.type==="code"?"Code...":"Type something... (/ for commands)"}
          style={{ flex:1,...styles[block.type]||styles.text,outline:"none",minHeight:22,cursor:"text",borderLeft:block.type==="quote"?"3px solid #FF6B35":"none",paddingLeft:block.type==="quote"?"12px":"0",wordBreak:"break-word" }}>
          {block.content}
        </div>
      )}
      <style>{`.block-row:hover .del-btn{opacity:1!important}`}</style>
      <button className="del-btn" onClick={()=>onDelete(index)} style={{ opacity:0,flexShrink:0,width:18,height:18,border:"none",background:"#1A1A26",borderRadius:4,color:"#6B7280",cursor:"pointer",fontSize:12,display:"flex",alignItems:"center",justifyContent:"center",marginTop:3,transition:"opacity 0.15s" }}>×</button>
    </div>
  );
}

function NoteEditor({ note, onSave, onClose }) {
  const { user } = useAuth();
  const [title, setTitle] = useState(note?.title || "");
  const [blocks, setBlocks] = useState(note?.blocks?.length ? note.blocks : [{ id:"1",type:"text",content:"" }]);
  const [tags, setTags] = useState(note?.tags || []);
  const [tagInput, setTagInput] = useState("");
  const [colorIdx, setColorIdx] = useState(0);
  const [slashMenu, setSlashMenu] = useState(null); // {idx, q}
  const [newBlockFocus, setNewBlockFocus] = useState(null);
  const titleRef = useRef(null);
  useEffect(() => { titleRef.current?.focus(); }, []);

  const uid = () => Math.random().toString(36).slice(2);

  const updateBlock = (idx, newBlock) => setBlocks(b => b.map((bl,i)=>i===idx?newBlock:bl));
  const deleteBlock = (idx) => { if(blocks.length<=1){setBlocks([{id:uid(),type:"text",content:""}]);return;} setBlocks(b=>b.filter((_,i)=>i!==idx)); };
  const insertBlock = (afterIdx, type="text") => {
    const newB = { id:uid(), type, content:"" };
    setBlocks(b => { const n=[...b];n.splice(afterIdx+1,0,newB);return n; });
    setNewBlockFocus(afterIdx+1);
  };

  const handleKey = (e, block, idx) => {
    if (e.key === "Enter" && block.type !== "code") {
      e.preventDefault();
      insertBlock(idx, block.type==="bullet"||block.type==="numbered"||block.type==="todo"?block.type:"text");
    }
    if (e.key === "Backspace" && !block.content) { e.preventDefault(); deleteBlock(idx); if(idx>0)setNewBlockFocus(idx-1); }
    if (e.key === "/" && !block.content) { setSlashMenu({ idx, q:"" }); }
  };

  const handleSlashSelect = (type, idx) => {
    updateBlock(idx, { ...blocks[idx], type, content:"" });
    setSlashMenu(null);
    setNewBlockFocus(idx);
  };

  const save = async () => {
    if (!title.trim() && !blocks.some(b=>b.content)) return;
    const data = { title: title || "Untitled", blocks, tags, color: NOTE_COLORS[colorIdx].bg };
    if (note?.id) await updateNote(user.uid, note.id, data);
    else await addNote(user.uid, data);
    onSave();
  };

  return (
    <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.9)",backdropFilter:"blur(12px)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",padding:20 }}>
      <div style={{ width:"100%",maxWidth:780,maxHeight:"90vh",background:NOTE_COLORS[colorIdx].bg,border:`1px solid ${NOTE_COLORS[colorIdx].border}`,borderRadius:20,display:"flex",flexDirection:"column",overflow:"hidden" }}>
        {/* Toolbar */}
        <div style={{ display:"flex",alignItems:"center",gap:10,padding:"14px 20px",borderBottom:`1px solid ${NOTE_COLORS[colorIdx].border}`,flexShrink:0 }}>
          <div style={{ display:"flex",gap:6 }}>
            {NOTE_COLORS.map((c,i)=><div key={i} onClick={()=>setColorIdx(i)} style={{ width:18,height:18,borderRadius:"50%",background:c.bg,border:`2px solid ${i===colorIdx?"#FF6B35":c.border}`,cursor:"pointer" }} />)}
          </div>
          <div style={{ flex:1 }} />
          <div style={{ display:"flex",gap:6 }}>
            {BLOCK_TYPES.slice(0,6).map(bt=>(
              <button key={bt.id} onClick={()=>insertBlock(blocks.length-1,bt.id)} style={{ padding:"4px 8px",border:"1px solid #2A2A3A",borderRadius:6,background:"transparent",color:"#9CA3AF",fontSize:11,cursor:"pointer",fontFamily:"inherit",fontWeight:700 }} title={bt.label}>{bt.icon}</button>
            ))}
          </div>
          <button onClick={save} style={{ padding:"7px 16px",border:"none",borderRadius:8,background:"#FF6B35",color:"#fff",fontWeight:700,fontSize:13,cursor:"pointer",fontFamily:"inherit" }}>Save</button>
          <button onClick={onClose} style={{ padding:"7px 12px",border:"1px solid #2A2A3A",borderRadius:8,background:"transparent",color:"#9CA3AF",cursor:"pointer",fontFamily:"inherit" }}>✕</button>
        </div>

        {/* Editor */}
        <div style={{ flex:1,overflowY:"auto",padding:"20px 28px" }}>
          <input ref={titleRef} value={title} onChange={e=>setTitle(e.target.value)}
            placeholder="Note title..." onKeyDown={e=>e.key==="Enter"&&setNewBlockFocus(0)}
            style={{ width:"100%",background:"none",border:"none",color:"#F9FAFB",fontFamily:"'Cabinet Grotesk',sans-serif",fontSize:32,fontWeight:800,outline:"none",marginBottom:16,letterSpacing:"-1px" }} />
          
          {/* Tags */}
          <div style={{ display:"flex",flexWrap:"wrap",gap:6,marginBottom:16,alignItems:"center" }}>
            {tags.map(tag=><span key={tag} style={{ fontSize:11,padding:"3px 9px",background:"rgba(255,107,53,0.1)",color:"#FF6B35",borderRadius:20,border:"1px solid rgba(255,107,53,0.25)",cursor:"pointer" }} onClick={()=>setTags(t=>t.filter(x=>x!==tag))}>#{tag} ×</span>)}
            <input value={tagInput} onChange={e=>setTagInput(e.target.value)} placeholder="+ tag"
              onKeyDown={e=>{ if(e.key==="Enter"&&tagInput.trim()){ setTags(t=>[...t,tagInput.trim()]); setTagInput(""); e.preventDefault(); }}}
              style={{ background:"none",border:"none",color:"#6B7280",fontSize:12,outline:"none",width:60,fontFamily:"inherit" }} />
          </div>

          {/* Blocks */}
          <div style={{ position:"relative" }}>
            {blocks.map((block,i)=>(
              <Block key={block.id} block={block} index={i}
                onChange={newB=>updateBlock(i,newB)}
                onDelete={()=>deleteBlock(i)}
                onKeyDown={handleKey}
                autoFocus={newBlockFocus===i} />
            ))}
          </div>

          {/* Add block button */}
          <button onClick={()=>insertBlock(blocks.length-1)} style={{ marginTop:12,padding:"6px 14px",border:"1px dashed #2A2A3A",borderRadius:8,background:"transparent",color:"#4B5563",fontSize:12,cursor:"pointer",fontFamily:"inherit" }}>+ Add block</button>

          {/* Slash command menu */}
          {slashMenu && (
            <div style={{ position:"fixed",background:"#13131F",border:"1px solid #2A2A3A",borderRadius:12,padding:8,zIndex:99999,boxShadow:"0 10px 30px rgba(0,0,0,0.5)",minWidth:200 }}>
              <div style={{ fontSize:11,color:"#6B7280",padding:"4px 8px",marginBottom:4,fontWeight:700 }}>BLOCK TYPES</div>
              {BLOCK_TYPES.map(bt=>(
                <div key={bt.id} onClick={()=>handleSlashSelect(bt.id,slashMenu.idx)} style={{ display:"flex",alignItems:"center",gap:10,padding:"7px 10px",borderRadius:8,cursor:"pointer",transition:"background 0.1s" }} onMouseEnter={e=>e.currentTarget.style.background="#1A1A26"} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                  <span style={{ width:24,textAlign:"center",fontSize:12,fontWeight:700,color:"#FF6B35" }}>{bt.icon}</span>
                  <span style={{ fontSize:13,color:"#E5E7EB" }}>{bt.label}</span>
                </div>
              ))}
              <div onClick={()=>setSlashMenu(null)} style={{ fontSize:11,color:"#6B7280",padding:"6px 10px",cursor:"pointer",marginTop:4 }}>✕ Close</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function RichNotesPage({ notes=[] }) {
  const { user } = useAuth();
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState("");

  const showToast = (msg) => { setToast(msg); setTimeout(()=>setToast(""),2500); };

  const filtered = notes.filter(n =>
    n.title?.toLowerCase().includes(search.toLowerCase()) ||
    n.body?.toLowerCase().includes(search.toLowerCase()) ||
    n.blocks?.some(b=>b.content?.toLowerCase().includes(search.toLowerCase()))
  );

  const del = async (id) => { await deleteNote(user.uid, id); showToast("🗑 Note deleted"); };

  return (
    <div>
      {toast && <div style={{ position:"fixed",bottom:24,right:24,background:"#10B981",color:"#fff",padding:"12px 20px",borderRadius:12,fontWeight:700,fontSize:14,zIndex:9999 }}>{toast}</div>}

      {/* Header */}
      <div style={{ display:"flex",alignItems:"center",gap:12,marginBottom:20 }}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Search notes..."
          style={{ flex:1,background:"#13131F",border:"1px solid #1E1E2E",borderRadius:10,color:"#E5E7EB",fontSize:13,padding:"9px 14px",fontFamily:"inherit",outline:"none" }} />
        <button onClick={()=>setEditing({})} style={{ padding:"9px 18px",border:"none",borderRadius:10,background:"linear-gradient(135deg,#FF6B35,#FF8C5A)",color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit",boxShadow:"0 0 14px rgba(255,107,53,0.3)",whiteSpace:"nowrap" }}>+ New Note</button>
      </div>

      {/* Notes grid */}
      {filtered.length === 0 ? (
        <div style={{ textAlign:"center",padding:"60px 20px",color:"#6B7280" }}>
          <div style={{ fontSize:52,marginBottom:14 }}>📝</div>
          <div style={{ fontFamily:"'Cabinet Grotesk',sans-serif",fontSize:20,fontWeight:800,color:"#E5E7EB",marginBottom:8 }}>{search ? "Koi note nahi mila" : "Pehla note banao"}</div>
          <div style={{ fontSize:13,marginBottom:20 }}>Notion-style block editor ke saath — headings, bullets, todos, code</div>
          {!search && <button onClick={()=>setEditing({})} style={{ padding:"10px 22px",border:"none",borderRadius:10,background:"#FF6B35",color:"#fff",fontWeight:700,cursor:"pointer",fontFamily:"inherit",fontSize:14 }}>+ New Note</button>}
        </div>
      ) : (
        <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:14 }}>
          {filtered.map(n => {
            const preview = n.blocks?.filter(b=>b.content&&b.type!=="divider").slice(0,3).map(b=>b.content).join(" • ") || n.body?.slice(0,120) || "";
            return (
              <div key={n.id} onClick={()=>setEditing(n)} style={{ background:n.color||"#13131F",border:"1px solid #2A2A3A",borderRadius:14,padding:18,cursor:"pointer",transition:"all 0.2s",minHeight:120,position:"relative" }} onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow="0 8px 24px rgba(0,0,0,0.4)";}} onMouseLeave={e=>{e.currentTarget.style.transform="none";e.currentTarget.style.boxShadow="none";}}>
                <button onClick={e=>{e.stopPropagation();del(n.id);}} style={{ position:"absolute",top:10,right:10,width:22,height:22,border:"none",background:"rgba(244,63,94,0.1)",borderRadius:6,color:"#F43F5E",cursor:"pointer",fontSize:13,display:"flex",alignItems:"center",justifyContent:"center",opacity:0,transition:"opacity 0.15s" }} className="note-del">×</button>
                <div style={{ fontFamily:"'Cabinet Grotesk',sans-serif",fontWeight:800,fontSize:15,color:"#F9FAFB",marginBottom:8,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{n.title||"Untitled"}</div>
                {n.tags?.length>0 && <div style={{ display:"flex",flexWrap:"wrap",gap:4,marginBottom:8 }}>{n.tags.slice(0,3).map(t=><span key={t} style={{ fontSize:10,padding:"2px 7px",background:"rgba(255,107,53,0.1)",color:"#FF6B35",borderRadius:12,border:"1px solid rgba(255,107,53,0.2)" }}>#{t}</span>)}</div>}
                <div style={{ fontSize:12,color:"#6B7280",lineHeight:1.6,overflow:"hidden",display:"-webkit-box",WebkitLineClamp:3,WebkitBoxOrient:"vertical" }}>{preview||"(empty)"}</div>
                <div style={{ fontSize:11,color:"#4B5563",marginTop:10 }}>{n.blocks?.length||0} blocks · {new Date(n.createdAt?.seconds*1000||Date.now()).toLocaleDateString("en-IN",{month:"short",day:"numeric"})}</div>
              </div>
            );
          })}
        </div>
      )}

      <style>{`.note-del{opacity:0}.note-card:hover .note-del{opacity:1!important}`}</style>

      {editing !== null && (
        <NoteEditor note={editing?.id ? editing : null} onSave={()=>{setEditing(null);showToast("✅ Note saved!");}} onClose={()=>setEditing(null)} />
      )}
    </div>
  );
}
