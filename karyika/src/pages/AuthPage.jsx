// 🔐 AuthPage — Login & Signup for Karyika
import { useState } from "react";
import { useAuth } from "../hooks/useAuth";

export default function AuthPage() {
  const { loginWithGoogle, loginWithEmail, signupWithEmail } = useAuth();
  const [mode, setMode] = useState("login"); // login | signup
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      if (mode === "login") {
        await loginWithEmail(form.email, form.password);
      } else {
        if (!form.name.trim()) { setError("Naam daalo bhai!"); setLoading(false); return; }
        await signupWithEmail(form.email, form.password, form.name);
      }
    } catch (err) {
      const msgs = {
        "auth/user-not-found": "Yeh account nahi mila. Pehle signup karo.",
        "auth/wrong-password": "Password galat hai!",
        "auth/email-already-in-use": "Yeh email already registered hai.",
        "auth/weak-password": "Password kam se kam 6 characters ka hona chahiye.",
        "auth/invalid-email": "Email sahi nahi hai.",
        "auth/invalid-credential": "Email ya password galat hai.",
      };
      setError(msgs[err.code] || "Kuch gadbad ho gayi. Dobara try karo.");
    }
    setLoading(false);
  };

  const handleGoogle = async () => {
    setError(""); setLoading(true);
    try { await loginWithGoogle(); }
    catch (err) { setError("Google login mein problem aayi."); }
    setLoading(false);
  };

  return (
    <div style={styles.wrapper}>
      {/* Background decoration */}
      <div style={styles.bgCircle1} />
      <div style={styles.bgCircle2} />
      <div style={styles.bgDots} />

      <div style={styles.card} className="bounce-in">
        {/* Logo */}
        <div style={styles.logo}>
          <div style={styles.logoIcon}>क</div>
          <div>
            <div style={styles.logoName}>Karyika</div>
            <div style={styles.logoSub}>कार्यिका — Your Productivity Companion</div>
          </div>
        </div>

        {/* Tab switcher */}
        <div style={styles.tabs}>
          <button style={{ ...styles.tab, ...(mode === "login" ? styles.tabActive : {}) }} onClick={() => { setMode("login"); setError(""); }}>
            Login
          </button>
          <button style={{ ...styles.tab, ...(mode === "signup" ? styles.tabActive : {}) }} onClick={() => { setMode("signup"); setError(""); }}>
            Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          {mode === "signup" && (
            <div style={styles.field}>
              <label style={styles.label}>Aapka Naam</label>
              <input style={styles.input} type="text" placeholder="Full name daalo" value={form.name} onChange={e => set("name", e.target.value)} required />
            </div>
          )}
          <div style={styles.field}>
            <label style={styles.label}>Email</label>
            <input style={styles.input} type="email" placeholder="email@example.com" value={form.email} onChange={e => set("email", e.target.value)} required />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input style={styles.input} type="password" placeholder={mode === "signup" ? "Min 6 characters" : "Password daalo"} value={form.password} onChange={e => set("password", e.target.value)} required />
          </div>

          {error && <div style={styles.error}>⚠️ {error}</div>}

          <button type="submit" style={{ ...styles.btnPrimary, opacity: loading ? 0.7 : 1 }} disabled={loading}>
            {loading ? "⏳ Wait karo..." : mode === "login" ? "Login Karo →" : "Account Banao →"}
          </button>
        </form>

        <div style={styles.divider}><span style={styles.dividerText}>ya phir</span></div>

        <button onClick={handleGoogle} style={styles.btnGoogle} disabled={loading}>
          <GoogleIcon /> Google se Continue Karo
        </button>

        <div style={styles.switchText}>
          {mode === "login" ? "Pehli baar hai?" : "Already account hai?"}{" "}
          <span style={styles.switchLink} onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); }}>
            {mode === "login" ? "Sign Up Karo" : "Login Karo"}
          </span>
        </div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" style={{ marginRight: 8, flexShrink: 0 }}>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}

