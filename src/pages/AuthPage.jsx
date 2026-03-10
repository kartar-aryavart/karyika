// 🔐 AuthPage v3 — Premium Dark
import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useLang } from "../i18n/translations.jsx";

export default function AuthPage() {
  const { loginWithGoogle, loginWithEmail, signupWithEmail } = useAuth();
  const { t, lang, toggleLang } = useLang();
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name:"", email:"", password:"" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  const handleSubmit = async e => {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      if (mode==="login") await loginWithEmail(form.email, form.password);
      else { if(!form.name.trim()){setError("Naam daalo!"); setLoading(false); return;} await signupWithEmail(form.email, form.password, form.name); }
    } catch(err) {
      const msgs = { "auth/user-not-found":"Account nahi mila.", "auth/wrong-password":"Password galat hai!", "auth/email-already-in-use":"Email pehle se registered hai.", "auth/weak-password":"Password 6+ chars ka hona chahiye.", "auth/invalid-credential":"Email ya password galat hai." };
      setError(msgs[err.code]||"Kuch gadbad ho gayi.");
    }
    setLoading(false);
  };

  const handleGoogle = async () => { setError(""); setLoading(true); try{await loginWithGoogle();}catch{setError("Google login mein problem.");} setLoading(false); };

  const inp = { background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:10, color:"#fff", fontSize:14, padding:"12px 15px", fontFamily:"'Satoshi',sans-serif", outline:"none", width:"100%", transition:"border-color 0.2s" };

  return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"#09090E", padding:20, position:"relative", overflow:"hidden" }}>
      {/* Background orbs */}
      <div style={{ position:"absolute", top:-100, right:-100, width:500, height:500, borderRadius:"50%", background:"radial-gradient(circle,rgba(255,107,53,0.12) 0%,transparent 65%)", pointerEvents:"none" }} />
      <div style={{ position:"absolute", bottom:-150, left:-50, width:600, height:600, borderRadius:"50%", background:"radial-gradient(circle,rgba(99,102,241,0.1) 0%,transparent 65%)", pointerEvents:"none" }} />
      <div style={{ position:"absolute", inset:0, backgroundImage:"linear-gradient(rgba(255,107,53,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,107,53,0.03) 1px,transparent 1px)", backgroundSize:"40px 40px", pointerEvents:"none" }} />

      {/* Lang toggle */}
      <button onClick={toggleLang} style={{ position:"absolute", top:20, right:20, padding:"6px 14px", border:"1px solid rgba(255,255,255,0.12)", borderRadius:20, background:"rgba(255,255,255,0.05)", cursor:"pointer", fontSize:12, fontWeight:700, color:"rgba(255,255,255,0.6)", fontFamily:"'Satoshi',sans-serif", zIndex:10 }}>{lang==="en"?"हिंदी":"English"}</button>

      <div className="bounce-in" style={{ background:"#13131C", border:"1px solid rgba(255,255,255,0.08)", borderRadius:22, padding:"36px 32px", width:"100%", maxWidth:420, boxShadow:"0 24px 64px rgba(0,0,0,0.8)", position:"relative", zIndex:1 }}>

        {/* Logo */}
        <div style={{ display:"flex", alignItems:"center", gap:13, marginBottom:30 }}>
          <div style={{ width:46, height:46, borderRadius:13, background:"rgba(255,107,53,0.1)", border:"1px solid rgba(255,107,53,0.2)", display:"flex", alignItems:"center", justifyContent:"center", overflow:"hidden" }}>
            <img src="/logo.png" alt="K" style={{ width:42, height:42, objectFit:"contain" }} onError={e=>e.target.style.display="none"} />
          </div>
          <div>
            <div style={{ fontFamily:"'Cabinet Grotesk','Satoshi',sans-serif", fontSize:22, fontWeight:800, letterSpacing:"-0.5px", background:"linear-gradient(135deg,#FF6B35,#FF8C5A)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>Karyika</div>
            <div style={{ fontSize:11, color:"rgba(255,255,255,0.3)", marginTop:1 }}>{t("appTagline")}</div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display:"flex", background:"rgba(255,255,255,0.04)", borderRadius:10, padding:4, marginBottom:24, border:"1px solid rgba(255,255,255,0.06)" }}>
          {["login","signup"].map(m=>(
            <button key={m} onClick={()=>{setMode(m);setError("");}} style={{ flex:1, padding:"9px", border:"none", borderRadius:8, background:mode===m?"rgba(255,107,53,0.15)":"transparent", color:mode===m?"#FF6B35":"rgba(255,255,255,0.4)", cursor:"pointer", fontSize:13, fontWeight:600, fontFamily:"'Satoshi',sans-serif", transition:"all 0.2s", letterSpacing:"0.2px" }}>
              {m==="login"?"Sign In":"Sign Up"}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} style={{ display:"flex", flexDirection:"column", gap:14 }}>
          {mode==="signup" && (
            <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
              <label style={{ fontSize:10, fontWeight:700, color:"rgba(255,255,255,0.3)", letterSpacing:"1.2px", textTransform:"uppercase" }}>Full Name</label>
              <input style={inp} type="text" placeholder="Apna naam" value={form.name} onChange={e=>set("name",e.target.value)} required />
            </div>
          )}
          <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
            <label style={{ fontSize:10, fontWeight:700, color:"rgba(255,255,255,0.3)", letterSpacing:"1.2px", textTransform:"uppercase" }}>Email</label>
            <input style={inp} type="email" placeholder="email@example.com" value={form.email} onChange={e=>set("email",e.target.value)} required />
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:5 }}>
            <label style={{ fontSize:10, fontWeight:700, color:"rgba(255,255,255,0.3)", letterSpacing:"1.2px", textTransform:"uppercase" }}>Password</label>
            <input style={inp} type="password" placeholder={mode==="signup"?"Min 6 characters":"Password"} value={form.password} onChange={e=>set("password",e.target.value)} required />
          </div>

          {error && (
            <div style={{ background:"rgba(244,63,94,0.1)", border:"1px solid rgba(244,63,94,0.25)", color:"#F43F5E", borderRadius:9, padding:"10px 14px", fontSize:12, fontWeight:500 }}>⚠️ {error}</div>
          )}

          <button type="submit" style={{ background:"linear-gradient(135deg,#FF6B35,#FF8C5A)", color:"#fff", border:"none", borderRadius:11, padding:"14px", fontSize:14, fontWeight:700, cursor:loading?"not-allowed":"pointer", fontFamily:"'Satoshi',sans-serif", opacity:loading?0.7:1, marginTop:2, boxShadow:"0 4px 20px rgba(255,107,53,0.4)", letterSpacing:"0.2px" }} disabled={loading}>
            {loading ? "⏳ Wait karo..." : mode==="login" ? "Sign In →" : "Create Account →"}
          </button>
        </form>

        <div style={{ display:"flex", alignItems:"center", gap:12, margin:"20px 0" }}>
          <div style={{ flex:1, height:1, background:"rgba(255,255,255,0.07)" }} />
          <span style={{ fontSize:11, color:"rgba(255,255,255,0.25)", fontWeight:500 }}>OR</span>
          <div style={{ flex:1, height:1, background:"rgba(255,255,255,0.07)" }} />
        </div>

        <button onClick={handleGoogle} style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:9, background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:11, padding:"13px", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"'Satoshi',sans-serif", color:"rgba(255,255,255,0.7)", width:"100%", transition:"all 0.2s" }} disabled={loading}>
          <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          Continue with Google
        </button>

        <div style={{ textAlign:"center", fontSize:12, color:"rgba(255,255,255,0.25)", marginTop:20 }}>
          {mode==="login"?"Pehli baar?":"Already have account?"}{" "}
          <span onClick={()=>{setMode(mode==="login"?"signup":"login");setError("");}} style={{ color:"#FF6B35", fontWeight:600, cursor:"pointer" }}>
            {mode==="login"?"Sign Up":"Sign In"}
          </span>
        </div>
      </div>
    </div>
  );
}
