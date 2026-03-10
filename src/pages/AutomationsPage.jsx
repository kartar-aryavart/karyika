// 🤖 Automations — ClickUp-style workflow rules
import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { addAutomation, updateAutomation, deleteAutomation, subscribeToAutomations } from "../firebase/services";
import { useEffect } from "react";

const TRIGGERS = [
  { id:"task_completed", label:"When task is completed", icon:"✅" },
  { id:"task_overdue", label:"When task becomes overdue", icon:"⚠️" },
  { id:"priority_high", label:"When priority set to High", icon:"🔴" },
  { id:"habit_streak_3", label:"When habit streak reaches 3", icon:"🔥" },
  { id:"goal_50pct", label:"When goal reaches 50%", icon:"🎯" },
  { id:"task_created", label:"When new task is created", icon:"➕" },
];

const ACTIONS = [
  { id:"send_notification", label:"Send browser notification", icon:"🔔" },
  { id:"create_subtask", label:"Auto-create subtask", icon:"📌" },
  { id:"change_priority", label:"Change priority", icon:"🔄" },
  { id:"add_tag", label:"Add tag to task", icon:"🏷️" },
  { id:"move_to_project", label:"Move to project", icon:"📁" },
  { id:"mark_urgent", label:"Mark as urgent", icon:"⚡" },
];

const PRESET_TEMPLATES = [
  { name:"Auto-notify on overdue", trigger:"task_overdue", actions:[{id:"send_notification"}], icon:"⚠️", desc:"Browser notification jab task overdue ho" },
  { name:"Urgent flag on high priority", trigger:"priority_high", actions:[{id:"mark_urgent"}], icon:"🔴", desc:"High priority tasks ko urgent mark karo" },
  { name:"Streak celebration", trigger:"habit_streak_3", actions:[{id:"send_notification"}], icon:"🔥", desc:"3 din streak ke baad celebrate karo" },
  { name:"Goal milestone alert", trigger:"goal_50pct", actions:[{id:"send_notification"}], icon:"🎯", desc:"50% goal complete pe notification" },
];

