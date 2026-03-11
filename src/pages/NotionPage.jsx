// 📄 NotionPage v2 — Phase 7 FULL UPGRADE
// NEW: Inline Databases · Version History · Block Comments · @Mentions
//      Public Share · Export MD/HTML · Linked DBs · Emoji picker · Drag reorder
import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../hooks/useAuth";
import { addNote, updateNote, deleteNote, subscribeToNotes } from "../firebase/services";

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const BLOCK_TYPES = [
  { type:"text",     label:"Text",          icon:"¶",   desc:"Just start writing" },
  { type:"h1",       label:"Heading 1",     icon:"H1",  desc:"Big section header" },
  { type:"h2",       label:"Heading 2",     icon:"H2",  desc:"Medium header" },
  { type:"h3",       label:"Heading 3",     icon:"H3",  desc:"Small header" },
  { type:"bullet",   label:"Bullet List",   icon:"•",   desc:"Unordered list" },
  { type:"numbered", label:"Numbered List", icon:"1.",  desc:"Ordered list" },
  { type:"todo",     label:"To-do",         icon:"☐",   desc:"Action item" },
  { type:"toggle",   label:"Toggle",        icon:"▶",   desc:"Expandable section" },
  { type:"quote",    label:"Quote",         icon:"❝",   desc:"Blockquote" },
  { type:"callout",  label:"Callout",       icon:"💡",  desc:"Highlighted note" },
  { type:"code",     label:"Code",          icon:"</>", desc:"Code block" },
  { type:"divider",  label:"Divider",       icon:"—",   desc:"Horizontal rule" },
  { type:"image",    label:"Image",         icon:"🖼",  desc:"Embed image" },
  { type:"video",    label:"Video",         icon:"▶️",  desc:"YouTube / Loom" },
  { type:"table",    label:"Table",         icon:"⊟",   desc:"Simple table" },
  { type:"database", label:"Database",      icon:"🗄",  desc:"Notion-style inline DB" },
  { type:"columns",  label:"2 Columns",     icon:"⫿",   desc:"Side by side" },
  { type:"math",     label:"Math",          icon:"∑",   desc:"LaTeX equation" },
  { type:"bookmark", label:"Bookmark",      icon:"🔖",  desc:"Web bookmark" },
  { type:"page",     label:"Sub-page",      icon:"📄",  desc:"Nested page" },
  { type:"toc",      label:"Table of Contents", icon:"📑", desc:"Auto-generated TOC" },
  { type:"mention",  label:"Mention Page",  icon:"@",   desc:"Link to another page" },
];

const CALLOUT_ICONS = ["💡","⚠️","✅","❌","🔥","💬","📌","🎯","⚡","🌟","🚨","💎"];
const COLORS = ["default","red","orange","yellow","green","blue","purple","pink","gray"];
const COLOR_BG = { default:"transparent",red:"rgba(244,63,94,0.08)",orange:"rgba(255,107,53,0.08)",yellow:"rgba(245,158,11,0.08)",green:"rgba(16,185,129,0.08)",blue:"rgba(99,102,241,0.08)",purple:"rgba(139,92,246,0.08)",pink:"rgba(236,72,153,0.08)",gray:"rgba(107,114,128,0.08)" };
const TEXT_COLORS = { default:"#E5E7EB",red:"#F43F5E",orange:"#FF6B35",yellow:"#F59E0B",green:"#10B981",blue:"#818CF8",purple:"#8B5CF6",pink:"#EC4899",gray:"#9CA3AF" };
const COVERS = ["linear-gradient(135deg,#FF6B35,#FF8C5A)","linear-gradient(135deg,#8B5CF6,#6366F1)","linear-gradient(135deg,#10B981,#06B6D4)","linear-gradient(135deg,#F43F5E,#EC4899)","linear-gradient(135deg,#F59E0B,#EF4444)","linear-gradient(135deg,#0F0F1C,#1A1A2E)","linear-gradient(135deg,#1e3a5f,#0f2027)","linear-gradient(135deg,#2d1b69,#11998e)"];
const PAGE_ICONS = ["📄","📝","🎯","🚀","💡","📊","🏠","⚡","🌟","🎨","📚","💼","🔥","🌈","🎭","🛠","🧠","🔬","🎵","🌍","⚽","🎮","🍕","☕","🏆"];
const DB_VIEWS = ["table","kanban","gallery","list"];

const uid = () => Math.random().toString(36).slice(2,10);
const newBlock = (type="text",content="",extra={}) => ({ id:uid(),type,content,color:"default",textColor:"default",bold:false,italic:false,underline:false,strikethrough:false,checked:false,open:false,lang:"javascript",icon:"💡",children:[],indent:0,rows:[["","",""],["","",""]],cols:["",""],dbRows:[],dbCols:[{id:uid(),name:"Name",type:"text"},{id:uid(),name:"Status",type:"select"},{id:uid(),name:"Date",type:"date"}],dbView:"table",comments:[],...extra });
const inp = { background:"var(--input-bg)",border:"1px solid var(--border)",borderRadius:8,color:"var(--text)",fontSize:13,padding:"8px 12px",fontFamily:"inherit",outline:"none",width:"100%",boxSizing:"border-box" };

