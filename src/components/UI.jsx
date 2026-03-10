// 🧩 UI Components v3 — Premium Dark Design
import { useState, useEffect } from "react";

// ─── Toast ────────────────────────────────────────────
let _addToast = null;
export const toast = (msg, type = "default") => _addToast?.(msg, type);

export function ToastContainer() {
  const [toasts, setToasts] = useState([]);
  _addToast = (msg, type) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
  };
  const styles = {
    success: { bg: "linear-gradient(135deg,#10B981,#059669)", icon: "✓" },
    error:   { bg: "linear-gradient(135deg,#F43F5E,#DC2626)", icon: "✕" },
    default: { bg: "linear-gradient(135deg,#1A1A26,#222232)", icon: "●" },
  };
  return (
    <div style={{ position:"fixed", bottom:24, right:24, zIndex:9999, display:"flex", flexDirection:"column", gap:8, pointerEvents:"none" }}>
      {toasts.map(t => {
        const s = styles[t.type] || styles.default;
        return (
          <div key={t.id} className="slide-up" style={{ background: s.bg, color:"#fff", padding:"13px 18px", borderRadius:12, fontSize:13, fontWeight:600, boxShadow:"0 8px 32px rgba(0,0,0,0.5)", maxWidth:320, display:"flex", alignItems:"center", gap:10, border:"1px solid rgba(255,255,255,0.1)" }}>
            <span style={{ width:20, height:20, borderRadius:"50%", background:"rgba(255,255,255,0.2)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, flexShrink:0 }}>{s.icon}</span>
            {t.msg}
          </div>
        );
      })}
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────
export function Modal({ title, onClose, children, footer, maxWidth = 540 }) {
  useEffect(() => {
    const h = e => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", h); document.body.style.overflow = ""; };
  }, [onClose]);

  return (
    <div className="fade-in" onClick={e => e.target === e.currentTarget && onClose()} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.75)", backdropFilter:"blur(8px)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000, padding:20 }}>
      <div className="bounce-in" style={{ background:"var(--surface)", borderRadius:20, padding:"28px 28px 24px", width:"100%", maxWidth, maxHeight:"90vh", overflowY:"auto", boxShadow:"var(--shadow-xl)", border:"1px solid var(--border)" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:22 }}>
          <div style={{ fontFamily:"var(--font-head)", fontSize:18, fontWeight:700, letterSpacing:"-0.3px" }}>{title}</div>
          <button onClick={onClose} style={{ width:32, height:32, borderRadius:8, border:"1px solid var(--border)", background:"var(--surface2)", cursor:"pointer", color:"var(--text2)", fontSize:18, display:"flex", alignItems:"center", justifyContent:"center", transition:"all var(--t)" }}>×</button>
        </div>
        {children}
        {footer && <div style={{ display:"flex", gap:10, justifyContent:"flex-end", marginTop:22, paddingTop:18, borderTop:"1px solid var(--border)" }}>{footer}</div>}
      </div>
    </div>
  );
}

// ─── Btn ──────────────────────────────────────────────
export function Btn({ children, onClick, variant="primary", size="md", disabled, style:s={} }) {
  const base = { display:"inline-flex", alignItems:"center", gap:6, border:"none", cursor:disabled?"not-allowed":"pointer", fontFamily:"var(--font-body)", fontWeight:600, transition:"all var(--t)", borderRadius:10, opacity:disabled?0.5:1, letterSpacing:"0.1px", ...(size==="sm"?{padding:"6px 14px",fontSize:12}:{padding:"10px 20px",fontSize:13}) };
  const variants = {
    primary: { background:"linear-gradient(135deg,var(--accent),var(--accent2))", color:"#fff", boxShadow:"0 4px 14px rgba(255,107,53,0.35)" },
    teal:    { background:"linear-gradient(135deg,var(--teal),#059669)", color:"#fff", boxShadow:"0 4px 14px rgba(16,185,129,0.3)" },
    ghost:   { background:"var(--surface2)", color:"var(--text2)", border:"1px solid var(--border)" },
    danger:  { background:"rgba(244,63,94,0.12)", color:"var(--rose)", border:"1px solid rgba(244,63,94,0.25)" },
    cyan:    { background:"linear-gradient(135deg,var(--cyan),var(--indigo))", color:"#fff", boxShadow:"0 4px 14px rgba(34,211,238,0.25)" },
  };
  return <button style={{ ...base, ...variants[variant]||variants.ghost, ...s }} onClick={onClick} disabled={disabled}>{children}</button>;
}

