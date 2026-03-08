// 📋 TasksPage v2 — Karyika Phase 1
// Features: Subtasks · Tags · Kanban · Eisenhower Matrix · Recurring · Est. Time

import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { addTask, updateTask, deleteTask } from "../firebase/services";
import { Modal, Btn, Badge, PriorityBadge, CatBadge, Chip, Empty, Loader } from "../components/UI";
import { toast } from "../components/UI";
import { useLang } from "../i18n/translations";

const todayStr = () => new Date().toISOString().split("T")[0];
const uid = () => Math.random().toString(36).slice(2, 10);
const fmt = d => { try { return new Date(d).toLocaleDateString("en-IN", { month: "short", day: "numeric" }); } catch { return d; } };

const EMPTY_FORM = {
  title: "", desc: "", due: todayStr(), priority: "medium", category: "study",
  reminder: "", recurring: "none", tags: [], subtasks: [],
  estimatedTime: "", urgency: "not-urgent", importance: "important", status: "todo",
};

const inp = { background: "var(--surface2)", border: "1.5px solid var(--border)", borderRadius: 10, color: "var(--text)", fontSize: 14, padding: "10px 13px", fontFamily: "var(--font-body)", outline: "none", width: "100%" };
const lbl = { fontSize: 12, fontWeight: 600, color: "var(--text2)", display: "block", marginBottom: 5 };

