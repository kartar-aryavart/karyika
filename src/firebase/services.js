// 🔥 Firebase Services v5 — Karyika Phase 4 (ClickUp Complete)
import {
  collection, addDoc, updateDoc, deleteDoc,
  doc, query, orderBy, onSnapshot, serverTimestamp,
  getDoc, getDocs, setDoc, arrayUnion, arrayRemove, where, limit
} from "firebase/firestore";
import { db } from "./config";

// ─── TIMESTAMP HELPER ──────────────────────────────────────────────────────
export const tsToMs = (val) => {
  if (!val) return 0;
  if (typeof val === "string") return new Date(val).getTime();
  if (val.toDate) return val.toDate().getTime();
  if (val.seconds) return val.seconds * 1000;
  return 0;
};
export const tsToStr = (val) => {
  if (!val) return "";
  const ms = typeof val === "string" ? new Date(val).getTime() : val.toDate ? val.toDate().getTime() : (val.seconds||0)*1000;
  return ms ? new Date(ms).toLocaleDateString("en-IN",{month:"short",day:"numeric",year:"numeric"}) : "";
};



const userCol  = (uid, col) => collection(db, "users", uid, col);
const globalCol = (col) => collection(db, col);

// ─── TASKS v5 ──────────────────────────────────────────────────────────────
export const addTask = (uid, task) =>
  addDoc(userCol(uid, "tasks"), {
    title:"", desc:"", due:"", dueTime:"", priority:"medium", category:"personal",
    done:false, status:"todo", tags:[], subtasks:[],
    reminder:"", recurring:"none", estimatedTime:0, timeSpent:0, timeLogs:[],
    urgency:"not-urgent", importance:"important",
    projectId:null, spaceId:null, listId:null,
    comments:[], dependencies:[], blockedBy:[],
    completedAt:null, assignees:[], watchers:[],
    attachments:[], customFields:{}, checklist:[],
    points:0, startDate:"", coverColor:"",
    ...task, createdAt:serverTimestamp(),
  });

export const updateTask = (uid, taskId, data) =>
  updateDoc(doc(db,"users",uid,"tasks",taskId), data);

export const deleteTask = (uid, taskId) =>
  deleteDoc(doc(db,"users",uid,"tasks",taskId));

export const subscribeToTasks = (uid, callback) => {
  const q = query(userCol(uid,"tasks"), orderBy("createdAt","desc"));
  return onSnapshot(q,
    snap => callback(snap.docs.map(d => ({ id:d.id, ...d.data() }))),
    err => { console.error("Tasks sync error:", err); callback([]); }
  );
};

export const toggleSubtask = async (uid, taskId, subtaskId) => {
  const ref = doc(db,"users",uid,"tasks",taskId);
  const snap = await getDoc(ref); if (!snap.exists()) return;
  const subtasks = (snap.data().subtasks||[]).map(s=>s.id===subtaskId?{...s,done:!s.done}:s);
  return updateDoc(ref,{subtasks});
};

export const logTime = async (uid, taskId, minutes, note="") => {
  const ref = doc(db,"users",uid,"tasks",taskId);
  const snap = await getDoc(ref); if (!snap.exists()) return;
  const newLog = {minutes, note, at:new Date().toISOString(), id:Math.random().toString(36).slice(2)};
  const logs = [...(snap.data().timeLogs||[]), newLog];
  const total = (snap.data().timeSpent||0)+minutes;
  return updateDoc(ref,{timeLogs:logs, timeSpent:total});
};

// ─── TASK COMMENTS ─────────────────────────────────────────────────────────
export const addComment = async (uid, taskId, text, authorName, authorEmail) => {
  const ref = doc(db,"users",uid,"tasks",taskId);
  const snap = await getDoc(ref); if (!snap.exists()) return;
  const comment = {
    id:Math.random().toString(36).slice(2), text, authorId:uid,
    authorName, authorEmail, createdAt:new Date().toISOString(),
    reactions:{}, edited:false,
  };
  return updateDoc(ref,{comments:arrayUnion(comment)});
};

export const deleteComment = async (uid, taskId, commentId) => {
  const ref = doc(db,"users",uid,"tasks",taskId);
  const snap = await getDoc(ref); if (!snap.exists()) return;
  const comments = (snap.data().comments||[]).filter(c=>c.id!==commentId);
  return updateDoc(ref,{comments});
};

// ─── TASK DEPENDENCIES ─────────────────────────────────────────────────────
export const addDependency = async (uid, taskId, depId) => {
  await updateDoc(doc(db,"users",uid,"tasks",taskId),{dependencies:arrayUnion(depId)});
  await updateDoc(doc(db,"users",uid,"tasks",depId),{blockedBy:arrayUnion(taskId)});
};
export const removeDependency = async (uid, taskId, depId) => {
  await updateDoc(doc(db,"users",uid,"tasks",taskId),{dependencies:arrayRemove(depId)});
  await updateDoc(doc(db,"users",uid,"tasks",depId),{blockedBy:arrayRemove(taskId)});
};