// ─── Badge ────────────────────────────────────────────
export function Badge({ children, color, bg }) {
  return <span style={{ display:"inline-flex", alignItems:"center", padding:"2px 9px", borderRadius:20, fontSize:11, fontWeight:700, color:color||"var(--text2)", background:bg||"var(--surface2)", letterSpacing:"0.2px" }}>{children}</span>;
}

export function PriorityBadge({ priority }) {
  const m = {
    high:   { c:"#F43F5E", bg:"rgba(244,63,94,0.12)",  border:"rgba(244,63,94,0.25)",  l:"● High" },
    medium: { c:"#F59E0B", bg:"rgba(245,158,11,0.12)", border:"rgba(245,158,11,0.25)", l:"● Medium" },
    low:    { c:"#10B981", bg:"rgba(16,185,129,0.12)", border:"rgba(16,185,129,0.25)", l:"● Low" },
  };
  const x = m[priority]||m.low;
  return <span style={{ display:"inline-flex", alignItems:"center", padding:"2px 9px", borderRadius:20, fontSize:11, fontWeight:700, color:x.c, background:x.bg, border:`1px solid ${x.border}` }}>{x.l}</span>;
}

export function CatBadge({ cat }) {
  const m = {
    study:    { c:"#6366F1", bg:"rgba(99,102,241,0.12)",  l:"📚 Study" },
    work:     { c:"#22D3EE", bg:"rgba(34,211,238,0.12)",  l:"💼 Work" },
    personal: { c:"#F43F5E", bg:"rgba(244,63,94,0.12)",   l:"🏠 Personal" },
  };
  const x = m[cat]||m.personal;
  return <Badge color={x.c} bg={x.bg}>{x.l}</Badge>;
}

// ─── Toggle ───────────────────────────────────────────
export function Toggle({ on, onChange }) {
  return (
    <div onClick={() => onChange(!on)} style={{ width:44, height:24, borderRadius:20, cursor:"pointer", background:on?"linear-gradient(135deg,var(--accent),var(--accent2))":"var(--surface3)", position:"relative", transition:"background var(--t)", flexShrink:0, boxShadow:on?"0 0 12px rgba(255,107,53,0.4)":"none" }}>
      <div style={{ position:"absolute", width:18, height:18, borderRadius:"50%", background:"#fff", top:3, left:on?23:3, transition:"left var(--t)", boxShadow:"0 2px 6px rgba(0,0,0,0.3)" }} />
    </div>
  );
}

// ─── Chip ─────────────────────────────────────────────
export function Chip({ label, active, onClick }) {
  return (
    <div onClick={onClick} style={{ padding:"5px 14px", borderRadius:20, fontSize:12, fontWeight:600, cursor:"pointer", border:`1px solid ${active?"var(--accent)":"var(--border)"}`, background:active?"rgba(255,107,53,0.15)":"var(--surface2)", color:active?"var(--accent)":"var(--text2)", transition:"all var(--t)", userSelect:"none", whiteSpace:"nowrap" }}>
      {label}
    </div>
  );
}

// ─── Card ─────────────────────────────────────────────
export function Card({ children, style:s={}, onClick, glow }) {
  return (
    <div onClick={onClick} style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:"var(--radius)", padding:20, transition:"all var(--t)", boxShadow:glow?"0 0 30px rgba(255,107,53,0.1)":"var(--shadow)", ...s }}>
      {children}
    </div>
  );
}

