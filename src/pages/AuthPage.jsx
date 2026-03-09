// 🔐 AuthPage v2 — with Logo
import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { useLang } from "../i18n/translations.jsx";

export default function AuthPage() {
  const { loginWithGoogle, loginWithEmail, signupWithEmail } = useAuth();
  const { t, lang, toggleLang } = useLang();
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      if (mode === "login") await loginWithEmail(form.email, form.password);
      else { if (!form.name.trim()) { setError("Naam daalo!"); setLoading(false); return; } await signupWithEmail(form.email, form.password, form.name); }
    } catch (err) {
      const msgs = { "auth/user-not-found": "Account nahi mila.", "auth/wrong-password": "Password galat hai!", "auth/email-already-in-use": "Email already registered hai.", "auth/weak-password": "Password 6+ characters ka hona chahiye.", "auth/invalid-credential": "Email ya password galat hai." };
      setError(msgs[err.code] || "Kuch gadbad ho gayi.");
    }
    setLoading(false);
  };

  const handleGoogle = async () => { setError(""); setLoading(true); try { await loginWithGoogle(); } catch { setError("Google login mein problem."); } setLoading(false); };

  const inp = { background: "var(--surface2)", border: "1.5px solid var(--border)", borderRadius: 10, color: "var(--text)", fontSize: 14, padding: "11px 14px", fontFamily: "var(--font-body)", outline: "none", transition: "all var(--t)", width: "100%" };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)", padding: 20, position: "relative", overflow: "hidden" }}>
      {/* Background */}
      <div style={{ position: "absolute", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,107,53,0.08) 0%, transparent 70%)", top: -200, right: -100, pointerEvents: "none" }} />
      <div style={{ position: "absolute", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(10,123,108,0.08) 0%, transparent 70%)", bottom: -150, left: -100, pointerEvents: "none" }} />
      <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(circle, var(--border) 1px, transparent 1px)", backgroundSize: "28px 28px", opacity: 0.4, pointerEvents: "none" }} />

      {/* Language toggle top right */}
      <button onClick={toggleLang} style={{ position: "absolute", top: 20, right: 20, padding: "6px 14px", border: "1.5px solid var(--border)", borderRadius: 20, background: "var(--surface)", cursor: "pointer", fontSize: 13, fontWeight: 700, color: "var(--text)", fontFamily: "var(--font-body)", zIndex: 10 }}>{lang === "en" ? "हिंदी" : "English"}</button>

      <div className="bounce-in" style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 24, padding: "36px 32px", width: "100%", maxWidth: 420, boxShadow: "var(--shadow-xl)", position: "relative", zIndex: 1 }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 28 }}>
          <img src="/logo.png" alt="Karyika" style={{ width: 52, height: 52, borderRadius: 14, objectFit: "contain" }} onError={e => { e.target.style.display = "none"; }} />
          <div>
            <div style={{ fontFamily: "var(--font-head)", fontSize: 22, fontWeight: 800, color: "var(--accent)", lineHeight: 1.2 }}>Karyika</div>
            <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 2 }}>{t("appTagline")}</div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", background: "var(--surface2)", borderRadius: 10, padding: 4, marginBottom: 22, gap: 4 }}>
          {["login", "signup"].map(m => (
            <button key={m} onClick={() => { setMode(m); setError(""); }} style={{ flex: 1, padding: "9px", border: "none", borderRadius: 8, background: mode === m ? "var(--surface)" : "transparent", color: mode === m ? "var(--accent)" : "var(--text2)", cursor: "pointer", fontSize: 14, fontWeight: 600, fontFamily: "var(--font-body)", transition: "all var(--t)", boxShadow: mode === m ? "0 1px 4px rgba(0,0,0,0.1)" : "none" }}>
              {m === "login" ? t("login") : t("signup")}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {mode === "signup" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text2)" }}>{t("yourName")}</label>
              <input style={inp} type="text" placeholder="Full name" value={form.name} onChange={e => set("name", e.target.value)} required />
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text2)" }}>{t("email")}</label>
            <input style={inp} type="email" placeholder="email@example.com" value={form.email} onChange={e => set("email", e.target.value)} required />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text2)" }}>{t("password")}</label>
            <input style={inp} type="password" placeholder={mode === "signup" ? "Min 6 characters" : "Password"} value={form.password} onChange={e => set("password", e.target.value)} required />
          </div>
          {error && <div style={{ background: "#FFF0F0", border: "1px solid #FFD0D0", color: "var(--high)", borderRadius: 8, padding: "10px 14px", fontSize: 13 }}>⚠️ {error}</div>}
          <button type="submit" style={{ background: "var(--accent)", color: "#fff", border: "none", borderRadius: 10, padding: "13px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-body)", opacity: loading ? 0.7 : 1, marginTop: 4 }} disabled={loading}>
            {loading ? "⏳ Please wait..." : mode === "login" ? t("loginBtn") : t("signupBtn")}
          </button>
        </form>

        <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "18px 0" }}>
          <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
          <span style={{ fontSize: 12, color: "var(--text3)" }}>{t("orUse")}</span>
          <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
        </div>

        <button onClick={handleGoogle} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: "var(--surface2)", border: "1.5px solid var(--border)", borderRadius: 10, padding: "12px", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font-body)", color: "var(--text)", width: "100%" }} disabled={loading}>
          <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          {t("continueGoogle")}
        </button>

        <div style={{ textAlign: "center", fontSize: 13, color: "var(--text2)", marginTop: 18 }}>
          {mode === "login" ? t("firstTime") : t("haveAccount")}{" "}
          <span onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); }} style={{ color: "var(--accent)", fontWeight: 600, cursor: "pointer", textDecoration: "underline" }}>
            {mode === "login" ? t("signUpLink") : t("loginLink")}
          </span>
        </div>
      </div>
    </div>
  );
}
