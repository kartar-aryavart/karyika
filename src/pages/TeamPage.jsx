// 👥 Team Collaboration Page — ClickUp-style
import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import {
  createWorkspace, joinWorkspace, getUserWorkspaces,
  subscribeToSharedTasks, addSharedTask, updateSharedTask,
  subscribeToActivity, addSharedComment
} from "../firebase/services";

const PRI = {high:"#F43F5E", medium:"#F59E0B", low:"#10B981"};
const STATUSES = ["todo","in-progress","review","done"];
const STATUS_COLOR = {todo:"#6B7280","in-progress":"#F59E0B",review:"#818CF8",done:"#10B981"};

function Avatar({ name, size=28 }) {
  const initials = (name||"?").split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();
  const colors = ["#FF6B35","#818CF8","#10B981","#F43F5E","#F59E0B","#06B6D4"];
  const color = colors[initials.charCodeAt(0)%colors.length];
  return (
    <div style={{width:size,height:size,borderRadius:"50%",background:color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:size*0.38,fontWeight:800,color:"#fff",flexShrink:0}}>
      {initials}
    </div>
  );
}

function TaskCard({ task, members, onClick }) {
  const assignee = members.find(m=>task.assignees?.[0]===m.uid);
  return (
    <div onClick={onClick} style={{background:"#13131F",border:"1px solid rgba(255,255,255,0.06)",borderLeft:`3px solid ${PRI[task.priority]||"#6B7280"}`,borderRadius:10,padding:"12px 14px",cursor:"pointer",transition:"all 0.15s",marginBottom:8}}
      onMouseEnter={e=>{e.currentTarget.style.background="#1A1A2E";e.currentTarget.style.borderColor="rgba(255,255,255,0.12)";}}
      onMouseLeave={e=>{e.currentTarget.style.background="#13131F";e.currentTarget.style.borderColor="rgba(255,255,255,0.06)";}}>
      <div style={{display:"flex",alignItems:"flex-start",gap:8}}>
        <div style={{flex:1}}>
          <div style={{fontSize:13,fontWeight:600,color:task.done?"#6B7280":"#F3F4F6",textDecoration:task.done?"line-through":"none",marginBottom:6}}>{task.title}</div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            <span style={{fontSize:10,padding:"2px 8px",background:`${STATUS_COLOR[task.status]||"#6B7280"}20`,color:STATUS_COLOR[task.status]||"#6B7280",borderRadius:12,fontWeight:700}}>{task.status}</span>
            {task.due&&<span style={{fontSize:10,padding:"2px 8px",background:"rgba(255,255,255,0.05)",color:"#9CA3AF",borderRadius:12}}>📅 {task.due}</span>}
            {task.comments?.length>0&&<span style={{fontSize:10,color:"#6B7280"}}>💬 {task.comments.length}</span>}
          </div>
        </div>
        {assignee && <Avatar name={assignee.name||assignee.uid} size={26} />}
      </div>
    </div>
  );
}

