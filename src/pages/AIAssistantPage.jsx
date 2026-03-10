// ⚡ AI Assistant — Powered by Claude API (Enterprise Feature)
import { useState, useRef, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { addTask } from "../firebase/services";

const SYSTEM_PROMPT = `You are Karyika's AI assistant — an enterprise productivity expert.
You help with:
1. Breaking goals into actionable tasks (suggest in JSON format when asked)
2. Prioritizing with Eisenhower Matrix
3. Writing emails, docs, summaries
4. Productivity analysis and smart scheduling
5. Project planning and risk prediction

When creating tasks, output ONLY this format (no extra text before/after):
<tasks>[{"title":"Task 1","priority":"high","category":"work","due":"2026-03-15","estimatedTime":60},...]</tasks>

Be concise, practical. Respond in Hinglish (Hindi+English mix) unless asked otherwise.`;

const QUICK_PROMPTS = [
  { icon: "🎯", label: "Tasks todna", prompt: "Is bade project ko chhote tasks mein todo: " },
  { icon: "⚡", label: "Aaj ki priorities", prompt: "Mujhe aaj ke liye top 5 priorities suggest karo" },
  { icon: "📝", label: "Email likhwao", prompt: "Ek professional email likhni hai regarding: " },
  { icon: "🧠", label: "Brainstorm", prompt: "Mujhe ideas chahiye for: " },
  { icon: "📊", label: "Eisenhower Matrix", prompt: "Yeh tasks matrix mein daalo: " },
  { icon: "⏱", label: "Time estimate", prompt: "Mujhe time estimate chahiye for: " },
  { icon: "🔥", label: "Productivity audit", prompt: "Meri productivity improve karne ke 5 tips do" },
  { icon: "📅", label: "Week plan", prompt: "Meri is week ki planning karo based on these tasks: " },
];

function SuggestedTask({ task, onAdd }) {
  const [added, setAdded] = useState(false);
  const PRI = { high: "#F43F5E", medium: "#F59E0B", low: "#10B981" };
  return (
    <div style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 12px", background:"rgba(255,107,53,0.05)", border:"1px solid rgba(255,107,53,0.2)", borderRadius:10, borderLeft:`3px solid ${PRI[task.priority]||"#FF6B35"}` }}>
      <div style={{ flex:1 }}>
        <div style={{ fontWeight:600, fontSize:13 }}>{task.title}</div>
        <div style={{ fontSize:11, color:"#6B7280", marginTop:2 }}>
          {task.priority && <span style={{ marginRight:8, color:PRI[task.priority] }}>● {task.priority}</span>}
          {task.category && <span style={{ marginRight:8 }}>📁 {task.category}</span>}
          {task.due && <span>📅 {task.due}</span>}
          {task.estimatedTime && <span style={{ marginLeft:8 }}>⏱ {task.estimatedTime}m</span>}
        </div>
      </div>
      <button onClick={() => { onAdd(task); setAdded(true); }} disabled={added}
        style={{ padding:"5px 12px", border:"none", borderRadius:8, background:added?"#10B981":"#FF6B35", color:"#fff", fontSize:12, fontWeight:700, cursor:added?"default":"pointer", transition:"all 0.2s", fontFamily:"inherit" }}>
        {added ? "✓ Done" : "+ Add"}
      </button>
    </div>
  );
}

function Msg({ msg }) {
  const isAI = msg.role === "assistant";
  const [parsed, setParsed] = useState([]);
  const clean = msg.content.replace(/<tasks>[\s\S]*?<\/tasks>/g, "").trim();

  useEffect(() => {
    if (isAI && msg.content.includes("<tasks>")) {
      try {
        const m = msg.content.match(/<tasks>([\s\S]*?)<\/tasks>/);
        if (m) setParsed(JSON.parse(m[1]));
      } catch {}
    }
  }, [msg.content]);

  return (
    <div style={{ display:"flex", gap:10, alignItems:"flex-start", flexDirection:isAI?"row":"row-reverse" }}>
      <div style={{ width:30, height:30, borderRadius:"50%", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", fontSize:15, background:isAI?"linear-gradient(135deg,#FF6B35,#FF8C5A)":"#1A1A26", border:isAI?"none":"1px solid #2A2A3A", boxShadow:isAI?"0 0 12px rgba(255,107,53,0.3)":"none" }}>
        {isAI ? "⚡" : "👤"}
      </div>
      <div style={{ maxWidth:"78%", display:"flex", flexDirection:"column", gap:8 }}>
        <div style={{ background:isAI?"#13131F":"rgba(255,107,53,0.08)", border:`1px solid ${isAI?"#2A2A3A":"rgba(255,107,53,0.2)"}`, borderRadius:isAI?"4px 14px 14px 14px":"14px 4px 14px 14px", padding:"12px 15px", fontSize:13.5, lineHeight:1.75, color:"#E5E7EB", whiteSpace:"pre-wrap" }}>
          {clean}
        </div>
        {parsed.length > 0 && (
          <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
            <div style={{ fontSize:10, fontWeight:800, color:"#6B7280", textTransform:"uppercase", letterSpacing:"1px" }}>💡 Suggested Tasks — Click to Add</div>
            {parsed.map((t,i) => <SuggestedTask key={i} task={t} onAdd={msg.onAdd} />)}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AIAssistantPage({ tasks = [], projects = [], goals = [] }) {
  const { user } = useAuth();
  const [msgs, setMsgs] = useState([{
    role:"assistant",
    content:`Namaste! 👋 Main Karyika ka AI assistant hoon — aapka smart productivity partner!\n\nMain kar sakta hoon:\n🎯 Goals → Tasks breakdown\n⚡ Eisenhower Matrix prioritization\n📝 Email & document writing\n🧠 Brainstorming & ideas\n⏱ Time estimation\n📊 Productivity analysis\n\nNeeche quick prompts use karo ya seedha poochho!`,
    onAdd: () => {}
  }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:"smooth" }); }, [msgs]);

  const buildCtx = () => {
    const t = tasks.filter(x => !x.done).slice(0,8).map(x=>`- ${x.title} (${x.priority}, ${x.due||"no date"})`).join("\n");
    const p = projects.filter(x=>x.status==="active").slice(0,4).map(x=>`- ${x.name}`).join("\n");
    const g = goals.slice(0,3).map(x=>`- ${x.title} (${x.current}/${x.target} ${x.unit})`).join("\n");
    return `\n\n[User's Current Context]\nPending Tasks:\n${t||"None"}\nActive Projects:\n${p||"None"}\nGoals:\n${g||"None"}`;
  };

  const handleAdd = async (task) => {
    await addTask(user.uid, { ...task, done:false, status:"todo", tags:[], subtasks:[] });
  };

  const send = async (text) => {
    if (!text.trim() || loading) return;
    const userMsg = { role:"user", content:text };
    const newMsgs = [...msgs, userMsg];
    setMsgs(newMsgs);
    setInput("");
    setLoading(true);

    try {
      const apiMsgs = newMsgs.map(m => ({ role:m.role, content:m.content }));
      if (apiMsgs.length === 2) apiMsgs[1].content += buildCtx();

      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:1000, system:SYSTEM_PROMPT, messages:apiMsgs }),
      });
      const data = await res.json();
      const reply = data.content?.[0]?.text || "Kuch gadbad ho gayi. Retry karo!";
      setMsgs(prev => [...prev, { role:"assistant", content:reply, onAdd:handleAdd }]);
    } catch {
      setMsgs(prev => [...prev, { role:"assistant", content:"Network error. Please check connection.", onAdd:()=>{} }]);
    }
    setLoading(false);
  };

  return (
    <div style={{ display:"flex", flexDirection:"column", height:"calc(100vh - 108px)", maxWidth:820, margin:"0 auto" }}>
      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:14 }}>
        <div style={{ width:44, height:44, borderRadius:12, background:"linear-gradient(135deg,#FF6B35,#FF8C5A)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, boxShadow:"0 0 20px rgba(255,107,53,0.35)" }}>⚡</div>
        <div>
          <div style={{ fontFamily:"'Cabinet Grotesk',sans-serif", fontSize:18, fontWeight:800 }}>AI Assistant</div>
          <div style={{ fontSize:12, color:"#6B7280" }}>Powered by Claude — Your smart productivity co-pilot</div>
        </div>
        <div style={{ marginLeft:"auto", fontSize:11, background:"rgba(16,185,129,0.1)", color:"#10B981", padding:"4px 12px", borderRadius:20, border:"1px solid rgba(16,185,129,0.25)", fontWeight:700 }}>● Online</div>
      </div>

      {/* Quick prompts */}
      <div style={{ display:"flex", gap:7, marginBottom:12, flexWrap:"wrap" }}>
        {QUICK_PROMPTS.map(qp => (
          <button key={qp.label} onClick={() => { setInput(qp.prompt); inputRef.current?.focus(); }}
            style={{ display:"flex", alignItems:"center", gap:5, padding:"5px 11px", border:"1px solid #2A2A3A", borderRadius:20, background:"#13131F", cursor:"pointer", fontSize:12, fontWeight:500, color:"#9CA3AF", fontFamily:"inherit", transition:"all 0.15s", whiteSpace:"nowrap" }}>
            {qp.icon} {qp.label}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div style={{ flex:1, overflowY:"auto", background:"#0D0D18", border:"1px solid #1E1E2E", borderRadius:14, padding:20, marginBottom:12, display:"flex", flexDirection:"column", gap:18 }}>
        {msgs.map((m,i) => <Msg key={i} msg={m} />)}
        {loading && (
          <div style={{ display:"flex", gap:10, alignItems:"center" }}>
            <div style={{ width:30, height:30, borderRadius:"50%", background:"linear-gradient(135deg,#FF6B35,#FF8C5A)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:15, boxShadow:"0 0 12px rgba(255,107,53,0.3)" }}>⚡</div>
            <div style={{ display:"flex", gap:5, padding:"12px 15px", background:"#13131F", borderRadius:"4px 14px 14px 14px", border:"1px solid #2A2A3A" }}>
              {[0,1,2].map(i => <div key={i} style={{ width:7, height:7, borderRadius:"50%", background:"#FF6B35", animation:"bounce 1.1s ease infinite", animationDelay:`${i*0.18}s` }} />)}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ display:"flex", gap:9 }}>
        <input ref={inputRef} value={input} onChange={e=>setInput(e.target.value)}
          onKeyDown={e=>{ if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send(input);} }}
          placeholder="Kuch bhi poochho... (Enter se bhejo, Shift+Enter for newline)"
          style={{ flex:1, background:"#13131F", border:"1px solid #2A2A3A", borderRadius:12, color:"#E5E7EB", fontSize:14, padding:"12px 16px", fontFamily:"inherit", outline:"none" }} />
        <button onClick={()=>send(input)} disabled={loading||!input.trim()}
          style={{ padding:"12px 20px", border:"none", borderRadius:12, background:loading||!input.trim()?"#1A1A26":"linear-gradient(135deg,#FF6B35,#FF8C5A)", color:"#fff", fontSize:13, fontWeight:700, cursor:loading||!input.trim()?"default":"pointer", fontFamily:"inherit", transition:"all 0.2s", boxShadow:(!loading&&input.trim())?"0 0 14px rgba(255,107,53,0.3)":"none" }}>
          {loading ? "⏳" : "Send →"}
        </button>
      </div>
      <div style={{ fontSize:11, color:"#4B5563", textAlign:"center", marginTop:7 }}>Suggested tasks directly add karo Firebase mein · Context-aware responses</div>

      <style>{`@keyframes bounce{0%,100%{transform:scale(0.7);opacity:0.4}50%{transform:scale(1.1);opacity:1}}`}</style>
    </div>
  );
}
