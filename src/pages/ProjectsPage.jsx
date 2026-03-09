// 📁 ProjectsPage — ClickUp-style Projects with task linking
import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { addProject, updateProject, deleteProject, updateTask } from "../firebase/services";
import { Modal, Btn, Empty, Card, ProgressBar, SectionHeader, Chip } from "../components/UI";
import { toast } from "../components/UI";
import { useLang } from "../i18n/translations";

const PROJECT_COLORS = ["#FF6B35","#0A7B6C","#4A5CDB","#D4456A","#E6A817","#7C3AED","#059669","#DC2626"];
const PROJECT_EMOJIS = ["📁","🚀","💼","🎯","📚","🔧","🌟","💡","🏗️","🎨","📊","🌐"];

const inp = { background: "var(--surface2)", border: "1.5px solid var(--border)", borderRadius: 10, color: "var(--text)", fontSize: 14, padding: "10px 13px", fontFamily: "var(--font-body)", outline: "none", width: "100%" };
const lbl = { fontSize: 12, fontWeight: 600, color: "var(--text2)", display: "block", marginBottom: 5 };

function ProjectFormModal({ initial, onSave, onClose }) {
  const [form, setForm] = useState(initial || { name: "", description: "", color: "#FF6B35", emoji: "📁", dueDate: "", status: "active" });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.name.trim()) { toast("Project ka naam daalo!", "error"); return; }
    setSaving(true);
    await onSave(form);
    setSaving(false); onClose();
  };

  return (
    <Modal title={initial?.id ? "Project Edit Karo" : "Naya Project"} onClose={onClose} maxWidth={520}
      footer={<><Btn variant="ghost" onClick={onClose}>Cancel</Btn><Btn onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save Karo"}</Btn></>}>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {/* Emoji + Name */}
        <div style={{ display: "flex", gap: 10 }}>
          <div>
            <label style={lbl}>Icon</label>
            <select style={{ ...inp, width: 70, textAlign: "center", fontSize: 20 }} value={form.emoji} onChange={e => set("emoji", e.target.value)}>
              {PROJECT_EMOJIS.map(e => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <label style={lbl}>Project Name *</label>
            <input style={inp} placeholder="e.g. Website Redesign" value={form.name} onChange={e => set("name", e.target.value)} autoFocus />
          </div>
        </div>

        <div>
          <label style={lbl}>Description</label>
          <textarea style={{ ...inp, resize: "vertical" }} rows={2} placeholder="Project ke baare mein..." value={form.description} onChange={e => set("description", e.target.value)} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div>
            <label style={lbl}>Due Date</label>
            <input type="date" style={inp} value={form.dueDate} onChange={e => set("dueDate", e.target.value)} />
          </div>
          <div>
            <label style={lbl}>Status</label>
            <select style={inp} value={form.status} onChange={e => set("status", e.target.value)}>
              <option value="active">🟢 Active</option>
              <option value="paused">⏸ Paused</option>
              <option value="completed">✅ Completed</option>
              <option value="archived">🗄️ Archived</option>
            </select>
          </div>
        </div>

        {/* Color picker */}
        <div>
          <label style={lbl}>Color</label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {PROJECT_COLORS.map(c => (
              <div key={c} onClick={() => set("color", c)} style={{ width: 28, height: 28, borderRadius: "50%", background: c, cursor: "pointer", border: `3px solid ${form.color === c ? "var(--text)" : "transparent"}`, transition: "border-color 0.15s" }} />
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}

export default function ProjectsPage({ projects, tasks }) {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [editProject, setEditProject] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [filter, setFilter] = useState("all");

  const handleSave = async (form) => {
    if (editProject?.id) { await updateProject(user.uid, editProject.id, form); toast("Project updated! ✅"); }
    else { await addProject(user.uid, form); toast("Project created! 🚀", "success"); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Project delete karna chahte ho?")) return;
    await deleteProject(user.uid, id); toast("Deleted!"); setSelectedProject(null);
  };

  const getProjectTasks = (pid) => tasks.filter(t => t.projectId === pid);
  const getProgress = (pid) => {
    const pt = getProjectTasks(pid);
    if (!pt.length) return 0;
    return Math.round(pt.filter(t => t.done).length / pt.length * 100);
  };

  const STATUS_COLORS = { active: { c: "var(--teal)", bg: "#E6F7F5", l: "🟢 Active" }, paused: { c: "var(--gold)", bg: "#FFF8E6", l: "⏸ Paused" }, completed: { c: "var(--indigo)", bg: "#EEF0FF", l: "✅ Done" }, archived: { c: "var(--text3)", bg: "var(--surface2)", l: "🗄️ Archived" } };
  const fmtD = d => { try { return new Date(d).toLocaleDateString("en-IN", { month: "short", day: "numeric" }); } catch { return ""; } };

  const filtered = projects.filter(p => filter === "all" || p.status === filter);
  const selected = selectedProject ? projects.find(p => p.id === selectedProject) : null;
  const selTasks = selected ? getProjectTasks(selected.id) : [];

  return (
    <div style={{ display: "grid", gridTemplateColumns: selected ? "320px 1fr" : "1fr", gap: 16 }}>
      {/* Projects List */}
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div style={{ fontFamily: "var(--font-head)", fontSize: 17, fontWeight: 700 }}>📁 Projects</div>
          <Btn onClick={() => { setEditProject(null); setShowForm(true); }}>+ New</Btn>
        </div>

        {/* Status filter */}
        <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
          {["all", "active", "paused", "completed", "archived"].map(f => (
            <Chip key={f} label={f.charAt(0).toUpperCase() + f.slice(1)} active={filter === f} onClick={() => setFilter(f)} />
          ))}
        </div>

        {filtered.length === 0 ? (
          <Empty emoji="📁" text="Koi project nahi" sub="Apna pehla project banao!" />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {filtered.map(p => {
              const pct = getProgress(p.id); const pt = getProjectTasks(p.id);
              const st = STATUS_COLORS[p.status] || STATUS_COLORS.active;
              const isSelected = selectedProject === p.id;
              return (
                <div key={p.id} onClick={() => setSelectedProject(isSelected ? null : p.id)} style={{
                  background: "var(--surface)", border: `2px solid ${isSelected ? p.color : "var(--border)"}`,
                  borderRadius: 14, padding: "14px 16px", cursor: "pointer", transition: "all 0.2s",
                  borderLeft: `4px solid ${p.color}`,
                }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: p.color + "20", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>{p.emoji}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 3 }}>{p.name}</div>
                      {p.description && <div style={{ fontSize: 12, color: "var(--text2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.description}</div>}
                    </div>
                    <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                      <button onClick={e => { e.stopPropagation(); setEditProject(p); setShowForm(true); }} style={{ padding: "4px 6px", border: "none", borderRadius: 6, background: "var(--surface2)", cursor: "pointer", fontSize: 12 }}>✏️</button>
                      <button onClick={e => { e.stopPropagation(); handleDelete(p.id); }} style={{ padding: "4px 6px", border: "none", borderRadius: 6, background: "#FFF0F0", cursor: "pointer", fontSize: 12 }}>🗑️</button>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <ProgressBar value={pct} color={p.color} height={5} />
                    <span style={{ fontSize: 11, fontWeight: 700, color: p.color, whiteSpace: "nowrap" }}>{pct}%</span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 9px", borderRadius: 20, background: st.bg, color: st.c }}>{st.l}</span>
                    <span style={{ fontSize: 11, color: "var(--text3)" }}>📋 {pt.length} tasks</span>
                    {p.dueDate && <span style={{ fontSize: 11, color: "var(--text3)" }}>📅 {fmtD(p.dueDate)}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Project Detail */}
      {selected && (
        <div className="slide-up">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: selected.color + "20", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>{selected.emoji}</div>
              <div>
                <div style={{ fontFamily: "var(--font-head)", fontSize: 17, fontWeight: 700 }}>{selected.name}</div>
                {selected.description && <div style={{ fontSize: 12, color: "var(--text2)" }}>{selected.description}</div>}
              </div>
            </div>
            <button onClick={() => setSelectedProject(null)} style={{ padding: "6px 10px", border: "none", borderRadius: 8, background: "var(--surface2)", cursor: "pointer", fontSize: 18, color: "var(--text2)" }}>×</button>
          </div>

          {/* Stats row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 16 }}>
            {[
              { icon: "📋", val: selTasks.length, label: "Total" },
              { icon: "✅", val: selTasks.filter(t => t.done).length, label: "Done" },
              { icon: "⏳", val: selTasks.filter(t => !t.done).length, label: "Pending" },
              { icon: "⏱", val: selTasks.reduce((s, t) => s + (t.timeSpent || 0), 0) + "m", label: "Time Spent" },
            ].map(s => (
              <div key={s.label} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "12px", textAlign: "center" }}>
                <div style={{ fontSize: 20 }}>{s.icon}</div>
                <div style={{ fontFamily: "var(--font-head)", fontSize: 20, fontWeight: 800, color: selected.color }}>{s.val}</div>
                <div style={{ fontSize: 11, color: "var(--text2)" }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Overall progress */}
          <Card style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontWeight: 600, fontSize: 14 }}>Overall Progress</span>
              <span style={{ fontFamily: "var(--font-head)", fontWeight: 800, color: selected.color, fontSize: 18 }}>{getProgress(selected.id)}%</span>
            </div>
            <ProgressBar value={getProgress(selected.id)} color={selected.color} height={10} />
          </Card>

          {/* Tasks in project */}
          <Card>
            <SectionHeader title="Tasks" action={<span style={{ fontSize: 12, color: "var(--text3)" }}>{selTasks.filter(t => t.done).length}/{selTasks.length}</span>} />
            {selTasks.length === 0 ? (
              <div style={{ textAlign: "center", padding: "20px", color: "var(--text3)", fontSize: 13 }}>
                No tasks linked.<br />Kisi task ke form mein project select karo!
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {selTasks.map(task => (
                  <div key={task.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 11px", background: "var(--surface2)", borderRadius: 9 }}>
                    <div style={{ width: 18, height: 18, borderRadius: 5, border: `2px solid ${task.done ? "var(--teal)" : "var(--border)"}`, background: task.done ? "var(--teal)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 10, flexShrink: 0 }}>{task.done && "✓"}</div>
                    <span style={{ flex: 1, fontSize: 13, fontWeight: 500, textDecoration: task.done ? "line-through" : "none", opacity: task.done ? 0.6 : 1 }}>{task.title}</span>
                    <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 10, fontWeight: 700, background: task.priority === "high" ? "#FFF0F5" : "#FFF8E6", color: task.priority === "high" ? "var(--rose)" : "var(--gold)" }}>{task.priority}</span>
                    {task.timeSpent > 0 && <span style={{ fontSize: 10, color: "var(--text3)" }}>⏱ {task.timeSpent}m</span>}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {showForm && <ProjectFormModal initial={editProject} onSave={handleSave} onClose={() => { setShowForm(false); setEditProject(null); }} />}
    </div>
  );
}
