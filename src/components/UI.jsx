// 🧩 UI Components v2 — Karyika
import { useState, useEffect } from "react";

// ─── Toast ────────────────────────────────────────────────────────────────────
let _addToast = null;
export const toast = (msg, type = "default") => _addToast?.(msg, type);

export function ToastContainer() {
  const [toasts, setToasts] = useState([]);
  _addToast = (msg, type) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
  };
  const colors = { success: "#0A7B6C", error: "#D4456A", default: "#1C1815" };
  return (
    <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999, display: "flex", flexDirection: "column", gap: 8, pointerEvents: "none" }}>
      {toasts.map(t => (
        <div key={t.id} className="slide-up" style={{ background: colors[t.type] || colors.default, color: "#fff", padding: "12px 18px", borderRadius: 12, fontSize: 13, fontWeight: 500, boxShadow: "var(--shadow-lg)", maxWidth: 320 }}>{t.msg}</div>
      ))}
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────
export function Modal({ title, onClose, children, footer, maxWidth = 520 }) {
  useEffect(() => {
    const h = e => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);
  return (
    <div className="fade-in" style={{ position: "fixed", inset: 0, background: "rgba(28,24,21,0.5)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20 }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bounce-in" style={{ background: "var(--surface)", borderRadius: 20, padding: "26px 26px 22px", width: "100%", maxWidth, maxHeight: "90vh", overflowY: "auto", boxShadow: "var(--shadow-xl)", border: "1px solid var(--border)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div style={{ fontFamily: "var(--font-head)", fontSize: 17, fontWeight: 700 }}>{title}</div>
          <button onClick={onClose} style={{ background: "var(--surface2)", border: "none", borderRadius: 8, width: 30, height: 30, cursor: "pointer", fontSize: 16, color: "var(--text2)", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
        </div>
        {children}
        {footer && <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 }}>{footer}</div>}
      </div>
    </div>
  );
}

// ─── Btn ──────────────────────────────────────────────────────────────────────
export function Btn({ children, onClick, variant = "primary", size = "md", disabled, style: s = {} }) {
  const base = { display: "inline-flex", alignItems: "center", gap: 6, border: "none", cursor: disabled ? "not-allowed" : "pointer", fontFamily: "var(--font-body)", fontWeight: 600, transition: "all var(--t)", borderRadius: 10, opacity: disabled ? 0.6 : 1, ...(size === "sm" ? { padding: "6px 13px", fontSize: 12 } : { padding: "10px 18px", fontSize: 13 }) };
  const variants = { primary: { background: "var(--accent)", color: "#fff" }, teal: { background: "var(--teal)", color: "#fff" }, ghost: { background: "var(--surface2)", color: "var(--text2)", border: "1px solid var(--border)" }, danger: { background: "#FFF0F0", color: "var(--high)", border: "1px solid #FFD0D0" } };
  return <button style={{ ...base, ...variants[variant], ...s }} onClick={onClick} disabled={disabled}>{children}</button>;
}

// ─── Badges ───────────────────────────────────────────────────────────────────
export function Badge({ children, color, bg }) {
  return <span style={{ display: "inline-flex", alignItems: "center", padding: "2px 9px", borderRadius: 20, fontSize: 11, fontWeight: 700, color: color || "var(--text2)", background: bg || "var(--surface2)" }}>{children}</span>;
}
export function PriorityBadge({ priority }) {
  const m = { high: { c: "#D4456A", bg: "#FFF0F5", l: "🔴 High" }, medium: { c: "#B87A00", bg: "#FFF8E6", l: "🟡 Medium" }, low: { c: "#0A7B6C", bg: "#E6F7F5", l: "🟢 Low" } };
  const x = m[priority] || m.low;
  return <Badge color={x.c} bg={x.bg}>{x.l}</Badge>;
}
export function CatBadge({ cat }) {
  const m = { study: { c: "#4A5CDB", bg: "#EEF0FF", l: "📚 Study" }, work: { c: "#0A7B6C", bg: "#E6F7F5", l: "💼 Work" }, personal: { c: "#D4456A", bg: "#FFF0F5", l: "🏠 Personal" } };
  const x = m[cat] || m.personal;
  return <Badge color={x.c} bg={x.bg}>{x.l}</Badge>;
}

// ─── Toggle ───────────────────────────────────────────────────────────────────
export function Toggle({ on, onChange }) {
  return (
    <div onClick={() => onChange(!on)} style={{ width: 42, height: 24, borderRadius: 20, cursor: "pointer", background: on ? "var(--accent)" : "var(--border)", position: "relative", transition: "background var(--t)", flexShrink: 0 }}>
      <div style={{ position: "absolute", width: 18, height: 18, borderRadius: "50%", background: "#fff", top: 3, left: on ? 21 : 3, transition: "left var(--t)", boxShadow: "0 1px 4px rgba(0,0,0,0.2)" }} />
    </div>
  );
}

// ─── Chip ─────────────────────────────────────────────────────────────────────
export function Chip({ label, active, onClick }) {
  return <div onClick={onClick} style={{ padding: "5px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: "pointer", border: `1.5px solid ${active ? "var(--accent)" : "var(--border)"}`, background: active ? "var(--accent)" : "var(--surface)", color: active ? "#fff" : "var(--text2)", transition: "all var(--t)", userSelect: "none" }}>{label}</div>;
}

// ─── Card ─────────────────────────────────────────────────────────────────────
export function Card({ children, style: s = {}, onClick }) {
  return <div onClick={onClick} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: 20, boxShadow: "var(--shadow)", transition: "all var(--t)", ...s }}>{children}</div>;
}

// ─── Empty ────────────────────────────────────────────────────────────────────
export function Empty({ emoji, text, sub }) {
  return (
    <div style={{ textAlign: "center", padding: "48px 20px", color: "var(--text3)" }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>{emoji}</div>
      <div style={{ fontSize: 15, fontWeight: 600, color: "var(--text2)", marginBottom: 4 }}>{text}</div>
      {sub && <div style={{ fontSize: 13 }}>{sub}</div>}
    </div>
  );
}

// ─── Loader ───────────────────────────────────────────────────────────────────
export function Loader() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 200 }}>
      <div style={{ width: 36, height: 36, borderRadius: "50%", border: "3px solid var(--surface2)", borderTopColor: "var(--accent)", animation: "spin 0.8s linear infinite" }} />
    </div>
  );
}

// ─── ProgressBar ─────────────────────────────────────────────────────────────
export function ProgressBar({ value, color = "var(--accent)", height = 6 }) {
  return (
    <div style={{ background: "var(--surface2)", borderRadius: 20, height, overflow: "hidden" }}>
      <div style={{ height: "100%", width: `${Math.min(value, 100)}%`, background: color, borderRadius: 20, transition: "width 0.5s ease" }} />
    </div>
  );
}

// ─── SectionHeader ────────────────────────────────────────────────────────────
export function SectionHeader({ title, action }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
      <div style={{ fontFamily: "var(--font-head)", fontSize: 16, fontWeight: 700 }}>{title}</div>
      {action}
    </div>
  );
}

// ─── StatCard ─────────────────────────────────────────────────────────────────
export function StatCard({ icon, number, label, color = "var(--accent)" }) {
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius)", padding: "18px 16px", textAlign: "center", boxShadow: "var(--shadow)" }}>
      <div style={{ fontSize: 26, marginBottom: 6 }}>{icon}</div>
      <div style={{ fontFamily: "var(--font-head)", fontSize: 32, fontWeight: 800, lineHeight: 1, color, marginBottom: 4 }}>{number}</div>
      <div style={{ fontSize: 12, color: "var(--text2)", fontWeight: 500 }}>{label}</div>
    </div>
  );
}

