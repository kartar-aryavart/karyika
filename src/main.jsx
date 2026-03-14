import { initSentry, setUser } from "./lib/sentry";
import { getAuth, onAuthStateChanged } from "firebase/auth";

// Init Sentry FIRST before anything else
initSentry();

// Track auth state for Sentry user context
const auth = getAuth();
onAuthStateChanged(auth, user => setUser(user));

import React, { Component } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { AuthProvider } from './hooks/useAuth.jsx'
import { LangProvider } from './i18n/translations.jsx'
import './index.css'

// Global Error Boundary
class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { hasError:false, error:null }; }
  static getDerivedStateFromError(error) { return { hasError:true, error }; }
  componentDidCatch(error, info) { console.error("App crash:", error, info); }
  render() {
    if (this.state.hasError) return (
      <div style={{ minHeight:"100vh", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", background:"#09090E", color:"#fff", padding:40, textAlign:"center" }}>
        <div style={{ fontSize:56, marginBottom:20 }}>💥</div>
        <h2 style={{ fontSize:22, fontWeight:900, marginBottom:8, color:"#FF6B35", fontFamily:"'Manrope','Inter',sans-serif" }}>Oops! Kuch toot gaya</h2>
        <p style={{ color:"rgba(255,255,255,0.45)", fontSize:14, marginBottom:8, maxWidth:420 }}>
          {this.state.error?.message || "Unexpected error"}
        </p>
        <p style={{ color:"rgba(255,255,255,0.25)", fontSize:12, marginBottom:28, fontFamily:"monospace" }}>
          {this.state.error?.stack?.split('\n')[1] || ""}
        </p>
        <button onClick={() => window.location.reload()}
          style={{ padding:"13px 32px", background:"linear-gradient(135deg,#FF6B35,#FF8C5A)", border:"none", borderRadius:12, color:"#fff", fontWeight:800, fontSize:15, cursor:"pointer", fontFamily:"'Inter',sans-serif", boxShadow:"0 4px 20px rgba(255,107,53,0.4)" }}>
          🔄 Reload App
        </button>
      </div>
    );
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <LangProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </LangProvider>
  </ErrorBoundary>
)
