// 📄 NotionPage v3 — World-Class Notion Clone
// Features: Drag-Drop Blocks · Cover Images · Page Linking · Inline DB (Table/Kanban/Gallery/List/Calendar)
//           Slash Menu · Rich Text · Toggle · Callout · Code · Math · Comments · Version History
//           Export MD/HTML · Full Light+Dark · Smooth typing
import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../hooks/useAuth";
import { addNote, updateNote, deleteNote, subscribeToNotes } from "../firebase/services";

// ─── UTILS ────────────────────────────────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2, 10);
const todayStr = () => new Date().toISOString().slice(0, 10);

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const BLOCK_TYPES = [
  { type:"text",     icon:"¶",    label:"Text",            desc:"Start writing" },
  { type:"h1",       icon:"H1",   label:"Heading 1",       desc:"Big header" },
  { type:"h2",       icon:"H2",   label:"Heading 2",       desc:"Medium header" },
  { type:"h3",       icon:"H3",   label:"Heading 3",       desc:"Small header" },
  { type:"bullet",   icon:"•",    label:"Bullet List",     desc:"Unordered list" },
  { type:"numbered", icon:"1.",   label:"Numbered List",   desc:"Ordered list" },
  { type:"todo",     icon:"☐",    label:"To-do",           desc:"Checkbox item" },
  { type:"toggle",   icon:"▶",    label:"Toggle",          desc:"Collapsible section" },
  { type:"quote",    icon:"❝",    label:"Quote",           desc:"Blockquote" },
  { type:"callout",  icon:"💡",   label:"Callout",         desc:"Highlighted note" },
  { type:"code",     icon:"</>",  label:"Code",            desc:"Code block" },
  { type:"math",     icon:"∑",    label:"Math / LaTeX",    desc:"Equation" },
  { type:"image",    icon:"🖼",   label:"Image",           desc:"Upload or URL" },
  { type:"video",    icon:"▶️",   label:"Video",           desc:"YouTube / Vimeo" },
  { type:"divider",  icon:"—",    label:"Divider",         desc:"Horizontal rule" },
  { type:"columns",  icon:"⫿",    label:"2 Columns",       desc:"Side by side" },
  { type:"database", icon:"🗄",   label:"Database",        desc:"Table / Kanban / Gallery" },
  { type:"toc",      icon:"📑",   label:"Table of Contents", desc:"Auto generated" },
  { type:"subpage",  icon:"📄",   label:"Sub-page",        desc:"Nested page link" },
  { type:"bookmark", icon:"🔖",   label:"Bookmark",        desc:"Web link card" },
];

const PAGE_ICONS = ["📄","📝","🎯","🚀","💡","📊","🏠","⚡","🌟","🎨","📚","💼","🔥","🌈","🎭","🛠","🧠","🔬","🎵","🌍","⚽","🎮","🍕","☕","🏆","🦁","🐉","🦋","🌺","🎪"];
const COVERS = [
  "linear-gradient(135deg,#FF6B35,#FF8C5A)",
  "linear-gradient(135deg,#8B5CF6,#6366F1)",
  "linear-gradient(135deg,#10B981,#06B6D4)",
  "linear-gradient(135deg,#F43F5E,#EC4899)",
  "linear-gradient(135deg,#F59E0B,#EF4444)",
  "linear-gradient(135deg,#0f2027,#203a43,#2c5364)",
  "linear-gradient(135deg,#2d1b69,#11998e)",
  "linear-gradient(135deg,#373B44,#4286f4)",
  "linear-gradient(135deg,#c94b4b,#4b134f)",
  "linear-gradient(135deg,#134E5E,#71B280)",
];
const STATUS_OPTS = ["Not Started","In Progress","Done","Blocked","Review"];
const STATUS_COLOR = { "Not Started":"#6B7280","In Progress":"#F59E0B","Done":"#10B981","Blocked":"#F43F5E","Review":"#818CF8" };
const PRIORITY_OPTS = ["Low","Medium","High","Urgent"];
const PRIORITY_COLOR = { Low:"#10B981", Medium:"#F59E0B", High:"#FF6B35", Urgent:"#F43F5E" };
const DB_VIEWS = [
  { id:"table", icon:"⊟", label:"Table" },
  { id:"kanban", icon:"▦", label:"Kanban" },
  { id:"gallery", icon:"⊞", label:"Gallery" },
  { id:"list", icon:"☰", label:"List" },
  { id:"calendar", icon:"📅", label:"Calendar" },
];

const newBlock = (type = "text", extra = {}) => ({
  id: uid(), type, content: "", checked: false, open: false,
  icon: "💡", lang: "javascript", color: "default", indent: 0,
  children: [], rows: [["","",""],["","",""]], cols: ["Col 1","Col 2","Col 3"],
  dbRows: [], dbView: "table",
  dbCols: [
    { id: uid(), name: "Name", type: "text" },
    { id: uid(), name: "Status", type: "status" },
    { id: uid(), name: "Date", type: "date" },
    { id: uid(), name: "Priority", type: "priority" },
  ],
  url: "", caption: "", align: "left",
  leftBlocks: [{ id: uid(), type: "text", content: "" }],
  rightBlocks: [{ id: uid(), type: "text", content: "" }],
  ...extra,
});

const BG_COLORS = {
  default: "transparent", red: "rgba(244,63,94,0.08)", orange: "rgba(255,107,53,0.08)",
  yellow: "rgba(245,158,11,0.08)", green: "rgba(16,185,129,0.08)", blue: "rgba(99,102,241,0.08)",
  purple: "rgba(139,92,246,0.08)", gray: "rgba(107,114,128,0.08)",
};
const TEXT_COLORS = {
  default: "var(--text)", red: "#F43F5E", orange: "#FF6B35",
  yellow: "#F59E0B", green: "#10B981", blue: "#818CF8", purple: "#8B5CF6", gray: "#9CA3AF",
};

