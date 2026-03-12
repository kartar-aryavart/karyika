// 👤 ProfileSetupPage — First login ke baad setup
import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { updateProfile } from "firebase/auth";
import { db, auth } from "../firebase/config";

const AVATARS = ["🦁","🐯","🦊","🐺","🦅","🐉","🦋","🌟","🔥","⚡","🎯","🚀","🧠","💎","🎨","🌈"];
const TIMEZONES = [
  "Asia/Kolkata", "Asia/Dubai", "Asia/Singapore", "Asia/Tokyo",
  "Europe/London", "Europe/Paris", "America/New_York", "America/Los_Angeles",
  "Australia/Sydney", "Pacific/Auckland",
];
const THEMES = [
  { id:"dark", label:"Dark", icon:"🌙", desc:"Easy on eyes" },
  { id:"light", label:"Light", icon:"☀️", desc:"Classic look" },
];
const GOALS = [
  { id:"student", label:"Student", icon:"📚" },
  { id:"professional", label:"Professional", icon:"💼" },
  { id:"entrepreneur", label:"Entrepreneur", icon:"🚀" },
  { id:"creator", label:"Creator", icon:"🎨" },
  { id:"other", label:"Other", icon:"✨" },
];

export default function ProfileSetupPage({ onComplete }) {
  const { user } = useAuth();
  const [step, setStep] = useState(1); // 1: name+avatar, 2: timezone+theme, 3: goal
  const [form, setForm] = useState({
    name: user?.displayName || "",
    avatar: "🚀",
    timezone: "Asia/Kolkata",
    theme: "dark",
    goal: "professional",
    lang: "en",
  });
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function handleComplete() {
    setSaving(true);
    try {
      // Update Firebase Auth display name
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { displayName: form.name });
      }
      // Save to Firestore
      await setDoc(doc(db, "users", user.uid, "profile", "info"), {
        uid: user.uid,
        name: form.name,
        email: user.email,
        avatar: form.avatar,
        timezone: form.timezone,
        theme: form.theme,
        goal: form.goal,
        lang: form.lang,
        plan: "free",
        onboarded: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }, { merge: true });

      // Apply theme
      document.documentElement.setAttribute("data-theme", form.theme);
      localStorage.setItem("karyika-theme", form.theme);

      onComplete(form);
    } catch (e) {
      console.error("Profile save error:", e);
      onComplete(form); // Continue anyway
    }
    setSaving(false);
  }

  const totalSteps = 3;
  const progress = (step / totalSteps) * 100;

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "#09090E", padding: 20, position: "relative", overflow: "hidden",
    }}>
      {/* Background */}
      <div style={{ position:"absolute", top:-100, right:-100, width:500, height:500, borderRadius:"50%", background:"radial-gradient(circle,rgba(255,107,53,0.1) 0%,transparent 65%)", pointerEvents:"none" }} />
      <div style={{ position:"absolute", bottom:-100, left:-100, width:400, height:400, borderRadius:"50%", background:"radial-gradient(circle,rgba(99,102,241,0.08) 0%,transparent 65%)", pointerEvents:"none" }} />

      <div style={{
        background: "#0F0F1C", border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 24, padding: "38px 34px", width: "100%", maxWidth: 480,
        boxShadow: "0 32px 80px rgba(0,0,0,0.85)", position: "relative", zIndex: 1,
      }}>
        {/* Progress bar */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:10 }}>
            <span style={{ fontSize:12, color:"rgba(255,255,255,0.35)", fontWeight:600 }}>
              Step {step} of {totalSteps}
            </span>
            <span style={{ fontSize:12, color:"#FF6B35", fontWeight:700 }}>{Math.round(progress)}%</span>
          </div>
          <div style={{ height:4, background:"rgba(255,255,255,0.06)", borderRadius:4, overflow:"hidden" }}>
            <div style={{ height:"100%", width:`${progress}%`, background:"linear-gradient(90deg,#FF6B35,#FF8C5A)", borderRadius:4, transition:"width 0.4s ease" }} />
          </div>
        </div>

        {/* STEP 1 — Name + Avatar */}
        {step === 1 && (
          <div style={{ animation:"fadeIn 0.3s ease" }}>
            <div style={{ fontSize:36, marginBottom:12 }}>👋</div>
            <h2 style={{ fontSize:24, fontWeight:900, color:"#fff", marginBottom:6, fontFamily:"'Manrope','Inter',sans-serif", letterSpacing:"-0.5px" }}>
              Namaste! Aapka naam?
            </h2>
            <p style={{ color:"rgba(255,255,255,0.35)", fontSize:14, marginBottom:28 }}>
              Karyika aapko personalize karega
            </p>

            <div style={{ marginBottom:20 }}>
              <label style={{ fontSize:10, fontWeight:800, color:"rgba(255,255,255,0.35)", letterSpacing:"1.2px", textTransform:"uppercase", display:"block", marginBottom:8 }}>
                Aapka Naam
              </label>
              <input
                value={form.name}
                onChange={e => set("name", e.target.value)}
                placeholder="e.g. Kartar Arya"
                autoFocus
                style={{
                  width:"100%", padding:"13px 16px", background:"rgba(255,255,255,0.05)",
                  border:"1.5px solid rgba(255,255,255,0.1)", borderRadius:12,
                  color:"#fff", fontSize:15, outline:"none", fontFamily:"'Inter',sans-serif",
                  boxSizing:"border-box", transition:"border 0.2s",
                }}
                onFocus={e => e.target.style.borderColor = "rgba(255,107,53,0.6)"}
                onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
              />
            </div>

            <div>
              <label style={{ fontSize:10, fontWeight:800, color:"rgba(255,255,255,0.35)", letterSpacing:"1.2px", textTransform:"uppercase", display:"block", marginBottom:10 }}>
                Avatar Choose Karo
              </label>
              <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                {AVATARS.map(av => (
                  <button key={av} onClick={() => set("avatar", av)}
                    style={{
                      width:46, height:46, borderRadius:12, fontSize:22, border:"2px solid",
                      borderColor: form.avatar === av ? "#FF6B35" : "rgba(255,255,255,0.08)",
                      background: form.avatar === av ? "rgba(255,107,53,0.15)" : "rgba(255,255,255,0.03)",
                      cursor:"pointer", transition:"all 0.15s", display:"flex", alignItems:"center", justifyContent:"center",
                    }}>
                    {av}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 2 — Timezone + Theme */}
        {step === 2 && (
          <div style={{ animation:"fadeIn 0.3s ease" }}>
            <div style={{ fontSize:36, marginBottom:12 }}>⚙️</div>
            <h2 style={{ fontSize:24, fontWeight:900, color:"#fff", marginBottom:6, fontFamily:"'Manrope','Inter',sans-serif", letterSpacing:"-0.5px" }}>
              Preferences Set Karo
            </h2>
            <p style={{ color:"rgba(255,255,255,0.35)", fontSize:14, marginBottom:28 }}>
              Baad mein Settings mein change kar sakte ho
            </p>

            <div style={{ marginBottom:22 }}>
              <label style={{ fontSize:10, fontWeight:800, color:"rgba(255,255,255,0.35)", letterSpacing:"1.2px", textTransform:"uppercase", display:"block", marginBottom:8 }}>
                Timezone
              </label>
              <select value={form.timezone} onChange={e => set("timezone", e.target.value)}
                style={{
                  width:"100%", padding:"13px 16px", background:"rgba(255,255,255,0.05)",
                  border:"1.5px solid rgba(255,255,255,0.1)", borderRadius:12,
                  color:"#fff", fontSize:14, outline:"none", fontFamily:"'Inter',sans-serif",
                  boxSizing:"border-box", cursor:"pointer",
                }}>
                {TIMEZONES.map(tz => (
                  <option key={tz} value={tz} style={{ background:"#13131F" }}>{tz.replace("_"," ")}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize:10, fontWeight:800, color:"rgba(255,255,255,0.35)", letterSpacing:"1.2px", textTransform:"uppercase", display:"block", marginBottom:10 }}>
                Theme
              </label>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                {THEMES.map(t => (
                  <button key={t.id} onClick={() => set("theme", t.id)}
                    style={{
                      padding:"14px 16px", border:"2px solid",
                      borderColor: form.theme === t.id ? "#FF6B35" : "rgba(255,255,255,0.08)",
                      background: form.theme === t.id ? "rgba(255,107,53,0.1)" : "rgba(255,255,255,0.03)",
                      borderRadius:12, cursor:"pointer", textAlign:"left", transition:"all 0.15s",
                    }}>
                    <div style={{ fontSize:22, marginBottom:4 }}>{t.icon}</div>
                    <div style={{ fontSize:13, fontWeight:700, color:"#fff" }}>{t.label}</div>
                    <div style={{ fontSize:11, color:"rgba(255,255,255,0.35)" }}>{t.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 3 — Goal */}
        {step === 3 && (
          <div style={{ animation:"fadeIn 0.3s ease" }}>
            <div style={{ fontSize:36, marginBottom:12 }}>🎯</div>
            <h2 style={{ fontSize:24, fontWeight:900, color:"#fff", marginBottom:6, fontFamily:"'Manrope','Inter',sans-serif", letterSpacing:"-0.5px" }}>
              Aap mainly kya hain?
            </h2>
            <p style={{ color:"rgba(255,255,255,0.35)", fontSize:14, marginBottom:28 }}>
              Karyika aapke liye customize ho jaayega
            </p>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
              {GOALS.map(g => (
                <button key={g.id} onClick={() => set("goal", g.id)}
                  style={{
                    padding:"18px 16px", border:"2px solid",
                    borderColor: form.goal === g.id ? "#FF6B35" : "rgba(255,255,255,0.08)",
                    background: form.goal === g.id ? "rgba(255,107,53,0.1)" : "rgba(255,255,255,0.03)",
                    borderRadius:14, cursor:"pointer", textAlign:"center", transition:"all 0.15s",
                  }}>
                  <div style={{ fontSize:28, marginBottom:6 }}>{g.icon}</div>
                  <div style={{ fontSize:13, fontWeight:700, color:"#fff" }}>{g.label}</div>
                </button>
              ))}
            </div>

            <div style={{ marginTop:20, padding:"14px 16px", background:"rgba(255,107,53,0.06)", border:"1px solid rgba(255,107,53,0.15)", borderRadius:12 }}>
              <div style={{ fontSize:13, color:"rgba(255,255,255,0.6)" }}>
                👋 <strong style={{ color:"#FF6B35" }}>{form.name || "Aap"}</strong> — Karyika mein aapka swagat hai!
                Aapka avatar: {form.avatar} | Theme: {form.theme === "dark" ? "🌙 Dark" : "☀️ Light"}
              </div>
            </div>
          </div>
        )}

        {/* Navigation buttons */}
        <div style={{ display:"flex", gap:10, marginTop:28 }}>
          {step > 1 && (
            <button onClick={() => setStep(s => s-1)}
              style={{ flex:1, padding:"13px", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:12, color:"rgba(255,255,255,0.6)", fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"'Inter',sans-serif" }}>
              ← Peeche
            </button>
          )}
          <button
            onClick={() => {
              if (step < totalSteps) setStep(s => s+1);
              else handleComplete();
            }}
            disabled={saving || (step === 1 && !form.name.trim())}
            style={{
              flex: 2, padding:"13px",
              background: "linear-gradient(135deg,#FF6B35,#FF8C5A)",
              border:"none", borderRadius:12, color:"#fff", fontSize:14, fontWeight:800,
              cursor: saving ? "not-allowed" : "pointer", fontFamily:"'Inter',sans-serif",
              boxShadow:"0 4px 20px rgba(255,107,53,0.35)", transition:"all 0.2s",
              opacity: (step === 1 && !form.name.trim()) ? 0.5 : 1,
            }}>
            {saving ? "⏳ Saving..." : step < totalSteps ? "Aage →" : "🚀 Karyika Start Karo!"}
          </button>
        </div>
      </div>
      <style>{`@keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }`}</style>
    </div>
  );
}