// ─── TASK FORM ────────────────────────────────────────────────────────────────
function TaskFormModal({ initial, onSave, onClose }) {
  const { t } = useLang();
  const [form, setForm] = useState(initial ? { ...EMPTY_FORM, ...initial } : EMPTY_FORM);
  const [tagInput, setTagInput] = useState("");
  const [subtaskInput, setSubtaskInput] = useState("");
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (!tag || (form.tags || []).includes(tag)) return;
    set("tags", [...(form.tags || []), tag]); setTagInput("");
  };
  const addSubtask = () => {
    if (!subtaskInput.trim()) return;
    set("subtasks", [...(form.subtasks || []), { id: uid(), title: subtaskInput.trim(), done: false }]);
    setSubtaskInput("");
  };

  const handleSave = async () => {
    if (!form.title.trim()) { toast("Title daalo!", "error"); return; }
    setSaving(true);
    await onSave(form);
    setSaving(false); onClose();
  };

  return (
    <Modal title={initial?.id ? t("editTask") : t("newTask")} onClose={onClose} maxWidth={600}
      footer={<><Btn variant="ghost" onClick={onClose}>{t("cancel")}</Btn><Btn onClick={handleSave} disabled={saving}>{saving ? t("saving") : t("saveTask")}</Btn></>}>
      <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
        <div><label style={lbl}>{t("taskTitle")}</label><input style={inp} placeholder={t("taskTitlePlaceholder")} value={form.title} onChange={e => set("title", e.target.value)} autoFocus /></div>
        <div><label style={lbl}>{t("description")}</label><textarea style={{ ...inp, resize: "vertical" }} rows={2} value={form.desc} onChange={e => set("desc", e.target.value)} /></div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
          <div><label style={lbl}>{t("dueDate")}</label><input type="date" style={inp} value={form.due} onChange={e => set("due", e.target.value)} /></div>
          <div><label style={lbl}>{t("priority")}</label>
            <select style={inp} value={form.priority} onChange={e => set("priority", e.target.value)}>
              <option value="high">🔴 {t("high")}</option><option value="medium">🟡 {t("medium")}</option><option value="low">🟢 {t("low")}</option>
            </select>
          </div>
          <div><label style={lbl}>{t("category")}</label>
            <select style={inp} value={form.category} onChange={e => set("category", e.target.value)}>
              <option value="study">📚 {t("study")}</option><option value="work">💼 {t("work")}</option><option value="personal">🏠 {t("personal")}</option>
            </select>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
          <div><label style={lbl}>🔔 {t("reminder")}</label><input type="time" style={inp} value={form.reminder} onChange={e => set("reminder", e.target.value)} /></div>
          <div><label style={lbl}>🔁 {t("reminderRecurring")}</label>
            <select style={inp} value={form.recurring} onChange={e => set("recurring", e.target.value)}>
              <option value="none">🚫 {t("doesNotRepeat")}</option>
              <option value="daily">📅 {t("daily")}</option>
              <option value="weekly">📆 {t("weekly")}</option>
              <option value="monthly">🗓️ {t("monthly")}</option>
              <option value="weekdays">🗂️ {t("weekdays")}</option>
            </select>
          </div>
          <div><label style={lbl}>⏱ {t("estimatedTime")}</label><input type="number" style={inp} placeholder="30" min="0" value={form.estimatedTime} onChange={e => set("estimatedTime", e.target.value)} /></div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div><label style={lbl}>⚡ Urgency</label>
            <select style={inp} value={form.urgency} onChange={e => set("urgency", e.target.value)}>
              <option value="urgent">🔥 Urgent</option><option value="not-urgent">🧘 Not Urgent</option>
            </select>
          </div>
          <div><label style={lbl}>⭐ Importance</label>
            <select style={inp} value={form.importance} onChange={e => set("importance", e.target.value)}>
              <option value="important">⭐ Important</option><option value="not-important">📌 Not Important</option>
            </select>
          </div>
        </div>

        {/* Tags */}
        <div>
          <label style={lbl}>🏷️ {t("tags")}</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
            {(form.tags || []).map(tag => (
              <span key={tag} style={{ background: "var(--accent)", color: "#fff", padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 5 }}>
                #{tag} <span onClick={() => set("tags", form.tags.filter(x => x !== tag))} style={{ cursor: "pointer", fontSize: 14 }}>×</span>
              </span>
            ))}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <input style={{ ...inp, flex: 1 }} placeholder={t("tagsPlaceholder")} value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addTag())} />
            <Btn size="sm" onClick={addTag}>+ Add</Btn>
          </div>
        </div>

        {/* Subtasks */}
        <div>
          <label style={lbl}>☑️ {t("subtasks")} ({(form.subtasks || []).filter(s => s.done).length}/{(form.subtasks || []).length})</label>
          {(form.subtasks || []).length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 8 }}>
              {(form.subtasks || []).map(s => (
                <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", background: "var(--surface2)", borderRadius: 8 }}>
                  <div onClick={() => set("subtasks", form.subtasks.map(x => x.id === s.id ? { ...x, done: !x.done } : x))} style={{ width: 18, height: 18, borderRadius: 5, border: `2px solid ${s.done ? "var(--teal)" : "var(--border)"}`, background: s.done ? "var(--teal)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#fff", fontSize: 10, flexShrink: 0 }}>{s.done && "✓"}</div>
                  <span style={{ flex: 1, fontSize: 13, textDecoration: s.done ? "line-through" : "none", opacity: s.done ? 0.6 : 1 }}>{s.title}</span>
                  <span onClick={() => set("subtasks", form.subtasks.filter(x => x.id !== s.id))} style={{ cursor: "pointer", color: "var(--text3)", fontSize: 16 }}>×</span>
                </div>
              ))}
            </div>
          )}
          <div style={{ display: "flex", gap: 8 }}>
            <input style={{ ...inp, flex: 1 }} placeholder={t("addSubtask")} value={subtaskInput} onChange={e => setSubtaskInput(e.target.value)} onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addSubtask())} />
            <Btn size="sm" onClick={addSubtask}>+ Add</Btn>
          </div>
        </div>
      </div>
    </Modal>
  );
}

