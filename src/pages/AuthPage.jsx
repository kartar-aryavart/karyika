// 🔐 AuthPage v4 — World Class Auth
import { useState } from "react";
import { useAuth } from "../hooks/useAuth";

const ERROR_MSGS = {
  "auth/user-not-found":       "Yeh email registered nahi hai.",
  "auth/wrong-password":       "Password galat hai!",
  "auth/invalid-credential":   "Email ya password galat hai.",
  "auth/email-already-in-use": "Yeh email pehle se registered hai.",
  "auth/weak-password":        "Password kam se kam 6 characters ka hona chahiye.",
  "auth/invalid-email":        "Email sahi format mein likho.",
  "auth/too-many-requests":    "Bahut zyada tries! Thodi der baad try karo.",
  "auth/network-request-failed": "Internet connection check karo.",
  "auth/popup-closed-by-user": "Google login cancel ho gaya. Dobara try karo.",
};

export default function AuthPage() {
  const { loginWithGoogle, loginWithEmail, signupWithEmail, resetPassword } = useAuth();
  const [mode, setMode]     = useState("login"); // login | signup | reset
  const [form, setForm]     = useState({ name:"", email:"", password:"" });
  const [showPass, setShowPass] = useState(false);
  const [error, setError]   = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setSuccess(""); setLoading(true);
    try {
      if (mode === "reset") {
        if (!form.email) { setError("Email daalo!"); setLoading(false); return; }
        await resetPassword(form.email);
        setSuccess("Password reset email bhej diya! Inbox check karo.");
        setLoading(false); return;
      }
      if (mode === "login") {
        await loginWithEmail(form.email, form.password);
      } else {
        if (!form.name.trim()) { setError("Apna naam daalo!"); setLoading(false); return; }
        if (form.password.length < 6) { setError("Password 6+ characters ka hona chahiye."); setLoading(false); return; }
        await signupWithEmail(form.email, form.password, form.name);
      }
    } catch (err) {
      setError(ERROR_MSGS[err.code] || `Error: ${err.message}`);
    }
    setLoading(false);
  };

  const handleGoogle = async () => {
    setError(""); setLoading(true);
    try { await loginWithGoogle(); }
    catch (err) { setError(ERROR_MSGS[err.code] || "Google login mein problem. Dobara try karo."); }
    setLoading(false);
  };

  const inp = (focused) => ({
    width: "100%", padding: "13px 16px", background: "rgba(255,255,255,0.05)",
    border: `1.5px solid ${focused ? "rgba(255,107,53,0.6)" : "rgba(255,255,255,0.1)"}`,
    borderRadius: 12, color: "#fff", fontSize: 14, outline: "none",
    fontFamily: "'Inter','Manrope',sans-serif", transition: "border 0.2s",
    boxSizing: "border-box",
  });

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "#09090E", padding: 20, position: "relative", overflow: "hidden",
    }}>
      {/* Background */}
      <div style={{ position:"absolute", top:-120, right:-120, width:500, height:500, borderRadius:"50%", background:"radial-gradient(circle,rgba(255,107,53,0.14) 0%,transparent 65%)", pointerEvents:"none" }} />
      <div style={{ position:"absolute", bottom:-100, left:-80, width:500, height:500, borderRadius:"50%", background:"radial-gradient(circle,rgba(99,102,241,0.1) 0%,transparent 65%)", pointerEvents:"none" }} />
      <div style={{ position:"absolute", inset:0, backgroundImage:"linear-gradient(rgba(255,107,53,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,107,53,0.025) 1px,transparent 1px)", backgroundSize:"44px 44px", pointerEvents:"none" }} />

      <div style={{
        background: "#0F0F1C", border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 24, padding: "38px 34px", width: "100%", maxWidth: 420,
        boxShadow: "0 32px 80px rgba(0,0,0,0.85)", position: "relative", zIndex: 1,
        animation: "popIn 0.25s ease",
      }}>

        {/* Logo */}
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:28 }}>
          <div style={{ width:46, height:46, borderRadius:13, background:"rgba(255,107,53,0.12)", border:"1px solid rgba(255,107,53,0.25)", display:"flex", alignItems:"center", justifyContent:"center", overflow:"hidden" }}>
            <img src="/logo.png" alt="K" style={{ width:40, height:40, objectFit:"contain" }} onError={e => e.target.style.display="none"} />
          </div>
          <div>
            <div style={{ fontFamily:"'Manrope','Inter',sans-serif", fontSize:22, fontWeight:900, letterSpacing:"-0.5px", background:"linear-gradient(135deg,#FF6B35,#FF8C5A)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>Karyika</div>
            <div style={{ fontSize:11, color:"rgba(255,255,255,0.3)", marginTop:1 }}>World-class productivity</div>
          </div>
        </div>

        {/* Mode tabs */}
        {mode !== "reset" && (
          <div style={{ display:"flex", background:"rgba(255,255,255,0.04)", borderRadius:12, padding:4, marginBottom:26, border:"1px solid rgba(255,255,255,0.06)" }}>
            {["login","signup"].map(m => (
              <button key={m} onClick={() => { setMode(m); setError(""); setSuccess(""); }}
                style={{ flex:1, padding:"10px", border:"none", borderRadius:9, background: mode===m ? "rgba(255,107,53,0.15)" : "transparent", color: mode===m ? "#FF6B35" : "rgba(255,255,255,0.4)", cursor:"pointer", fontSize:13, fontWeight:700, fontFamily:"'Inter',sans-serif", transition:"all 0.2s" }}>
                {m === "login" ? "Sign In" : "Sign Up"}
              </button>
            ))}
          </div>
        )}

        {mode === "reset" && (
          <div style={{ marginBottom:20 }}>
            <button onClick={() => { setMode("login"); setError(""); setSuccess(""); }} style={{ background:"transparent", border:"none", color:"rgba(255,255,255,0.4)", cursor:"pointer", fontSize:13, fontFamily:"'Inter',sans-serif", display:"flex", alignItems:"center", gap:6 }}>
              ← Wapas jaao
            </button>
            <h2 style={{ color:"#fff", fontSize:20, fontWeight:800, marginTop:12, fontFamily:"'Manrope',sans-serif" }}>Password Reset</h2>
            <p style={{ color:"rgba(255,255,255,0.4)", fontSize:13, marginTop:4 }}>Email daalo — reset link bhejenge</p>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display:"flex", flexDirection:"column", gap:16 }}>
          {mode === "signup" && (
            <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
              <label style={{ fontSize:10, fontWeight:800, color:"rgba(255,255,255,0.35)", letterSpacing:"1.2px", textTransform:"uppercase" }}>Full Name</label>
              <input style={inp(false)} type="text" placeholder="Apna naam" value={form.name}
                onChange={e => set("name", e.target.value)} required autoComplete="name"
                onFocus={e => e.target.style.borderColor = "rgba(255,107,53,0.6)"}
                onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"} />
            </div>
          )}

          <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
            <label style={{ fontSize:10, fontWeight:800, color:"rgba(255,255,255,0.35)", letterSpacing:"1.2px", textTransform:"uppercase" }}>Email</label>
            <input style={inp(false)} type="email" placeholder="aap@example.com" value={form.email}
              onChange={e => set("email", e.target.value)} required autoComplete="email"
              onFocus={e => e.target.style.borderColor = "rgba(255,107,53,0.6)"}
              onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"} />
          </div>

          {mode !== "reset" && (
            <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <label style={{ fontSize:10, fontWeight:800, color:"rgba(255,255,255,0.35)", letterSpacing:"1.2px", textTransform:"uppercase" }}>Password</label>
                {mode === "login" && (
                  <button type="button" onClick={() => setMode("reset")} style={{ background:"transparent", border:"none", color:"#FF6B35", fontSize:12, cursor:"pointer", fontFamily:"'Inter',sans-serif", fontWeight:600 }}>
                    Bhool gaye?
                  </button>
                )}
              </div>
              <div style={{ position:"relative" }}>
                <input style={{ ...inp(false), paddingRight:48 }} type={showPass ? "text" : "password"}
                  placeholder={mode === "signup" ? "Min 6 characters" : "Password"}
                  value={form.password} onChange={e => set("password", e.target.value)}
                  required autoComplete={mode === "login" ? "current-password" : "new-password"}
                  onFocus={e => e.target.style.borderColor = "rgba(255,107,53,0.6)"}
                  onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"} />
                <button type="button" onClick={() => setShowPass(s => !s)}
                  style={{ position:"absolute", right:14, top:"50%", transform:"translateY(-50%)", background:"transparent", border:"none", color:"rgba(255,255,255,0.4)", cursor:"pointer", fontSize:16, padding:0 }}>
                  {showPass ? "🙈" : "👁"}
                </button>
              </div>
            </div>
          )}

          {error && (
            <div style={{ background:"rgba(244,63,94,0.1)", border:"1px solid rgba(244,63,94,0.25)", color:"#F43F5E", borderRadius:10, padding:"11px 14px", fontSize:13, fontWeight:500, display:"flex", gap:8, alignItems:"flex-start" }}>
              <span>⚠️</span> <span>{error}</span>
            </div>
          )}
          {success && (
            <div style={{ background:"rgba(16,185,129,0.1)", border:"1px solid rgba(16,185,129,0.25)", color:"#10B981", borderRadius:10, padding:"11px 14px", fontSize:13, fontWeight:500, display:"flex", gap:8 }}>
              <span>✅</span> <span>{success}</span>
            </div>
          )}

          <button type="submit" disabled={loading}
            style={{ background: loading ? "rgba(255,107,53,0.4)" : "linear-gradient(135deg,#FF6B35,#FF8C5A)", color:"#fff", border:"none", borderRadius:12, padding:"14px", fontSize:14, fontWeight:800, cursor: loading ? "not-allowed" : "pointer", fontFamily:"'Inter',sans-serif", boxShadow: loading ? "none" : "0 4px 24px rgba(255,107,53,0.4)", letterSpacing:"0.3px", transition:"all 0.2s", marginTop:2 }}>
            {loading ? "⏳ Please wait..." :
             mode === "login" ? "Sign In →" :
             mode === "signup" ? "Create Account →" :
             "Send Reset Email →"}
          </button>
        </form>

        {mode !== "reset" && (
          <>
            <div style={{ display:"flex", alignItems:"center", gap:12, margin:"22px 0 18px" }}>
              <div style={{ flex:1, height:1, background:"rgba(255,255,255,0.07)" }} />
              <span style={{ fontSize:11, color:"rgba(255,255,255,0.25)", fontWeight:600 }}>OR</span>
              <div style={{ flex:1, height:1, background:"rgba(255,255,255,0.07)" }} />
            </div>

            <button onClick={handleGoogle} disabled={loading}
              style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:10, background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:12, padding:"13px", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"'Inter',sans-serif", color:"rgba(255,255,255,0.75)", width:"100%", transition:"all 0.2s" }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.09)"}
              onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}>
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </button>
          </>
        )}

        <div style={{ textAlign:"center", fontSize:12, color:"rgba(255,255,255,0.25)", marginTop:22 }}>
          {mode === "login" ? "Pehli baar? " : mode === "signup" ? "Pehle se account hai? " : ""}
          {mode !== "reset" && (
            <span onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); }}
              style={{ color:"#FF6B35", fontWeight:700, cursor:"pointer" }}>
              {mode === "login" ? "Sign Up karo" : "Sign In karo"}
            </span>
          )}
        </div>
      </div>

      <style>{`@keyframes popIn { from{opacity:0;transform:scale(0.95) translateY(10px)} to{opacity:1;transform:none} }`}</style>
    </div>
  );
}