export default function AutomationsPage() {
  const { user } = useAuth();
  const [automations, setAutomations] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name:"", trigger:"task_completed", actions:[{id:"send_notification"}], isActive:true });
  const [toast, setToast] = useState("");

  useEffect(() => {
    const unsub = subscribeToAutomations(user.uid, setAutomations);
    return () => unsub();
  }, [user.uid]);

  const showToast = (msg) => { setToast(msg); setTimeout(()=>setToast(""),3000); };

  const save = async () => {
    if (!form.name.trim()) return;
    await addAutomation(user.uid, form);
    setForm({name:"",trigger:"task_completed",actions:[{id:"send_notification"}],isActive:true});
    setShowForm(false);
    showToast("✅ Automation created!");
  };

  const toggle = async (id, current) => {
    await updateAutomation(user.uid, id, { isActive: !current });
    showToast(current ? "⏸ Automation paused" : "▶ Automation activated!");
  };

  const remove = async (id) => {
    await deleteAutomation(user.uid, id);
    showToast("🗑 Deleted");
  };

  const addPreset = async (p) => {
    await addAutomation(user.uid, { name:p.name, trigger:p.trigger, actions:p.actions, isActive:true });
    showToast("✅ Template added!");
  };

  const Card = ({children,style={}}) => <div style={{ background:"#13131F",border:"1px solid #1E1E2E",borderRadius:14,padding:18,...style }}>{children}</div>;

  return (
    <div style={{ maxWidth:900, margin:"0 auto" }}>
      {toast && <div style={{ position:"fixed",bottom:24,right:24,background:"#10B981",color:"#fff",padding:"12px 20px",borderRadius:12,fontWeight:700,fontSize:14,zIndex:9999 }}>{toast}</div>}

      <div style={{ display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20 }}>
        <div>
          <div style={{ fontFamily:"'Cabinet Grotesk',sans-serif",fontSize:22,fontWeight:800 }}>🤖 Automations</div>
          <div style={{ fontSize:13,color:"#6B7280",marginTop:3 }}>ClickUp-style workflow rules — set it and forget it</div>
        </div>
        <button onClick={()=>setShowForm(true)} style={{ padding:"10px 18px",border:"none",borderRadius:10,background:"linear-gradient(135deg,#FF6B35,#FF8C5A)",color:"#fff",fontSize:13,fontWeight:700,cursor:"pointer",fontFamily:"inherit" }}>+ New Rule</button>
      </div>

      {/* Stats */}
      <div style={{ display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:20 }}>
        {[{icon:"🤖",val:automations.length,label:"Total Rules"},{icon:"✅",val:automations.filter(a=>a.isActive).length,label:"Active"},{icon:"🔥",val:automations.reduce((s,a)=>s+(a.runsCount||0),0),label:"Times Run"}].map(s=>(
          <Card key={s.label} style={{ textAlign:"center",padding:14 }}>
            <div style={{ fontSize:24 }}>{s.icon}</div>
            <div style={{ fontFamily:"'Cabinet Grotesk',sans-serif",fontSize:26,fontWeight:800,color:"#FF6B35",marginTop:4 }}>{s.val}</div>
            <div style={{ fontSize:12,color:"#6B7280" }}>{s.label}</div>
          </Card>
        ))}
      </div>

      {/* Templates */}
      <Card style={{ marginBottom:16 }}>
        <div style={{ fontFamily:"'Cabinet Grotesk',sans-serif",fontWeight:800,fontSize:15,marginBottom:14 }}>⚡ Quick Templates</div>
        <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10 }}>
          {PRESET_TEMPLATES.map(p=>(
            <div key={p.name} style={{ display:"flex",alignItems:"center",gap:12,padding:"12px 14px",background:"#0D0D18",border:"1px solid #1E1E2E",borderRadius:10 }}>
              <span style={{ fontSize:24,flexShrink:0 }}>{p.icon}</span>
              <div style={{ flex:1,minWidth:0 }}>
                <div style={{ fontWeight:600,fontSize:13,color:"#E5E7EB" }}>{p.name}</div>
                <div style={{ fontSize:11,color:"#6B7280",marginTop:2 }}>{p.desc}</div>
              </div>
              <button onClick={()=>addPreset(p)} style={{ padding:"5px 12px",border:"1px solid #FF6B35",borderRadius:8,background:"transparent",color:"#FF6B35",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit",flexShrink:0 }}>Use</button>
            </div>
          ))}
        </div>
      </Card>

      {/* My rules */}
      <Card>
        <div style={{ fontFamily:"'Cabinet Grotesk',sans-serif",fontWeight:800,fontSize:15,marginBottom:14 }}>📋 My Rules ({automations.length})</div>
        {automations.length===0 ? (
          <div style={{ textAlign:"center",padding:"32px 20px",color:"#6B7280" }}>
            <div style={{ fontSize:40,marginBottom:10 }}>🤖</div>
            <div style={{ fontSize:14,fontWeight:600,marginBottom:6 }}>Koi automation nahi abhi tak</div>
            <div style={{ fontSize:12 }}>Upar se template use karo ya "+ New Rule" click karo</div>
          </div>
        ) : (
          <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
            {automations.map(a => {
              const trigger = TRIGGERS.find(t=>t.id===a.trigger);
              return (
                <div key={a.id} style={{ display:"flex",alignItems:"center",gap:12,padding:"12px 16px",background:"#0D0D18",border:`1px solid ${a.isActive?"rgba(16,185,129,0.25)":"#1E1E2E"}`,borderRadius:12,borderLeft:`3px solid ${a.isActive?"#10B981":"#4B5563"}` }}>
                  <div style={{ flex:1,minWidth:0 }}>
                    <div style={{ fontWeight:600,fontSize:14,color:"#E5E7EB" }}>{a.name}</div>
                    <div style={{ fontSize:12,color:"#6B7280",marginTop:3 }}>
                      {trigger?.icon} {trigger?.label} → {a.actions?.map(ac=>ACTIONS.find(x=>x.id===ac.id)?.label).filter(Boolean).join(", ")}
                    </div>
                    {a.runsCount>0&&<div style={{ fontSize:11,color:"#FF6B35",marginTop:2 }}>Ran {a.runsCount} times</div>}
                  </div>
                  <div style={{ display:"flex",gap:6,flexShrink:0 }}>
                    <button onClick={()=>toggle(a.id,a.isActive)} style={{ padding:"5px 12px",border:`1px solid ${a.isActive?"#10B981":"#4B5563"}`,borderRadius:8,background:"transparent",color:a.isActive?"#10B981":"#6B7280",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit" }}>{a.isActive?"Pause":"Resume"}</button>
                    <button onClick={()=>remove(a.id)} style={{ padding:"5px 10px",border:"1px solid #F43F5E",borderRadius:8,background:"transparent",color:"#F43F5E",fontSize:12,cursor:"pointer",fontFamily:"inherit" }}>🗑</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Create form modal */}
      {showForm && (
        <div onClick={e=>e.target===e.currentTarget&&setShowForm(false)} style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.8)",backdropFilter:"blur(8px)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:9999 }}>
          <div style={{ background:"#0D0D18",border:"1px solid #2A2A3A",borderRadius:16,padding:24,width:"100%",maxWidth:480 }}>
            <div style={{ fontFamily:"'Cabinet Grotesk',sans-serif",fontWeight:800,fontSize:18,marginBottom:18 }}>🤖 New Automation Rule</div>
            <input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="Rule name..."
              style={{ width:"100%",background:"#13131F",border:"1px solid #2A2A3A",borderRadius:10,color:"#E5E7EB",fontSize:14,padding:"10px 14px",fontFamily:"inherit",outline:"none",marginBottom:12,boxSizing:"border-box" }} />
            <div style={{ marginBottom:12 }}>
              <div style={{ fontSize:12,color:"#6B7280",marginBottom:6,fontWeight:600 }}>WHEN (Trigger)</div>
              <select value={form.trigger} onChange={e=>setForm(f=>({...f,trigger:e.target.value}))}
                style={{ width:"100%",background:"#13131F",border:"1px solid #2A2A3A",borderRadius:10,color:"#E5E7EB",fontSize:13,padding:"9px 12px",fontFamily:"inherit",outline:"none" }}>
                {TRIGGERS.map(t=><option key={t.id} value={t.id}>{t.icon} {t.label}</option>)}
              </select>
            </div>
            <div style={{ marginBottom:18 }}>
              <div style={{ fontSize:12,color:"#6B7280",marginBottom:6,fontWeight:600 }}>THEN (Action)</div>
              <select value={form.actions[0]?.id||"send_notification"} onChange={e=>setForm(f=>({...f,actions:[{id:e.target.value}]}))}
                style={{ width:"100%",background:"#13131F",border:"1px solid #2A2A3A",borderRadius:10,color:"#E5E7EB",fontSize:13,padding:"9px 12px",fontFamily:"inherit",outline:"none" }}>
                {ACTIONS.map(a=><option key={a.id} value={a.id}>{a.icon} {a.label}</option>)}
              </select>
            </div>
            <div style={{ display:"flex",gap:10 }}>
              <button onClick={()=>setShowForm(false)} style={{ flex:1,padding:"10px",border:"1px solid #2A2A3A",borderRadius:10,background:"transparent",color:"#9CA3AF",cursor:"pointer",fontFamily:"inherit",fontWeight:600 }}>Cancel</button>
              <button onClick={save} style={{ flex:2,padding:"10px",border:"none",borderRadius:10,background:"linear-gradient(135deg,#FF6B35,#FF8C5A)",color:"#fff",cursor:"pointer",fontFamily:"inherit",fontWeight:700,fontSize:14 }}>Create Rule ✓</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
