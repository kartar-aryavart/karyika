// 🔥 Firebase Services v2 — Karyika Phase 1
import {
  collection, addDoc, updateDoc, deleteDoc,
  doc, query, orderBy, onSnapshot, serverTimestamp, getDoc
} from "firebase/firestore";
import { db } from "./config";

const userCol = (uid, col) => collection(db, "users", uid, col);

// ─── TASKS v2 ─────────────────────────────────────────────────────────────────
export const addTask = (uid, task) =>
  addDoc(userCol(uid, "tasks"), {
    title: "", desc: "", due: "", priority: "medium", category: "personal",
    done: false, status: "todo", tags: [], subtasks: [],
    reminder: "", recurring: "none", estimatedTime: 0, timeSpent: 0,
    urgency: "not-urgent", importance: "important",
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

export const addTimeSpent = async (uid, taskId, minutes) => {
  const ref = doc(db, "users", uid, "tasks", taskId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  return updateDoc(ref, { timeSpent: (snap.data().timeSpent || 0) + minutes });
};

// ─── HABITS ───────────────────────────────────────────────────────────────────
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

// ─── NOTES ────────────────────────────────────────────────────────────────────
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