// ─── TASK CARD ────────────────────────────────────────────────────────────────
function TaskCard({ task: t, onToggle, onEdit, onDelete, onToggleSubtask }) {
  const [expanded, setExpanded] = useState(false);
  const doneS = (t.subtasks || []).filter(s => s.done).length;
  const totalS = (t.subtasks || []).length;
  const isOverdue = !t.done && t.due && t.due < todayStr();

  return (
    <div style={{ background: "var(--surface)", border: "1.5px solid var(--border)", borderRadius: 12, opacity: t.done ? 0.6 : 1, borderLeftWidth: 3, borderLeftColor: t.priority === "high" ? "var(--rose)" : t.priority === "medium" ? "var(--gold)" : "var(--teal)", transition: "all 0.2s" }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "13px 14px" }}>
        <div onClick={() => onToggle(t)} style={{ width: 22, height: 22, borderRadius: 7, flexShrink: 0, marginTop: 1, border: `2px solid ${t.done ? "var(--teal)" : "var(--border)"}`, background: t.done ? "var(--teal)" : "var(--surface2)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#fff", fontSize: 11 }}>{t.done && "✓"}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
            <span style={{ fontWeight: 600, fontSize: 14, textDecoration: t.done ? "line-through" : "none" }}>{t.title}</span>
            {t.recurring && t.recurring !== "none" && <span style={{ fontSize: 10, background: "#E8F5E9", color: "#2E7D32", padding: "1px 7px", borderRadius: 10, fontWeight: 700 }}>🔁 {t.recurring}</span>}
            {isOverdue && <span style={{ fontSize: 10, background: "#FFF0F5", color: "var(--rose)", padding: "1px 7px", borderRadius: 10, fontWeight: 700 }}>⚠️ Overdue</span>}
          </div>
          {t.desc && <div style={{ fontSize: 12, color: "var(--text2)", marginTop: 2 }}>{t.desc}</div>}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 7 }}>
            <PriorityBadge priority={t.priority} />
            <CatBadge cat={t.category} />
            {t.due && <Badge bg="var(--surface2)" color="var(--text2)">📅 {fmt(t.due)}</Badge>}
            {t.reminder && <Badge bg="var(--surface2)" color="var(--text2)">🔔 {t.reminder}</Badge>}
            {t.estimatedTime > 0 && <Badge bg="var(--surface2)" color="var(--text2)">⏱ {t.estimatedTime}m</Badge>}
            {(t.tags || []).map(tag => <Badge key={tag} bg="rgba(91,76,255,0.1)" color="var(--accent)">#{tag}</Badge>)}
          </div>
          {totalS > 0 && (
            <div style={{ marginTop: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: expanded ? 6 : 0 }}>
                <div style={{ flex: 1, height: 4, background: "var(--surface2)", borderRadius: 10, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${(doneS / totalS) * 100}%`, background: "var(--teal)", borderRadius: 10, transition: "width 0.3s" }} />
                </div>
                <span style={{ fontSize: 10, color: "var(--text3)", fontWeight: 600 }}>{doneS}/{totalS}</span>
                <span onClick={() => setExpanded(e => !e)} style={{ fontSize: 11, color: "var(--accent)", cursor: "pointer", fontWeight: 700 }}>{expanded ? "▲" : "▼"}</span>
              </div>
              {expanded && (
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {(t.subtasks || []).map(s => (
                    <div key={s.id} onClick={() => onToggleSubtask(t.id, s.id)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 8px", background: "var(--surface2)", borderRadius: 7, cursor: "pointer" }}>
                      <div style={{ width: 16, height: 16, borderRadius: 4, border: `2px solid ${s.done ? "var(--teal)" : "var(--border)"}`, background: s.done ? "var(--teal)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 10, flexShrink: 0 }}>{s.done && "✓"}</div>
                      <span style={{ fontSize: 12, textDecoration: s.done ? "line-through" : "none", opacity: s.done ? 0.6 : 1 }}>{s.title}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
          <button onClick={onEdit} style={{ padding: "5px 7px", border: "none", borderRadius: 7, background: "var(--surface2)", cursor: "pointer", fontSize: 13 }}>✏️</button>
          <button onClick={() => onDelete(t.id)} style={{ padding: "5px 7px", border: "none", borderRadius: 7, background: "#FFF0F0", cursor: "pointer", fontSize: 13 }}>🗑️</button>
        </div>
      </div>
    </div>
  );
}

// ─── KANBAN ───────────────────────────────────────────────────────────────────
function KanbanView({ tasks, onToggle, onEdit, onStatusChange }) {
  const { t } = useLang();
  const cols = [
    { id: "todo", label: t("todo"), color: "var(--gold)", bg: "#FFF8E6" },
    { id: "inprogress", label: t("inProgress"), color: "var(--accent)", bg: "#EDEAFF" },
    { id: "done", label: t("done"), color: "var(--teal)", bg: "#E6F7F5" },
  ];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, alignItems: "start" }}>
      {cols.map(col => {
        const colTasks = tasks.filter(task => col.id === "done" ? task.done : task.status === col.id && !task.done);
        return (
          <div key={col.id} style={{ background: col.bg, borderRadius: 14, padding: 14, border: `1.5px solid ${col.color}40` }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: col.color }}>{col.label}</div>
              <div style={{ background: col.color, color: "#fff", borderRadius: 20, padding: "1px 9px", fontSize: 11, fontWeight: 700 }}>{colTasks.length}</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {colTasks.length === 0 && <div style={{ textAlign: "center", padding: "20px 0", color: "var(--text3)", fontSize: 12 }}>Empty ✨</div>}
              {colTasks.map(task => (
                <div key={task.id} style={{ background: "var(--surface)", borderRadius: 10, padding: "11px 12px", border: "1px solid var(--border)" }}>
                  <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 7 }}>{task.title}</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 8 }}>
                    <PriorityBadge priority={task.priority} />
                    {task.due && <Badge bg="var(--surface2)" color="var(--text2)">📅 {fmt(task.due)}</Badge>}
                    {(task.tags || []).map(tag => <Badge key={tag} bg="rgba(91,76,255,0.1)" color="var(--accent)">#{tag}</Badge>)}
                  </div>
                  <div style={{ display: "flex", gap: 5, justifyContent: "flex-end" }}>
                    {col.id !== "todo" && <button onClick={() => onStatusChange(task, col.id === "inprogress" ? "todo" : "inprogress")} style={{ fontSize: 10, padding: "3px 8px", border: "none", borderRadius: 6, background: "var(--surface2)", cursor: "pointer", color: "var(--text2)" }}>← Back</button>}
                    {col.id !== "done" && <button onClick={() => onStatusChange(task, col.id === "todo" ? "inprogress" : "done")} style={{ fontSize: 10, padding: "3px 8px", border: "none", borderRadius: 6, background: col.color, cursor: "pointer", color: "#fff" }}>Next →</button>}
                    <button onClick={() => onEdit(task)} style={{ fontSize: 12, padding: "3px 7px", border: "none", borderRadius: 6, background: "var(--surface2)", cursor: "pointer" }}>✏️</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── MATRIX ───────────────────────────────────────────────────────────────────
function MatrixView({ tasks, onEdit, onToggle }) {
  const { t } = useLang();
  const quads = [
    { urgency: "urgent", importance: "important", label: t("q1"), sub: t("q1Sub"), color: "var(--rose)", bg: "#FFF0F5" },
    { urgency: "not-urgent", importance: "important", label: t("q2"), sub: t("q2Sub"), color: "var(--teal)", bg: "#E6F7F5" },
    { urgency: "urgent", importance: "not-important", label: t("q3"), sub: t("q3Sub"), color: "var(--gold)", bg: "#FFF8E6" },
    { urgency: "not-urgent", importance: "not-important", label: t("q4"), sub: t("q4Sub"), color: "var(--text3)", bg: "var(--surface2)" },
  ];
  return (
    <div>
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <div style={{ fontFamily: "var(--font-head)", fontSize: 18, fontWeight: 700 }}>{t("matrixTitle")}</div>
        <div style={{ fontSize: 13, color: "var(--text2)", marginTop: 3 }}>{t("matrixSubtitle")}</div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-around", marginBottom: 6, fontSize: 11, fontWeight: 700, color: "var(--text3)" }}>
        <span style={{ color: "var(--rose)" }}>← URGENT</span><span>NOT URGENT →</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {quads.map((q, i) => {
          const qTasks = tasks.filter(task => !task.done && task.urgency === q.urgency && task.importance === q.importance);
          return (
            <div key={i} style={{ background: q.bg, borderRadius: 14, padding: 16, border: `2px solid ${q.color}40`, minHeight: 150 }}>
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontWeight: 800, fontSize: 14, color: q.color, fontFamily: "var(--font-head)" }}>{q.label}</div>
                <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 2 }}>{q.sub}</div>
              </div>
              {qTasks.length === 0
                ? <div style={{ textAlign: "center", padding: "12px 0", fontSize: 12, color: "var(--text3)" }}>✨ Clear!</div>
                : <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                  {qTasks.map(task => (
                    <div key={task.id} style={{ background: "var(--surface)", borderRadius: 9, padding: "9px 11px", border: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 8 }}>
                      <div onClick={() => onToggle(task)} style={{ width: 18, height: 18, borderRadius: 5, border: `2px solid ${q.color}`, flexShrink: 0, cursor: "pointer" }} />
                      <span style={{ flex: 1, fontSize: 12, fontWeight: 500 }}>{task.title}</span>
                      <button onClick={() => onEdit(task)} style={{ fontSize: 11, padding: "2px 6px", border: "none", borderRadius: 5, background: "var(--surface2)", cursor: "pointer" }}>✏️</button>
                    </div>
                  ))}
                </div>
              }
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function TasksPage({ tasks, loading }) {
  const { user } = useAuth();
  const { t } = useLang();
  const [showForm, setShowForm] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [catFilter, setCatFilter] = useState("all");
  const [tagFilter, setTagFilter] = useState("");
  const [sortBy, setSortBy] = useState("due");
  const [view, setView] = useState("list");

  const allTags = [...new Set(tasks.flatMap(t => t.tags || []))];

  const openEdit = (task) => { setEditTask(task); setShowForm(true); };

  const handleSave = async (form) => {
    if (editTask?.id) { await updateTask(user.uid, editTask.id, form); toast("Updated! ✅"); }
    else { await addTask(user.uid, { ...form, done: false }); toast("Task added! 🎉", "success"); }
  };

  const handleToggle = async (task) => {
    const newDone = !task.done;
    await updateTask(user.uid, task.id, { done: newDone, status: newDone ? "done" : "todo" });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this task?")) return;
    await deleteTask(user.uid, id); toast("Deleted!");
  };

  const handleToggleSubtask = async (taskId, subtaskId) => {
    const task = tasks.find(x => x.id === taskId); if (!task) return;
    const subtasks = (task.subtasks || []).map(s => s.id === subtaskId ? { ...s, done: !s.done } : s);
    await updateTask(user.uid, taskId, { subtasks });
  };

  const handleStatusChange = async (task, newStatus) => {
    await updateTask(user.uid, task.id, { status: newStatus, done: newStatus === "done" });
  };

  let filtered = tasks.filter(task => {
    if (filter === "pending") return !task.done;
    if (filter === "completed") return task.done;
    if (filter === "overdue") return !task.done && task.due < todayStr();
    if (filter === "today") return task.due === todayStr();
    return true;
  });
  if (catFilter !== "all") filtered = filtered.filter(t => t.category === catFilter);
  if (tagFilter) filtered = filtered.filter(t => (t.tags || []).includes(tagFilter));
  if (search) filtered = filtered.filter(t =>
    t.title?.toLowerCase().includes(search.toLowerCase()) ||
    t.desc?.toLowerCase().includes(search.toLowerCase()) ||
    (t.tags || []).some(tag => tag.includes(search.toLowerCase()))
  );
  filtered = [...filtered].sort((a, b) => {
    if (sortBy === "due") return (a.due || "zzzz").localeCompare(b.due || "zzzz");
    if (sortBy === "priority") return ["high", "medium", "low"].indexOf(a.priority) - ["high", "medium", "low"].indexOf(b.priority);
    return 0;
  });

  const counts = { all: tasks.length, today: tasks.filter(t => t.due === todayStr()).length, pending: tasks.filter(t => !t.done).length, completed: tasks.filter(t => t.done).length, overdue: tasks.filter(t => !t.done && t.due < todayStr()).length };

  if (loading) return <Loader />;

  return (
    <div>
      <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 180, position: "relative" }}>
          <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text3)", fontSize: 14, pointerEvents: "none" }}>🔍</span>
          <input placeholder={t("search")} value={search} onChange={e => setSearch(e.target.value)} style={{ background: "var(--surface2)", border: "1.5px solid var(--border)", borderRadius: 10, color: "var(--text)", fontSize: 14, padding: "10px 13px 10px 34px", fontFamily: "var(--font-body)", outline: "none", width: "100%" }} />
        </div>
        <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{ background: "var(--surface2)", border: "1.5px solid var(--border)", borderRadius: 10, color: "var(--text2)", fontSize: 13, padding: "10px 13px", fontFamily: "var(--font-body)", cursor: "pointer" }}>
          <option value="due">{t("sortDue")}</option>
          <option value="priority">{t("sortPriority")}</option>
        </select>
        <div style={{ display: "flex", background: "var(--surface2)", borderRadius: 10, padding: 3, gap: 2 }}>
          {[{ id: "list", icon: "☰", label: t("listView") }, { id: "kanban", icon: "⬛", label: t("kanbanView") }, { id: "matrix", icon: "⊞", label: t("matrixView") }].map(v => (
            <button key={v.id} onClick={() => setView(v.id)} style={{ padding: "7px 12px", border: "none", borderRadius: 8, cursor: "pointer", background: view === v.id ? "var(--accent)" : "transparent", color: view === v.id ? "#fff" : "var(--text2)", fontSize: 12, fontWeight: 600, fontFamily: "var(--font-body)", transition: "all 0.15s" }}>{v.icon} {v.label}</button>
          ))}
        </div>
        <Btn onClick={() => { setEditTask(null); setShowForm(true); }}>{t("addTask")}</Btn>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
        {[{ id: "all", label: `${t("all")} (${counts.all})` }, { id: "today", label: `📅 Today (${counts.today})` }, { id: "pending", label: `⏳ ${t("pending")} (${counts.pending})` }, { id: "completed", label: `✅ ${t("completed")} (${counts.completed})` }, { id: "overdue", label: `⚠️ Late (${counts.overdue})` }].map(f => <Chip key={f.id} label={f.label} active={filter === f.id} onClick={() => setFilter(f.id)} />)}
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
        {["all", "study", "work", "personal"].map(c => <Chip key={c} label={c === "all" ? t("allCategories") : t(c)} active={catFilter === c} onClick={() => setCatFilter(c)} />)}
        {allTags.length > 0 && <><div style={{ width: 1, background: "var(--border)", margin: "0 2px" }} />{allTags.map(tag => <Chip key={tag} label={`#${tag}`} active={tagFilter === tag} onClick={() => setTagFilter(tagFilter === tag ? "" : tag)} />)}</>}
      </div>

      {view === "list" && (filtered.length === 0 ? <Empty emoji="📭" text={t("noTasksFound")} sub={t("addOneNow")} /> : <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>{filtered.map(task => <TaskCard key={task.id} task={task} onToggle={handleToggle} onEdit={() => openEdit(task)} onDelete={handleDelete} onToggleSubtask={handleToggleSubtask} />)}</div>)}
      {view === "kanban" && <KanbanView tasks={filtered} onToggle={handleToggle} onEdit={openEdit} onStatusChange={handleStatusChange} />}
      {view === "matrix" && <MatrixView tasks={filtered} onEdit={openEdit} onToggle={handleToggle} />}

      {showForm && <TaskFormModal initial={editTask} onSave={handleSave} onClose={() => { setShowForm(false); setEditTask(null); }} />}
    </div>
  );
}
