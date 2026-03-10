// 🚀 Karyika Landing Page — World-class Hero
import { useState, useEffect, useRef } from "react";

const FEATURES = [
  { icon:"📋", title:"God Mode Tasks", desc:"Sprint boards, Eisenhower matrix, story points — ClickUp ko peeche chhod do", color:"#FF6B35" },
  { icon:"📄", title:"Notion-style Pages", desc:"Inline databases, version history, block comments, export MD/HTML", color:"#818CF8" },
  { icon:"🎯", title:"Goals & OKRs", desc:"Company-level goal tracking with key results, progress rings", color:"#10B981" },
  { icon:"📊", title:"Analytics", desc:"Task heatmaps, habit health, tag clouds — data se insight lo", color:"#F59E0B" },
  { icon:"👥", title:"Workload View", desc:"14-day capacity heatmap, overload alerts, category-wise load bars", color:"#EC4899" },
  { icon:"🤖", title:"AI Assistant", desc:"Tasks banao, priorities suggest karwao — Hinglish mein bhi!", color:"#06B6D4" },
  { icon:"⚡", title:"Automations", desc:"Rules banao, manual kaam chhodo — auto pilot pe chalo", color:"#F43F5E" },
  { icon:"📅", title:"Gantt + Calendar", desc:"Dependencies ke saath full Gantt, enterprise calendar", color:"#8B5CF6" },
];

const QUOTES = [
  { text:"Ek kaam ek waqt. Yehi productivity ka raaz hai.", author:"Karyika Philosophy" },
  { text:"Chhote chhote steps hi bade sapne poore karte hain.", author:"Daily Wisdom" },
  { text:"Plan karo, karo, dekho — repeat.", author:"The Karyika Way" },
  { text:"Jo likhte ho, woh hota hai.", author:"Manifestation meets Action" },
];

const STATS = [
  { val:"20+", label:"Block Types" },
  { val:"8", label:"Task Views" },
  { val:"∞", label:"Pages" },
  { val:"100%", label:"Free Forever" },
];