// ─── HABITS ────────────────────────────────────────────────────────────────
export const addHabit = (uid, habit) =>
  addDoc(userCol(uid,"habits"),{name:"",emoji:"✨",color:"#FF6B35",frequency:"daily",streak:0,logs:{},...habit,createdAt:serverTimestamp()});
export const updateHabit = (uid,id,d) => updateDoc(doc(db,"users",uid,"habits",id),d);
export const deleteHabit = (uid,id) => deleteDoc(doc(db,"users",uid,"habits",id));
export const subscribeToHabits = (uid, cb) => onSnapshot(query(userCol(uid,"habits"),orderBy("createdAt","desc")), snap=>cb(snap.docs.map(d=>({id:d.id,...d.data()}))), err=>{console.error("Habits sync:",err);cb([]);});

export const toggleHabit = async (uid, habitId, dateStr) => {
  const ref = doc(db,"users",uid,"habits",habitId);
  const snap = await getDoc(ref); if (!snap.exists()) return;
  const logs = snap.data().logs||{};
  const newLogs = {...logs, [dateStr]:!logs[dateStr]};
  // Calculate streak
  let streak=0; const today=new Date();
  for(let i=0;i<365;i++){
    const d=new Date(today); d.setDate(d.getDate()-i);
    const key=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
    if(newLogs[key]) streak++; else break;
  }
  return updateDoc(ref,{logs:newLogs, streak});
};

// ─── NOTES v3 ──────────────────────────────────────────────────────────────
export const addNote = (uid,note) =>
  addDoc(userCol(uid,"notes"),{title:"Untitled",blocks:[],tags:[],color:"default",isPinned:false,isArchived:false,coverImage:"",...note,createdAt:serverTimestamp(),updatedAt:serverTimestamp()});
export const updateNote = (uid,id,d) => updateDoc(doc(db,"users",uid,"notes",id),{...d,updatedAt:serverTimestamp()});
export const deleteNote = (uid,id) => deleteDoc(doc(db,"users",uid,"notes",id));
export const subscribeToNotes = (uid, cb) => onSnapshot(query(userCol(uid,"notes"),orderBy("updatedAt","desc")), snap=>cb(snap.docs.map(d=>({id:d.id,...d.data()}))), err=>{console.error("Notes sync:",err);cb([]);});

// ─── PROJECTS v3 ───────────────────────────────────────────────────────────
export const addProject = (uid,p) =>
  addDoc(userCol(uid,"projects"),{name:"",emoji:"📁",color:"#FF6B35",status:"active",description:"",members:[],lists:[],customStatuses:["todo","in-progress","review","done"],...p,createdAt:serverTimestamp()});
export const updateProject = (uid,id,d) => updateDoc(doc(db,"users",uid,"projects",id),d);
export const deleteProject = (uid,id) => deleteDoc(doc(db,"users",uid,"projects",id));
export const subscribeToProjects = (uid,cb) => onSnapshot(query(userCol(uid,"projects"),orderBy("createdAt","desc")),snap=>cb(snap.docs.map(d=>({id:d.id,...d.data()}))), err=>{console.error("subscribeToProjects sync:",err);cb([]);});

// ─── GOALS v2 ──────────────────────────────────────────────────────────────
export const addGoal = (uid,g) =>
  addDoc(userCol(uid,"goals"),{title:"",description:"",target:100,current:0,unit:"%",color:"#FF6B35",category:"personal",keyResults:[],...g,createdAt:serverTimestamp()});
export const updateGoal = (uid,id,d) => updateDoc(doc(db,"users",uid,"goals",id),d);
export const deleteGoal = (uid,id) => deleteDoc(doc(db,"users",uid,"goals",id));
export const subscribeToGoals = (uid,cb) => onSnapshot(query(userCol(uid,"goals"),orderBy("createdAt","desc")),snap=>cb(snap.docs.map(d=>({id:d.id,...d.data()}))), err=>{console.error("subscribeToGoals sync:",err);cb([]);});

// ─── AUTOMATIONS ───────────────────────────────────────────────────────────
export const addAutomation = (uid,a) =>
  addDoc(userCol(uid,"automations"),{name:"",trigger:"task_completed",action:"send_notification",isActive:true,runCount:0,...a,createdAt:serverTimestamp()});
export const updateAutomation = (uid,id,d) => updateDoc(doc(db,"users",uid,"automations",id),d);
export const deleteAutomation = (uid,id) => deleteDoc(doc(db,"users",uid,"automations",id));
export const subscribeToAutomations = (uid,cb) => onSnapshot(query(userCol(uid,"automations"),orderBy("createdAt","desc")),snap=>cb(snap.docs.map(d=>({id:d.id,...d.data()}))));

// ─── TEAM COLLABORATION ────────────────────────────────────────────────────
// Workspaces (shared across users)
export const createWorkspace = async (uid, name, description="") => {
  const ws = await addDoc(globalCol("workspaces"),{
    name, description, ownerId:uid, members:[{uid, role:"owner", joinedAt:new Date().toISOString()}],
    inviteCode:Math.random().toString(36).slice(2,8).toUpperCase(),
    plan:"free", createdAt:serverTimestamp(),
  });
  // Add to user's workspaces list
  await setDoc(doc(db,"users",uid,"meta","workspaces"),{workspaceIds:arrayUnion(ws.id)},{merge:true});
  return ws.id;
};