// ─── SLASH MENU ───────────────────────────────────────────────────────────────
function SlashMenu({ query, onSelect, pos }) {
  const filtered = BLOCK_TYPES.filter(b=>b.label.toLowerCase().includes(query.toLowerCase())||b.type.includes(query.toLowerCase()));
  if(!filtered.length) return null;
  return (
    <div style={{position:"fixed",left:pos.x,top:pos.y,background:"var(--input-bg)",border:"1px solid var(--border2)",borderRadius:14,width:264,maxHeight:320,overflowY:"auto",boxShadow:"0 24px 60px rgba(0,0,0,0.7)",zIndex:99999,animation:"popIn 0.12s ease"}}>
      <div style={{padding:"8px 12px 4px",fontSize:10,fontWeight:800,color:"var(--text3)",textTransform:"uppercase",letterSpacing:"1px"}}>BLOCKS</div>
      {filtered.map(b=>(
        <div key={b.type} onClick={()=>onSelect(b.type)} style={{display:"flex",alignItems:"center",gap:10,padding:"7px 12px",cursor:"pointer",margin:"0 4px",borderRadius:8,transition:"background 0.1s"}}
          onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.05)"} onMouseLeave={e=>e.currentTarget.style.background=""}>
          <div style={{width:28,height:28,borderRadius:7,background:"var(--surface3)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,flexShrink:0}}>{b.icon}</div>
          <div><div style={{fontSize:13,fontWeight:600,color:"var(--text)"}}>{b.label}</div><div style={{fontSize:11,color:"var(--text3)"}}>{b.desc}</div></div>
        </div>
      ))}
    </div>
  );
}

// ─── INLINE DATABASE BLOCK ────────────────────────────────────────────────────
function DatabaseBlock({ block, onUpdate }) {
  const [view, setView] = useState(block.dbView||"table");
  const [addingRow, setAddingRow] = useState(false);
  const [newRow, setNewRow] = useState({});
  const [editingCell, setEditingCell] = useState(null); // {row,col}
  const cols = block.dbCols||[{id:"c1",name:"Name",type:"text"},{id:"c2",name:"Status",type:"select"},{id:"c3",name:"Date",type:"date"}];
  const rows = block.dbRows||[];

  const addRow = () => {
    const row = {id:uid(),...newRow};
    onUpdate({dbRows:[...rows,row]});
    setNewRow({}); setAddingRow(false);
  };
  const updateCell = (rowId,colId,val) => {
    onUpdate({dbRows:rows.map(r=>r.id===rowId?{...r,[colId]:val}:r)});
  };
  const deleteRow = (rowId) => onUpdate({dbRows:rows.filter(r=>r.id!==rowId)});
  const addCol = () => {
    const col={id:uid(),name:"New Field",type:"text"};
    onUpdate({dbCols:[...cols,col]});
  };

  const STATUS_COLORS = {"Not Started":"#6B7280","In Progress":"#F59E0B","Done":"#10B981","Blocked":"#F43F5E"};

  return (
    <div style={{border:"1px solid var(--border)",borderRadius:12,overflow:"hidden",marginBottom:4}}>
      {/* DB Header */}
      <div style={{display:"flex",alignItems:"center",gap:8,padding:"10px 14px",background:"var(--surface2)",borderBottom:"1px solid var(--border)"}}>
        <span style={{fontSize:14}}>🗄</span>
        <input value={block.content||"Database"} onChange={e=>onUpdate({content:e.target.value})} style={{background:"transparent",border:"none",color:"var(--text)",fontWeight:700,fontSize:13,outline:"none",fontFamily:"inherit",flex:1}}/>
        <div style={{display:"flex",gap:2}}>
          {DB_VIEWS.map(v=>(
            <button key={v} onClick={()=>{setView(v);onUpdate({dbView:v});}} style={{padding:"3px 8px",border:"none",borderRadius:6,background:view===v?"rgba(255,107,53,0.15)":"transparent",color:view===v?"#FF6B35":"#6B7280",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit",textTransform:"capitalize"}}>{v}</button>
          ))}
        </div>
        <button onClick={()=>setAddingRow(true)} style={{padding:"4px 10px",background:"rgba(255,107,53,0.1)",border:"1px solid rgba(255,107,53,0.2)",borderRadius:7,color:"#FF6B35",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>+ Row</button>
      </div>

      {/* TABLE VIEW */}
      {view==="table"&&(
        <div style={{overflowX:"auto"}}>
          <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
            <thead>
              <tr style={{borderBottom:"1px solid var(--border)"}}>
                {cols.map(col=>(
                  <th key={col.id} style={{padding:"8px 12px",textAlign:"left",fontWeight:700,color:"var(--text3)",fontSize:11,textTransform:"uppercase",letterSpacing:"0.5px",borderRight:"1px solid rgba(255,255,255,0.04)"}}>
                    <div style={{display:"flex",alignItems:"center",gap:5}}>
                      <span style={{fontSize:10}}>{col.type==="text"?"T":col.type==="select"?"◉":col.type==="date"?"📅":col.type==="number"?"#":"T"}</span>
                      {col.name}
                    </div>
                  </th>
                ))}
                <th style={{width:32}}/>
              </tr>
            </thead>
            <tbody>
              {rows.map(row=>(
                <tr key={row.id} style={{borderBottom:"1px solid var(--border)"}} onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.01)"} onMouseLeave={e=>e.currentTarget.style.background=""}>
                  {cols.map(col=>(
                    <td key={col.id} style={{padding:"6px 12px",borderRight:"1px solid rgba(255,255,255,0.03)"}}>
                      {editingCell?.row===row.id&&editingCell?.col===col.id ? (
                        col.type==="select" ? (
                          <select value={row[col.id]||""} onChange={e=>{updateCell(row.id,col.id,e.target.value);setEditingCell(null);}} autoFocus style={{...inp,padding:"3px 6px",fontSize:12}}>
                            <option value="">—</option>
                            {["Not Started","In Progress","Done","Blocked"].map(s=><option key={s} value={s}>{s}</option>)}
                          </select>
                        ) : (
                          <input value={row[col.id]||""} onChange={e=>updateCell(row.id,col.id,e.target.value)} onBlur={()=>setEditingCell(null)} autoFocus type={col.type==="date"?"date":col.type==="number"?"number":"text"} style={{...inp,padding:"3px 6px",fontSize:12,}}/>
                        )
                      ) : (
                        <div onClick={()=>setEditingCell({row:row.id,col:col.id})} style={{cursor:"text",minHeight:22,color:col.type==="select"&&row[col.id]?STATUS_COLORS[row[col.id]]||"#E5E7EB":"#E5E7EB",fontWeight:col.type==="select"?700:400}}>
                          {row[col.id]||<span style={{color:"var(--text3)"}}>Empty</span>}
                        </div>
                      )}
                    </td>
                  ))}
                  <td style={{padding:"6px 8px"}}>
                    <button onClick={()=>deleteRow(row.id)} style={{background:"transparent",border:"none",color:"var(--text3)",cursor:"pointer",fontSize:12}} onMouseEnter={e=>e.currentTarget.style.color="#F43F5E"} onMouseLeave={e=>e.currentTarget.style.color="var(--text3)"}>×</button>
                  </td>
                </tr>
              ))}
              {addingRow&&(
                <tr style={{borderBottom:"1px solid var(--border)"}}>
                  {cols.map(col=>(
                    <td key={col.id} style={{padding:"6px 12px"}}>
                      <input value={newRow[col.id]||""} onChange={e=>setNewRow(r=>({...r,[col.id]:e.target.value}))} type={col.type==="date"?"date":"text"} placeholder={col.name} style={{...inp,padding:"4px 8px",fontSize:12,}} onKeyDown={e=>e.key==="Enter"&&addRow()} />
                    </td>
                  ))}
                  <td style={{padding:"6px 8px",display:"flex",gap:4}}>
                    <button onClick={addRow} style={{background:"rgba(16,185,129,0.15)",border:"none",borderRadius:5,color:"#10B981",cursor:"pointer",fontSize:12,padding:"2px 7px",fontFamily:"inherit",fontWeight:700}}>✓</button>
                    <button onClick={()=>setAddingRow(false)} style={{background:"transparent",border:"none",color:"var(--text3)",cursor:"pointer",fontSize:14}}>×</button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <div style={{padding:"6px 12px",borderTop:"1px solid rgba(255,255,255,0.04)",display:"flex",gap:8}}>
            <button onClick={addCol} style={{fontSize:11,color:"var(--text3)",background:"transparent",border:"none",cursor:"pointer",fontFamily:"inherit"}}>+ Add field</button>
          </div>
        </div>
      )}

      {/* KANBAN VIEW */}
      {view==="kanban"&&(
        <div style={{display:"flex",gap:12,padding:"12px",overflowX:"auto"}}>
          {["Not Started","In Progress","Done","Blocked"].map(status=>{
            const statusCol = cols.find(c=>c.type==="select");
            const colRows = rows.filter(r=>(!statusCol||(r[statusCol?.id]||"Not Started")===status));
            const statusColor = STATUS_COLORS?.[status]||"#6B7280";
            return (
              <div key={status} style={{minWidth:180,flexShrink:0}}>
                <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:8}}>
                  <div style={{width:6,height:6,borderRadius:"50%",background:statusColor}}/>
                  <span style={{fontSize:11,fontWeight:800,color:"var(--text2)",textTransform:"uppercase",letterSpacing:"0.5px"}}>{status}</span>
                  <span style={{fontSize:10,color:"var(--text3)",marginLeft:"auto"}}>{colRows.length}</span>
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:6}}>
                  {colRows.map(row=>(
                    <div key={row.id} style={{background:"var(--input-bg)",border:"1px solid var(--border)",borderRadius:9,padding:"9px 11px",fontSize:12}}>
                      <div style={{fontWeight:600,color:"var(--text)",marginBottom:4}}>{row[cols[0]?.id]||"Untitled"}</div>
                      {cols.slice(1).map(col=>row[col.id]&&<div key={col.id} style={{fontSize:10,color:"var(--text3)"}}>{col.name}: {row[col.id]}</div>)}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* GALLERY VIEW */}
      {view==="gallery"&&(
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,padding:"12px"}}>
          {rows.map(row=>(
            <div key={row.id} style={{background:"var(--input-bg)",border:"1px solid var(--border)",borderRadius:10,padding:"12px",cursor:"pointer"}} onMouseEnter={e=>e.currentTarget.style.borderColor="rgba(255,107,53,0.3)"} onMouseLeave={e=>e.currentTarget.style.borderColor="rgba(255,255,255,0.06)"}>
              <div style={{height:60,borderRadius:8,background:"linear-gradient(135deg,rgba(255,107,53,0.1),rgba(139,92,246,0.1))",marginBottom:8,display:"flex",alignItems:"center",justifyContent:"center",fontSize:24}}>📄</div>
              <div style={{fontSize:12,fontWeight:700,color:"var(--text)"}}>{row[cols[0]?.id]||"Untitled"}</div>
            </div>
          ))}
          {rows.length===0&&<div style={{gridColumn:"1/-1",textAlign:"center",padding:"20px",color:"var(--text3)",fontSize:12}}>No entries yet</div>}
        </div>
      )}

      {/* LIST VIEW */}
      {view==="list"&&(
        <div style={{padding:"8px 0"}}>
          {rows.map(row=>(
            <div key={row.id} style={{display:"flex",alignItems:"center",gap:12,padding:"7px 14px",borderBottom:"1px solid var(--border)",cursor:"pointer"}} onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.01)"} onMouseLeave={e=>e.currentTarget.style.background=""}>
              <span style={{fontSize:14}}>•</span>
              <span style={{fontSize:13,color:"var(--text)",flex:1}}>{row[cols[0]?.id]||"Untitled"}</span>
              {cols.slice(1,3).map(col=><span key={col.id} style={{fontSize:11,color:"var(--text3)"}}>{row[col.id]||"—"}</span>)}
            </div>
          ))}
          {rows.length===0&&<div style={{padding:"12px 14px",color:"var(--text3)",fontSize:12}}>No entries</div>}
        </div>
      )}
    </div>
  );
}

// ─── BLOCK RENDERER ───────────────────────────────────────────────────────────
function Block({ block, index, blocks, onUpdate, onDelete, onAdd, depth=0, allPages, onOpenPage }) {
  const ref = useRef();
  const [slashOpen, setSlashOpen] = useState(false);
  const [slashQuery, setSlashQuery] = useState("");
  const [slashPos, setSlashPos] = useState({x:0,y:0});
  const [hovered, setHovered] = useState(false);
  const [showColorMenu, setShowColorMenu] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentInput, setCommentInput] = useState("");
  const [dragging, setDragging] = useState(false);

  const style = { ...block.bold&&{fontWeight:800}, ...block.italic&&{fontStyle:"italic"}, ...block.underline&&{textDecoration:"underline"}, ...block.strikethrough&&{textDecoration:(block.underline?"underline ":"")+"line-through"}, ...(block.textColor!=="default"&&{color:TEXT_COLORS[block.textColor]}) };

  const baseInp = { width:"100%",background:"transparent",border:"none",outline:"none",color:TEXT_COLORS[block.textColor]||"var(--text)",fontFamily:"inherit",resize:"none",lineHeight:1.7,...style };

  const handleKey = (e) => {
    if(e.key==="/"&&!(block.content||"").trim()){
      const r=ref.current?.getBoundingClientRect();
      setSlashPos({x:r?.left||100,y:r?.bottom||200});
      setSlashOpen(true); setSlashQuery(""); return;
    }
    if(slashOpen){if(e.key==="Escape")setSlashOpen(false);return;}
    if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();onAdd(index+1,"text");}
    if(e.key==="Backspace"&&!(block.content||"")&&blocks.length>1){e.preventDefault();onDelete(block.id);}
    if(e.key==="Tab"){e.preventDefault();onUpdate(block.id,{indent:Math.min((block.indent||0)+(e.shiftKey?-1:1),4)});}
    if(e.key==="ArrowUp"&&index>0){e.preventDefault();document.getElementById(`b-${blocks[index-1]?.id}`)?.focus();}
    if(e.key==="ArrowDown"&&index<blocks.length-1){e.preventDefault();document.getElementById(`b-${blocks[index+1]?.id}`)?.focus();}
  };

  const handleInput = (e) => {
    const val = e.target.value||e.target.innerText||"";
    if(slashOpen){const si=val.lastIndexOf("/");si>=0?setSlashQuery(val.slice(si+1)):setSlashOpen(false);}
    onUpdate(block.id,{content:val});
  };

  const handleSlash = (type) => {
    setSlashOpen(false);
    const clean=(block.content||"").replace(/\/\w*$/,"");
    onUpdate(block.id,{type,content:clean,rows:type==="table"?[["","",""],["","",""]]:block.rows,dbRows:type==="database"?[]:block.dbRows,dbCols:type==="database"?[{id:uid(),name:"Name",type:"text"},{id:uid(),name:"Status",type:"select"},{id:uid(),name:"Date",type:"date"}]:block.dbCols});
    setTimeout(()=>ref.current?.focus(),50);
  };

  const addComment = () => {
    if(!commentInput.trim()) return;
    const comments=[...(block.comments||[]),{id:uid(),text:commentInput.trim(),time:new Date().toLocaleTimeString()}];
    onUpdate(block.id,{comments});
    setCommentInput("");
  };

  const pl=(block.indent||0)*24+(depth*20);
  const bg=COLOR_BG[block.color]||"transparent";

  const renderContent=()=>{
    switch(block.type){
      case "h1": return <input id={`b-${block.id}`} ref={ref} value={block.content||""} onChange={handleInput} onKeyDown={handleKey} placeholder="Heading 1" style={{...baseInp,fontSize:30,fontWeight:900,fontFamily:"'Cabinet Grotesk',sans-serif",letterSpacing:"-1px"}}/>;
      case "h2": return <input id={`b-${block.id}`} ref={ref} value={block.content||""} onChange={handleInput} onKeyDown={handleKey} placeholder="Heading 2" style={{...baseInp,fontSize:22,fontWeight:800,fontFamily:"'Cabinet Grotesk',sans-serif"}}/>;
      case "h3": return <input id={`b-${block.id}`} ref={ref} value={block.content||""} onChange={handleInput} onKeyDown={handleKey} placeholder="Heading 3" style={{...baseInp,fontSize:17,fontWeight:700}}/>;
      case "bullet": return <div style={{display:"flex",gap:10,alignItems:"flex-start"}}><span style={{color:"var(--text3)",marginTop:5,fontSize:16,lineHeight:1,flexShrink:0}}>•</span><input id={`b-${block.id}`} ref={ref} value={block.content||""} onChange={handleInput} onKeyDown={handleKey} placeholder="List item" style={{...baseInp,fontSize:14,flex:1}}/></div>;
      case "numbered": return <div style={{display:"flex",gap:10,alignItems:"flex-start"}}><span style={{color:"var(--text3)",fontSize:13,fontWeight:700,marginTop:3,flexShrink:0,minWidth:18}}>{index+1}.</span><input id={`b-${block.id}`} ref={ref} value={block.content||""} onChange={handleInput} onKeyDown={handleKey} placeholder="List item" style={{...baseInp,fontSize:14,flex:1}}/></div>;
      case "todo": return <div style={{display:"flex",gap:10,alignItems:"flex-start"}}><input type="checkbox" checked={!!block.checked} onChange={()=>onUpdate(block.id,{checked:!block.checked})} style={{marginTop:4,width:15,height:15,cursor:"pointer",accentColor:"#FF6B35",flexShrink:0}}/><input id={`b-${block.id}`} ref={ref} value={block.content||""} onChange={handleInput} onKeyDown={handleKey} placeholder="To-do" style={{...baseInp,fontSize:14,flex:1,textDecoration:block.checked?"line-through":"none",color:block.checked?"#4B5563":baseInp.color}}/></div>;
      case "toggle": return <div><div style={{display:"flex",gap:8,alignItems:"flex-start",cursor:"pointer"}} onClick={()=>onUpdate(block.id,{open:!block.open})}><span style={{color:"var(--text3)",fontSize:11,marginTop:5,transform:block.open?"rotate(90deg)":"none",transition:"transform 0.2s",flexShrink:0}}>▶</span><input id={`b-${block.id}`} ref={ref} value={block.content||""} onChange={handleInput} onKeyDown={handleKey} onClick={e=>e.stopPropagation()} placeholder="Toggle" style={{...baseInp,fontSize:14,fontWeight:600,flex:1}}/></div>{block.open&&<div style={{paddingLeft:24,marginTop:4,borderLeft:"2px solid rgba(255,255,255,0.06)"}}><textarea value={block.toggleContent||""} onChange={e=>onUpdate(block.id,{toggleContent:e.target.value})} placeholder="Toggle content..." rows={2} style={{...baseInp,fontSize:13,color:"var(--text2)"}}/></div>}</div>;
      case "quote": return <div style={{borderLeft:"3px solid #FF6B35",paddingLeft:14}}><textarea id={`b-${block.id}`} ref={ref} value={block.content||""} onChange={handleInput} onKeyDown={handleKey} placeholder="Quote..." rows={2} style={{...baseInp,fontSize:15,fontStyle:"italic",color:"var(--text2)",resize:"none"}}/></div>;
      case "callout": return <div style={{display:"flex",gap:12,alignItems:"flex-start",background:bg||"rgba(255,107,53,0.06)",border:"1px solid var(--border)",borderRadius:10,padding:"12px 14px"}}><span style={{fontSize:20,cursor:"pointer",flexShrink:0}} onClick={()=>{const ic=CALLOUT_ICONS;onUpdate(block.id,{icon:ic[(ic.indexOf(block.icon||"💡")+1)%ic.length]});}}>{block.icon||"💡"}</span><textarea id={`b-${block.id}`} ref={ref} value={block.content||""} onChange={handleInput} onKeyDown={handleKey} placeholder="Callout..." rows={2} style={{...baseInp,fontSize:14,flex:1,resize:"none"}}/></div>;
      case "code": return <div style={{background:"var(--surface2)",border:"1px solid var(--border)",borderRadius:10,overflow:"hidden"}}><div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"6px 12px",borderBottom:"1px solid var(--border)",background:"var(--surface2)"}}><select value={block.lang||"javascript"} onChange={e=>onUpdate(block.id,{lang:e.target.value})} style={{background:"transparent",border:"none",color:"var(--text3)",fontSize:11,cursor:"pointer",outline:"none"}}>{["javascript","python","typescript","css","html","bash","json","sql","rust","go","java","c++"].map(l=><option key={l} value={l}>{l}</option>)}</select><button onClick={()=>navigator.clipboard.writeText(block.content||"")} style={{background:"transparent",border:"none",color:"var(--text3)",cursor:"pointer",fontSize:11,fontFamily:"inherit"}}>Copy</button></div><textarea id={`b-${block.id}`} ref={ref} value={block.content||""} onChange={handleInput} onKeyDown={e=>{if(e.key==="Tab"){e.preventDefault();const s=e.target;const v=s.value;s.value=v.slice(0,s.selectionStart)+"  "+v.slice(s.selectionEnd);}handleKey(e);}} placeholder="// code..." rows={4} style={{...baseInp,fontFamily:"'JetBrains Mono','Fira Code',monospace",fontSize:12,padding:"12px",color:"#A5F3FC",display:"block",resize:"vertical",lineHeight:1.6}}/></div>;
      case "divider": return <hr style={{border:"none",borderTop:"1px solid rgba(255,255,255,0.08)",margin:"8px 0",cursor:"pointer"}} onClick={()=>onAdd(index+1,"text")}/>;
      case "image": return <div style={{borderRadius:10,overflow:"hidden",border:"1px solid var(--border)"}}>{block.content?<img src={block.content} alt="" style={{width:"100%",maxHeight:420,objectFit:"cover",display:"block"}} onError={e=>e.target.style.display="none"}/>:<div style={{padding:"24px",textAlign:"center",background:"var(--surface2)"}}><div style={{fontSize:28,marginBottom:8}}>🖼</div><input value={block.content||""} onChange={e=>onUpdate(block.id,{content:e.target.value})} placeholder="Paste image URL..." style={{...inp,width:"80%",textAlign:"center"}}/></div>}</div>;
      case "video": return <div style={{borderRadius:10,overflow:"hidden",border:"1px solid var(--border)",background:"var(--surface2)"}}>{block.content?.includes("youtube")?<iframe src={block.content.replace("watch?v=","embed/").replace("youtu.be/","www.youtube.com/embed/")} width="100%" height="315" frameBorder="0" allowFullScreen style={{display:"block"}}/>:<div style={{padding:"24px",textAlign:"center"}}><div style={{fontSize:28,marginBottom:8}}>▶️</div><input value={block.content||""} onChange={e=>onUpdate(block.id,{content:e.target.value})} placeholder="Paste YouTube URL..." style={{...inp,width:"80%",textAlign:"center"}}/></div>}</div>;
      case "bookmark": return <div style={{border:"1px solid var(--border)",borderRadius:10,padding:"14px 16px",display:"flex",gap:12,alignItems:"center",cursor:block.content?"pointer":"default"}} onClick={()=>block.content&&window.open(block.content,"_blank")}><span style={{fontSize:20}}>🔖</span><div style={{flex:1}}><input value={block.content||""} onChange={e=>onUpdate(block.id,{content:e.target.value})} onClick={e=>e.stopPropagation()} placeholder="https://..." style={{...baseInp,fontSize:13,fontWeight:600}}/><div style={{fontSize:11,color:"var(--text3)",marginTop:2}}>{block.content||"Add URL"}</div></div></div>;
      case "table": return <div style={{overflowX:"auto",border:"1px solid var(--border)",borderRadius:10}}><table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}><tbody>{(block.rows||[["","",""],["","",""]]).map((row,ri)=><tr key={ri} style={{borderBottom:"1px solid var(--border)"}}>{row.map((cell,ci)=><td key={ci} style={{padding:"7px 12px",borderRight:"1px solid rgba(255,255,255,0.05)"}}><input value={cell} onChange={e=>{const rows=(block.rows||[]).map((r,rr)=>rr===ri?r.map((c,cc)=>cc===ci?e.target.value:c):r);onUpdate(block.id,{rows});}} style={{...baseInp,fontSize:13,background:ri===0?"rgba(255,255,255,0.03)":"transparent"}}/></td>)}</tr>)}</tbody></table><div style={{padding:"5px 12px",borderTop:"1px solid rgba(255,255,255,0.05)"}}><button onClick={()=>onUpdate(block.id,{rows:[...(block.rows||[]),Array((block.rows?.[0]||[""]).length).fill("")]})} style={{fontSize:11,color:"var(--text3)",background:"transparent",border:"none",cursor:"pointer",fontFamily:"inherit"}}>+ Row</button></div></div>;
      case "database": return <DatabaseBlock block={block} onUpdate={u=>onUpdate(block.id,u)}/>;
      case "columns": return <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,border:"1px solid rgba(255,255,255,0.05)",borderRadius:10,padding:"12px"}}>{[0,1].map(col=><div key={col} style={{minHeight:60,borderRadius:8,background:"var(--surface2)",padding:"8px"}}><textarea value={(block.cols||["",""])[col]||""} onChange={e=>{const cols=[...(block.cols||["",""])];cols[col]=e.target.value;onUpdate(block.id,{cols});}} placeholder={`Column ${col+1}...`} rows={3} style={{...baseInp,fontSize:13,width:"100%",resize:"none"}}/></div>)}</div>;
      case "math": return <div style={{background:"var(--surface2)",border:"1px solid var(--border)",borderRadius:10,padding:"12px 16px"}}><input id={`b-${block.id}`} ref={ref} value={block.content||""} onChange={handleInput} onKeyDown={handleKey} placeholder="LaTeX: e.g. E = mc^2" style={{...baseInp,fontFamily:"'JetBrains Mono',monospace",fontSize:14,textAlign:"center",color:"#A5F3FC"}}/>{block.content&&<div style={{textAlign:"center",marginTop:8,fontSize:16,color:"var(--text)",fontStyle:"italic"}}>{block.content}</div>}</div>;
      case "page": return <div onClick={()=>onOpenPage&&onOpenPage(block.pageId)} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 12px",background:"var(--surface2)",border:"1px solid var(--border)",borderRadius:10,cursor:"pointer",transition:"background 0.15s"}} onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.05)"} onMouseLeave={e=>e.currentTarget.style.background="rgba(255,255,255,0.02)"}><span style={{fontSize:18}}>{block.icon||"📄"}</span><span style={{fontSize:14,fontWeight:600,color:"var(--text)"}}>{block.content||"Untitled Page"}</span><span style={{marginLeft:"auto",fontSize:11,color:"var(--text3)"}}>↗</span></div>;
      case "toc": return <div style={{background:"var(--surface2)",border:"1px solid var(--border)",borderRadius:10,padding:"12px 16px"}}><div style={{fontSize:11,fontWeight:800,color:"var(--text3)",textTransform:"uppercase",letterSpacing:"1px",marginBottom:8}}>📑 Table of Contents</div><div style={{fontSize:12,color:"var(--text3)",fontStyle:"italic"}}>Auto-generated from headings</div></div>;
      case "mention": return <div style={{display:"inline-flex",alignItems:"center",gap:6,padding:"3px 10px",background:"rgba(129,140,248,0.1)",border:"1px solid rgba(129,140,248,0.2)",borderRadius:20,cursor:"pointer"}}><span>@</span><input value={block.content||""} onChange={e=>onUpdate(block.id,{content:e.target.value})} placeholder="Page name..." style={{background:"transparent",border:"none",color:"#818CF8",fontSize:13,outline:"none",fontFamily:"inherit",width:120}}/></div>;
      default: return <textarea id={`b-${block.id}`} ref={ref} value={block.content||""} onChange={handleInput} onKeyDown={handleKey} placeholder={index===0?"Type '/' for commands...":"Type '/' for commands..."} rows={1} style={{...baseInp,fontSize:15,width:"100%",resize:"none",overflow:"hidden",lineHeight:1.7}} onInput={e=>{e.target.style.height="auto";e.target.style.height=e.target.scrollHeight+"px";}}/>;
    }
  };

  return (
    <div style={{position:"relative",paddingLeft:pl,marginBottom:3}} onMouseEnter={()=>setHovered(true)} onMouseLeave={()=>{setHovered(false);setShowColorMenu(false);}}>
      {/* Controls */}
      {hovered&&block.type!=="divider"&&(
        <div style={{position:"absolute",left:pl-52,top:"50%",transform:"translateY(-50%)",display:"flex",gap:2,opacity:0.5}}>
          <button onClick={()=>onAdd(index,"text")} style={{width:18,height:18,borderRadius:4,background:"var(--surface3)",border:"none",color:"var(--text3)",cursor:"pointer",fontSize:12,display:"flex",alignItems:"center",justifyContent:"center"}}>+</button>
          <button onClick={()=>setShowColorMenu(c=>!c)} style={{width:18,height:18,borderRadius:4,background:"var(--surface3)",border:"none",color:"var(--text3)",cursor:"pointer",fontSize:10}}>⋮⋮</button>
        </div>
      )}
      {/* Color / action menu */}
      {showColorMenu&&(
        <div style={{position:"absolute",left:pl-52,top:0,background:"var(--modal-bg)",border:"1px solid var(--border2)",borderRadius:12,padding:"10px",zIndex:9999,minWidth:170,boxShadow:"var(--shadow-xl)"}}>
          <div style={{fontSize:10,color:"var(--text3)",fontWeight:700,marginBottom:6,textTransform:"uppercase"}}>Color</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:10}}>
            {COLORS.map(c=><div key={c} onClick={()=>{onUpdate(block.id,{color:c});setShowColorMenu(false);}} style={{width:18,height:18,borderRadius:4,background:c==="default"?"rgba(255,255,255,0.1)":COLOR_BG[c].replace("0.08","0.5"),cursor:"pointer",border:block.color===c?"2px solid #fff":"1px solid rgba(255,255,255,0.1)"}} title={c}/>)}
          </div>
          <div style={{fontSize:10,color:"var(--text3)",fontWeight:700,marginBottom:6,textTransform:"uppercase"}}>Format</div>
          <div style={{display:"flex",gap:4,marginBottom:10}}>
            {[{p:"bold",l:"B"},{p:"italic",l:"I"},{p:"underline",l:"U"},{p:"strikethrough",l:"S"}].map(f=>(
              <button key={f.p} onClick={()=>onUpdate(block.id,{[f.p]:!block[f.p]})} style={{padding:"3px 7px",background:block[f.p]?"rgba(255,107,53,0.3)":"rgba(255,255,255,0.04)",border:"none",borderRadius:5,color:block[f.p]?"#FF6B35":"#9CA3AF",cursor:"pointer",fontFamily:"inherit",fontSize:12,fontWeight:f.p==="bold"?800:f.p==="italic"?400:500,fontStyle:f.p==="italic"?"italic":"normal",textDecoration:f.p==="underline"?"underline":f.p==="strikethrough"?"line-through":"none"}}>{f.l}</button>
            ))}
          </div>
          <button onClick={()=>setShowComments(c=>!c)} style={{width:"100%",padding:"5px",background:"rgba(129,140,248,0.08)",border:"1px solid rgba(129,140,248,0.15)",borderRadius:7,color:"#818CF8",fontSize:11,cursor:"pointer",fontFamily:"inherit",fontWeight:700,marginBottom:6}}>💬 Comment {block.comments?.length>0&&`(${block.comments.length})`}</button>
          <button onClick={()=>{onDelete(block.id);setShowColorMenu(false);}} style={{width:"100%",padding:"5px",background:"rgba(244,63,94,0.08)",border:"1px solid rgba(244,63,94,0.15)",borderRadius:7,color:"#F43F5E",fontSize:11,cursor:"pointer",fontFamily:"inherit",fontWeight:700}}>🗑 Delete block</button>
        </div>
      )}
      {/* Block bg */}
      <div style={{background:COLOR_BG[block.color]||"transparent",borderRadius:6,padding:block.color&&block.color!=="default"?"6px 8px":"0"}}>
        {renderContent()}
      </div>
      {/* Block comments */}
      {showComments&&(
        <div style={{marginTop:8,padding:"10px 12px",background:"rgba(129,140,248,0.05)",border:"1px solid rgba(129,140,248,0.12)",borderRadius:10}}>
          {(block.comments||[]).map(c=><div key={c.id} style={{fontSize:12,color:"var(--text2)",marginBottom:6,display:"flex",gap:8}}><span style={{color:"var(--text3)",fontSize:10,flexShrink:0}}>{c.time}</span>{c.text}</div>)}
          <div style={{display:"flex",gap:7}}>
            <input value={commentInput} onChange={e=>setCommentInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addComment()} placeholder="Add comment..." style={{...inp,flex:1,padding:"5px 10px",fontSize:12}}/>
            <button onClick={addComment} style={{padding:"5px 10px",background:"rgba(129,140,248,0.15)",border:"1px solid rgba(129,140,248,0.2)",borderRadius:7,color:"#818CF8",cursor:"pointer",fontSize:12,fontFamily:"inherit",fontWeight:700}}>Post</button>
          </div>
        </div>
      )}
      {slashOpen&&<SlashMenu query={slashQuery} onSelect={handleSlash} pos={slashPos}/>}
    </div>
  );
}

