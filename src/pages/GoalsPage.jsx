// 🎯 GoalsPage — OKR Tracker like ClickUp Goals
import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { addGoal, updateGoal, deleteGoal } from "../firebase/services";
import { Modal, Btn, Input, Empty, Card, ProgressBar, SectionHeader } from "../components/UI";
import { toast } from "../components/UI";

const uid = () => Math.random().toString(36).slice(2, 10);
const GOAL_COLORS = ["#FF6B35","#0A7B6C","#4A5CDB","#D4456A","#E6A817","#7C3AED"];

const inp = { background: "var(--surface2)", border: "1.5px solid var(--border)", borderRadius: 10, color: "var(--text)", fontSize: 14, padding: "10px 13px", fontFamily: "var(--font-body)", outline: "none", width: "100%" };
const lbl = { fontSize: 12, fontWeight: 600, color: "var(--text2)", display: "block", marginBottom: 5 };

function GoalFormModal({ initial, onSave, onClose }) {
  const [form, setForm] = useState(initial || { title: "", description: "", target: 100, current: 0, unit: "%", dueDate: "", color: "#FF6B35", keyResults: [] });
  const [krInput, setKrInput] = useState("");
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const addKR = () => {
    if (!krInput.trim()) return;
    set("keyResults", [...(form.keyResults || []), { id: uid(), title: krInput.trim(), target: 100, current: 0, unit: "%" }]);
    setKrInput("");
  };

  const handleSave = async () => {
    if (!form.title.trim()) { toast("Goal title daalo!", "error"); return; }
    setSaving(true); await onSave(form); setSaving(false); onClose();
  };

  return (
    <Modal title={initial?.id ? "Goal Edit Karo" : "Naya Goal / OKR"} onClose={onClose} maxWidth={540}
      footer={<><Btn variant="ghost" onClick={onClose}>Cancel</Btn><Btn onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save Karo"}</Btn></>}>
      <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
        <div><label style={lbl}>Goal / Objective *</label><input style={inp} placeholder="e.g. Launch Karyika app" value={form.title} onChange={e => set("title", e.target.value)} autoFocus /></div>
        <div><label style={lbl}>Description</label><textarea style={{ ...inp, resize: "vertical" }} rows={2} value={form.description} onChange={e => set("description", e.target.value)} /></div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
          <div><label style={lbl}>Target</label><input type="number" style={inp} value={form.target} onChange={e => set("target", +e.target.value)} /></div>
          <div><label style={lbl}>Current</label><input type="number" style={inp} value={form.current} onChange={e => set("current", +e.target.value)} /></div>
          <div><label style={lbl}>Unit</label>
            <select style={inp} value={form.unit} onChange={e => set("unit", e.target.value)}>
              <option value="%">% Percent</option>
              <option value="tasks">Tasks</option>
              <option value="users">Users</option>
              <option value="₹">₹ Rupees</option>
              <option value="hours">Hours</option>
              <option value="pages">Pages</option>
            </select>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div><label style={lbl}>Due Date</label><input type="date" style={inp} value={form.dueDate} onChange={e => set("dueDate", e.target.value)} /></div>
          <div>
            <label style={lbl}>Color</label>
            <div style={{ display: "flex", gap: 8, paddingTop: 6 }}>
              {GOAL_COLORS.map(c => <div key={c} onClick={() => set("color", c)} style={{ width: 28, height: 28, borderRadius: "50%", background: c, cursor: "pointer", border: `3px solid ${form.color === c ? "var(--text)" : "transparent"}` }} />)}
            </div>
          </div>
        </div>

        {/* Key Results */}
        <div>
          <label style={lbl}>🗝️ Key Results (Optional)</label>
          {(form.keyResults || []).map(kr => (
            <div key={kr.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", background: "var(--surface2)", borderRadius: 8, marginBottom: 5 }}>
              <span style={{ flex: 1, fontSize: 12 }}>• {kr.title}</span>
              <span onClick={() => set("keyResults", form.keyResults.filter(x => x.id !== kr.id))} style={{ cursor: "pointer", color: "var(--text3)", fontSize: 16 }}>×</span>
            </div>
          ))}
          <div style={{ display: "flex", gap: 8 }}>
            <input style={{ ...inp, flex: 1 }} placeholder="Add key result..." value={krInput} onChange={e => setKrInput(e.target.value)} onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addKR())} />
            <Btn size="sm" onClick={addKR}>+ Add</Btn>
          </div>
        </div>
      </div>
    </Modal>
  );
}

