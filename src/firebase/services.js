// 🔥 Firebase Services v3 — Karyika Phase 2
// Projects · Goals · Time Tracking · Comments · Admin

import {
  collection, addDoc, updateDoc, deleteDoc,
  doc, query, orderBy, onSnapshot, serverTimestamp,
  getDoc, where, getDocs, limit
} from "firebase/firestore";
import { db } from "./config";

const userCol = (uid, col) => collection(db, "users", uid, col);
const globalCol = (col) => collection(db, col);

// ─── TASKS v3 ──────────────────────────────────────────────────────────────
export const addTask = (uid, task) =>
  addDoc(userCol(uid, "tasks"), {
    title: "", desc: "", due: "", priority: "medium", category: "personal",
    done: false, status: "todo", tags: [], subtasks: [],
    reminder: "", recurring: "none", estimatedTime: 0, timeSpent: 0,
    urgency: "not-urgent", importance: "important",
    projectId: null, assignedTo: null, comments: [],
    ...task, createdAt: serverTimestamp(),
  });

export const updateTask = (uid, taskId, data) =>
  updateDoc(doc(db, "users", uid, "tasks", taskId), data);

export const deleteTask = (uid, taskId) =>
  deleteDoc(doc(db, "users", uid, "tasks", taskId));

export const subscribeToTasks = (uid, callback) => {
  const q = query(userCol(uid, "tasks"), orderBy("createdAt", "desc"));
  return onSnapshot(q, snap => callback(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
};

export const toggleSubtask = async (uid, taskId, subtaskId) => {
  const ref = doc(db, "users", uid, "tasks", taskId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const subtasks = (snap.data().subtasks || []).map(s =>
    s.id === subtaskId ? { ...s, done: !s.done } : s
  );
  return updateDoc(ref, { subtasks });
};

// Add time log to task
export const logTime = async (uid, taskId, minutes) => {
  const ref = doc(db, "users", uid, "tasks", taskId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const logs = snap.data().timeLogs || [];
  logs.push({ minutes, at: new Date().toISOString() });
  const total = (snap.data().timeSpent || 0) + minutes;
  return updateDoc(ref, { timeLogs: logs, timeSpent: total });
};

// Add comment to task
export const addComment = async (uid, taskId, comment) => {
  const ref = doc(db, "users", uid, "tasks", taskId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const comments = snap.data().comments || [];
  comments.push({ ...comment, id: Math.random().toString(36).slice(2), at: new Date().toISOString() });
  return updateDoc(ref, { comments });
};

// ─── PROJECTS ─────────────────────────────────────────────────────────────
export const addProject = (uid, project) =>
  addDoc(userCol(uid, "projects"), {
    name: "", color: "#FF6B35", emoji: "📁", description: "",
    status: "active", members: [], dueDate: "",
    ...project, createdAt: serverTimestamp(),
  });

export const updateProject = (uid, projectId, data) =>
  updateDoc(doc(db, "users", uid, "projects", projectId), data);

export const deleteProject = (uid, projectId) =>
  deleteDoc(doc(db, "users", uid, "projects", projectId));

export const subscribeToProjects = (uid, callback) => {
  const q = query(userCol(uid, "projects"), orderBy("createdAt", "desc"));
  return onSnapshot(q, snap => callback(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
};

// ─── GOALS / OKRs ─────────────────────────────────────────────────────────
export const addGoal = (uid, goal) =>
  addDoc(userCol(uid, "goals"), {
    title: "", description: "", target: 100, current: 0,
    unit: "%", dueDate: "", color: "#FF6B35", status: "active",
    keyResults: [],
    ...goal, createdAt: serverTimestamp(),
  });

export const updateGoal = (uid, goalId, data) =>
  updateDoc(doc(db, "users", uid, "goals", goalId), data);

export const deleteGoal = (uid, goalId) =>
  deleteDoc(doc(db, "users", uid, "goals", goalId));

export const subscribeToGoals = (uid, callback) => {
  const q = query(userCol(uid, "goals"), orderBy("createdAt", "desc"));
  return onSnapshot(q, snap => callback(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
};

// ─── HABITS ───────────────────────────────────────────────────────────────
export const addHabit = (uid, habit) =>
  addDoc(userCol(uid, "habits"), { name: "", emoji: "📌", color: "#FF6B35", logs: {}, ...habit, createdAt: serverTimestamp() });
export const updateHabit = (uid, habitId, data) =>
  updateDoc(doc(db, "users", uid, "habits", habitId), data);
export const deleteHabit = (uid, habitId) =>
  deleteDoc(doc(db, "users", uid, "habits", habitId));
export const subscribeToHabits = (uid, callback) => {
  const q = query(userCol(uid, "habits"), orderBy("createdAt", "asc"));
  return onSnapshot(q, snap => callback(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
};

// ─── NOTES ────────────────────────────────────────────────────────────────
export const addNote = (uid, note) =>
  addDoc(userCol(uid, "notes"), { title: "", body: "", color: "#FFF8E7", ...note, createdAt: serverTimestamp() });
export const updateNote = (uid, noteId, data) =>
  updateDoc(doc(db, "users", uid, "notes", noteId), { ...data, updatedAt: serverTimestamp() });
export const deleteNote = (uid, noteId) =>
  deleteDoc(doc(db, "users", uid, "notes", noteId));
export const subscribeToNotes = (uid, callback) => {
  const q = query(userCol(uid, "notes"), orderBy("createdAt", "desc"));
  return onSnapshot(q, snap => callback(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
};

// ─── ADMIN ────────────────────────────────────────────────────────────────
// Save admin flag (only first user / manually set in Firestore)
export const checkIsAdmin = async (uid) => {
  try {
    const ref = doc(db, "admins", uid);
    const snap = await getDoc(ref);
    return snap.exists();
  } catch { return false; }
};

// Get all users stats (admin only)
export const getAdminStats = async () => {
  try {
    const usersSnap = await getDocs(collection(db, "users"));
    const stats = { totalUsers: usersSnap.size, users: [] };
    for (const userDoc of usersSnap.docs) {
      const uid = userDoc.id;
      const tasksSnap = await getDocs(collection(db, "users", uid, "tasks"));
      const habitsSnap = await getDocs(collection(db, "users", uid, "habits"));
      const notesSnap = await getDocs(collection(db, "users", uid, "notes"));
      stats.users.push({
        uid, tasks: tasksSnap.size,
        habits: habitsSnap.size, notes: notesSnap.size,
      });
    }
    return stats;
  } catch (e) { return { totalUsers: 0, users: [] }; }
};