// ─── Empty ────────────────────────────────────────────
export function Empty({ emoji, text, sub }) {
  return (
    <div style={{ textAlign:"center", padding:"56px 20px", color:"var(--text3)" }}>
      <div style={{ fontSize:44, marginBottom:14, filter:"grayscale(0.3)" }}>{emoji}</div>
      <div style={{ fontSize:16, fontWeight:700, color:"var(--text2)", marginBottom:6, fontFamily:"var(--font-head)" }}>{text}</div>
      {sub && <div style={{ fontSize:13 }}>{sub}</div>}
    </div>
  );
}

// ─── Loader ───────────────────────────────────────────
export function Loader() {
  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:200 }}>
      <div style={{ width:36, height:36, borderRadius:"50%", border:"3px solid var(--surface3)", borderTopColor:"var(--accent)", animation:"spin 0.7s linear infinite", boxShadow:"0 0 16px rgba(255,107,53,0.3)" }} />
    </div>
  );
}

// ─── ProgressBar ──────────────────────────────────────
export function ProgressBar({ value, color="var(--accent)", height=6 }) {
  return (
    <div style={{ background:"var(--surface3)", borderRadius:20, height, overflow:"hidden" }}>
      <div style={{ height:"100%", width:`${Math.min(value,100)}%`, background:color, borderRadius:20, transition:"width 0.5s ease", boxShadow:`0 0 8px ${color}60` }} />
    </div>
  );
}

// ─── SectionHeader ────────────────────────────────────
export function SectionHeader({ title, action }) {
  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:16 }}>
      <div style={{ fontFamily:"var(--font-head)", fontSize:15, fontWeight:700, letterSpacing:"-0.2px" }}>{title}</div>
      {action}
    </div>
  );
}

// ─── StatCard ─────────────────────────────────────────
export function StatCard({ icon, number, label, color="var(--accent)", glow }) {
  return (
    <div style={{ background:"var(--surface)", border:"1px solid var(--border)", borderRadius:"var(--radius)", padding:"20px 16px", textAlign:"center", boxShadow:glow?`0 0 24px ${color}25`:"var(--shadow)", position:"relative", overflow:"hidden", transition:"all var(--t)" }}>
      <div style={{ position:"absolute", top:-20, right:-20, width:80, height:80, borderRadius:"50%", background:`${color}10`, pointerEvents:"none" }} />
      <div style={{ fontSize:28, marginBottom:8 }}>{icon}</div>
      <div style={{ fontFamily:"var(--font-head)", fontSize:34, fontWeight:800, lineHeight:1, color, marginBottom:6, letterSpacing:"-1px" }}>{number}</div>
      <div style={{ fontSize:12, color:"var(--text3)", fontWeight:500, letterSpacing:"0.3px", textTransform:"uppercase" }}>{label}</div>
    </div>
  );
}

// ─── Input ────────────────────────────────────────────
export function Input({ label, type="text", value, onChange, placeholder, required, autoFocus, rows }) {
  const s = { background:"var(--surface2)", border:"1px solid var(--border)", borderRadius:10, color:"var(--text)", fontSize:14, padding:"10px 14px", fontFamily:"var(--font-body)", outline:"none", transition:"border-color var(--t)", width:"100%", resize:rows?"vertical":undefined };
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
      {label && <label style={{ fontSize:11, fontWeight:700, color:"var(--text3)", letterSpacing:"0.8px", textTransform:"uppercase" }}>{label}</label>}
      {rows ? <textarea style={s} rows={rows} value={value} onChange={onChange} placeholder={placeholder} /> : <input style={s} type={type} value={value} onChange={onChange} placeholder={placeholder} required={required} autoFocus={autoFocus} />}
    </div>
  );
}

// ─── Select ───────────────────────────────────────────
export function Select({ label, value, onChange, options }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
      {label && <label style={{ fontSize:11, fontWeight:700, color:"var(--text3)", letterSpacing:"0.8px", textTransform:"uppercase" }}>{label}</label>}
      <select value={value} onChange={onChange} style={{ background:"var(--surface2)", border:"1px solid var(--border)", borderRadius:10, color:"var(--text)", fontSize:14, padding:"10px 14px", fontFamily:"var(--font-body)", outline:"none", width:"100%", cursor:"pointer" }}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}