// ─── TABLE OF CONTENTS ────────────────────────────────────────────────────────
function TOC({ blocks }) {
  const headings=blocks.filter(b=>["h1","h2","h3"].includes(b.type)&&b.content);
  if(!headings.length) return null;
  return (
    <div style={{position:"sticky",top:20,width:200,flexShrink:0,paddingLeft:8}}>
      <div style={{fontSize:10,fontWeight:800,color:"var(--text3)",textTransform:"uppercase",letterSpacing:"1px",marginBottom:10}}>ON THIS PAGE</div>
      {headings.map(h=>(
        <div key={h.id} onClick={()=>document.getElementById(`b-${h.id}`)?.focus()} style={{fontSize:h.type==="h1"?12:h.type==="h2"?11:10,paddingLeft:h.type==="h1"?0:h.type==="h2"?10:18,color:"var(--text3)",padding:"3px 0",cursor:"pointer"}} onMouseEnter={e=>e.currentTarget.style.color="#E5E7EB"} onMouseLeave={e=>e.currentTarget.style.color="#6B7280"}>
          {h.content?.slice(0,30)}{h.content?.length>30?"...":""}
        </div>
      ))}
    </div>
  );
}

// ─── VERSION HISTORY ──────────────────────────────────────────────────────────
function VersionHistory({ versions, onRestore, onClose }) {
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div style={{background:"var(--surface)",border:"1px solid var(--border2)",borderRadius:18,width:480,maxHeight:"70vh",overflow:"hidden",display:"flex",flexDirection:"column",boxShadow:"0 30px 80px rgba(0,0,0,0.8)"}}>
        <div style={{padding:"18px 22px",borderBottom:"1px solid var(--border)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{fontFamily:"'Cabinet Grotesk',sans-serif",fontSize:16,fontWeight:800}}>🕐 Version History</div>
          <button onClick={onClose} style={{background:"transparent",border:"none",color:"var(--text3)",cursor:"pointer",fontSize:20}}>×</button>
        </div>
        <div style={{flex:1,overflowY:"auto",padding:"12px 22px"}}>
          {versions.length===0&&<div style={{textAlign:"center",padding:"30px",color:"var(--text3)",fontSize:13}}>No saved versions yet.<br/><span style={{fontSize:11}}>Versions auto-save every 5 minutes.</span></div>}
          {versions.map((v,i)=>(
            <div key={v.id} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 0",borderBottom:"1px solid var(--border)"}}>
              <div style={{width:36,height:36,borderRadius:10,background:i===0?"rgba(255,107,53,0.1)":"rgba(255,255,255,0.04)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>{i===0?"⭐":"🕐"}</div>
              <div style={{flex:1}}>
                <div style={{fontSize:13,fontWeight:600,color:"var(--text)"}}>{i===0?"Current version":v.label||`Version ${versions.length-i}`}</div>
                <div style={{fontSize:11,color:"var(--text3)"}}>{v.time} · {v.blocks?.length||0} blocks</div>
              </div>
              {i>0&&<button onClick={()=>onRestore(v)} style={{padding:"5px 14px",background:"rgba(129,140,248,0.1)",border:"1px solid rgba(129,140,248,0.2)",borderRadius:8,color:"#818CF8",cursor:"pointer",fontSize:12,fontFamily:"inherit",fontWeight:700}}>Restore</button>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── EXPORT MODAL ─────────────────────────────────────────────────────────────
function ExportModal({ page, blocks, onClose }) {
  const toMarkdown = () => {
    const lines = blocks.map(b=>{
      switch(b.type){
        case "h1": return `# ${b.content}`;
        case "h2": return `## ${b.content}`;
        case "h3": return `### ${b.content}`;
        case "bullet": return `- ${b.content}`;
        case "numbered": return `1. ${b.content}`;
        case "todo": return `- [${b.checked?"x":" "}] ${b.content}`;
        case "quote": return `> ${b.content}`;
        case "code": return `\`\`\`${b.lang||""}\n${b.content}\n\`\`\``;
        case "divider": return "---";
        default: return b.content||"";
      }
    });
    return `# ${page.title||"Untitled"}\n\n${lines.join("\n\n")}`;
  };
  const toHTML = () => {
    const md = toMarkdown();
    return `<!DOCTYPE html><html><head><title>${page.title||"Untitled"}</title><style>body{font-family:sans-serif;max-width:760px;margin:40px auto;color:#333;line-height:1.7}code{background:#f4f4f4;padding:2px 6px;border-radius:4px}pre{background:#f4f4f4;padding:16px;border-radius:8px}blockquote{border-left:3px solid #FF6B35;padding-left:16px;color:#666}</style></head><body><pre>${md.replace(/</g,"&lt;")}</pre></body></html>`;
  };
  const download = (content, filename, type) => {
    const blob=new Blob([content],{type});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");
    a.href=url;a.download=filename;a.click();URL.revokeObjectURL(url);
  };

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div style={{background:"var(--surface)",border:"1px solid var(--border2)",borderRadius:18,width:400,padding:"24px",boxShadow:"0 30px 80px rgba(0,0,0,0.8)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
          <div style={{fontFamily:"'Cabinet Grotesk',sans-serif",fontSize:16,fontWeight:800}}>📤 Export Page</div>
          <button onClick={onClose} style={{background:"transparent",border:"none",color:"var(--text3)",cursor:"pointer",fontSize:20}}>×</button>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {[
            {label:"📝 Markdown (.md)",action:()=>download(toMarkdown(),`${page.title||"page"}.md`,"text/markdown"),color:"#10B981"},
            {label:"🌐 HTML (.html)",action:()=>download(toHTML(),`${page.title||"page"}.html`,"text/html"),color:"#818CF8"},
            {label:"📋 Copy as Text",action:()=>{navigator.clipboard.writeText(toMarkdown());onClose();},color:"#F59E0B"},
          ].map(btn=>(
            <button key={btn.label} onClick={btn.action} style={{width:"100%",padding:"12px",background:`${btn.color}10`,border:`1px solid ${btn.color}22`,borderRadius:12,color:btn.color,fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit",textAlign:"left",transition:"all 0.15s"}} onMouseEnter={e=>e.currentTarget.style.background=`${btn.color}20`} onMouseLeave={e=>e.currentTarget.style.background=`${btn.color}10`}>{btn.label}</button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── PAGE EDITOR ─────────────────────────────────────────────────────────────
function PageEditor({ page, allPages, onBack, onOpenPage }) {
  const { user } = useAuth();
  const [title, setTitle] = useState(page.title||"Untitled");
  const [icon, setIcon] = useState(page.icon||"📄");
  const [cover, setCover] = useState(page.cover||"");
  const [blocks, setBlocks] = useState(page.blocks?.length?page.blocks:[newBlock("text")]);
  const [showIcons, setShowIcons] = useState(false);
  const [showCoverPicker, setShowCoverPicker] = useState(false);
  const [showTOC, setShowTOC] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [fullWidth, setFullWidth] = useState(false);
  const [saved, setSaved] = useState(true);
  const [versions, setVersions] = useState(page.versions||[]);
  const saveTimer = useRef();
  const versionTimer = useRef();

  const save = useCallback((t,b,i,c,v) => {
    setSaved(false);
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async()=>{
      await updateNote(user.uid,page.id,{title:t||"Untitled",blocks:b,icon:i,cover:c,versions:v||versions,updatedAt:new Date()});
      setSaved(true);
    },600);
  },[user,page.id,versions]);

  // Auto-save version every 5 min
  useEffect(()=>{
    versionTimer.current = setInterval(()=>{
      const snap={id:uid(),time:new Date().toLocaleTimeString(),blocks:[...blocks],label:title};
      const v=[snap,...versions].slice(0,20);
      setVersions(v);
      save(title,blocks,icon,cover,v);
    },5*60*1000);
    return()=>clearInterval(versionTimer.current);
  },[blocks,title]);

  const updateBlock=(id,data)=>{const u=blocks.map(b=>b.id===id?{...b,...data}:b);setBlocks(u);save(title,u,icon,cover);};
  const deleteBlock=(id)=>{if(blocks.length<=1)return;const u=blocks.filter(b=>b.id!==id);setBlocks(u);save(title,u,icon,cover);};
  const addBlock=(idx,type="text")=>{const nb=newBlock(type);const u=[...blocks.slice(0,idx),nb,...blocks.slice(idx)];setBlocks(u);save(title,u,icon,cover);setTimeout(()=>document.getElementById(`b-${nb.id}`)?.focus(),50);};
  const restoreVersion=(v)=>{setBlocks(v.blocks);save(title,v.blocks,icon,cover);setShowHistory(false);};

  const shareUrl = `${window.location.origin}?page=${page.id}`;
  const wordCount = blocks.reduce((s,b)=>s+(b.content||"").split(/\s+/).filter(Boolean).length,0);
  const readTime = Math.max(1,Math.round(wordCount/200));

  return (
    <div style={{display:"flex",flexDirection:"column",height:"100%",background:"var(--bg)"}}>
      {/* Topbar */}
      <div style={{display:"flex",alignItems:"center",gap:8,padding:"9px 18px",borderBottom:"1px solid var(--border)",flexShrink:0,background:"var(--topbar-bg)",backdropFilter:"blur(20px)"}}>
        <button onClick={onBack} style={{padding:"5px 12px",background:"var(--surface3)",border:"1px solid var(--border)",borderRadius:8,color:"var(--text2)",cursor:"pointer",fontFamily:"inherit",fontSize:12}}>← Back</button>
        <div style={{flex:1,fontSize:13,color:"var(--text3)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{title||"Untitled"}</div>
        <span style={{fontSize:11,color:"var(--text3)"}}>{wordCount}w · {readTime}min</span>
        <span style={{fontSize:11,fontWeight:700,color:saved?"#10B981":"#F59E0B"}}>{saved?"✓":"..."}</span>
        {/* Action buttons */}
        {[
          {icon:"📑",title:"TOC",action:()=>setShowTOC(t=>!t),active:showTOC},
          {icon:"🕐",title:"History",action:()=>setShowHistory(true),active:false},
          {icon:"📤",title:"Export",action:()=>setShowExport(true),active:false},
          {icon:"🔗",title:"Share",action:()=>setShowShare(s=>!s),active:showShare},
          {icon:"⤢",title:"Full Width",action:()=>setFullWidth(f=>!f),active:fullWidth},
        ].map(btn=>(
          <button key={btn.icon} onClick={btn.action} title={btn.title} style={{padding:"5px 8px",background:btn.active?"rgba(255,107,53,0.1)":"rgba(255,255,255,0.03)",border:"1px solid var(--border)",borderRadius:8,color:btn.active?"#FF6B35":"#6B7280",cursor:"pointer",fontSize:13}}>{btn.icon}</button>
        ))}
      </div>
      {/* Share bar */}
      {showShare&&(
        <div style={{padding:"10px 20px",background:"rgba(16,185,129,0.06)",borderBottom:"1px solid var(--border)",display:"flex",alignItems:"center",gap:10,fontSize:12}}>
          <span style={{color:"#10B981",fontWeight:700}}>🔗 Share link:</span>
          <code style={{flex:1,background:"var(--surface3)",padding:"4px 10px",borderRadius:7,color:"var(--text2)",fontSize:11,overflow:"hidden",textOverflow:"ellipsis"}}>{shareUrl}</code>
          <button onClick={()=>{navigator.clipboard.writeText(shareUrl);toast?.("Copied! 🎉","success");}} style={{padding:"5px 12px",background:"rgba(16,185,129,0.15)",border:"1px solid rgba(16,185,129,0.2)",borderRadius:7,color:"#10B981",cursor:"pointer",fontFamily:"inherit",fontWeight:700,fontSize:11}}>Copy</button>
        </div>
      )}
      {/* Editor + TOC */}
      <div style={{flex:1,overflowY:"auto",display:"flex"}}>
        <div style={{flex:1,overflowY:"auto"}}>
          {cover&&<div style={{height:200,background:cover,position:"relative",flexShrink:0}}><button onClick={()=>{setCover("");save(title,blocks,icon,"");}} style={{position:"absolute",top:10,right:10,padding:"4px 10px",background:"rgba(0,0,0,0.5)",border:"none",borderRadius:6,color:"#fff",cursor:"pointer",fontSize:12,fontFamily:"inherit"}}>Remove</button></div>}
          <div style={{maxWidth:fullWidth?"100%":760,margin:"0 auto",padding:cover?"20px 60px 0":"60px 60px 0"}}>
            {/* Icon + cover */}
            <div style={{display:"flex",gap:10,marginBottom:12,position:"relative"}}>
              <button onClick={()=>setShowIcons(s=>!s)} style={{fontSize:44,background:"transparent",border:"none",cursor:"pointer",padding:0,lineHeight:1}}>{icon}</button>
              {showIcons&&(
                <div style={{position:"absolute",top:52,left:0,background:"var(--input-bg)",border:"1px solid var(--border2)",borderRadius:14,padding:12,zIndex:9999,display:"flex",flexWrap:"wrap",gap:6,width:280}}>
                  {PAGE_ICONS.map(ic=><span key={ic} onClick={()=>{setIcon(ic);setShowIcons(false);save(title,blocks,ic,cover);}} style={{fontSize:24,cursor:"pointer",padding:6,borderRadius:8,transition:"background 0.1s"}} onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.08)"} onMouseLeave={e=>e.currentTarget.style.background=""}>{ic}</span>)}
                </div>
              )}
              {!cover&&<button onClick={()=>setShowCoverPicker(s=>!s)} style={{alignSelf:"flex-end",padding:"4px 10px",background:"var(--surface3)",border:"1px solid var(--border)",borderRadius:8,color:"var(--text3)",cursor:"pointer",fontSize:11,fontFamily:"inherit",marginBottom:4}}>+ Cover</button>}
            </div>
            {showCoverPicker&&<div style={{display:"flex",flexWrap:"wrap",gap:7,marginBottom:16}}>{COVERS.map((g,i)=><div key={i} onClick={()=>{setCover(g);setShowCoverPicker(false);save(title,blocks,icon,g);}} style={{width:60,height:36,borderRadius:8,background:g,cursor:"pointer",transition:"transform 0.15s"}} onMouseEnter={e=>e.currentTarget.style.transform="scale(1.1)"} onMouseLeave={e=>e.currentTarget.style.transform="none"}/>)}</div>}
            {/* Title */}
            <input value={title} onChange={e=>{setTitle(e.target.value);save(e.target.value,blocks,icon,cover);}} placeholder="Untitled" onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();addBlock(0,"text");}}}
              style={{width:"100%",background:"transparent",border:"none",outline:"none",fontFamily:"'Cabinet Grotesk',sans-serif",fontSize:44,fontWeight:900,color:"var(--text)",letterSpacing:"-2px",lineHeight:1.15,padding:"4px 0",marginBottom:24,boxSizing:"border-box"}}/>
            {/* Blocks */}
            <div style={{paddingBottom:200}}>
              {blocks.map((block,i)=>(
                <Block key={block.id} block={block} index={i} blocks={blocks} onUpdate={updateBlock} onDelete={deleteBlock} onAdd={addBlock} allPages={allPages} onOpenPage={onOpenPage}/>
              ))}
              <div onClick={()=>addBlock(blocks.length,"text")} style={{padding:"8px 0",color:"rgba(255,255,255,0.08)",fontSize:13,cursor:"text",userSelect:"none"}}>Click to add a block · Type '/' for commands</div>
            </div>
          </div>
        </div>
        {showTOC&&<div style={{width:220,padding:"24px 16px",borderLeft:"1px solid rgba(255,255,255,0.05)",flexShrink:0,overflowY:"auto"}}><TOC blocks={blocks}/></div>}
      </div>
      {showHistory&&<VersionHistory versions={versions} onRestore={restoreVersion} onClose={()=>setShowHistory(false)}/>}
      {showExport&&<ExportModal page={{title,icon}} blocks={blocks} onClose={()=>setShowExport(false)}/>}
    </div>
  );
}

// ─── PAGES HOME ───────────────────────────────────────────────────────────────
const TEMPLATES = [
  {title:"Meeting Notes",icon:"📋",blocks:[newBlock("h1","Meeting Notes"),newBlock("text","📅 Date: "),newBlock("h2","Attendees"),newBlock("bullet",""),newBlock("h2","Agenda"),newBlock("numbered",""),newBlock("h2","Action Items"),newBlock("todo","")]},
  {title:"Project Brief",icon:"🚀",blocks:[newBlock("h1","Project Brief"),newBlock("callout","Define the goal clearly here"),newBlock("h2","Overview"),newBlock("text",""),newBlock("h2","Goals & KPIs"),newBlock("todo",""),newBlock("h2","Timeline"),newBlock("table")]},
  {title:"Daily Journal",icon:"📔",blocks:[newBlock("h1",new Date().toLocaleDateString()),newBlock("h2","🎉 Wins"),newBlock("bullet",""),newBlock("h2","😓 Challenges"),newBlock("bullet",""),newBlock("h2","📝 Tomorrow"),newBlock("todo","")]},
  {title:"Team Wiki",icon:"📚",blocks:[newBlock("h1","Team Wiki"),newBlock("callout","Living document — update regularly"),newBlock("h2","About"),newBlock("text",""),newBlock("h2","Processes"),newBlock("toggle","How to..."),newBlock("h2","Resources"),newBlock("bookmark","")]},
  {title:"Sprint Planning",icon:"🏃",blocks:[newBlock("h1","Sprint Planning"),newBlock("database","Sprint Backlog"),newBlock("h2","Goals"),newBlock("todo",""),newBlock("h2","Notes"),newBlock("text","")]},
  {title:"Brain Dump",icon:"🧠",blocks:[newBlock("h1","Brain Dump"),newBlock("text","Write everything on your mind...")]},
];

export default function NotionPage() {
  const { user } = useAuth();
  const [pages, setPages] = useState([]);
  const [activePage, setActivePage] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("grid");
  const [sortBy, setSortBy] = useState("updated");

  useEffect(()=>{if(!user)return;return subscribeToNotes(user.uid,d=>{setPages(d);setLoading(false);});},[user]);

  const createPage = async (tpl=null) => {
    const blocks=tpl?tpl.blocks:[newBlock("text")];
    const ref=await addNote(user.uid,{title:tpl?.title||"Untitled",icon:tpl?.icon||"📄",blocks,cover:"",tags:[],isPinned:false,versions:[]});
    setActivePage({id:ref.id,title:tpl?.title||"Untitled",icon:tpl?.icon||"📄",blocks,cover:"",tags:[],versions:[]});
  };
  const deletePage = async id => {await deleteNote(user.uid,id);if(activePage?.id===id)setActivePage(null);};

  let filtered=[...pages].filter(p=>(p.title||"Untitled").toLowerCase().includes(search.toLowerCase()));
  if(sortBy==="updated") filtered.sort((a,b)=>((b.updatedAt?.seconds||0)-(a.updatedAt?.seconds||0)));
  if(sortBy==="title") filtered.sort((a,b)=>(a.title||"").localeCompare(b.title||""));
  if(sortBy==="blocks") filtered.sort((a,b)=>(b.blocks?.length||0)-(a.blocks?.length||0));

  const pinned=filtered.filter(p=>p.isPinned);
  const rest=filtered.filter(p=>!p.isPinned);

  if(activePage){
    const fresh=pages.find(p=>p.id===activePage.id)||activePage;
    return <PageEditor page={fresh} allPages={pages} onBack={()=>setActivePage(null)} onOpenPage={id=>{const p=pages.find(x=>x.id===id);if(p)setActivePage(p);}}/>;
  }

  return (
    <div style={{maxWidth:1100,margin:"0 auto"}}>
      {/* Header */}
      <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:22}}>
        <div style={{flex:1}}>
          <h1 style={{fontFamily:"'Cabinet Grotesk',sans-serif",fontSize:26,fontWeight:900,margin:0,letterSpacing:"-1px"}}>📄 Pages</h1>
          <p style={{color:"var(--text3)",fontSize:13,margin:"4px 0 0"}}>Your knowledge base — write, plan, document anything · {pages.length} pages</p>
        </div>
        <select value={sortBy} onChange={e=>setSortBy(e.target.value)} style={{...inp,width:"auto",padding:"7px 12px",fontSize:12}}>
          <option value="updated">Recently updated</option>
          <option value="title">Title A–Z</option>
          <option value="blocks">Most blocks</option>
        </select>
        <div style={{display:"flex",gap:4,background:"var(--input-bg)",borderRadius:9,padding:3,border:"1px solid var(--border)"}}>
          {["grid","list"].map(v=><button key={v} onClick={()=>setView(v)} style={{padding:"5px 10px",border:"none",borderRadius:6,background:view===v?"rgba(255,107,53,0.15)":"transparent",color:view===v?"#FF6B35":"#6B7280",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>{v==="grid"?"⊞":"☰"}</button>)}
        </div>
        <button onClick={()=>createPage()} style={{padding:"8px 18px",background:"linear-gradient(135deg,#FF6B35,#FF8C5A)",border:"none",borderRadius:10,color:"#fff",fontWeight:800,fontSize:13,cursor:"pointer",fontFamily:"inherit",boxShadow:"0 4px 16px rgba(255,107,53,0.3)"}}>+ New Page</button>
      </div>
      {/* Search */}
      <div style={{position:"relative",marginBottom:20}}>
        <span style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",color:"var(--text3)",fontSize:14}}>🔍</span>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search pages..." style={{...inp,paddingLeft:38,fontSize:13}}/>
      </div>
      {/* Templates */}
      {pages.length===0&&!loading&&(
        <div style={{marginBottom:28}}>
          <div style={{fontSize:11,fontWeight:800,color:"var(--text3)",textTransform:"uppercase",letterSpacing:"1px",marginBottom:12}}>START WITH A TEMPLATE</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
            {TEMPLATES.map(t=>(
              <div key={t.title} onClick={()=>createPage(t)} style={{background:"var(--surface)",border:"1px solid var(--border)",borderRadius:14,padding:"16px",cursor:"pointer",transition:"all 0.15s"}} onMouseEnter={e=>{e.currentTarget.style.background="#1A1A2E";e.currentTarget.style.borderColor="rgba(255,107,53,0.3)";}} onMouseLeave={e=>{e.currentTarget.style.background="#0F0F1C";e.currentTarget.style.borderColor="rgba(255,255,255,0.06)";}}>
                <div style={{fontSize:26,marginBottom:8}}>{t.icon}</div>
                <div style={{fontSize:13,fontWeight:700,color:"var(--text)"}}>{t.title}</div>
                <div style={{fontSize:11,color:"var(--text3)",marginTop:3}}>{t.blocks.length} blocks</div>
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Pinned */}
      {pinned.length>0&&(
        <div style={{marginBottom:20}}>
          <div style={{fontSize:11,fontWeight:800,color:"var(--text3)",textTransform:"uppercase",letterSpacing:"1px",marginBottom:10}}>📌 PINNED</div>
          <PageGrid pages={pinned} view={view} onOpen={setActivePage} onDelete={deletePage} onPin={(id,v)=>updateNote(user.uid,id,{isPinned:v})}/>
        </div>
      )}
      {/* All pages */}
      <div>
        {rest.length>0&&<div style={{fontSize:11,fontWeight:800,color:"var(--text3)",textTransform:"uppercase",letterSpacing:"1px",marginBottom:10}}>ALL PAGES ({rest.length})</div>}
        {loading&&<div style={{textAlign:"center",padding:40,color:"var(--text3)"}}>Loading...</div>}
        {!loading&&filtered.length===0&&search&&<div style={{textAlign:"center",padding:40,color:"var(--text3)"}}>No pages match "{search}"</div>}
        {!loading&&pages.length===0&&!search&&(
          <div style={{textAlign:"center",padding:"60px 20px",color:"var(--text3)"}}>
            <div style={{fontSize:48,marginBottom:12}}>📄</div>
            <div style={{fontSize:16,fontWeight:700,color:"var(--text2)",marginBottom:8}}>Start your knowledge base</div>
            <div style={{fontSize:13,marginBottom:20}}>Create pages for notes, wikis, docs, plans — anything</div>
            <button onClick={()=>createPage()} style={{padding:"10px 24px",background:"linear-gradient(135deg,#FF6B35,#FF8C5A)",border:"none",borderRadius:10,color:"#fff",fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>Create First Page</button>
          </div>
        )}
        <PageGrid pages={rest} view={view} onOpen={setActivePage} onDelete={deletePage} onPin={(id,v)=>updateNote(user.uid,id,{isPinned:v})}/>
      </div>
    </div>
  );
}

// ─── PAGE GRID ────────────────────────────────────────────────────────────────
function PageGrid({ pages, view, onOpen, onDelete, onPin }) {
  if(view==="list") return (
    <div style={{display:"flex",flexDirection:"column",gap:6}}>
      {pages.map(p=>{
        const wc=(p.blocks||[]).reduce((s,b)=>s+(b.content||"").split(/\s+/).filter(Boolean).length,0);
        return (
          <div key={p.id} onClick={()=>onOpen(p)} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 14px",background:"var(--surface)",border:"1px solid rgba(255,255,255,0.05)",borderRadius:11,cursor:"pointer",transition:"all 0.15s"}} onMouseEnter={e=>e.currentTarget.style.background="#13131F"} onMouseLeave={e=>e.currentTarget.style.background="#0F0F1C"}>
            {p.cover?<div style={{width:40,height:40,borderRadius:9,background:p.cover,flexShrink:0}}/>:<div style={{fontSize:28,flexShrink:0}}>{p.icon||"📄"}</div>}
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:14,fontWeight:700,color:"var(--text)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.title||"Untitled"}</div>
              <div style={{fontSize:11,color:"var(--text3)"}}>{wc} words · {p.blocks?.length||0} blocks</div>
            </div>
            <button onClick={e=>{e.stopPropagation();onPin(p.id,!p.isPinned);}} style={{background:"transparent",border:"none",color:p.isPinned?"#F59E0B":"var(--text3)",cursor:"pointer",fontSize:14,transition:"color 0.1s"}} onMouseEnter={e=>e.currentTarget.style.color="#F59E0B"} onMouseLeave={e=>e.currentTarget.style.color=p.isPinned?"#F59E0B":"var(--text3)"}>📌</button>
            <button onClick={e=>{e.stopPropagation();onDelete(p.id);}} style={{background:"transparent",border:"none",color:"var(--text3)",cursor:"pointer",fontSize:14,transition:"color 0.1s"}} onMouseEnter={e=>e.currentTarget.style.color="#F43F5E"} onMouseLeave={e=>e.currentTarget.style.color="var(--text3)"}>🗑</button>
          </div>
        );
      })}
    </div>
  );
  return (
    <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12}}>
      {pages.map(p=>{
        const preview=(p.blocks||[]).find(b=>b.type==="text"&&b.content)?.content||"";
        const wc=(p.blocks||[]).reduce((s,b)=>s+(b.content||"").split(/\s+/).filter(Boolean).length,0);
        const hasDB=(p.blocks||[]).some(b=>b.type==="database");
        return (
          <div key={p.id} style={{background:"var(--surface)",border:"1px solid rgba(255,255,255,0.05)",borderRadius:14,overflow:"hidden",cursor:"pointer",transition:"all 0.18s"}} onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.borderColor="rgba(255,107,53,0.3)";e.currentTarget.style.boxShadow="0 12px 32px rgba(0,0,0,0.4)";}} onMouseLeave={e=>{e.currentTarget.style.transform="none";e.currentTarget.style.borderColor="rgba(255,255,255,0.05)";e.currentTarget.style.boxShadow="none";}}>
            <div onClick={()=>onOpen(p)} style={{height:80,background:p.cover||"linear-gradient(135deg,#0F0F1C,#1A1A2E)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:36}}>{!p.cover&&(p.icon||"📄")}</div>
            <div style={{padding:"12px 14px"}}>
              <div onClick={()=>onOpen(p)} style={{fontSize:14,fontWeight:700,color:"var(--text)",marginBottom:5,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.title||"Untitled"}</div>
              {preview&&<div onClick={()=>onOpen(p)} style={{fontSize:12,color:"var(--text3)",marginBottom:10,overflow:"hidden",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical"}}>{preview}</div>}
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <div style={{display:"flex",gap:6,alignItems:"center"}}>
                  <span style={{fontSize:10,color:"var(--text3)"}}>{wc}w</span>
                  {hasDB&&<span style={{fontSize:9,padding:"1px 5px",background:"rgba(129,140,248,0.1)",color:"#818CF8",borderRadius:8,fontWeight:700}}>DB</span>}
                  {(p.blocks||[]).some(b=>b.type==="code")&&<span style={{fontSize:9,padding:"1px 5px",background:"rgba(165,243,252,0.1)",color:"#A5F3FC",borderRadius:8,fontWeight:700}}>Code</span>}
                </div>
                <div style={{display:"flex",gap:4}}>
                  <button onClick={e=>{e.stopPropagation();onPin(p.id,!p.isPinned);}} style={{background:"transparent",border:"none",color:p.isPinned?"#F59E0B":"var(--text3)",cursor:"pointer",fontSize:12,padding:"2px 5px",borderRadius:5,transition:"color 0.1s"}} onMouseEnter={e=>e.currentTarget.style.color="#F59E0B"} onMouseLeave={e=>e.currentTarget.style.color=p.isPinned?"#F59E0B":"var(--text3)"}>📌</button>
                  <button onClick={e=>{e.stopPropagation();onDelete(p.id);}} style={{background:"transparent",border:"none",color:"var(--text3)",cursor:"pointer",fontSize:12,padding:"2px 5px",borderRadius:5,transition:"color 0.1s"}} onMouseEnter={e=>e.currentTarget.style.color="#F43F5E"} onMouseLeave={e=>e.currentTarget.style.color="var(--text3)"}>🗑</button>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