const styles = {
  wrapper: {
    minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
    background: "var(--bg)", padding: "20px", position: "relative", overflow: "hidden",
  },
  bgCircle1: {
    position: "absolute", width: 500, height: 500, borderRadius: "50%",
    background: "radial-gradient(circle, rgba(255,107,53,0.08) 0%, transparent 70%)",
    top: -200, right: -100, pointerEvents: "none",
  },
  bgCircle2: {
    position: "absolute", width: 400, height: 400, borderRadius: "50%",
    background: "radial-gradient(circle, rgba(10,123,108,0.08) 0%, transparent 70%)",
    bottom: -150, left: -100, pointerEvents: "none",
  },
  bgDots: {
    position: "absolute", inset: 0, pointerEvents: "none",
    backgroundImage: "radial-gradient(circle, var(--border) 1px, transparent 1px)",
    backgroundSize: "28px 28px", opacity: 0.5,
  },
  card: {
    background: "var(--surface)", border: "1px solid var(--border)",
    borderRadius: 24, padding: "40px 36px", width: "100%", maxWidth: 420,
    boxShadow: "var(--shadow-xl)", position: "relative", zIndex: 1,
  },
  logo: { display: "flex", alignItems: "center", gap: 14, marginBottom: 32 },
  logoIcon: {
    width: 48, height: 48, borderRadius: 14, fontSize: 22, fontWeight: 700,
    background: "var(--accent)", color: "#fff", display: "flex",
    alignItems: "center", justifyContent: "center", fontFamily: "var(--font-head)",
    flexShrink: 0,
  },
  logoName: { fontFamily: "var(--font-head)", fontSize: 22, fontWeight: 700, color: "var(--text)", lineHeight: 1.2 },
  logoSub: { fontSize: 11, color: "var(--text3)", marginTop: 2 },
  tabs: {
    display: "flex", background: "var(--surface2)", borderRadius: 10,
    padding: 4, marginBottom: 24, gap: 4,
  },
  tab: {
    flex: 1, padding: "9px", border: "none", borderRadius: 8,
    background: "transparent", color: "var(--text2)", cursor: "pointer",
    fontSize: 14, fontWeight: 600, fontFamily: "var(--font-body)",
    transition: "all var(--t)",
  },
  tabActive: {
    background: "var(--surface)", color: "var(--accent)",
    boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
  },
  form: { display: "flex", flexDirection: "column", gap: 16 },
  field: { display: "flex", flexDirection: "column", gap: 6 },
  label: { fontSize: 12, fontWeight: 600, color: "var(--text2)", letterSpacing: "0.3px" },
  input: {
    background: "var(--surface2)", border: "1.5px solid var(--border)",
    borderRadius: 10, color: "var(--text)", fontSize: 14, padding: "11px 14px",
    fontFamily: "var(--font-body)", outline: "none", transition: "all var(--t)", width: "100%",
  },
  error: {
    background: "#FFF0F0", border: "1px solid #FFD0D0", color: "var(--high)",
    borderRadius: 8, padding: "10px 14px", fontSize: 13,
  },
  btnPrimary: {
    background: "var(--accent)", color: "#fff", border: "none",
    borderRadius: 10, padding: "13px", fontSize: 14, fontWeight: 700,
    cursor: "pointer", fontFamily: "var(--font-body)", transition: "all var(--t)",
    marginTop: 4,
  },
  divider: {
    display: "flex", alignItems: "center", gap: 12, margin: "20px 0",
    "::before": { content: '""', flex: 1, height: 1, background: "var(--border)" },
  },
  dividerText: {
    fontSize: 12, color: "var(--text3)", background: "var(--surface)",
    padding: "0 8px", position: "relative",
  },
  btnGoogle: {
    display: "flex", alignItems: "center", justifyContent: "center",
    background: "var(--surface2)", border: "1.5px solid var(--border)",
    borderRadius: 10, padding: "12px", fontSize: 14, fontWeight: 600,
    cursor: "pointer", fontFamily: "var(--font-body)", color: "var(--text)",
    transition: "all var(--t)", width: "100%",
  },
  switchText: { textAlign: "center", fontSize: 13, color: "var(--text2)", marginTop: 20 },
  switchLink: { color: "var(--accent)", fontWeight: 600, cursor: "pointer", textDecoration: "underline" },
};