export default function LandingPage({ onGetStarted }) {
  const [quoteIdx, setQuoteIdx] = useState(0);
  const [scrollY, setScrollY] = useState(0);
  const [mousePos, setMousePos] = useState({ x:0, y:0 });
  const [hoveredFeature, setHoveredFeature] = useState(null);

  useEffect(() => {
    const timer = setInterval(() => setQuoteIdx(i => (i+1) % QUOTES.length), 3500);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    const onMouse = (e) => setMousePos({ x:e.clientX, y:e.clientY });
    window.addEventListener("scroll", onScroll);
    window.addEventListener("mousemove", onMouse);
    return () => { window.removeEventListener("scroll", onScroll); window.removeEventListener("mousemove", onMouse); };
  }, []);

  const parallax = (f) => ({ transform:`translateY(${scrollY*f}px)` });

  return (
    <div style={{ fontFamily:"'Cabinet Grotesk','Satoshi',sans-serif", background:"#05050A", color:"#F3F4F6", overflowX:"hidden", minHeight:"100vh" }}>

      {/* Cursor glow */}
      <div style={{ position:"fixed", left:mousePos.x-200, top:mousePos.y-200, width:400, height:400, borderRadius:"50%", background:"radial-gradient(circle,rgba(255,107,53,0.06) 0%,transparent 70%)", pointerEvents:"none", zIndex:0, transition:"left 0.1s,top 0.1s" }}/>

      {/* NAVBAR */}
      <nav style={{ position:"fixed", top:0, left:0, right:0, zIndex:100, padding:"16px 40px", display:"flex", alignItems:"center", justifyContent:"space-between", background:scrollY>50?"rgba(5,5,10,0.92)":"transparent", backdropFilter:scrollY>50?"blur(20px)":"none", borderBottom:scrollY>50?"1px solid rgba(255,255,255,0.05)":"none", transition:"all 0.3s" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:34, height:34, borderRadius:9, background:"linear-gradient(135deg,#FF6B35,#FF8C5A)", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:900, fontSize:16, color:"#fff", boxShadow:"0 4px 16px rgba(255,107,53,0.4)" }}>क</div>
          <span style={{ fontSize:18, fontWeight:900, letterSpacing:"-0.5px", background:"linear-gradient(135deg,#fff,rgba(255,107,53,0.9))", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>Karyika</span>
        </div>
        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          <span style={{ fontSize:12, color:"#4B5563", padding:"4px 12px" }}>By Kartar Arya</span>
          <button onClick={onGetStarted} style={{ padding:"9px 22px", background:"linear-gradient(135deg,#FF6B35,#FF8C5A)", border:"none", borderRadius:22, color:"#fff", fontWeight:800, fontSize:13, cursor:"pointer", fontFamily:"inherit", boxShadow:"0 4px 20px rgba(255,107,53,0.35)", transition:"all 0.2s" }}
            onMouseEnter={e=>e.currentTarget.style.transform="scale(1.05)"} onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}>
            Shuru Karo →
          </button>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", position:"relative", padding:"120px 20px 80px", textAlign:"center", overflow:"hidden" }}>
        <div style={{ position:"absolute", inset:0, backgroundImage:"linear-gradient(rgba(255,107,53,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(255,107,53,0.04) 1px,transparent 1px)", backgroundSize:"60px 60px", ...parallax(0.2) }}/>
        <div style={{ position:"absolute", top:"10%", left:"10%", width:600, height:600, borderRadius:"50%", background:"radial-gradient(circle,rgba(255,107,53,0.12) 0%,transparent 60%)", ...parallax(0.15), pointerEvents:"none" }}/>
        <div style={{ position:"absolute", bottom:"10%", right:"10%", width:500, height:500, borderRadius:"50%", background:"radial-gradient(circle,rgba(129,140,248,0.1) 0%,transparent 60%)", ...parallax(-0.1), pointerEvents:"none" }}/>

        {/* Badge */}
        <div style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"6px 16px", background:"rgba(255,107,53,0.08)", border:"1px solid rgba(255,107,53,0.2)", borderRadius:30, fontSize:12, fontWeight:700, color:"#FF6B35", marginBottom:28, animation:"fadeDown 0.6s ease", letterSpacing:"0.5px" }}>
          <span style={{ width:6, height:6, borderRadius:"50%", background:"#FF6B35", display:"inline-block", animation:"pulse 2s infinite" }}/>
          Phase 7 Live — Notion Pages + Inline Databases
        </div>

        {/* Heading */}
        <h1 style={{ fontSize:"clamp(42px,7vw,88px)", fontWeight:900, lineHeight:1.05, letterSpacing:"-3px", margin:"0 0 24px", maxWidth:900, animation:"fadeUp 0.7s ease 0.1s both" }}>
          <span style={{ background:"linear-gradient(135deg,#FFFFFF 0%,rgba(255,255,255,0.75) 100%)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>Apni Zindagi Ka</span>
          <br/>
          <span style={{ background:"linear-gradient(135deg,#FF6B35 0%,#FF8C5A 40%,#F59E0B 100%)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>Command Center</span>
        </h1>

        <p style={{ fontSize:"clamp(16px,2.5vw,21px)", color:"#6B7280", maxWidth:600, lineHeight:1.65, margin:"0 0 40px", animation:"fadeUp 0.7s ease 0.2s both" }}>
          Tasks, Pages, Goals, Habits, Team — sab ek jagah. <br/>
          <span style={{ color:"#9CA3AF" }}>ClickUp + Notion + Linear ka desi jugaad. 🇮🇳</span>
        </p>

        {/* CTAs */}
        <div style={{ display:"flex", gap:12, justifyContent:"center", flexWrap:"wrap", animation:"fadeUp 0.7s ease 0.3s both" }}>
          <button onClick={onGetStarted} style={{ padding:"14px 36px", background:"linear-gradient(135deg,#FF6B35,#FF8C5A)", border:"none", borderRadius:14, color:"#fff", fontWeight:900, fontSize:16, cursor:"pointer", fontFamily:"inherit", boxShadow:"0 8px 32px rgba(255,107,53,0.4)", transition:"all 0.2s" }}
            onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow="0 16px 48px rgba(255,107,53,0.5)";}}
            onMouseLeave={e=>{e.currentTarget.style.transform="none";e.currentTarget.style.boxShadow="0 8px 32px rgba(255,107,53,0.4)";}}>
            🚀 Free Mein Shuru Karo
          </button>
          <a href="#features" style={{ padding:"14px 28px", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:14, color:"#D1D5DB", fontWeight:700, fontSize:15, cursor:"pointer", fontFamily:"inherit", transition:"all 0.2s", textDecoration:"none", display:"inline-block" }}
            onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.08)"} onMouseLeave={e=>e.currentTarget.style.background="rgba(255,255,255,0.04)"}>
            Features Dekho ↓
          </a>
        </div>

        {/* Stats */}
        <div style={{ display:"flex", gap:40, justifyContent:"center", marginTop:60, flexWrap:"wrap", animation:"fadeUp 0.7s ease 0.4s both" }}>
          {STATS.map(s=>(
            <div key={s.label} style={{ textAlign:"center" }}>
              <div style={{ fontSize:30, fontWeight:900, background:"linear-gradient(135deg,#FF6B35,#F59E0B)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>{s.val}</div>
              <div style={{ fontSize:10, color:"#4B5563", fontWeight:700, textTransform:"uppercase", letterSpacing:"1.5px", marginTop:3 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* App preview mockup */}
        <div style={{ marginTop:70, position:"relative", maxWidth:860, width:"100%", animation:"fadeUp 0.8s ease 0.5s both" }}>
          <div style={{ background:"linear-gradient(180deg,rgba(255,107,53,0.06) 0%,transparent 100%)", borderRadius:24, border:"1px solid rgba(255,107,53,0.12)", overflow:"hidden", boxShadow:"0 40px 120px rgba(0,0,0,0.8),0 0 0 1px rgba(255,255,255,0.04)" }}>
            <div style={{ background:"#0A0A14", borderBottom:"1px solid rgba(255,255,255,0.06)", padding:"10px 16px", display:"flex", alignItems:"center", gap:8 }}>
              <div style={{ display:"flex", gap:6 }}>{["#F43F5E","#F59E0B","#10B981"].map(c=><div key={c} style={{ width:10, height:10, borderRadius:"50%", background:c }}/>)}</div>
              <div style={{ flex:1, background:"rgba(255,255,255,0.04)", borderRadius:6, padding:"4px 12px", fontSize:11, color:"#4B5563", textAlign:"center" }}>karyika.vercel.app</div>
            </div>
            <div style={{ padding:"20px", background:"#09090E", display:"grid", gridTemplateColumns:"170px 1fr", gap:16, minHeight:280 }}>
              <div style={{ background:"#0A0A14", borderRadius:12, padding:"12px 10px", display:"flex", flexDirection:"column", gap:3 }}>
                {["🏠 Home","📋 Tasks","📄 Pages","🎯 Goals","📊 Analytics","👥 Workload","🤖 AI"].map((item,i)=>(
                  <div key={item} style={{ padding:"6px 10px", borderRadius:7, background:i===0?"rgba(255,107,53,0.1)":"transparent", color:i===0?"#FF6B35":"#4B5563", fontSize:11, fontWeight:i===0?700:400 }}>{item}</div>
                ))}
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8 }}>
                  {[{l:"Pending",v:"12",c:"#FF6B35"},{l:"Habits",v:"4/6",c:"#10B981"},{l:"Focus",v:"2.5h",c:"#818CF8"}].map(s=>(
                    <div key={s.l} style={{ background:"#0F0F1C", borderRadius:9, padding:"10px 12px", border:`1px solid ${s.c}18` }}>
                      <div style={{ fontSize:18, fontWeight:900, color:s.c }}>{s.v}</div>
                      <div style={{ fontSize:10, color:"#4B5563", marginTop:2 }}>{s.l}</div>
                    </div>
                  ))}
                </div>
                <div style={{ background:"#0F0F1C", borderRadius:9, padding:"12px 14px", flex:1, border:"1px solid rgba(255,255,255,0.04)" }}>
                  <div style={{ fontSize:10, color:"#6B7280", marginBottom:8, fontWeight:800, textTransform:"uppercase", letterSpacing:"1px" }}>Today's Tasks</div>
                  {["Design landing page ✓","Fix notification bug","Write project docs"].map((t,i)=>(
                    <div key={t} style={{ display:"flex", alignItems:"center", gap:8, padding:"5px 0", borderBottom:"1px solid rgba(255,255,255,0.03)" }}>
                      <div style={{ width:13, height:13, borderRadius:3, border:`1px solid ${i===0?"#10B981":"rgba(255,255,255,0.1)"}`, background:i===0?"rgba(16,185,129,0.1)":"transparent", display:"flex", alignItems:"center", justifyContent:"center", fontSize:8, color:"#10B981" }}>{i===0?"✓":""}</div>
                      <span style={{ fontSize:11, color:i===0?"#4B5563":"#9CA3AF", textDecoration:i===0?"line-through":"none" }}>{t}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div style={{ position:"absolute", bottom:-40, left:"20%", right:"20%", height:60, background:"rgba(255,107,53,0.18)", filter:"blur(40px)", borderRadius:"50%" }}/>
        </div>
      </section>

      {/* QUOTE TICKER */}
      <section style={{ padding:"40px 20px", borderTop:"1px solid rgba(255,255,255,0.04)", borderBottom:"1px solid rgba(255,255,255,0.04)", background:"rgba(255,107,53,0.02)", textAlign:"center" }}>
        <div style={{ fontSize:"clamp(15px,2.2vw,20px)", fontStyle:"italic", color:"#D1D5DB", maxWidth:680, margin:"0 auto", minHeight:30 }}>
          "{QUOTES[quoteIdx].text}"
        </div>
        <div style={{ fontSize:11, color:"#4B5563", marginTop:10, fontWeight:700, letterSpacing:"1px", textTransform:"uppercase" }}>— {QUOTES[quoteIdx].author}</div>
        <div style={{ display:"flex", gap:6, justifyContent:"center", marginTop:14 }}>
          {QUOTES.map((_,i)=><div key={i} onClick={()=>setQuoteIdx(i)} style={{ width:i===quoteIdx?20:6, height:6, borderRadius:10, background:i===quoteIdx?"#FF6B35":"rgba(255,255,255,0.1)", cursor:"pointer", transition:"all 0.3s" }}/>)}
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" style={{ padding:"100px 40px", maxWidth:1100, margin:"0 auto" }}>
        <div style={{ textAlign:"center", marginBottom:60 }}>
          <div style={{ fontSize:11, fontWeight:900, color:"#FF6B35", letterSpacing:"3px", textTransform:"uppercase", marginBottom:14 }}>FEATURES</div>
          <h2 style={{ fontSize:"clamp(28px,4.5vw,52px)", fontWeight:900, letterSpacing:"-2px", margin:0, lineHeight:1.1 }}>Sab Kuch Ek Jagah</h2>
          <p style={{ color:"#6B7280", fontSize:15, marginTop:14, maxWidth:480, margin:"14px auto 0" }}>Alag alag apps ka jhanjhat khatam. Karyika mein sab hai.</p>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))", gap:14 }}>
          {FEATURES.map((f,i)=>(
            <div key={f.title} onMouseEnter={()=>setHoveredFeature(i)} onMouseLeave={()=>setHoveredFeature(null)}
              style={{ background:hoveredFeature===i?"#0F0F1C":"#0A0A12", border:`1px solid ${hoveredFeature===i?f.color+"28":"rgba(255,255,255,0.05)"}`, borderRadius:18, padding:"22px 20px", cursor:"default", transition:"all 0.2s", transform:hoveredFeature===i?"translateY(-4px)":"none", boxShadow:hoveredFeature===i?`0 20px 50px rgba(0,0,0,0.5)`:""  }}>
              <div style={{ width:42, height:42, borderRadius:11, background:`${f.color}12`, border:`1px solid ${f.color}20`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, marginBottom:14, transition:"transform 0.2s", transform:hoveredFeature===i?"scale(1.1)":"none" }}>{f.icon}</div>
              <div style={{ fontSize:14, fontWeight:800, color:"#F3F4F6", marginBottom:7, letterSpacing:"-0.3px" }}>{f.title}</div>
              <div style={{ fontSize:12, color:"#6B7280", lineHeight:1.65 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ padding:"80px 40px", background:"rgba(255,107,53,0.02)", borderTop:"1px solid rgba(255,255,255,0.04)" }}>
        <div style={{ maxWidth:860, margin:"0 auto", textAlign:"center" }}>
          <div style={{ fontSize:11, fontWeight:900, color:"#818CF8", letterSpacing:"3px", textTransform:"uppercase", marginBottom:14 }}>HOW IT WORKS</div>
          <h2 style={{ fontSize:"clamp(26px,4vw,44px)", fontWeight:900, letterSpacing:"-1.5px", margin:"0 0 50px" }}>Teen Steps, Infinite Results</h2>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))", gap:20 }}>
            {[
              { n:"01", title:"Account Banao", desc:"Google se ya email se — 10 second mein ready. Koi credit card nahi.", color:"#FF6B35", icon:"👤" },
              { n:"02", title:"Tasks & Pages Banao", desc:"Tasks add karo, pages likho, goals set karo — apne hisaab se sab.", color:"#818CF8", icon:"✏️" },
              { n:"03", title:"Productive Raho", desc:"Daily dashboard dekho, AI se help lo, analytics se improve karo.", color:"#10B981", icon:"🚀" },
            ].map(s=>(
              <div key={s.n} style={{ background:"#0A0A12", border:"1px solid rgba(255,255,255,0.05)", borderRadius:20, padding:"28px 22px" }}>
                <div style={{ fontSize:10, fontWeight:900, color:s.color, letterSpacing:"2px", marginBottom:12 }}>{s.n}</div>
                <div style={{ fontSize:30, marginBottom:12 }}>{s.icon}</div>
                <div style={{ fontSize:17, fontWeight:800, marginBottom:9, letterSpacing:"-0.3px" }}>{s.title}</div>
                <div style={{ fontSize:13, color:"#6B7280", lineHeight:1.7 }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding:"100px 40px", textAlign:"center", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-50%)", width:700, height:700, borderRadius:"50%", background:"radial-gradient(circle,rgba(255,107,53,0.08) 0%,transparent 60%)", pointerEvents:"none" }}/>
        <div style={{ position:"relative", zIndex:1 }}>
          <h2 style={{ fontSize:"clamp(30px,5vw,58px)", fontWeight:900, letterSpacing:"-2px", margin:"0 0 16px", lineHeight:1.1 }}>Aaj Hi Shuru Karo 🔥</h2>
          <p style={{ color:"#6B7280", fontSize:16, margin:"0 0 36px" }}>Free hai. Hamesha rahega. Bas karo shuru.</p>
          <button onClick={onGetStarted} style={{ padding:"16px 44px", background:"linear-gradient(135deg,#FF6B35,#FF8C5A)", border:"none", borderRadius:16, color:"#fff", fontWeight:900, fontSize:18, cursor:"pointer", fontFamily:"inherit", boxShadow:"0 12px 40px rgba(255,107,53,0.45)", transition:"all 0.2s" }}
            onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-3px) scale(1.02)";e.currentTarget.style.boxShadow="0 20px 60px rgba(255,107,53,0.55)";}}
            onMouseLeave={e=>{e.currentTarget.style.transform="none";e.currentTarget.style.boxShadow="0 12px 40px rgba(255,107,53,0.45)";}}>
            Karyika Mein Aao →
          </button>
          <div style={{ marginTop:18, fontSize:12, color:"#374151" }}>No credit card · No subscription · Bas karo 🙏</div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ borderTop:"1px solid rgba(255,255,255,0.05)", padding:"28px 40px", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:12 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:28, height:28, borderRadius:7, background:"linear-gradient(135deg,#FF6B35,#FF8C5A)", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:900, fontSize:13, color:"#fff" }}>क</div>
          <span style={{ fontSize:14, fontWeight:800, color:"#6B7280" }}>Karyika</span>
        </div>
        <div style={{ fontSize:12, color:"#374151" }}>Made with ❤️ by Kartar Arya · Phase 6+7</div>
        <div style={{ fontSize:12, color:"#374151" }}>karyika.vercel.app</div>
      </footer>

      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:none}}
        @keyframes fadeDown{from{opacity:0;transform:translateY(-12px)}to{opacity:1;transform:none}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
        *{box-sizing:border-box}
        html{scroll-behavior:smooth}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:#05050A}::-webkit-scrollbar-thumb{background:rgba(255,107,53,0.3);border-radius:4px}
      `}</style>
    </div>
  );
}