export const getWorkspace = (wsId) => getDoc(doc(db,"workspaces",wsId));

export const joinWorkspace = async (uid, inviteCode, userInfo) => {
  const q = query(globalCol("workspaces"), where("inviteCode","==",inviteCode.toUpperCase()), limit(1));
  const snap = await getDocs(q);
  if (snap.empty) throw new Error("Invalid invite code");
  const wsDoc = snap.docs[0];
  const member = {uid, role:"member", joinedAt:new Date().toISOString(), ...userInfo};
  await updateDoc(doc(db,"workspaces",wsDoc.id),{members:arrayUnion(member)});
  await setDoc(doc(db,"users",uid,"meta","workspaces"),{workspaceIds:arrayUnion(wsDoc.id)},{merge:true});
  return wsDoc.id;
};

export const subscribeToWorkspace = (wsId, cb) =>
  onSnapshot(doc(db,"workspaces",wsId), snap => cb(snap.exists()?{id:snap.id,...snap.data()}:null));

export const getUserWorkspaces = async (uid) => {
  const meta = await getDoc(doc(db,"users",uid,"meta","workspaces"));
  if (!meta.exists()) return [];
  const ids = meta.data().workspaceIds||[];
  const snaps = await Promise.all(ids.map(id=>getDoc(doc(db,"workspaces",id))));
  return snaps.filter(s=>s.exists()).map(s=>({id:s.id,...s.data()}));
};

// Shared tasks in workspace
export const addSharedTask = (wsId, task, uid) =>
  addDoc(collection(db,"workspaces",wsId,"tasks"),{
    ...task, createdBy:uid, assignees:[], watchers:[uid], comments:[],
    createdAt:serverTimestamp(),
  });

export const updateSharedTask = (wsId, taskId, data) =>
  updateDoc(doc(db,"workspaces",wsId,"tasks",taskId), data);

export const subscribeToSharedTasks = (wsId, cb) =>
  onSnapshot(query(collection(db,"workspaces",wsId,"tasks"),orderBy("createdAt","desc")),
    snap=>cb(snap.docs.map(d=>({id:d.id,...d.data()}))));

// Workspace activity feed
export const addActivity = (wsId, uid, type, text, meta={}) =>
  addDoc(collection(db,"workspaces",wsId,"activity"),{uid,type,text,meta,createdAt:serverTimestamp()});

export const subscribeToActivity = (wsId, cb) =>
  onSnapshot(query(collection(db,"workspaces",wsId,"activity"),orderBy("createdAt","desc"),limit(50)),
    snap=>cb(snap.docs.map(d=>({id:d.id,...d.data()}))));

// Workspace comments on shared tasks
export const addSharedComment = async (wsId, taskId, uid, text, authorName) => {
  const comment = {id:Math.random().toString(36).slice(2),text,authorId:uid,authorName,createdAt:new Date().toISOString()};
  await updateDoc(doc(db,"workspaces",wsId,"tasks",taskId),{comments:arrayUnion(comment)});
  await addActivity(wsId,uid,"comment",`${authorName} commented on a task`,{taskId,text:text.slice(0,60)});
};

// ─── NOTIFICATIONS ─────────────────────────────────────────────────────────
export const addNotification = (uid, notif) =>
  addDoc(userCol(uid,"notifications"),{
    title:"",body:"",type:"info",read:false,link:"",
    ...notif, createdAt:serverTimestamp(),
  });

export const markNotifRead = (uid, nid) =>
  updateDoc(doc(db,"users",uid,"notifications",nid),{read:true});

export const markAllNotifsRead = async (uid) => {
  const q = query(userCol(uid,"notifications"), where("read","==",false));
  const snap = await getDocs(q);
  return Promise.all(snap.docs.map(d=>updateDoc(d.ref,{read:true})));
};

export const subscribeToNotifications = (uid, cb) =>
  onSnapshot(query(userCol(uid,"notifications"),orderBy("createdAt","desc"),limit(30)),
    snap=>cb(snap.docs.map(d=>({id:d.id,...d.data()}))));

export const deleteNotification = (uid, nid) =>
  deleteDoc(doc(db,"users",uid,"notifications",nid));

// ─── ADMIN ─────────────────────────────────────────────────────────────────
export const checkIsAdmin = async (uid) => {
  try { const s=await getDoc(doc(db,"admins",uid)); return s.exists(); } catch { return false; }
};
export const getAllUsers = () => getDocs(query(collection(db,"users"),limit(100)));

// ─── ADMIN STATS ───────────────────────────────────────────────────────────
export const getAdminStats = async () => {
  try {
    const usersSnap = await getDocs(query(collection(db,"users"),limit(100)));
    return {
      totalUsers: usersSnap.size,
      activeUsers: usersSnap.size,
      totalTasks: 0,
      completedTasks: 0,
      storageUsed: "—",
      uptime: "99.9%",
    };
  } catch { return { totalUsers:0, activeUsers:0, totalTasks:0, completedTasks:0 }; }
};
