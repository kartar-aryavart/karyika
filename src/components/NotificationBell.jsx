// 🔔 Notification Bell Component — Real-time push notifications
import { useState, useEffect, useRef } from "react";
import { useAuth } from "../hooks/useAuth";
import { subscribeToNotifications, markNotifRead, markAllNotifsRead, deleteNotification } from "../firebase/services";

const TYPE_ICON = { info:"💬", task:"✅", reminder:"⏰", team:"👥", ai:"🤖", warning:"⚠️", success:"🎉" };
const TYPE_COLOR = { info:"#818CF8", task:"#10B981", reminder:"#F59E0B", team:"#FF6B35", ai:"#8B5CF6", warning:"#F43F5E", success:"#10B981" };

function timeAgo(ts) {
  if (!ts) return "";
  const d = ts?.toDate ? ts.toDate() : new Date(ts);
  const diff = (Date.now()-d.getTime())/1000;
  if (diff<60) return "just now";
  if (diff<3600) return `${Math.floor(diff/60)}m ago`;
  if (diff<86400) return `${Math.floor(diff/3600)}h ago`;
  return `${Math.floor(diff/86400)}d ago`;
}

export default function NotificationBell({ onNavigate }) {
  const { user } = useAuth();
  const [notifs, setNotifs] = useState([]);
  const [open, setOpen] = useState(false);
  const ref = useRef();

  useEffect(() => {
    if (!user) return;
    return subscribeToNotifications(user.uid, setNotifs);
  }, [user]);

  useEffect(() => {
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const unread = notifs.filter(n=>!n.read).length;

  const handleClick = async (n) => {
    if (!n.read) await markNotifRead(user.uid, n.id);
    if (n.link && onNavigate) onNavigate(n.link);
    setOpen(false);
  };

  return (
    <div ref={ref} style={{position:"relative"}}>
      <button onClick={()=>setOpen(o=>!o)} style={{
        position:"relative",width:36,height:36,borderRadius:"50%",
        background:open?"rgba(255,107,53,0.1)":"rgba(255,255,255,0.04)",
        border:`1px solid ${open?"rgba(255,107,53,0.3)":"rgba(255,255,255,0.08)"}`,
        display:"flex",alignItems:"center",justifyContent:"center",
        cursor:"pointer",transition:"all 0.2s",fontSize:16,
      }}>
        🔔
        {unread>0&&(
          <div style={{
            position:"absolute",top:-2,right:-2,minWidth:18,height:18,
            borderRadius:9,background:"#F43F5E",border:"2px solid #09090E",
            display:"flex",alignItems:"center",justifyContent:"center",
            fontSize:10,fontWeight:800,color:"#fff",padding:"0 4px",
          }}>{unread>9?"9+":unread}</div>
        )}
      </button>

      {open&&(
        <div style={{
          position:"absolute",right:0,top:"calc(100% + 8px)",
          width:340,background:"#0F0F1C",border:"1px solid rgba(255,255,255,0.1)",
          borderRadius:16,boxShadow:"0 20px 60px rgba(0,0,0,0.7)",zIndex:9999,
          overflow:"hidden",animation:"fadeIn 0.2s ease",
        }}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 16px",borderBottom:"1px solid rgba(255,255,255,0.06)"}}>
            <div style={{fontFamily:"'Cabinet Grotesk',sans-serif",fontSize:14,fontWeight:800}}>Notifications {unread>0&&<span style={{fontSize:11,background:"#F43F5E",color:"#fff",borderRadius:20,padding:"1px 7px",marginLeft:6}}>{unread}</span>}</div>
            {unread>0&&<button onClick={()=>markAllNotifsRead(user.uid)} style={{fontSize:11,color:"#FF6B35",background:"transparent",border:"none",cursor:"pointer",fontFamily:"inherit",fontWeight:700}}>Mark all read</button>}
          </div>

          <div style={{maxHeight:380,overflowY:"auto"}}>
            {notifs.length===0&&(
              <div style={{textAlign:"center",padding:"32px 20px",color:"#4B5563"}}>
                <div style={{fontSize:32,marginBottom:8}}>🔕</div>
                <div style={{fontSize:13}}>You're all caught up!</div>
              </div>
            )}
            {notifs.map(n=>(
              <div key={n.id} onClick={()=>handleClick(n)} style={{
                display:"flex",gap:12,padding:"12px 16px",cursor:"pointer",
                background:n.read?"transparent":"rgba(255,107,53,0.04)",
                borderBottom:"1px solid rgba(255,255,255,0.03)",
                transition:"background 0.1s",
                borderLeft:`3px solid ${n.read?"transparent":TYPE_COLOR[n.type]||"#FF6B35"}`,
              }}
              onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.03)"}
              onMouseLeave={e=>e.currentTarget.style.background=n.read?"transparent":"rgba(255,107,53,0.04)"}>
                <div style={{width:34,height:34,borderRadius:10,background:`${TYPE_COLOR[n.type]||"#FF6B35"}18`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>
                  {TYPE_ICON[n.type]||"🔔"}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:13,fontWeight:n.read?500:700,color:n.read?"#9CA3AF":"#F3F4F6",lineHeight:1.4}}>{n.title}</div>
                  {n.body&&<div style={{fontSize:12,color:"#6B7280",marginTop:3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{n.body}</div>}
                  <div style={{fontSize:11,color:"#4B5563",marginTop:4}}>{timeAgo(n.createdAt)}</div>
                </div>
                <button onClick={e=>{e.stopPropagation();deleteNotification(user.uid,n.id);}} style={{background:"transparent",border:"none",color:"#2A2A3A",cursor:"pointer",fontSize:14,padding:"2px 4px",flexShrink:0,lineHeight:1}}
                  onMouseEnter={e=>e.currentTarget.style.color="#F43F5E"}
                  onMouseLeave={e=>e.currentTarget.style.color="#2A2A3A"}>×</button>
              </div>
            ))}
          </div>

          <div style={{padding:"10px 16px",borderTop:"1px solid rgba(255,255,255,0.06)",textAlign:"center"}}>
            <button onClick={()=>setOpen(false)} style={{fontSize:12,color:"#6B7280",background:"transparent",border:"none",cursor:"pointer",fontFamily:"inherit"}}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