// ─── SLASH MENU ───────────────────────────────────────────────────────────────
function SlashMenu({ query, onSelect, pos }) {
  const list = BLOCK_TYPES.filter(b =>
    b.label.toLowerCase().includes(query.toLowerCase()) || b.type.includes(query.toLowerCase())
  );
  if (!list.length) return null;
  return (
    <div style={{ position:"fixed", left:pos.x, top:pos.y, background:"var(--modal-bg)", border:"1px solid var(--border2)", borderRadius:14, width:260, maxHeight:300, overflowY:"auto", boxShadow:"var(--shadow-xl)", zIndex:99999, animation:"popIn 0.15s ease" }}>
      <div style={{ padding:"8px 12px 4px", fontSize:10, fontWeight:800, color:"var(--text3)", textTransform:"uppercase", letterSpacing:"1px" }}>BLOCKS</div>
      {list.map(b => (
        <div key={b.type} onClick={() => onSelect(b.type)}
          style={{ display:"flex", alignItems:"center", gap:10, padding:"7px 10px", cursor:"pointer", margin:"0 4px 2px", borderRadius:8, transition:"background 0.1s" }}
          onMouseEnter={e => e.currentTarget.style.background = "var(--hover-bg)"}
          onMouseLeave={e => e.currentTarget.style.background = ""}>
          <div style={{ width:30, height:30, borderRadius:8, background:"var(--surface3)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, flexShrink:0, fontFamily:"monospace", fontWeight:700, color:"var(--text2)" }}>{b.icon}</div>
          <div>
            <div style={{ fontSize:13, fontWeight:600, color:"var(--text)" }}>{b.label}</div>
            <div style={{ fontSize:11, color:"var(--text3)" }}>{b.desc}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── BLOCK TOOLBAR ────────────────────────────────────────────────────────────
function BlockToolbar({ block, onUpdate, onDelete, onDuplicate, onMoveUp, onMoveDown, onAddBelow }) {
  const [open, setOpen] = useState(false);
  const [colorOpen, setColorOpen] = useState(false);
  const colors = ["default","red","orange","yellow","green","blue","purple","gray"];
  return (
    <div style={{ display:"flex", gap:2, opacity:0, transition:"opacity 0.15s", position:"absolute", right:0, top:-2, zIndex:10 }} className="block-toolbar">
      <button onClick={onMoveUp} title="Move Up" style={tbtn}>↑</button>
      <button onClick={onMoveDown} title="Move Down" style={tbtn}>↓</button>
      <button onClick={() => setColorOpen(c => !c)} title="Color" style={tbtn}>🎨</button>
      {colorOpen && (
        <div style={{ position:"absolute", right:80, top:0, background:"var(--modal-bg)", border:"1px solid var(--border)", borderRadius:10, padding:8, display:"flex", gap:5, flexWrap:"wrap", width:160, zIndex:100, boxShadow:"var(--shadow)" }}>
          {colors.map(c => (
            <div key={c} onClick={() => { onUpdate({ color:c }); setColorOpen(false); }}
              title={c} style={{ width:20, height:20, borderRadius:5, background:c === "default" ? "var(--surface3)" : BG_COLORS[c] || "var(--surface3)", cursor:"pointer", border: block.color === c ? "2px solid var(--accent)" : "2px solid transparent", transition:"border 0.1s" }} />
          ))}
        </div>
      )}
      <button onClick={onDuplicate} title="Duplicate" style={tbtn}>⧉</button>
      <button onClick={onAddBelow} title="Add block below" style={tbtn}>+</button>
      <button onClick={onDelete} title="Delete" style={{ ...tbtn, color:"#F43F5E" }}>🗑</button>
    </div>
  );
}
const tbtn = { fontSize:12, padding:"3px 6px", background:"var(--surface2)", border:"1px solid var(--border)", borderRadius:6, cursor:"pointer", color:"var(--text2)", fontFamily:"inherit", transition:"all 0.1s", lineHeight:1.2 };

// ─── INLINE DATABASE ──────────────────────────────────────────────────────────
function InlineDatabase({ block, onUpdate }) {
  const [view, setView] = useState(block.dbView || "table");
  const [editCell, setEditCell] = useState(null);
  const [newRowOpen, setNewRowOpen] = useState(false);
  const [newRow, setNewRow] = useState({});
  const [editingColId, setEditingColId] = useState(null);
  const [filterCol, setFilterCol] = useState(null);
  const [filterVal, setFilterVal] = useState("");

  const cols = block.dbCols || [];
  const rows = block.dbRows || [];

  function addRow() {
    const r = { id:uid(), ...newRow };
    cols.forEach(c => { if (!r[c.id]) r[c.id] = ""; });
    onUpdate({ dbRows:[...rows, r] });
    setNewRow({}); setNewRowOpen(false);
  }
  function updateCell(rowId, colId, val) {
    onUpdate({ dbRows: rows.map(r => r.id === rowId ? { ...r, [colId]:val } : r) });
  }
  function deleteRow(rowId) { onUpdate({ dbRows: rows.filter(r => r.id !== rowId) }); }
  function addCol() { onUpdate({ dbCols:[...cols, { id:uid(), name:"New Field", type:"text" }] }); }
  function renameCol(colId, name) { onUpdate({ dbCols: cols.map(c => c.id === colId ? { ...c, name } : c) }); }
  function deleteCol(colId) { onUpdate({ dbCols: cols.filter(c => c.id !== colId), dbRows: rows.map(r => { const n = {...r}; delete n[colId]; return n; }) }); }

  const nameCol = cols[0];
  const filteredRows = filterCol ? rows.filter(r => (r[filterCol] || "").toLowerCase().includes(filterVal.toLowerCase())) : rows;

  const cellStyle = { padding:"6px 10px", borderRight:"1px solid var(--border)", fontSize:13, color:"var(--text)", minWidth:100, position:"relative" };

  function CellEdit({ row, col }) {
    const [val, setVal] = useState(row[col.id] || "");
    if (col.type === "status") return (
      <select value={val} onChange={e => { setVal(e.target.value); updateCell(row.id, col.id, e.target.value); setEditCell(null); }}
        style={{ background:"transparent", border:"none", color: STATUS_COLOR[val] || "var(--text)", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit", outline:"none" }}>
        {STATUS_OPTS.map(s => <option key={s} value={s}>{s}</option>)}
      </select>
    );
    if (col.type === "priority") return (
      <select value={val} onChange={e => { setVal(e.target.value); updateCell(row.id, col.id, e.target.value); setEditCell(null); }}
        style={{ background:"transparent", border:"none", color: PRIORITY_COLOR[val] || "var(--text)", fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"inherit", outline:"none" }}>
        {PRIORITY_OPTS.map(p => <option key={p} value={p}>{p}</option>)}
      </select>
    );
    if (col.type === "checkbox") return (
      <input type="checkbox" checked={!!row[col.id]} onChange={e => updateCell(row.id, col.id, e.target.checked)} />
    );
    if (col.type === "date") return (
      <input type="date" value={val} onChange={e => { setVal(e.target.value); updateCell(row.id, col.id, e.target.value); }}
        onBlur={() => setEditCell(null)}
        style={{ background:"transparent", border:"none", color:"var(--text)", fontSize:12, fontFamily:"inherit", outline:"none" }} />
    );
    return (
      <input autoFocus value={val} onChange={e => setVal(e.target.value)}
        onBlur={() => { updateCell(row.id, col.id, val); setEditCell(null); }}
        onKeyDown={e => { if (e.key === "Enter") { updateCell(row.id, col.id, val); setEditCell(null); } }}
        style={{ background:"transparent", border:"none", color:"var(--text)", fontSize:13, width:"100%", outline:"none", fontFamily:"inherit" }} />
    );
  }

  function renderCellValue(row, col) {
    const val = row[col.id] || "";
    if (col.type === "status") return <span style={{ fontSize:11, fontWeight:700, color: STATUS_COLOR[val] || "var(--text3)", background:(STATUS_COLOR[val] || "#6B7280") + "18", padding:"2px 8px", borderRadius:20 }}>{val || "—"}</span>;
    if (col.type === "priority") return <span style={{ fontSize:11, fontWeight:700, color: PRIORITY_COLOR[val] || "var(--text3)", background:(PRIORITY_COLOR[val] || "#6B7280") + "18", padding:"2px 8px", borderRadius:20 }}>{val || "—"}</span>;
    if (col.type === "checkbox") return <span>{val ? "✅" : "☐"}</span>;
    if (col.type === "date") return <span style={{ fontSize:12, color:"var(--text2)" }}>{val || "—"}</span>;
    return <span>{val || <span style={{ color:"var(--text3)" }}>—</span>}</span>;
  }

  // TABLE VIEW
  if (view === "table") return (
    <div style={{ border:"1px solid var(--border)", borderRadius:12, overflow:"hidden" }}>
      {/* View switcher + controls */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"8px 12px", background:"var(--surface2)", borderBottom:"1px solid var(--border)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
          <span style={{ fontSize:14 }}>🗄</span>
          <input value={block.content || "Database"} onChange={e => onUpdate({ content:e.target.value })}
            style={{ background:"transparent", border:"none", color:"var(--text)", fontWeight:800, fontSize:13, outline:"none", fontFamily:"inherit" }} />
        </div>
        <div style={{ display:"flex", gap:4 }}>
          {DB_VIEWS.map(v => (
            <button key={v.id} onClick={() => { setView(v.id); onUpdate({ dbView:v.id }); }}
              style={{ fontSize:11, padding:"3px 9px", border:"none", borderRadius:8, background: view===v.id ? "rgba(255,107,53,0.15)" : "transparent", color: view===v.id ? "#FF6B35" : "var(--text3)", fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
              {v.icon} {v.label}
            </button>
          ))}
          <button onClick={() => setNewRowOpen(true)} style={{ fontSize:11, padding:"3px 10px", background:"rgba(255,107,53,0.1)", border:"1px solid rgba(255,107,53,0.2)", borderRadius:8, color:"#FF6B35", fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>+ Row</button>
        </div>
      </div>
      {/* Table */}
      <div style={{ overflowX:"auto" }}>
        <table style={{ width:"100%", borderCollapse:"collapse" }}>
          <thead>
            <tr style={{ background:"var(--surface2)" }}>
              {cols.map((col, ci) => (
                <th key={col.id} style={{ ...cellStyle, fontWeight:700, fontSize:11, color:"var(--text3)", textTransform:"uppercase", letterSpacing:"0.5px", textAlign:"left" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                    {editingColId === col.id
                      ? <input autoFocus value={col.name} onChange={e => renameCol(col.id, e.target.name || e.target.value)}
                          onBlur={() => setEditingColId(null)} onKeyDown={e => { if (e.key === "Enter") setEditingColId(null); }}
                          style={{ background:"transparent", border:"none", color:"var(--text)", fontSize:11, outline:"none", fontFamily:"inherit", fontWeight:700 }} />
                      : <span onClick={() => setEditingColId(col.id)} style={{ cursor:"pointer" }}>{col.name}</span>
                    }
                    {ci > 0 && <span onClick={() => deleteCol(col.id)} style={{ cursor:"pointer", color:"var(--text3)", fontSize:11, opacity:0.5 }}>×</span>}
                  </div>
                </th>
              ))}
              <th style={{ ...cellStyle, width:40 }}></th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((row, ri) => (
              <tr key={row.id} style={{ borderBottom:"1px solid var(--border)", transition:"background 0.1s" }}
                onMouseEnter={e => e.currentTarget.style.background = "var(--hover-bg)"}
                onMouseLeave={e => e.currentTarget.style.background = ""}>
                {cols.map(col => (
                  <td key={col.id} style={{ ...cellStyle }} onClick={() => setEditCell(row.id + col.id)}>
                    {editCell === row.id + col.id
                      ? <CellEdit row={row} col={col} />
                      : renderCellValue(row, col)
                    }
                  </td>
                ))}
                <td style={{ ...cellStyle, width:40, textAlign:"center" }}>
                  <button onClick={() => deleteRow(row.id)} style={{ background:"transparent", border:"none", color:"var(--text3)", cursor:"pointer", fontSize:13 }}>×</button>
                </td>
              </tr>
            ))}
            {/* Add row inline */}
            {newRowOpen && (
              <tr style={{ borderBottom:"1px solid var(--border)", background:"var(--surface2)" }}>
                {cols.map(col => (
                  <td key={col.id} style={cellStyle}>
                    <input placeholder={col.name} value={newRow[col.id] || ""}
                      onChange={e => setNewRow(n => ({ ...n, [col.id]:e.target.value }))}
                      onKeyDown={e => { if (e.key === "Enter") addRow(); if (e.key === "Escape") setNewRowOpen(false); }}
                      style={{ background:"transparent", border:"none", color:"var(--text)", fontSize:13, width:"100%", outline:"none", fontFamily:"inherit" }} />
                  </td>
                ))}
                <td style={cellStyle}>
                  <button onClick={addRow} style={{ background:"var(--accent)", border:"none", borderRadius:5, color:"#fff", fontSize:11, padding:"2px 8px", cursor:"pointer", fontFamily:"inherit" }}>Add</button>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {/* Add col */}
      <div style={{ padding:"6px 12px", borderTop:"1px solid var(--border)" }}>
        <button onClick={addCol} style={{ fontSize:12, color:"var(--text3)", background:"transparent", border:"none", cursor:"pointer", fontFamily:"inherit" }}>+ Add field</button>
      </div>
    </div>
  );

  // KANBAN VIEW
  if (view === "kanban") {
    const statusCol = cols.find(c => c.type === "status") || cols[1];
    const groups = STATUS_OPTS.reduce((acc, s) => { acc[s] = rows.filter(r => (r[statusCol?.id] || "Not Started") === s); return acc; }, {});
    return (
      <div style={{ border:"1px solid var(--border)", borderRadius:12, overflow:"hidden" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"8px 12px", background:"var(--surface2)", borderBottom:"1px solid var(--border)" }}>
          <span style={{ fontWeight:800, fontSize:13, color:"var(--text)" }}>▦ {block.content || "Database"}</span>
          <div style={{ display:"flex", gap:4 }}>
            {DB_VIEWS.map(v => <button key={v.id} onClick={() => { setView(v.id); onUpdate({ dbView:v.id }); }} style={{ fontSize:11, padding:"3px 9px", border:"none", borderRadius:8, background: view===v.id ? "rgba(255,107,53,0.15)" : "transparent", color: view===v.id ? "#FF6B35" : "var(--text3)", fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>{v.icon} {v.label}</button>)}
          </div>
        </div>
        <div style={{ display:"flex", gap:12, padding:14, overflowX:"auto" }}>
          {STATUS_OPTS.map(status => (
            <div key={status} style={{ minWidth:200, flexShrink:0 }}>
              <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:10 }}>
                <div style={{ width:8, height:8, borderRadius:"50%", background:STATUS_COLOR[status] }} />
                <span style={{ fontSize:12, fontWeight:700, color:"var(--text2)" }}>{status}</span>
                <span style={{ fontSize:11, color:"var(--text3)" }}>({(groups[status]||[]).length})</span>
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {(groups[status]||[]).map(row => (
                  <div key={row.id} style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:10, padding:"10px 12px", cursor:"pointer", transition:"all 0.15s" }}
                    onMouseEnter={e => e.currentTarget.style.boxShadow = "var(--shadow)"}
                    onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}>
                    <div style={{ fontSize:13, fontWeight:600, color:"var(--text)", marginBottom:6 }}>{row[nameCol?.id] || "Untitled"}</div>
                    {cols.filter(c => c.type === "priority").map(c => row[c.id] && (
                      <span key={c.id} style={{ fontSize:10, padding:"2px 7px", background:(PRIORITY_COLOR[row[c.id]]||"#6B7280")+"18", color:PRIORITY_COLOR[row[c.id]]||"#6B7280", borderRadius:20, fontWeight:700, marginRight:4 }}>{row[c.id]}</span>
                    ))}
                    {cols.filter(c => c.type === "date").map(c => row[c.id] && (
                      <div key={c.id} style={{ fontSize:11, color:"var(--text3)", marginTop:4 }}>📅 {row[c.id]}</div>
                    ))}
                    <button onClick={() => deleteRow(row.id)} style={{ marginTop:6, fontSize:11, color:"var(--text3)", background:"transparent", border:"none", cursor:"pointer", fontFamily:"inherit" }}>Delete</button>
                  </div>
                ))}
                <button onClick={() => { setNewRow({ [statusCol?.id]:status }); setNewRowOpen(true); }}
                  style={{ fontSize:12, padding:"7px", background:"transparent", border:"1px dashed var(--border)", borderRadius:10, color:"var(--text3)", cursor:"pointer", fontFamily:"inherit", textAlign:"center" }}>
                  + Add
                </button>
              </div>
            </div>
          ))}
        </div>
        {newRowOpen && (
          <div style={{ padding:"12px 14px", borderTop:"1px solid var(--border)", background:"var(--surface2)", display:"flex", gap:8 }}>
            {cols.slice(0, 2).map(col => (
              <input key={col.id} placeholder={col.name} value={newRow[col.id] || ""}
                onChange={e => setNewRow(n => ({ ...n, [col.id]:e.target.value }))}
                style={{ flex:1, padding:"7px 10px", background:"var(--input-bg)", border:"1px solid var(--border)", borderRadius:8, color:"var(--text)", fontSize:13, fontFamily:"inherit", outline:"none" }} />
            ))}
            <button onClick={addRow} style={{ padding:"7px 14px", background:"var(--accent)", border:"none", borderRadius:8, color:"#fff", fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>Add</button>
            <button onClick={() => setNewRowOpen(false)} style={{ padding:"7px 12px", background:"var(--surface3)", border:"none", borderRadius:8, color:"var(--text2)", cursor:"pointer", fontFamily:"inherit" }}>Cancel</button>
          </div>
        )}
      </div>
    );
  }

  // GALLERY VIEW
  if (view === "gallery") return (
    <div style={{ border:"1px solid var(--border)", borderRadius:12, overflow:"hidden" }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"8px 12px", background:"var(--surface2)", borderBottom:"1px solid var(--border)" }}>
        <span style={{ fontWeight:800, fontSize:13, color:"var(--text)" }}>⊞ {block.content || "Database"}</span>
        <div style={{ display:"flex", gap:4 }}>
          {DB_VIEWS.map(v => <button key={v.id} onClick={() => { setView(v.id); onUpdate({ dbView:v.id }); }} style={{ fontSize:11, padding:"3px 9px", border:"none", borderRadius:8, background: view===v.id ? "rgba(255,107,53,0.15)" : "transparent", color: view===v.id ? "#FF6B35" : "var(--text3)", fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>{v.icon} {v.label}</button>)}
          <button onClick={() => setNewRowOpen(true)} style={{ fontSize:11, padding:"3px 10px", background:"rgba(255,107,53,0.1)", border:"1px solid rgba(255,107,53,0.2)", borderRadius:8, color:"#FF6B35", fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>+ Card</button>
        </div>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))", gap:12, padding:14 }}>
        {rows.map(row => {
          const statusCol2 = cols.find(c => c.type === "status");
          const s = statusCol2 ? (row[statusCol2.id] || "Not Started") : null;
          return (
            <div key={row.id} style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:12, overflow:"hidden", transition:"all 0.15s" }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = "var(--shadow)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "none"; }}>
              <div style={{ height:60, background:`linear-gradient(135deg,${s ? STATUS_COLOR[s]+"44" : "#FF6B3544"},transparent)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:24 }}>
                {row.emoji || "📄"}
              </div>
              <div style={{ padding:"10px 12px" }}>
                <div style={{ fontSize:13, fontWeight:700, color:"var(--text)", marginBottom:6 }}>{row[nameCol?.id] || "Untitled"}</div>
                {s && <span style={{ fontSize:10, padding:"2px 7px", background:(STATUS_COLOR[s]||"#6B7280")+"18", color:STATUS_COLOR[s]||"#6B7280", borderRadius:20, fontWeight:700 }}>{s}</span>}
              </div>
            </div>
          );
        })}
        <div onClick={() => setNewRowOpen(true)} style={{ height:120, border:"1px dashed var(--border)", borderRadius:12, display:"flex", alignItems:"center", justifyContent:"center", color:"var(--text3)", cursor:"pointer", fontSize:13, transition:"background 0.15s" }}
          onMouseEnter={e => e.currentTarget.style.background = "var(--hover-bg)"}
          onMouseLeave={e => e.currentTarget.style.background = ""}>
          + New card
        </div>
      </div>
    </div>
  );

  // LIST VIEW
  if (view === "list") return (
    <div style={{ border:"1px solid var(--border)", borderRadius:12, overflow:"hidden" }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"8px 12px", background:"var(--surface2)", borderBottom:"1px solid var(--border)" }}>
        <span style={{ fontWeight:800, fontSize:13, color:"var(--text)" }}>☰ {block.content || "Database"}</span>
        <div style={{ display:"flex", gap:4 }}>
          {DB_VIEWS.map(v => <button key={v.id} onClick={() => { setView(v.id); onUpdate({ dbView:v.id }); }} style={{ fontSize:11, padding:"3px 9px", border:"none", borderRadius:8, background: view===v.id ? "rgba(255,107,53,0.15)" : "transparent", color: view===v.id ? "#FF6B35" : "var(--text3)", fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>{v.icon} {v.label}</button>)}
          <button onClick={() => setNewRowOpen(true)} style={{ fontSize:11, padding:"3px 10px", background:"rgba(255,107,53,0.1)", border:"1px solid rgba(255,107,53,0.2)", borderRadius:8, color:"#FF6B35", fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>+ Row</button>
        </div>
      </div>
      {rows.map((row, i) => {
        const statusCol3 = cols.find(c => c.type === "status");
        const s = statusCol3 ? (row[statusCol3.id] || "") : "";
        return (
          <div key={row.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 14px", borderBottom:"1px solid var(--border)", transition:"background 0.1s" }}
            onMouseEnter={e => e.currentTarget.style.background = "var(--hover-bg)"}
            onMouseLeave={e => e.currentTarget.style.background = ""}>
            <span style={{ color:"var(--text3)", fontSize:12, width:20, textAlign:"right" }}>{i+1}.</span>
            <span style={{ fontSize:13, fontWeight:600, color:"var(--text)", flex:1 }}>{row[nameCol?.id] || "Untitled"}</span>
            {s && <span style={{ fontSize:11, padding:"2px 8px", background:(STATUS_COLOR[s]||"#6B7280")+"18", color:STATUS_COLOR[s]||"#6B7280", borderRadius:20, fontWeight:700 }}>{s}</span>}
            <button onClick={() => deleteRow(row.id)} style={{ background:"transparent", border:"none", color:"var(--text3)", cursor:"pointer", fontSize:13 }}>×</button>
          </div>
        );
      })}
      <div style={{ padding:"8px 14px" }}>
        <button onClick={() => setNewRowOpen(true)} style={{ fontSize:12, color:"var(--text3)", background:"transparent", border:"none", cursor:"pointer", fontFamily:"inherit" }}>+ Add item</button>
      </div>
      {newRowOpen && (
        <div style={{ padding:"10px 14px", borderTop:"1px solid var(--border)", background:"var(--surface2)", display:"flex", gap:8 }}>
          <input autoFocus placeholder={nameCol?.name || "Name"} value={newRow[nameCol?.id] || ""}
            onChange={e => setNewRow(n => ({ ...n, [nameCol?.id]:e.target.value }))}
            onKeyDown={e => { if (e.key === "Enter") addRow(); if (e.key === "Escape") setNewRowOpen(false); }}
            style={{ flex:1, padding:"7px 10px", background:"var(--input-bg)", border:"1px solid var(--border)", borderRadius:8, color:"var(--text)", fontSize:13, fontFamily:"inherit", outline:"none" }} />
          <button onClick={addRow} style={{ padding:"7px 14px", background:"var(--accent)", border:"none", borderRadius:8, color:"#fff", fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>Add</button>
        </div>
      )}
    </div>
  );

  // CALENDAR VIEW
  if (view === "calendar") {
    const dateCol = cols.find(c => c.type === "date");
    const [calMonth, setCalMonth] = useState(new Date().getMonth());
    const [calYear, setCalYear] = useState(new Date().getFullYear());
    const daysInMonth = new Date(calYear, calMonth+1, 0).getDate();
    const firstDay = new Date(calYear, calMonth, 1).getDay();
    const monthRows = {};
    rows.forEach(r => {
      const d = r[dateCol?.id];
      if (d) { const day = parseInt(d.slice(8)); if (!isNaN(day)) { if (!monthRows[day]) monthRows[day] = []; monthRows[day].push(r); } }
    });
    const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const days = Array.from({ length:42 }, (_, i) => { const d = i - firstDay + 1; return d > 0 && d <= daysInMonth ? d : null; });
    return (
      <div style={{ border:"1px solid var(--border)", borderRadius:12, overflow:"hidden" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"8px 12px", background:"var(--surface2)", borderBottom:"1px solid var(--border)" }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <button onClick={() => { if (calMonth === 0) { setCalMonth(11); setCalYear(y => y-1); } else setCalMonth(m => m-1); }} style={{ background:"transparent", border:"none", color:"var(--text2)", cursor:"pointer", fontSize:16 }}>‹</button>
            <span style={{ fontWeight:800, fontSize:13, color:"var(--text)" }}>📅 {monthNames[calMonth]} {calYear}</span>
            <button onClick={() => { if (calMonth === 11) { setCalMonth(0); setCalYear(y => y+1); } else setCalMonth(m => m+1); }} style={{ background:"transparent", border:"none", color:"var(--text2)", cursor:"pointer", fontSize:16 }}>›</button>
          </div>
          <div style={{ display:"flex", gap:4 }}>
            {DB_VIEWS.map(v => <button key={v.id} onClick={() => { setView(v.id); onUpdate({ dbView:v.id }); }} style={{ fontSize:11, padding:"3px 9px", border:"none", borderRadius:8, background: view===v.id ? "rgba(255,107,53,0.15)" : "transparent", color: view===v.id ? "#FF6B35" : "var(--text3)", fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>{v.icon} {v.label}</button>)}
          </div>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", background:"var(--surface2)" }}>
          {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d => <div key={d} style={{ padding:"6px 0", textAlign:"center", fontSize:11, fontWeight:700, color:"var(--text3)" }}>{d}</div>)}
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)" }}>
          {days.map((day, i) => {
            const isToday = day && new Date().getDate() === day && new Date().getMonth() === calMonth && new Date().getFullYear() === calYear;
            const items = day ? (monthRows[day] || []) : [];
            return (
              <div key={i} style={{ minHeight:80, padding:"4px 6px", borderRight:"1px solid var(--border)", borderBottom:"1px solid var(--border)", background: isToday ? "rgba(255,107,53,0.04)" : "transparent" }}>
                {day && <div style={{ fontSize:12, fontWeight: isToday ? 900 : 400, color: isToday ? "var(--accent)" : "var(--text2)", marginBottom:4, width:22, height:22, display:"flex", alignItems:"center", justifyContent:"center", borderRadius:"50%", background: isToday ? "rgba(255,107,53,0.15)" : "transparent" }}>{day}</div>}
                {items.slice(0, 2).map(r => (
                  <div key={r.id} style={{ fontSize:10, padding:"2px 5px", background:"rgba(255,107,53,0.12)", color:"var(--accent)", borderRadius:5, marginBottom:2, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                    {r[nameCol?.id] || "Item"}
                  </div>
                ))}
                {items.length > 2 && <div style={{ fontSize:9, color:"var(--text3)" }}>+{items.length-2} more</div>}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return null;
}

// ─── SINGLE BLOCK ─────────────────────────────────────────────────────────────
function Block({ block, idx, total, allBlocks, onUpdate, onDelete, onDuplicate, onMoveUp, onMoveDown, onAddBelow, onNavigatePage, depth }) {
  const [slashOpen, setSlashOpen] = useState(false);
  const [slashQuery, setSlashQuery] = useState("");
  const [slashPos, setSlashPos] = useState({ x:0, y:0 });
  const [hovered, setHovered] = useState(false);
  const inputRef = useRef();
  depth = depth || 0;

  function handleInput(e) {
    const val = e.target.value;
    const slashIdx = val.lastIndexOf("/");
    if (slashIdx >= 0) {
      const query = val.slice(slashIdx + 1);
      const rect = e.target.getBoundingClientRect();
      setSlashPos({ x: rect.left, y: rect.bottom + 6 });
      setSlashQuery(query);
      setSlashOpen(true);
    } else {
      setSlashOpen(false);
    }
    onUpdate({ content: val });
  }

  function handleSlashSelect(type) {
    setSlashOpen(false);
    const slashIdx = block.content.lastIndexOf("/");
    const cleaned = block.content.slice(0, slashIdx >= 0 ? slashIdx : undefined);
    onUpdate({ content: cleaned, type });
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onAddBelow();
    }
    if (e.key === "Backspace" && !block.content && block.type !== "text") {
      e.preventDefault();
      onUpdate({ type:"text" });
    }
    if (e.key === "Escape") setSlashOpen(false);
    if (e.key === "Tab") {
      e.preventDefault();
      onUpdate({ indent: Math.min((block.indent||0)+1, 3) });
    }
  }

  function handlePaste(e) {
    const text = e.clipboardData.getData("text");
    if (text.startsWith("http") && block.type === "text") {
      onUpdate({ type:"bookmark", url:text });
      e.preventDefault();
    }
  }

  const fontSize = block.type === "h1" ? 30 : block.type === "h2" ? 22 : block.type === "h3" ? 17 : 15;
  const fontWeight = ["h1","h2","h3"].includes(block.type) ? 900 : 400;
  const marginLeft = (block.indent||0) * 24;

  const sharedInputStyle = {
    width:"100%", background:"transparent", border:"none", outline:"none",
    color: TEXT_COLORS[block.color] || "var(--text)", fontFamily:"inherit",
    fontSize, fontWeight, lineHeight:1.7, resize:"none", boxSizing:"border-box",
    padding:"1px 0",
  };

  const blockBg = BG_COLORS[block.color] || "transparent";

  const content = (() => {
    switch (block.type) {
      case "divider":
        return <hr style={{ border:"none", borderTop:"2px solid var(--border2)", margin:"8px 0" }} />;

      case "todo":
        return (
          <div style={{ display:"flex", alignItems:"flex-start", gap:9 }}>
            <div onClick={() => onUpdate({ checked:!block.checked })}
              style={{ width:17, height:17, borderRadius:4, border:`1.5px solid ${block.checked?"var(--teal)":"var(--border2)"}`, background:block.checked?"var(--teal)":"transparent", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", flexShrink:0, marginTop:4 }}>
              {block.checked && <span style={{ color:"#fff", fontSize:10, fontWeight:900 }}>✓</span>}
            </div>
            <textarea ref={inputRef} value={block.content} onChange={handleInput} onKeyDown={handleKeyDown} onPaste={handlePaste}
              style={{ ...sharedInputStyle, textDecoration:block.checked?"line-through":"none", opacity:block.checked?0.5:1, flex:1 }} rows={1}
              onInput={e => { e.target.style.height="auto"; e.target.style.height=e.target.scrollHeight+"px"; }} placeholder="To-do..." />
          </div>
        );

      case "bullet":
        return (
          <div style={{ display:"flex", alignItems:"flex-start", gap:10 }}>
            <span style={{ color:"var(--accent)", fontSize:18, lineHeight:1.6, flexShrink:0 }}>•</span>
            <textarea ref={inputRef} value={block.content} onChange={handleInput} onKeyDown={handleKeyDown}
              style={{ ...sharedInputStyle, flex:1 }} rows={1}
              onInput={e => { e.target.style.height="auto"; e.target.style.height=e.target.scrollHeight+"px"; }} placeholder="List item..." />
          </div>
        );

      case "numbered":
        return (
          <div style={{ display:"flex", alignItems:"flex-start", gap:10 }}>
            <span style={{ color:"var(--accent)", fontWeight:800, fontSize:14, lineHeight:1.8, flexShrink:0, minWidth:20, textAlign:"right" }}>{idx+1}.</span>
            <textarea ref={inputRef} value={block.content} onChange={handleInput} onKeyDown={handleKeyDown}
              style={{ ...sharedInputStyle, flex:1 }} rows={1}
              onInput={e => { e.target.style.height="auto"; e.target.style.height=e.target.scrollHeight+"px"; }} placeholder="List item..." />
          </div>
        );

      case "toggle":
        return (
          <div>
            <div style={{ display:"flex", alignItems:"flex-start", gap:8 }}>
              <span onClick={() => onUpdate({ open:!block.open })} style={{ cursor:"pointer", fontSize:12, color:"var(--text3)", flexShrink:0, marginTop:4, transition:"transform 0.15s", transform:block.open?"rotate(90deg)":"none" }}>▶</span>
              <textarea ref={inputRef} value={block.content} onChange={handleInput} onKeyDown={handleKeyDown}
                style={{ ...sharedInputStyle, fontWeight:600, flex:1 }} rows={1}
                onInput={e => { e.target.style.height="auto"; e.target.style.height=e.target.scrollHeight+"px"; }} placeholder="Toggle..." />
            </div>
            {block.open && (
              <div style={{ paddingLeft:24, marginTop:4, borderLeft:"2px solid var(--border)", paddingTop:4 }}>
                {(block.children||[]).length === 0 && <div style={{ fontSize:13, color:"var(--text3)", padding:"4px 0" }}>Click to add content...</div>}
              </div>
            )}
          </div>
        );

      case "quote":
        return (
          <div style={{ display:"flex", gap:12, paddingLeft:4 }}>
            <div style={{ width:3, borderRadius:4, background:"var(--accent)", flexShrink:0 }} />
            <textarea ref={inputRef} value={block.content} onChange={handleInput} onKeyDown={handleKeyDown}
              style={{ ...sharedInputStyle, fontSize:16, fontStyle:"italic", color:"var(--text2)", flex:1 }} rows={1}
              onInput={e => { e.target.style.height="auto"; e.target.style.height=e.target.scrollHeight+"px"; }} placeholder="Quote..." />
          </div>
        );

      case "callout":
        return (
          <div style={{ display:"flex", gap:12, padding:"12px 16px", background:"rgba(255,107,53,0.06)", border:"1px solid rgba(255,107,53,0.14)", borderRadius:12 }}>
            <span style={{ fontSize:20, flexShrink:0 }}>{block.icon||"💡"}</span>
            <textarea ref={inputRef} value={block.content} onChange={handleInput} onKeyDown={handleKeyDown}
              style={{ ...sharedInputStyle, flex:1 }} rows={1}
              onInput={e => { e.target.style.height="auto"; e.target.style.height=e.target.scrollHeight+"px"; }} placeholder="Callout..." />
          </div>
        );

      case "code":
        return (
          <div style={{ borderRadius:12, overflow:"hidden", border:"1px solid var(--border)" }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"6px 12px", background:"var(--surface2)", borderBottom:"1px solid var(--border)" }}>
              <select value={block.lang||"javascript"} onChange={e => onUpdate({ lang:e.target.value })}
                style={{ background:"transparent", border:"none", color:"var(--text3)", fontSize:11, fontFamily:"monospace", cursor:"pointer", outline:"none" }}>
                {["javascript","python","typescript","html","css","sql","bash","json","go","rust","java","cpp"].map(l => <option key={l} value={l}>{l}</option>)}
              </select>
              <button onClick={() => navigator.clipboard?.writeText(block.content)} style={{ fontSize:11, color:"var(--text3)", background:"transparent", border:"none", cursor:"pointer", fontFamily:"inherit" }}>Copy</button>
            </div>
            <textarea value={block.content} onChange={e => onUpdate({ content:e.target.value })}
              style={{ width:"100%", background:"var(--surface2)", border:"none", outline:"none", padding:"14px 16px", color:"var(--teal)", fontFamily:"monospace", fontSize:13, lineHeight:1.7, resize:"vertical", minHeight:80, boxSizing:"border-box" }}
              placeholder="// Write code here..." />
          </div>
        );

      case "math":
        return (
          <div style={{ padding:"10px 16px", background:"var(--surface2)", borderRadius:12, border:"1px solid var(--border)" }}>
            <div style={{ fontSize:11, color:"var(--text3)", marginBottom:6, fontWeight:700 }}>∑ LaTeX</div>
            <textarea value={block.content} onChange={e => onUpdate({ content:e.target.value })}
              style={{ width:"100%", background:"transparent", border:"none", outline:"none", color:"var(--text)", fontFamily:"monospace", fontSize:14, lineHeight:1.6, resize:"none", boxSizing:"border-box" }}
              rows={1} onInput={e => { e.target.style.height="auto"; e.target.style.height=e.target.scrollHeight+"px"; }}
              placeholder="e.g. E = mc^2" />
            {block.content && <div style={{ marginTop:8, padding:"8px 12px", background:"var(--surface3)", borderRadius:8, fontSize:15, color:"var(--indigo)", fontStyle:"italic" }}>{block.content}</div>}
          </div>
        );

      case "image":
        return (
          <div style={{ borderRadius:12, overflow:"hidden" }}>
            {block.url
              ? <img src={block.url} alt={block.caption||"image"} style={{ width:"100%", maxHeight:400, objectFit:"cover", display:"block" }} onError={e => e.target.style.display="none"} />
              : (
                <div style={{ border:"2px dashed var(--border)", borderRadius:12, padding:"30px", textAlign:"center" }}>
                  <div style={{ fontSize:32, marginBottom:8 }}>🖼</div>
                  <div style={{ fontSize:13, color:"var(--text3)", marginBottom:10 }}>Paste an image URL</div>
                  <input placeholder="https://..." value={block.url||""} onChange={e => onUpdate({ url:e.target.value })}
                    style={{ width:"80%", padding:"8px 12px", background:"var(--input-bg)", border:"1px solid var(--border)", borderRadius:8, color:"var(--text)", fontSize:13, fontFamily:"inherit", outline:"none" }} />
                </div>
              )
            }
            {block.url && (
              <input value={block.caption||""} onChange={e => onUpdate({ caption:e.target.value })} placeholder="Caption..."
                style={{ width:"100%", padding:"6px 8px", background:"transparent", border:"none", outline:"none", color:"var(--text3)", fontSize:12, textAlign:"center", fontFamily:"inherit" }} />
            )}
          </div>
        );

      case "video":
        const ytId = block.url ? (block.url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/)||[])[1] : null;
        return (
          <div style={{ borderRadius:12, overflow:"hidden" }}>
            {ytId
              ? <div style={{ position:"relative", paddingBottom:"56.25%", height:0 }}><iframe title="video" src={`https://www.youtube.com/embed/${ytId}`} style={{ position:"absolute", top:0, left:0, width:"100%", height:"100%", border:"none", borderRadius:12 }} allowFullScreen /></div>
              : (
                <div style={{ border:"2px dashed var(--border)", borderRadius:12, padding:"30px", textAlign:"center" }}>
                  <div style={{ fontSize:32, marginBottom:8 }}>▶️</div>
                  <div style={{ fontSize:13, color:"var(--text3)", marginBottom:10 }}>Paste a YouTube URL</div>
                  <input placeholder="https://youtube.com/..." value={block.url||""} onChange={e => onUpdate({ url:e.target.value })}
                    style={{ width:"80%", padding:"8px 12px", background:"var(--input-bg)", border:"1px solid var(--border)", borderRadius:8, color:"var(--text)", fontSize:13, fontFamily:"inherit", outline:"none" }} />
                </div>
              )
            }
          </div>
        );

      case "bookmark":
        return (
          <div style={{ border:"1px solid var(--border)", borderRadius:12, overflow:"hidden", cursor:"pointer", transition:"all 0.15s" }}
            onClick={() => block.url && window.open(block.url, "_blank")}
            onMouseEnter={e => e.currentTarget.style.borderColor = "var(--accent)"}
            onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border)"}>
            {block.url
              ? <div style={{ padding:"14px 16px", display:"flex", alignItems:"center", gap:12 }}>
                  <div style={{ width:40, height:40, borderRadius:10, background:"var(--surface3)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, flexShrink:0 }}>🔖</div>
                  <div>
                    <div style={{ fontSize:13, fontWeight:700, color:"var(--text)" }}>{block.content || block.url}</div>
                    <div style={{ fontSize:11, color:"var(--text3)", marginTop:2 }}>{block.url}</div>
                  </div>
                </div>
              : <div style={{ padding:"14px 16px" }}>
                  <input placeholder="Paste URL to create bookmark..." value={block.url||""} onChange={e => onUpdate({ url:e.target.value })}
                    style={{ width:"100%", background:"transparent", border:"none", outline:"none", color:"var(--text)", fontSize:13, fontFamily:"inherit" }} />
                </div>
            }
          </div>
        );

      case "toc":
        const headings = allBlocks ? allBlocks.filter(b => ["h1","h2","h3"].includes(b.type)) : [];
        return (
          <div style={{ padding:"12px 16px", background:"var(--surface2)", borderRadius:12, border:"1px solid var(--border)" }}>
            <div style={{ fontSize:11, fontWeight:800, color:"var(--text3)", textTransform:"uppercase", letterSpacing:"1px", marginBottom:8 }}>📑 Table of Contents</div>
            {headings.length === 0 && <div style={{ fontSize:12, color:"var(--text3)" }}>Add headings to auto-generate TOC</div>}
            {headings.map((h, i) => (
              <div key={i} style={{ padding:"3px 0", paddingLeft: h.type==="h2"?12:h.type==="h3"?24:0, fontSize:13, color:"var(--text2)", cursor:"pointer" }}
                onMouseEnter={e => e.currentTarget.style.color = "var(--accent)"}
                onMouseLeave={e => e.currentTarget.style.color = "var(--text2)"}>
                {h.type==="h1"?"• ":h.type==="h2"?"◦ ":"▸ "}{h.content||"Untitled heading"}
              </div>
            ))}
          </div>
        );

      case "subpage":
        return (
          <div style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px", background:"var(--surface2)", border:"1px solid var(--border)", borderRadius:12, cursor:"pointer", transition:"all 0.15s" }}
            onMouseEnter={e => { e.currentTarget.style.background="var(--surface3)"; e.currentTarget.style.borderColor="var(--accent)"; }}
            onMouseLeave={e => { e.currentTarget.style.background="var(--surface2)"; e.currentTarget.style.borderColor="var(--border)"; }}
            onClick={() => { if (block.linkedPageId && onNavigatePage) onNavigatePage(block.linkedPageId); }}>
            <span style={{ fontSize:18 }}>{block.icon||"📄"}</span>
            <span style={{ fontSize:13, fontWeight:600, color:"var(--text)", flex:1 }}>{block.content||"Untitled page"}</span>
            <span style={{ fontSize:11, color:"var(--text3)" }}>↗</span>
          </div>
        );

      case "database":
        return <InlineDatabase block={block} onUpdate={onUpdate} />;

      case "columns":
        return (
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
            <div style={{ background:"var(--surface2)", borderRadius:12, padding:"12px", border:"1px solid var(--border)", minHeight:80 }}>
              <div style={{ fontSize:11, color:"var(--text3)", marginBottom:8, fontWeight:700 }}>Column 1</div>
              <textarea value={(block.leftBlocks||[{content:""}])[0]?.content||""} onChange={e => onUpdate({ leftBlocks:[{...(block.leftBlocks||[{}])[0], content:e.target.value}], rightBlocks:block.rightBlocks||[{content:""}] })}
                style={{ width:"100%", background:"transparent", border:"none", outline:"none", color:"var(--text)", fontSize:14, lineHeight:1.7, resize:"none", fontFamily:"inherit", boxSizing:"border-box" }}
                rows={3} placeholder="Left column..." />
            </div>
            <div style={{ background:"var(--surface2)", borderRadius:12, padding:"12px", border:"1px solid var(--border)", minHeight:80 }}>
              <div style={{ fontSize:11, color:"var(--text3)", marginBottom:8, fontWeight:700 }}>Column 2</div>
              <textarea value={(block.rightBlocks||[{content:""}])[0]?.content||""} onChange={e => onUpdate({ rightBlocks:[{...(block.rightBlocks||[{}])[0], content:e.target.value}], leftBlocks:block.leftBlocks||[{content:""}] })}
                style={{ width:"100%", background:"transparent", border:"none", outline:"none", color:"var(--text)", fontSize:14, lineHeight:1.7, resize:"none", fontFamily:"inherit", boxSizing:"border-box" }}
                rows={3} placeholder="Right column..." />
            </div>
          </div>
        );

      default: // text, h1, h2, h3
        return (
          <textarea ref={inputRef} value={block.content} onChange={handleInput} onKeyDown={handleKeyDown} onPaste={handlePaste}
            style={{ ...sharedInputStyle }}
            rows={1} onInput={e => { e.target.style.height="auto"; e.target.style.height=e.target.scrollHeight+"px"; }}
            placeholder={block.type==="h1"?"Heading 1":block.type==="h2"?"Heading 2":block.type==="h3"?"Heading 3":"Type '/' for commands..."} />
        );
    }
  })();

  return (
    <div style={{ position:"relative", marginLeft, padding:"2px 0", background:blockBg, borderRadius:blockBg!=="transparent"?10:0 }}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      {hovered && (
        <div style={{ display:"flex", gap:2, opacity:1, position:"absolute", right:0, top:0, zIndex:10 }}>
          <button onClick={onMoveUp} disabled={idx===0} style={{ ...tbtn, opacity:idx===0?0.3:1 }}>↑</button>
          <button onClick={onMoveDown} disabled={idx===total-1} style={{ ...tbtn, opacity:idx===total-1?0.3:1 }}>↓</button>
          <button onClick={onDuplicate} style={tbtn}>⧉</button>
          <button onClick={onAddBelow} style={tbtn}>+</button>
          <button onClick={onDelete} style={{ ...tbtn, color:"#F43F5E" }}>🗑</button>
        </div>
      )}
      {content}
      {slashOpen && <SlashMenu query={slashQuery} onSelect={handleSlashSelect} pos={slashPos} />}
    </div>
  );
}

// ─── PAGE EDITOR ──────────────────────────────────────────────────────────────
function PageEditor({ page, onUpdate, onClose, allPages, onNavigatePage }) {
  const [blocks, setBlocks] = useState(page.blocks || [newBlock("text")]);
  const [cover, setCover] = useState(page.cover || "");
  const [icon, setIcon] = useState(page.icon || "📄");
  const [title, setTitle] = useState(page.title || "");
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [showCoverPicker, setShowCoverPicker] = useState(false);
  const [showLinkPage, setShowLinkPage] = useState(false);
  const [versions, setVersions] = useState(page.versions || []);
  const [showVersions, setShowVersions] = useState(false);
  const saveTimer = useRef(null);
  const titleRef = useRef();

  function save(newBlocks, newTitle, newCover, newIcon) {
    const b = newBlocks || blocks;
    const t = newTitle !== undefined ? newTitle : title;
    const c = newCover !== undefined ? newCover : cover;
    const ic = newIcon !== undefined ? newIcon : icon;
    const snapshot = { blocks:b, title:t, savedAt:new Date().toISOString() };
    const newVersions = [snapshot, ...(versions||[])].slice(0, 20);
    setVersions(newVersions);
    onUpdate({ ...page, blocks:b, title:t, cover:c, icon:ic, versions:newVersions, updatedAt:new Date().toISOString() });
  }

  function autoSave(b, t, c, ic) {
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => save(b, t, c, ic), 1500);
  }

  function updateBlock(id, changes) {
    const nb = blocks.map(b => b.id === id ? { ...b, ...changes } : b);
    setBlocks(nb); autoSave(nb);
  }
  function deleteBlock(id) {
    const nb = blocks.filter(b => b.id !== id);
    if (!nb.length) { const n = [newBlock()]; setBlocks(n); autoSave(n); return; }
    setBlocks(nb); autoSave(nb);
  }
  function duplicateBlock(id) {
    const idx = blocks.findIndex(b => b.id === id);
    const dup = { ...blocks[idx], id:uid() };
    const nb = [...blocks.slice(0, idx+1), dup, ...blocks.slice(idx+1)];
    setBlocks(nb); autoSave(nb);
  }
  function addBlockBelow(id) {
    const idx = blocks.findIndex(b => b.id === id);
    const nb = [...blocks.slice(0, idx+1), newBlock(), ...blocks.slice(idx+1)];
    setBlocks(nb); autoSave(nb);
  }
  function moveBlock(id, dir) {
    const idx = blocks.findIndex(b => b.id === id);
    if (dir === -1 && idx === 0) return;
    if (dir === 1 && idx === blocks.length-1) return;
    const nb = [...blocks];
    [nb[idx], nb[idx+dir]] = [nb[idx+dir], nb[idx]];
    setBlocks(nb); autoSave(nb);
  }

  function exportMD() {
    const md = ["# " + (title || "Untitled"), ""].concat(blocks.map(b => {
      if (b.type === "h1") return "# " + b.content;
      if (b.type === "h2") return "## " + b.content;
      if (b.type === "h3") return "### " + b.content;
      if (b.type === "bullet") return "- " + b.content;
      if (b.type === "numbered") return "1. " + b.content;
      if (b.type === "todo") return (b.checked ? "- [x] " : "- [ ] ") + b.content;
      if (b.type === "quote") return "> " + b.content;
      if (b.type === "code") return "```" + (b.lang||"") + "\n" + b.content + "\n```";
      if (b.type === "divider") return "---";
      return b.content || "";
    })).join("\n");
    const a = document.createElement("a");
    a.href = "data:text/markdown;charset=utf-8," + encodeURIComponent(md);
    a.download = (title || "page") + ".md";
    a.click();
  }

  function exportHTML() {
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title||"Page"}</title><style>body{font-family:sans-serif;max-width:800px;margin:50px auto;color:#111;line-height:1.6}h1{font-size:2em}h2{font-size:1.5em}code{background:#f1f1f1;padding:2px 6px;border-radius:4px}pre{background:#f1f1f1;padding:16px;border-radius:8px}blockquote{border-left:3px solid #FF6B35;padding-left:16px;color:#555}</style></head><body><h1>${title||"Untitled"}</h1>${blocks.map(b=>{if(b.type==="h1")return`<h1>${b.content}</h1>`;if(b.type==="h2")return`<h2>${b.content}</h2>`;if(b.type==="h3")return`<h3>${b.content}</h3>`;if(b.type==="bullet")return`<ul><li>${b.content}</li></ul>`;if(b.type==="todo")return`<p>${b.checked?"✅":"☐"} ${b.content}</p>`;if(b.type==="quote")return`<blockquote>${b.content}</blockquote>`;if(b.type==="code")return`<pre><code>${b.content}</code></pre>`;if(b.type==="divider")return`<hr>`;return`<p>${b.content||"&nbsp;"}</p>`;}).join("")}</body></html>`;
    const a = document.createElement("a");
    a.href = "data:text/html;charset=utf-8," + encodeURIComponent(html);
    a.download = (title || "page") + ".html";
    a.click();
  }

  const wordCount = blocks.reduce((s, b) => s + (b.content||"").split(/\s+/).filter(Boolean).length, 0);

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"100%", background:"var(--bg)" }}>
      {/* Toolbar */}
      <div style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 16px", borderBottom:"1px solid var(--border)", background:"var(--surface)", flexShrink:0 }}>
        <button onClick={onClose} style={{ ...tbtn, display:"flex", alignItems:"center", gap:4 }}>← Back</button>
        <div style={{ flex:1 }} />
        <span style={{ fontSize:11, color:"var(--text3)" }}>{wordCount} words</span>
        <button onClick={() => setShowVersions(v => !v)} style={tbtn}>🕐 History</button>
        <button onClick={exportMD} style={tbtn}>↓ MD</button>
        <button onClick={exportHTML} style={tbtn}>↓ HTML</button>
        <button onClick={() => { clearTimeout(saveTimer.current); save(); }} style={{ ...tbtn, background:"rgba(16,185,129,0.1)", color:"var(--teal)", border:"1px solid rgba(16,185,129,0.2)" }}>💾 Save</button>
      </div>

      <div style={{ display:"flex", flex:1, overflow:"hidden" }}>
        {/* Main editor */}
        <div style={{ flex:1, overflowY:"auto", padding:"0 0 80px" }}>
          {/* Cover */}
          {cover && (
            <div style={{ height:180, background:cover.startsWith("http") ? `url(${cover}) center/cover` : cover, position:"relative", cursor:"pointer" }} onClick={() => setShowCoverPicker(c => !c)}>
              <div style={{ position:"absolute", bottom:10, right:10, display:"flex", gap:6 }}>
                <button onClick={e => { e.stopPropagation(); setShowCoverPicker(c => !c); }} style={{ fontSize:11, padding:"4px 10px", background:"rgba(0,0,0,0.5)", border:"none", borderRadius:8, color:"#fff", cursor:"pointer", fontFamily:"inherit" }}>Change cover</button>
                <button onClick={e => { e.stopPropagation(); setCover(""); autoSave(blocks, title, "", icon); }} style={{ fontSize:11, padding:"4px 10px", background:"rgba(0,0,0,0.5)", border:"none", borderRadius:8, color:"#fff", cursor:"pointer", fontFamily:"inherit" }}>Remove</button>
              </div>
            </div>
          )}

          {/* Page content */}
          <div style={{ maxWidth:780, margin:"0 auto", padding:"40px 48px" }}>
            {/* Icon + title */}
            <div style={{ marginBottom:16 }}>
              <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:4 }}>
                <span onClick={() => setShowIconPicker(i => !i)} style={{ fontSize:48, cursor:"pointer", transition:"transform 0.15s" }}
                  onMouseEnter={e => e.currentTarget.style.transform="scale(1.1)"}
                  onMouseLeave={e => e.currentTarget.style.transform="scale(1)"}>
                  {icon}
                </span>
                <div style={{ display:"flex", gap:6 }}>
                  {!cover && (
                    <button onClick={() => setShowCoverPicker(c => !c)} style={{ fontSize:12, padding:"4px 10px", background:"var(--surface2)", border:"1px solid var(--border)", borderRadius:8, color:"var(--text3)", cursor:"pointer", fontFamily:"inherit" }}>
                      🖼 Add cover
                    </button>
                  )}
                  <button onClick={() => setShowLinkPage(l => !l)} style={{ fontSize:12, padding:"4px 10px", background:"var(--surface2)", border:"1px solid var(--border)", borderRadius:8, color:"var(--text3)", cursor:"pointer", fontFamily:"inherit" }}>
                    🔗 Link page
                  </button>
                </div>
              </div>

              {/* Icon picker */}
              {showIconPicker && (
                <div style={{ display:"flex", flexWrap:"wrap", gap:6, padding:"10px", background:"var(--modal-bg)", border:"1px solid var(--border)", borderRadius:12, marginBottom:10, maxWidth:300, boxShadow:"var(--shadow)" }}>
                  {PAGE_ICONS.map(ic => (
                    <span key={ic} onClick={() => { setIcon(ic); setShowIconPicker(false); autoSave(blocks, title, cover, ic); }}
                      style={{ fontSize:22, cursor:"pointer", padding:"4px", borderRadius:8, transition:"background 0.1s" }}
                      onMouseEnter={e => e.currentTarget.style.background="var(--hover-bg)"}
                      onMouseLeave={e => e.currentTarget.style.background=""}>{ic}</span>
                  ))}
                </div>
              )}

              {/* Cover picker */}
              {showCoverPicker && (
                <div style={{ padding:"12px", background:"var(--modal-bg)", border:"1px solid var(--border)", borderRadius:12, marginBottom:10, boxShadow:"var(--shadow)" }}>
                  <div style={{ fontSize:11, fontWeight:700, color:"var(--text3)", marginBottom:8, textTransform:"uppercase" }}>Cover Colors</div>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:10 }}>
                    {COVERS.map((c, i) => (
                      <div key={i} onClick={() => { setCover(c); setShowCoverPicker(false); autoSave(blocks, title, c, icon); }}
                        style={{ width:64, height:36, background:c, borderRadius:8, cursor:"pointer", border: cover===c ? "2px solid var(--accent)" : "2px solid transparent", transition:"border 0.15s" }} />
                    ))}
                  </div>
                  <div style={{ fontSize:11, fontWeight:700, color:"var(--text3)", marginBottom:6, textTransform:"uppercase" }}>Image URL</div>
                  <input placeholder="https://..." onKeyDown={e => { if (e.key === "Enter") { setCover(e.target.value); setShowCoverPicker(false); autoSave(blocks, title, e.target.value, icon); } }}
                    style={{ width:"100%", padding:"7px 10px", background:"var(--input-bg)", border:"1px solid var(--border)", borderRadius:8, color:"var(--text)", fontSize:12, fontFamily:"inherit", outline:"none", boxSizing:"border-box" }} />
                </div>
              )}

              {/* Link page picker */}
              {showLinkPage && allPages && (
                <div style={{ background:"var(--modal-bg)", border:"1px solid var(--border)", borderRadius:12, marginBottom:10, overflow:"hidden", boxShadow:"var(--shadow)" }}>
                  <div style={{ padding:"8px 12px", fontSize:11, fontWeight:700, color:"var(--text3)", borderBottom:"1px solid var(--border)" }}>🔗 Link to page</div>
                  {allPages.filter(p => p.id !== page.id).map(p => (
                    <div key={p.id} onClick={() => {
                      const linkBlock = newBlock("subpage");
                      linkBlock.content = p.title || "Untitled";
                      linkBlock.icon = p.icon || "📄";
                      linkBlock.linkedPageId = p.id;
                      const nb = [...blocks, linkBlock];
                      setBlocks(nb); autoSave(nb);
                      setShowLinkPage(false);
                    }} style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 12px", cursor:"pointer", transition:"background 0.1s" }}
                      onMouseEnter={e => e.currentTarget.style.background="var(--hover-bg)"}
                      onMouseLeave={e => e.currentTarget.style.background=""}>
                      <span>{p.icon||"📄"}</span>
                      <span style={{ fontSize:13, color:"var(--text)" }}>{p.title||"Untitled"}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Title */}
              <textarea ref={titleRef} value={title} onChange={e => { setTitle(e.target.value); autoSave(blocks, e.target.value, cover, icon); }}
                style={{ width:"100%", background:"transparent", border:"none", outline:"none", fontFamily:"var(--font-head)", fontSize:"clamp(28px,4vw,42px)", fontWeight:900, letterSpacing:"-1px", color:"var(--text)", resize:"none", lineHeight:1.2, boxSizing:"border-box", padding:0 }}
                rows={1} onInput={e => { e.target.style.height="auto"; e.target.style.height=e.target.scrollHeight+"px"; }}
                placeholder="Untitled" />
            </div>

            {/* Blocks */}
            <div style={{ display:"flex", flexDirection:"column", gap:2 }}>
              {blocks.map((block, idx) => (
                <Block key={block.id} block={block} idx={idx} total={blocks.length} allBlocks={blocks}
                  onUpdate={changes => updateBlock(block.id, changes)}
                  onDelete={() => deleteBlock(block.id)}
                  onDuplicate={() => duplicateBlock(block.id)}
                  onMoveUp={() => moveBlock(block.id, -1)}
                  onMoveDown={() => moveBlock(block.id, 1)}
                  onAddBelow={() => addBlockBelow(block.id)}
                  onNavigatePage={onNavigatePage} />
              ))}
            </div>

            {/* Add block button */}
            <div style={{ marginTop:20 }}>
              <button onClick={() => { const nb = [...blocks, newBlock()]; setBlocks(nb); autoSave(nb); }}
                style={{ fontSize:13, padding:"8px 16px", background:"transparent", border:"1px dashed var(--border)", borderRadius:10, color:"var(--text3)", cursor:"pointer", fontFamily:"inherit", transition:"all 0.15s" }}
                onMouseEnter={e => { e.currentTarget.style.borderColor="var(--accent)"; e.currentTarget.style.color="var(--accent)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor="var(--border)"; e.currentTarget.style.color="var(--text3)"; }}>
                + Add block
              </button>
            </div>
          </div>
        </div>

        {/* Version history sidebar */}
        {showVersions && (
          <div style={{ width:240, borderLeft:"1px solid var(--border)", background:"var(--surface)", overflowY:"auto", flexShrink:0 }}>
            <div style={{ padding:"12px 14px", borderBottom:"1px solid var(--border)", fontWeight:800, fontSize:13, color:"var(--text)" }}>🕐 Version History</div>
            {(versions||[]).length === 0 && <div style={{ padding:"16px", fontSize:12, color:"var(--text3)" }}>No versions yet</div>}
            {(versions||[]).map((v, i) => (
              <div key={i} style={{ padding:"10px 14px", borderBottom:"1px solid var(--border)", cursor:"pointer", transition:"background 0.1s" }}
                onMouseEnter={e => e.currentTarget.style.background="var(--hover-bg)"}
                onMouseLeave={e => e.currentTarget.style.background=""}>
                <div style={{ fontSize:12, fontWeight:700, color:"var(--text)" }}>{i===0?"Current":"Version "+(versions.length-i)}</div>
                <div style={{ fontSize:11, color:"var(--text3)", marginTop:2 }}>{v.savedAt ? new Date(v.savedAt).toLocaleString("en-IN",{hour:"2-digit",minute:"2-digit",month:"short",day:"numeric"}) : "—"}</div>
                {i > 0 && (
                  <button onClick={() => { setBlocks(v.blocks||[]); setTitle(v.title||""); }} style={{ marginTop:6, fontSize:11, padding:"3px 8px", background:"rgba(255,107,53,0.1)", border:"1px solid rgba(255,107,53,0.2)", borderRadius:6, color:"var(--accent)", cursor:"pointer", fontFamily:"inherit" }}>Restore</button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── MAIN NOTION PAGE ─────────────────────────────────────────────────────────
export default function NotionPage() {
  const { user } = useAuth();
  const [pages, setPages] = useState([]);
  const [activePage, setActivePage] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [sortBy, setSortBy] = useState("updated");

  useEffect(() => {
    if (!user) return;
    return subscribeToNotes(user.uid, data => { setPages(data); setLoading(false); });
  }, [user]);

  async function createPage(template) {
    setCreating(true);
    const blocks = template === "blank" ? [newBlock("text")] : getTemplate(template);
    const id = await addNote(user.uid, {
      title: template === "blank" ? "" : "New " + template,
      icon: "📄", cover: "", blocks, versions: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    });
    setCreating(false);
    const created = { id, title:"", icon:"📄", cover:"", blocks, versions:[] };
    setActivePage(created);
  }

  function getTemplate(t) {
    if (t === "meeting") return [
      newBlock("h1", { content:"Meeting Notes" }),
      newBlock("text", { content:"📅 Date: " + todayStr() }),
      newBlock("h2", { content:"Attendees" }),
      newBlock("bullet", { content:"" }),
      newBlock("h2", { content:"Agenda" }),
      newBlock("numbered", { content:"" }),
      newBlock("h2", { content:"Action Items" }),
      newBlock("todo", { content:"" }),
    ];
    if (t === "project") return [
      newBlock("h1", { content:"Project Overview" }),
      newBlock("callout", { content:"Project goal", icon:"🎯" }),
      newBlock("h2", { content:"Timeline" }),
      newBlock("database"),
      newBlock("h2", { content:"Notes" }),
      newBlock("text", { content:"" }),
    ];
    if (t === "journal") return [
      newBlock("h1", { content:"Journal — " + new Date().toLocaleDateString("en-IN",{weekday:"long",month:"long",day:"numeric"}) }),
      newBlock("h2", { content:"Aaj kya hua?" }),
      newBlock("text", { content:"" }),
      newBlock("h2", { content:"Grateful for..." }),
      newBlock("bullet", { content:"" }),
      newBlock("h2", { content:"Tomorrow's plan" }),
      newBlock("todo", { content:"" }),
    ];
    return [newBlock("text")];
  }

  async function updatePage(page) {
    await updateNote(user.uid, page.id, page);
    setPages(p => p.map(x => x.id === page.id ? page : x));
    if (activePage?.id === page.id) setActivePage(page);
  }

  async function deletePage(id) {
    await deleteNote(user.uid, id);
    if (activePage?.id === id) setActivePage(null);
  }

  const filtered = pages
    .filter(p => !search || (p.title||"").toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === "updated") return (b.updatedAt||"").localeCompare(a.updatedAt||"");
      if (sortBy === "created") return (b.createdAt||"").localeCompare(a.createdAt||"");
      return (a.title||"").localeCompare(b.title||"");
    });

  // Editor — inside app layout (no fixed, keeps theme working)
  if (activePage) return (
    <div style={{ height:"calc(100vh - 56px)", display:"flex", flexDirection:"column" }}>
      <PageEditor page={activePage} onUpdate={updatePage} onClose={() => setActivePage(null)} allPages={pages}
        onNavigatePage={id => { const p = pages.find(x => x.id === id); if (p) setActivePage(p); }} />
    </div>
  );

  // Pages list
  return (
    <div style={{ maxWidth:1100, margin:"0 auto" }}>
      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20, flexWrap:"wrap", gap:12 }}>
        <div>
          <h1 style={{ fontFamily:"var(--font-head)", fontSize:26, fontWeight:900, color:"var(--text)", letterSpacing:"-1px" }}>📄 Pages</h1>
          <div style={{ fontSize:13, color:"var(--text3)", marginTop:3 }}>{pages.length} pages — apni duniya likho</div>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Search pages..."
            style={{ padding:"8px 14px", background:"var(--surface2)", border:"1px solid var(--border)", borderRadius:20, color:"var(--text)", fontSize:13, fontFamily:"inherit", outline:"none", width:200 }} />
          <select value={sortBy} onChange={e => setSortBy(e.target.value)}
            style={{ padding:"8px 12px", background:"var(--surface2)", border:"1px solid var(--border)", borderRadius:10, color:"var(--text)", fontSize:12, fontFamily:"inherit", outline:"none" }}>
            <option value="updated">Last updated</option>
            <option value="created">Created</option>
            <option value="title">Title A-Z</option>
          </select>
        </div>
      </div>

      {/* Quick create templates */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:20 }}>
        {[
          { id:"blank", icon:"✨", label:"Blank Page", desc:"Empty canvas", color:"var(--indigo)" },
          { id:"meeting", icon:"👥", label:"Meeting Notes", desc:"Attendees + action items", color:"var(--accent)" },
          { id:"project", icon:"🚀", label:"Project", desc:"Overview + database", color:"var(--teal)" },
          { id:"journal", icon:"📖", label:"Daily Journal", desc:"Thoughts + gratitude", color:"var(--gold)" },
        ].map(t => (
          <button key={t.id} onClick={() => createPage(t.id)} disabled={creating}
            style={{ display:"flex", alignItems:"center", gap:10, padding:"12px 14px", background:"var(--surface)", border:"1px solid var(--border)", borderRadius:14, cursor:"pointer", transition:"all 0.18s", textAlign:"left", fontFamily:"inherit" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor=t.color; e.currentTarget.style.transform="translateY(-2px)"; e.currentTarget.style.boxShadow=`0 8px 24px ${t.color}18`; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor="var(--border)"; e.currentTarget.style.transform="none"; e.currentTarget.style.boxShadow="none"; }}>
            <div style={{ width:36, height:36, borderRadius:10, background:t.color+"14", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}>{t.icon}</div>
            <div>
              <div style={{ fontSize:13, fontWeight:700, color:"var(--text)" }}>{t.label}</div>
              <div style={{ fontSize:11, color:"var(--text3)" }}>{t.desc}</div>
            </div>
          </button>
        ))}
      </div>

      {/* Pages grid */}
      {loading && <div style={{ textAlign:"center", padding:"60px", color:"var(--text3)" }}>Loading pages...</div>}
      {!loading && filtered.length === 0 && (
        <div style={{ textAlign:"center", padding:"60px 20px", color:"var(--text3)" }}>
          <div style={{ fontSize:48, marginBottom:12 }}>📝</div>
          <div style={{ fontSize:16, fontWeight:700, color:"var(--text2)", marginBottom:6 }}>{search ? "Koi page nahi mila" : "Abhi tak koi page nahi"}</div>
          <div style={{ fontSize:13 }}>{search ? "Search change karo" : "Upar se ek template choose karo!"}</div>
        </div>
      )}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))", gap:12 }}>
        {filtered.map(page => (
          <div key={page.id}
            style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:16, overflow:"hidden", cursor:"pointer", transition:"all 0.18s" }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow="var(--shadow)"; e.currentTarget.style.transform="translateY(-2px)"; e.currentTarget.style.borderColor="var(--border2)"; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow="none"; e.currentTarget.style.transform="none"; e.currentTarget.style.borderColor="var(--border)"; }}
            onClick={() => setActivePage(page)}>
            {/* Mini cover */}
            <div style={{ height:60, background: page.cover || "var(--surface3)", display:"flex", alignItems:"flex-end", padding:"8px 12px" }}>
              <span style={{ fontSize:28 }}>{page.icon||"📄"}</span>
            </div>
            <div style={{ padding:"12px 14px" }}>
              <div style={{ fontSize:14, fontWeight:800, color:"var(--text)", marginBottom:4, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{page.title||"Untitled"}</div>
              <div style={{ fontSize:12, color:"var(--text3)", marginBottom:10, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                {(page.blocks||[]).find(b => b.type==="text" && b.content)?.content || "Empty page"}
              </div>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                <span style={{ fontSize:11, color:"var(--text3)" }}>
                  {page.updatedAt ? new Date(page.updatedAt).toLocaleDateString("en-IN",{month:"short",day:"numeric"}) : "—"}
                </span>
                <div style={{ display:"flex", gap:4 }}>
                  <span style={{ fontSize:11, padding:"2px 7px", background:"var(--surface2)", borderRadius:20, color:"var(--text3)" }}>
                    {(page.blocks||[]).length} blocks
                  </span>
                  <button onClick={e => { e.stopPropagation(); if (confirm("Delete this page?")) deletePage(page.id); }}
                    style={{ fontSize:12, padding:"2px 6px", background:"transparent", border:"none", color:"var(--text3)", cursor:"pointer", borderRadius:6, transition:"all 0.1s" }}
                    onMouseEnter={e => { e.currentTarget.style.background="rgba(244,63,94,0.1)"; e.currentTarget.style.color="#F43F5E"; }}
                    onMouseLeave={e => { e.currentTarget.style.background="transparent"; e.currentTarget.style.color="var(--text3)"; }}>🗑</button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}