// ─── Input (reusable) ─────────────────────────────────────────────────────────
export function Input({ label, type = "text", value, onChange, placeholder, required, autoFocus, rows }) {
  const s = { background: "var(--surface2)", border: "1.5px solid var(--border)", borderRadius: 10, color: "var(--text)", fontSize: 14, padding: "10px 13px", fontFamily: "var(--font-body)", outline: "none", transition: "all var(--t)", width: "100%", resize: rows ? "vertical" : undefined };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      {label && <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text2)", letterSpacing: "0.3px" }}>{label}</label>}
      {rows ? <textarea style={s} rows={rows} value={value} onChange={onChange} placeholder={placeholder} /> : <input style={s} type={type} value={value} onChange={onChange} placeholder={placeholder} required={required} autoFocus={autoFocus} />}
    </div>
  );
}

// ─── Select ───────────────────────────────────────────────────────────────────
export function Select({ label, value, onChange, options }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      {label && <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text2)", letterSpacing: "0.3px" }}>{label}</label>}
      <select value={value} onChange={onChange} style={{ background: "var(--surface2)", border: "1.5px solid var(--border)", borderRadius: 10, color: "var(--text)", fontSize: 14, padding: "10px 13px", fontFamily: "var(--font-body)", outline: "none", width: "100%", cursor: "pointer" }}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}