export default function GoalsPage({ goals }) {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [editGoal, setEditGoal] = useState(null);

  const handleSave = async (form) => {
    if (editGoal?.id) { await updateGoal(user.uid, editGoal.id, form); toast("Goal updated! ✅"); }
    else { await addGoal(user.uid, form); toast("Goal set! 🎯", "success"); }
  };

  const handleProgress = async (goal, delta) => {
    const newCurrent = Math.min(Math.max(0, (goal.current || 0) + delta), goal.target || 100);
    await updateGoal(user.uid, goal.id, { current: newCurrent });
  };

  const fmtD = d => { try { return new Date(d).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" }); } catch { return ""; } };

  const total = goals.length;
  const achieved = goals.filter(g => (g.current || 0) >= (g.target || 100)).length;
  const avgProgress = total ? Math.round(goals.reduce((s, g) => s + Math.min((g.current || 0) / (g.target || 100) * 100, 100), 0) / total) : 0;

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <div style={{ fontFamily: "var(--font-head)", fontSize: 18, fontWeight: 700 }}>🎯 Goals & OKRs</div>
          <div style={{ fontSize: 13, color: "var(--text2)", marginTop: 2 }}>Apne bade targets track karo</div>
        </div>
        <Btn onClick={() => { setEditGoal(null); setShowForm(true); }}>+ New Goal</Btn>
      </div>

      {/* Summary */}
      {total > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 20 }}>
          {[{ icon: "🎯", val: total, label: "Total Goals", c: "var(--accent)" }, { icon: "✅", val: achieved, label: "Achieved", c: "var(--teal)" }, { icon: "📈", val: `${avgProgress}%`, label: "Avg Progress", c: "var(--indigo)" }].map(s => (
            <div key={s.label} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: "16px", textAlign: "center" }}>
              <div style={{ fontSize: 26 }}>{s.icon}</div>
              <div style={{ fontFamily: "var(--font-head)", fontSize: 28, fontWeight: 800, color: s.c }}>{s.val}</div>
              <div style={{ fontSize: 12, color: "var(--text2)" }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {goals.length === 0 ? <Empty emoji="🎯" text="Koi goal nahi" sub="Apna pehla bada target set karo!" /> : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {goals.map(goal => {
            const pct = Math.min(Math.round((goal.current || 0) / (goal.target || 100) * 100), 100);
            const achieved = pct >= 100;
            return (
              <div key={goal.id} style={{ background: "var(--surface)", border: `1.5px solid ${achieved ? goal.color : "var(--border)"}`, borderRadius: 16, padding: 20, borderLeft: `4px solid ${goal.color}` }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span style={{ fontWeight: 700, fontSize: 15 }}>{goal.title}</span>
                      {achieved && <span style={{ fontSize: 11, background: goal.color, color: "#fff", padding: "2px 8px", borderRadius: 20, fontWeight: 700 }}>🏆 Achieved!</span>}
                    </div>
                    {goal.description && <div style={{ fontSize: 12, color: "var(--text2)" }}>{goal.description}</div>}
                    {goal.dueDate && <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 4 }}>📅 Due: {fmtD(goal.dueDate)}</div>}
                  </div>
                  <div style={{ display: "flex", gap: 6, flexShrink: 0, marginLeft: 12 }}>
                    <button onClick={() => { setEditGoal(goal); setShowForm(true); }} style={{ padding: "5px 7px", border: "none", borderRadius: 7, background: "var(--surface2)", cursor: "pointer", fontSize: 13 }}>✏️</button>
                    <button onClick={() => deleteGoal(user.uid, goal.id).then(() => toast("Deleted!"))} style={{ padding: "5px 7px", border: "none", borderRadius: 7, background: "#FFF0F0", cursor: "pointer", fontSize: 13 }}>🗑️</button>
                  </div>
                </div>

                {/* Progress */}
                <div style={{ marginBottom: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{goal.current || 0} / {goal.target} {goal.unit}</span>
                    <span style={{ fontFamily: "var(--font-head)", fontWeight: 800, color: goal.color, fontSize: 18 }}>{pct}%</span>
                  </div>
                  <ProgressBar value={pct} color={goal.color} height={10} />
                </div>

                {/* Quick update buttons */}
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span style={{ fontSize: 12, color: "var(--text2)" }}>Quick update:</span>
                  {[-10, -1, +1, +5, +10].map(delta => (
                    <button key={delta} onClick={() => handleProgress(goal, delta)} style={{ padding: "4px 10px", border: "1px solid var(--border)", borderRadius: 8, background: delta > 0 ? goal.color + "15" : "var(--surface2)", cursor: "pointer", fontSize: 12, fontWeight: 700, color: delta > 0 ? goal.color : "var(--text2)", fontFamily: "var(--font-body)" }}>
                      {delta > 0 ? "+" : ""}{delta}
                    </button>
                  ))}
                </div>

                {/* Key Results */}
                {(goal.keyResults || []).length > 0 && (
                  <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--border)" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text3)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>Key Results</div>
                    {goal.keyResults.map(kr => (
                      <div key={kr.id} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 14, color: goal.color }}>•</span>
                        <span style={{ fontSize: 13, flex: 1 }}>{kr.title}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showForm && <GoalFormModal initial={editGoal} onSave={handleSave} onClose={() => { setShowForm(false); setEditGoal(null); }} />}
    </div>
  );
}