function TaskModal({ task, members, wsId, onClose, onUpdate }) {
  const { user } = useAuth();
  const [comment, setComment] = useState("");
  const [status, setStatus] = useState(task.status||"todo");

  const submitComment = async () => {
    if (!comment.trim()) return;
    await addSharedComment(wsId, task.id, user.uid, comment.trim(), user.displayName||user.email);
    setComment("");
  };

  const changeStatus = async (s) => {
    setStatus(s);
    await updateSharedTask(wsId, task.id, {status:s, done:s==="done"});
    onUpdate();
  };

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.8)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center",padding:20}} onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div style={{background:"#0F0F1C",border:"1px solid rgba(255,255,255,0.1)",borderRadius:18,width:"100%",maxWidth:600,maxHeight:"80vh",overflow:"hidden",display:"flex",flexDirection:"column"}}>
        {/* Header */}
        <div style={{padding:"20px 24px 16px",borderBottom:"1px solid rgba(255,255,255,0.06)"}}>
          <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:12}}>
            <div style={{fontFamily:"'Cabinet Grotesk',sans-serif",fontSize:18,fontWeight:800,flex:1}}>{task.title}</div>
            <button onClick={onClose} style={{background:"transparent",border:"none",color:"#6B7280",cursor:"pointer",fontSize:20,lineHeight:1}}>×</button>
          </div>
          {/* Status selector */}
          <div style={{display:"flex",gap:6,marginTop:14}}>
            {STATUSES.map(s=>(
              <button key={s} onClick={()=>changeStatus(s)} style={{padding:"4px 12px",border:`1px solid ${status===s?STATUS_COLOR[s]:"rgba(255,255,255,0.08)"}`,borderRadius:20,background:status===s?`${STATUS_COLOR[s]}20`:"transparent",color:status===s?STATUS_COLOR[s]:"#6B7280",fontSize:11,fontWeight:700,cursor:"pointer",fontFamily:"inherit",textTransform:"capitalize"}}>
                {s.replace("-"," ")}
              </button>
            ))}
          </div>
        </div>
        {/* Body */}
        <div style={{flex:1,overflowY:"auto",padding:"16px 24px"}}>
          {task.desc&&<p style={{fontSize:13,color:"#9CA3AF",marginBottom:16,lineHeight:1.7}}>{task.desc}</p>}
          <div style={{fontSize:11,fontWeight:800,color:"#4B5563",textTransform:"uppercase",letterSpacing:"1px",marginBottom:12}}>Comments ({task.comments?.length||0})</div>
          {(task.comments||[]).map(c=>(
            <div key={c.id} style={{display:"flex",gap:10,marginBottom:14}}>
              <Avatar name={c.authorName} size={30} />
              <div style={{flex:1}}>
                <div style={{fontSize:12,fontWeight:700,color:"#F3F4F6"}}>{c.authorName} <span style={{color:"#4B5563",fontWeight:400}}>{new Date(c.createdAt).toLocaleTimeString("en-IN",{hour:"2-digit",minute:"2-digit"})}</span></div>
                <div style={{fontSize:13,color:"#D1D5DB",marginTop:4,lineHeight:1.6}}>{c.text}</div>
              </div>
            </div>
          ))}
        </div>
        {/* Comment input */}
        <div style={{padding:"12px 24px",borderTop:"1px solid rgba(255,255,255,0.06)",display:"flex",gap:10}}>
          <Avatar name={user?.displayName||user?.email} size={32} />
          <div style={{flex:1,display:"flex",gap:8}}>
            <input value={comment} onChange={e=>setComment(e.target.value)} onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&submitComment()} placeholder="Add a comment..." style={{flex:1,background:"#1A1A2E",border:"1px solid rgba(255,255,255,0.08)",borderRadius:10,color:"#E5E7EB",fontSize:13,padding:"10px 14px",fontFamily:"inherit",outline:"none"}} />
            <button onClick={submitComment} style={{padding:"10px 16px",border:"none",borderRadius:10,background:"#FF6B35",color:"#fff",cursor:"pointer",fontWeight:700,fontFamily:"inherit",fontSize:13}}>Send</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TeamPage() {
  const { user } = useAuth();
  const [workspaces, setWorkspaces] = useState([]);
  const [activeWs, setActiveWs] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("board"); // board | list | activity
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [wsName, setWsName] = useState("");
  const [wsDesc, setWsDesc] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [newTask, setNewTask] = useState({title:"",priority:"medium",status:"todo",due:""});
  const [addingTask, setAddingTask] = useState(false);
  const [selTask, setSelTask] = useState(null);
  const [toast, setToast] = useState("");
  const [copied, setCopied] = useState(false);

  const showToast = m => { setToast(m); setTimeout(()=>setToast(""),2800); };

  useEffect(() => {
    if (!user) return;
    getUserWorkspaces(user.uid).then(ws => { setWorkspaces(ws); if(ws.length>0)setActiveWs(ws[0]); setLoading(false); });
  }, [user]);

  useEffect(() => {
    if (!activeWs) return;
    const u1 = subscribeToSharedTasks(activeWs.id, setTasks);
    const u2 = subscribeToActivity(activeWs.id, setActivity);
    return () => { u1(); u2(); };
  }, [activeWs]);

  const createWs = async () => {
    if (!wsName.trim()) return;
    setLoading(true);
    const id = await createWorkspace(user.uid, wsName.trim(), wsDesc.trim());
    const ws = await getUserWorkspaces(user.uid);
    setWorkspaces(ws);
    setActiveWs(ws.find(w=>w.id===id)||ws[0]);
    setShowCreate(false); setWsName(""); setWsDesc(""); setLoading(false);
    showToast("🎉 Workspace created!");
  };

  const joinWs = async () => {
    if (!inviteCode.trim()) return;
    try {
      const id = await joinWorkspace(user.uid, inviteCode.trim(), {name:user.displayName||user.email});
      const ws = await getUserWorkspaces(user.uid);
      setWorkspaces(ws); setActiveWs(ws.find(w=>w.id===id)||ws[0]);
      setShowJoin(false); setInviteCode(""); showToast("✅ Joined workspace!");
    } catch(e) { showToast("❌ " + e.message); }
  };

  const createTask = async () => {
    if (!newTask.title.trim()||!activeWs) return;
    await addSharedTask(activeWs.id, {...newTask}, user.uid);
    setNewTask({title:"",priority:"medium",status:"todo",due:""}); setAddingTask(false);
    showToast("✅ Task added to workspace!");
  };

  const copyInvite = () => {
    if (!activeWs) return;
    navigator.clipboard.writeText(activeWs.inviteCode).then(()=>{setCopied(true);setTimeout(()=>setCopied(false),2000);});
  };

  const members = activeWs?.members||[];

  if (loading && workspaces.length===0) return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:300,flexDirection:"column",gap:16}}>
      <div style={{width:36,height:36,borderRadius:"50%",border:"3px solid #1A1A26",borderTopColor:"#FF6B35",animation:"spin 0.7s linear infinite"}} />
      <div style={{color:"#4B5563",fontSize:13}}>Loading team workspace...</div>
    </div>
  );

  return (
    <div style={{maxWidth:1200,margin:"0 auto"}}>
      {toast && <div style={{position:"fixed",bottom:24,right:24,background:"#10B981",color:"#fff",padding:"12px 20px",borderRadius:12,fontWeight:700,fontSize:14,zIndex:9999,animation:"slideUp 0.3s ease"}}>{toast}</div>}
      {selTask && <TaskModal task={selTask} members={members} wsId={activeWs?.id} onClose={()=>setSelTask(null)} onUpdate={()=>{}} />}

      {/* No workspace */}
      {workspaces.length===0 && !loading && (
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:400,gap:20}}>
          <div style={{fontSize:56}}>👥</div>
          <div style={{fontFamily:"'Cabinet Grotesk',sans-serif",fontSize:24,fontWeight:800,textAlign:"center"}}>Start Collaborating</div>
          <div style={{color:"#6B7280",fontSize:14,textAlign:"center",maxWidth:320}}>Create a workspace to invite teammates, assign tasks, and track progress together.</div>
          <div style={{display:"flex",gap:12}}>
            <button onClick={()=>setShowCreate(true)} style={{padding:"12px 24px",background:"linear-gradient(135deg,#FF6B35,#FF8C5A)",border:"none",borderRadius:12,color:"#fff",fontWeight:800,fontSize:14,cursor:"pointer",fontFamily:"inherit"}}>+ Create Workspace</button>
            <button onClick={()=>setShowJoin(true)} style={{padding:"12px 24px",background:"transparent",border:"1px solid rgba(255,255,255,0.1)",borderRadius:12,color:"#9CA3AF",fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:"inherit"}}>Join with Code</button>
          </div>
        </div>
      )}

      {/* Main workspace UI */}
      {workspaces.length>0 && (
        <>
          {/* Workspace header */}
          <div style={{background:"linear-gradient(135deg,#0F0F1C,#13102A)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:16,padding:"18px 22px",marginBottom:16,display:"flex",alignItems:"center",gap:14}}>
            <div style={{width:46,height:46,borderRadius:12,background:"linear-gradient(135deg,#FF6B35,#8B5CF6)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>🏢</div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontFamily:"'Cabinet Grotesk',sans-serif",fontSize:18,fontWeight:800}}>{activeWs?.name}</div>
              <div style={{fontSize:12,color:"#6B7280",marginTop:2}}>{members.length} members · {tasks.length} tasks</div>
            </div>
            {/* Workspace selector */}
            {workspaces.length>1&&(
              <select value={activeWs?.id} onChange={e=>setActiveWs(workspaces.find(w=>w.id===e.target.value))} style={{background:"#13131F",border:"1px solid rgba(255,255,255,0.08)",borderRadius:9,color:"#E5E7EB",padding:"6px 10px",fontSize:12,fontFamily:"inherit",cursor:"pointer"}}>
                {workspaces.map(w=><option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            )}
            {/* Invite code */}
            <div style={{display:"flex",alignItems:"center",gap:8}}>
              <div style={{fontSize:11,color:"#6B7280"}}>Invite:</div>
              <div style={{fontFamily:"monospace",fontSize:14,fontWeight:800,color:"#FF6B35",background:"rgba(255,107,53,0.1)",padding:"4px 10px",borderRadius:8,border:"1px solid rgba(255,107,53,0.2)"}}>{activeWs?.inviteCode}</div>
              <button onClick={copyInvite} style={{padding:"4px 10px",background:"transparent",border:"1px solid rgba(255,255,255,0.08)",borderRadius:8,color:copied?"#10B981":"#9CA3AF",fontSize:11,cursor:"pointer",fontFamily:"inherit",fontWeight:700}}>{copied?"Copied!":"Copy"}</button>
            </div>
            {/* Members */}
            <div style={{display:"flex",marginLeft:4}}>
              {members.slice(0,5).map((m,i)=><div key={m.uid} style={{marginLeft:i?-8:0,border:"2px solid #0F0F1C",borderRadius:"50%"}}><Avatar name={m.name||m.uid} size={30}/></div>)}
              {members.length>5&&<div style={{width:30,height:30,borderRadius:"50%",background:"#1A1A2E",border:"2px solid #0F0F1C",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:"#6B7280",marginLeft:-8}}>+{members.length-5}</div>}
            </div>
            <button onClick={()=>setShowCreate(true)} style={{padding:"7px 14px",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:9,color:"#9CA3AF",fontSize:12,cursor:"pointer",fontFamily:"inherit",fontWeight:600}}>+ New</button>
          </div>

          {/* Toolbar */}
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
            {["board","list","activity"].map(v=>(
              <button key={v} onClick={()=>setView(v)} style={{padding:"6px 14px",border:"1px solid",borderColor:view===v?"#FF6B35":"rgba(255,255,255,0.08)",borderRadius:20,background:view===v?"rgba(255,107,53,0.1)":"transparent",color:view===v?"#FF6B35":"#6B7280",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit",textTransform:"capitalize"}}>{v==="board"?"📋 Board":v==="list"?"📄 List":"⚡ Activity"}</button>
            ))}
            <div style={{flex:1}}/>
            <button onClick={()=>setAddingTask(true)} style={{padding:"7px 16px",background:"linear-gradient(135deg,#FF6B35,#FF8C5A)",border:"none",borderRadius:10,color:"#fff",fontSize:12,fontWeight:800,cursor:"pointer",fontFamily:"inherit"}}>+ Add Task</button>
          </div>

          {/* Add task form */}
          {addingTask&&(
            <div style={{background:"#0F0F1C",border:"1px solid rgba(255,255,255,0.1)",borderRadius:14,padding:"16px 18px",marginBottom:16,display:"flex",gap:10,flexWrap:"wrap",alignItems:"flex-end"}}>
              <input value={newTask.title} onChange={e=>setNewTask(t=>({...t,title:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&createTask()} placeholder="Task title..." autoFocus
                style={{flex:2,minWidth:200,background:"#13131F",border:"1px solid rgba(255,255,255,0.08)",borderRadius:9,color:"#E5E7EB",fontSize:13,padding:"9px 14px",fontFamily:"inherit",outline:"none"}} />
              <select value={newTask.priority} onChange={e=>setNewTask(t=>({...t,priority:e.target.value}))} style={{background:"#13131F",border:"1px solid rgba(255,255,255,0.08)",borderRadius:9,color:"#E5E7EB",padding:"9px 10px",fontFamily:"inherit",fontSize:12}}>
                <option value="high">🔴 High</option><option value="medium">🟡 Medium</option><option value="low">🟢 Low</option>
              </select>
              <input type="date" value={newTask.due} onChange={e=>setNewTask(t=>({...t,due:e.target.value}))} style={{background:"#13131F",border:"1px solid rgba(255,255,255,0.08)",borderRadius:9,color:"#9CA3AF",padding:"9px 10px",fontFamily:"inherit",fontSize:12,colorScheme:"dark"}} />
              <button onClick={createTask} style={{padding:"9px 18px",background:"#FF6B35",border:"none",borderRadius:9,color:"#fff",fontWeight:800,cursor:"pointer",fontFamily:"inherit",fontSize:13}}>Add</button>
              <button onClick={()=>setAddingTask(false)} style={{padding:"9px 14px",background:"transparent",border:"1px solid rgba(255,255,255,0.08)",borderRadius:9,color:"#6B7280",cursor:"pointer",fontFamily:"inherit",fontSize:12}}>Cancel</button>
            </div>
          )}

          {/* BOARD VIEW */}
          {view==="board"&&(
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14}}>
              {STATUSES.map(status=>{
                const cols=tasks.filter(t=>t.status===status||(status==="todo"&&!t.status));
                return (
                  <div key={status} style={{background:"#0A0A14",border:"1px solid rgba(255,255,255,0.05)",borderRadius:14,padding:"12px 12px"}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
                      <div style={{width:8,height:8,borderRadius:"50%",background:STATUS_COLOR[status]}}/>
                      <div style={{fontSize:12,fontWeight:800,color:"#9CA3AF",textTransform:"capitalize"}}>{status.replace("-"," ")}</div>
                      <div style={{marginLeft:"auto",fontSize:11,background:"rgba(255,255,255,0.06)",color:"#6B7280",borderRadius:20,padding:"1px 8px",fontWeight:700}}>{cols.length}</div>
                    </div>
                    {cols.map(t=><TaskCard key={t.id} task={t} members={members} onClick={()=>setSelTask(t)}/>)}
                    {cols.length===0&&<div style={{textAlign:"center",color:"#2A2A3A",fontSize:24,padding:"16px 0"}}>+</div>}
                  </div>
                );
              })}
            </div>
          )}

          {/* LIST VIEW */}
          {view==="list"&&(
            <div style={{background:"#0A0A14",border:"1px solid rgba(255,255,255,0.05)",borderRadius:14,overflow:"hidden"}}>
              <div style={{display:"grid",gridTemplateColumns:"1fr 100px 100px 80px 40px",padding:"10px 16px",borderBottom:"1px solid rgba(255,255,255,0.05)",fontSize:11,fontWeight:800,color:"#4B5563",textTransform:"uppercase",letterSpacing:"0.8px"}}>
                <div>Task</div><div>Status</div><div>Assignee</div><div>Due</div><div>Pri</div>
              </div>
              {tasks.map(t=>{
                const assignee=members.find(m=>t.assignees?.[0]===m.uid);
                return (
                  <div key={t.id} onClick={()=>setSelTask(t)} style={{display:"grid",gridTemplateColumns:"1fr 100px 100px 80px 40px",padding:"11px 16px",borderBottom:"1px solid rgba(255,255,255,0.04)",cursor:"pointer",transition:"background 0.1s"}}
                    onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.02)"}
                    onMouseLeave={e=>e.currentTarget.style.background=""}>
                    <div style={{fontSize:13,fontWeight:600,color:t.done?"#6B7280":"#E5E7EB",display:"flex",alignItems:"center",gap:8}}>
                      <div style={{width:6,height:6,borderRadius:"50%",background:PRI[t.priority]||"#6B7280",flexShrink:0}}/>
                      {t.title}
                      {t.comments?.length>0&&<span style={{fontSize:11,color:"#4B5563"}}>💬{t.comments.length}</span>}
                    </div>
                    <div><span style={{fontSize:11,padding:"2px 8px",background:`${STATUS_COLOR[t.status]||"#6B7280"}20`,color:STATUS_COLOR[t.status]||"#6B7280",borderRadius:12,fontWeight:700}}>{(t.status||"todo").replace("-"," ")}</span></div>
                    <div>{assignee?<Avatar name={assignee.name||assignee.uid} size={22}/>:<span style={{fontSize:11,color:"#2A2A3A"}}>—</span>}</div>
                    <div style={{fontSize:12,color:"#6B7280"}}>{t.due||"—"}</div>
                    <div style={{width:10,height:10,borderRadius:"50%",background:PRI[t.priority]||"#6B7280",marginTop:3}}/>
                  </div>
                );
              })}
              {tasks.length===0&&<div style={{textAlign:"center",padding:"32px",color:"#2A2A3A",fontSize:13}}>No tasks yet — add one above!</div>}
            </div>
          )}

          {/* ACTIVITY VIEW */}
          {view==="activity"&&(
            <div style={{background:"#0A0A14",border:"1px solid rgba(255,255,255,0.05)",borderRadius:14,overflow:"hidden"}}>
              <div style={{padding:"14px 18px",borderBottom:"1px solid rgba(255,255,255,0.05)",fontSize:11,fontWeight:800,color:"#4B5563",textTransform:"uppercase",letterSpacing:"0.8px"}}>Recent Activity</div>
              {activity.map(a=>(
                <div key={a.id} style={{display:"flex",gap:12,padding:"12px 18px",borderBottom:"1px solid rgba(255,255,255,0.03)"}}>
                  <Avatar name={members.find(m=>m.uid===a.uid)?.name||a.uid} size={30}/>
                  <div>
                    <div style={{fontSize:13,color:"#D1D5DB"}}>{a.text}</div>
                    <div style={{fontSize:11,color:"#4B5563",marginTop:3}}>
                      {a.createdAt?.toDate?.()?new Date(a.createdAt.toDate()).toLocaleString("en-IN",{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"}):"Just now"}
                    </div>
                  </div>
                </div>
              ))}
              {activity.length===0&&<div style={{textAlign:"center",padding:"32px",color:"#2A2A3A",fontSize:13}}>No activity yet</div>}
            </div>
          )}
        </>
      )}

      {/* Create Workspace Modal */}
      {showCreate&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.8)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={e=>{if(e.target===e.currentTarget)setShowCreate(false);}}>
          <div style={{background:"#0F0F1C",border:"1px solid rgba(255,255,255,0.1)",borderRadius:18,padding:"28px",width:"100%",maxWidth:440}}>
            <div style={{fontFamily:"'Cabinet Grotesk',sans-serif",fontSize:20,fontWeight:800,marginBottom:20}}>🏢 Create Workspace</div>
            <div style={{marginBottom:14}}>
              <div style={{fontSize:12,color:"#6B7280",fontWeight:600,marginBottom:6}}>Workspace Name *</div>
              <input value={wsName} onChange={e=>setWsName(e.target.value)} placeholder="e.g. Aryavart Ventures" autoFocus
                style={{width:"100%",background:"#13131F",border:"1px solid rgba(255,255,255,0.08)",borderRadius:10,color:"#E5E7EB",fontSize:14,padding:"11px 14px",fontFamily:"inherit",outline:"none",boxSizing:"border-box"}} />
            </div>
            <div style={{marginBottom:22}}>
              <div style={{fontSize:12,color:"#6B7280",fontWeight:600,marginBottom:6}}>Description</div>
              <textarea value={wsDesc} onChange={e=>setWsDesc(e.target.value)} placeholder="What does your team work on?" rows={2}
                style={{width:"100%",background:"#13131F",border:"1px solid rgba(255,255,255,0.08)",borderRadius:10,color:"#E5E7EB",fontSize:13,padding:"11px 14px",fontFamily:"inherit",outline:"none",resize:"none",boxSizing:"border-box"}} />
            </div>
            <div style={{display:"flex",gap:10}}>
              <button onClick={createWs} style={{flex:1,padding:"12px",background:"linear-gradient(135deg,#FF6B35,#FF8C5A)",border:"none",borderRadius:11,color:"#fff",fontWeight:800,fontSize:14,cursor:"pointer",fontFamily:"inherit"}}>Create Workspace</button>
              <button onClick={()=>setShowCreate(false)} style={{padding:"12px 18px",background:"transparent",border:"1px solid rgba(255,255,255,0.08)",borderRadius:11,color:"#9CA3AF",cursor:"pointer",fontFamily:"inherit"}}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Join Workspace Modal */}
      {showJoin&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.8)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={e=>{if(e.target===e.currentTarget)setShowJoin(false);}}>
          <div style={{background:"#0F0F1C",border:"1px solid rgba(255,255,255,0.1)",borderRadius:18,padding:"28px",width:"100%",maxWidth:380}}>
            <div style={{fontFamily:"'Cabinet Grotesk',sans-serif",fontSize:20,fontWeight:800,marginBottom:8}}>🔑 Join Workspace</div>
            <div style={{fontSize:13,color:"#6B7280",marginBottom:20}}>Ask your team admin for the 6-character invite code</div>
            <input value={inviteCode} onChange={e=>setInviteCode(e.target.value.toUpperCase())} placeholder="e.g. XK49PZ" maxLength={6} autoFocus
              style={{width:"100%",background:"#13131F",border:"1px solid rgba(255,255,255,0.08)",borderRadius:10,color:"#FF6B35",fontSize:22,fontWeight:800,padding:"14px 18px",fontFamily:"monospace",outline:"none",letterSpacing:"6px",textAlign:"center",boxSizing:"border-box",marginBottom:18}} />
            <div style={{display:"flex",gap:10}}>
              <button onClick={joinWs} style={{flex:1,padding:"12px",background:"linear-gradient(135deg,#818CF8,#6366F1)",border:"none",borderRadius:11,color:"#fff",fontWeight:800,fontSize:14,cursor:"pointer",fontFamily:"inherit"}}>Join Workspace</button>
              <button onClick={()=>setShowJoin(false)} style={{padding:"12px 18px",background:"transparent",border:"1px solid rgba(255,255,255,0.08)",borderRadius:11,color:"#9CA3AF",cursor:"pointer",fontFamily:"inherit"}}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
