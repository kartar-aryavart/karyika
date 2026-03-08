// 📋 Tasks Page — Karyika (with Firebase)
import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { addTask, updateTask, deleteTask } from "../firebase/services";
import { Modal, Btn, Input, Select, Badge, PriorityBadge, CatBadge, Chip, Empty, Loader } from "../components/UI";
import { toast } from "../components/UI";

const todayStr = () => new Date().toISOString().split("T")[0];
const fmt = d => { try { return new Date(d).toLocaleDateString("en-IN", { month: "short", day: "numeric" }); } catch { return d; } };

const EMPTY_FORM = { title: "", desc: "", due: todayStr(), priority: "medium", category: "study", reminder: "" };

export default function TasksPage({ tasks, loading }) {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [catFilter, setCatFilter] = useState("all");
  const [sortBy, setSortBy] = useState("due");
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const openAdd = () => { setEditTask(null); setForm(EMPTY_FORM); setShowForm(true); };
  const openEdit = (t) => { setEditTask(t); setForm({ title: t.title, desc: t.desc || "", due: t.due, priority: t.priority, category: t.category, reminder: t.reminder || "" }); setShowForm(true); };

  const handleSave = async () => {
    if (!form.title.trim()) { toast("Task ka title daalo!", "error"); return; }
    setSaving(true);
    try {
      if (editTask) {
        await updateTask(user.uid, editTask.id, form);
        toast("Task update ho gaya! ✅");
      } else {
        await addTask(user.uid, { ...form, done: false });
        toast("Naya task add ho gaya! 🎉", "success");
      }
      setShowForm(false);
    } catch (e) { toast("Kuch gadbad ho gayi.", "error"); }
    setSaving(false);
  };

  const handleToggle = async (t) => {
    try { await updateTask(user.uid, t.id, { done: !t.done }); }
    catch { toast("Update nahi hua.", "error"); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Task delete karna chahte ho?")) return;
    try { await deleteTask(user.uid, id); toast("Task delete ho gaya!"); }
    catch { toast("Delete nahi hua.", "error"); }
  };

  // Filter + sort
  let filtered = tasks.filter(t => {
    if (filter === "pending") return !t.done;
    if (filter === "completed") return t.done;
    if (filter === "overdue") return !t.done && t.due < todayStr();
    return true;
  });
  if (catFilter !== "all") filtered = filtered.filter(t => t.category === catFilter);
  if (search) filtered = filtered.filter(t =>
    t.title?.toLowerCase().includes(search.toLowerCase()) ||
    t.desc?.toLowerCase().includes(search.toLowerCase())
  );
  filtered = [...filtered].sort((a, b) => {
    if (sortBy === "due") return (a.due || "").localeCompare(b.due || "");
    if (sortBy === "priority") return ["high", "medium", "low"].indexOf(a.priority) - ["high", "medium", "low"].indexOf(b.priority);
    return 0;
  });

  const counts = {
    all: tasks.length,
    pending: tasks.filter(t => !t.done).length,
    completed: tasks.filter(t => t.done).length,
    overdue: tasks.filter(t => !t.done && t.due < todayStr()).length,
  };

  if (loading) return <Loader />;

  return (
    <div>
      {/* Search + Controls */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 200, position: "relative" }}>
          <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text3)", fontSize: 14, pointerEvents: "none" }}>🔍</span>
          <input placeholder="Tasks dhundo..." value={search} onChange={e => setSearch(e.target.value)} style={{
            background: "var(--surface2)", border: "1.5px solid var(--border)", borderRadius: 10,
            color: "var(--text)", fontSize: 14, padding: "10px 13px 10px 34px",
            fontFamily: "var(--font-body)", outline: "none", width: "100%",
          }} />
        </div>
        <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{
          background: "var(--surface2)", border: "1.5px solid var(--border)", borderRadius: 10,
          color: "var(--text2)", fontSize: 13, padding: "10px 13px", fontFamily: "var(--font-body)", cursor: "pointer",
        }}>
          <option value="due">Due Date</option>
          <option value="priority">Priority</option>
        </select>
        <Btn onClick={openAdd}>+ Task Add Karo</Btn>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginBottom: 16 }}>
        {[
          { id: "all", label: `Sabhi (${counts.all})` },
          { id: "pending", label: `Baaki (${counts.pending})` },
          { id: "completed", label: `Done (${counts.completed})` },
          { id: "overdue", label: `Late ⚠️ (${counts.overdue})` },
        ].map(f => <Chip key={f.id} label={f.label} active={filter === f.id} onClick={() => setFilter(f.id)} />)}
        <div style={{ width: 1, background: "var(--border)", margin: "0 3px" }} />
        {["all", "study", "work", "personal"].map(c => (
          <Chip key={c} label={c === "all" ? "Sab Categories" : c.charAt(0).toUpperCase() + c.slice(1)} active={catFilter === c} onClick={() => setCatFilter(c)} />
        ))}
      </div>

      {/* Task list */}
      {filtered.length === 0 ? (
        <Empty emoji="📭" text="Koi task nahi mila" sub="Naya task add karo ya filter change karo" />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filtered.map(t => (
            <div key={t.id} style={{
              display: "flex", alignItems: "flex-start", gap: 12,
              padding: "14px 16px",
              background: "var(--surface)", border: "1.5px solid var(--border)",
              borderRadius: 12, transition: "all var(--t)",
              opacity: t.done ? 0.55 : 1,
              borderLeftWidth: 3,
              borderLeftColor: t.priority === "high" ? "var(--rose)" : t.priority === "medium" ? "var(--gold)" : "var(--teal)",
            }}>
              {/* Checkbox */}
              <div onClick={() => handleToggle(t)} style={{
                width: 22, height: 22, borderRadius: 7, flexShrink: 0, marginTop: 1,
                border: `2px solid ${t.done ? "var(--teal)" : "var(--border)"}`,
                background: t.done ? "var(--teal)" : "var(--surface2)",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", transition: "all var(--t)", color: "#fff", fontSize: 12,
              }}>{t.done && "✓"}</div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 3, textDecoration: t.done ? "line-through" : "none" }}>{t.title}</div>
                {t.desc && <div style={{ fontSize: 12, color: "var(--text2)", marginBottom: 6 }}>{t.desc}</div>}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  <PriorityBadge priority={t.priority} />
                  <CatBadge cat={t.category} />
                  {t.due && <Badge bg="var(--surface2)" color="var(--text2)">📅 {fmt(t.due)}</Badge>}
                  {t.reminder && <Badge bg="var(--surface2)" color="var(--text2)">🔔 {t.reminder}</Badge>}
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                <button onClick={() => openEdit(t)} style={{ padding: "6px 8px", border: "none", borderRadius: 8, background: "var(--surface2)", cursor: "pointer", fontSize: 14 }}>✏️</button>
                <button onClick={() => handleDelete(t.id)} style={{ padding: "6px 8px", border: "none", borderRadius: 8, background: "#FFF0F0", cursor: "pointer", fontSize: 14 }}>🗑️</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <Modal
          title={editTask ? "Task Edit Karo" : "Naya Task Add Karo"}
          onClose={() => setShowForm(false)}
          footer={<>
            <Btn variant="ghost" onClick={() => setShowForm(false)}>Cancel</Btn>
            <Btn onClick={handleSave} disabled={saving}>{saving ? "Save ho raha hai..." : "Save Karo"}</Btn>
          </>}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Input label="Task Title *" placeholder="Kya karna hai?" value={form.title} onChange={e => set("title", e.target.value)} autoFocus />
            <Input label="Description" placeholder="Details daalo..." value={form.desc} onChange={e => set("desc", e.target.value)} rows={3} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              <Input label="Due Date" type="date" value={form.due} onChange={e => set("due", e.target.value)} />
              <Select label="Priority" value={form.priority} onChange={e => set("priority", e.target.value)}
                options={[{ value: "high", label: "🔴 High" }, { value: "medium", label: "🟡 Medium" }, { value: "low", label: "🟢 Low" }]} />
              <Select label="Category" value={form.category} onChange={e => set("category", e.target.value)}
                options={[{ value: "study", label: "📚 Study" }, { value: "work", label: "💼 Work" }, { value: "personal", label: "🏠 Personal" }]} />
            </div>
            <Input label="Reminder Time (optional)" type="time" value={form.reminder} onChange={e => set("reminder", e.target.value)} />
          </div>
        </Modal>
      )}
    </div>
  );
}
