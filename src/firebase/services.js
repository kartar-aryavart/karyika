// 🔥 Firebase Service — All database operations for Karyika
import {
  collection, addDoc, updateDoc, deleteDoc,
  doc, query, where, onSnapshot, orderBy, serverTimestamp
} from "firebase/firestore";
import { db } from "./config";

// ─── Helper ───────────────────────────────────────────────────────────────────
const userCol = (uid, col) => collection(db, "users", uid, col);

// ─── TASKS ────────────────────────────────────────────────────────────────────
export const addTask = (uid, task) =>
  addDoc(userCol(uid, "tasks"), { ...task, createdAt: serverTimestamp() });

export const updateTask = (uid, taskId, data) =>
  updateDoc(doc(db, "users", uid, "tasks", taskId), data);

export const deleteTask = (uid, taskId) =>
  deleteDoc(doc(db, "users", uid, "tasks", taskId));

export const subscribeToTasks = (uid, callback) => {
  const q = query(userCol(uid, "tasks"), orderBy("createdAt", "desc"));
  return onSnapshot(q, snap => {
    const tasks = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(tasks);
  });
};

// ─── HABITS ───────────────────────────────────────────────────────────────────
export const addHabit = (uid, habit) =>
  addDoc(userCol(uid, "habits"), { ...habit, createdAt: serverTimestamp() });

export const updateHabit = (uid, habitId, data) =>
  updateDoc(doc(db, "users", uid, "habits", habitId), data);

export const deleteHabit = (uid, habitId) =>
  deleteDoc(doc(db, "users", uid, "habits", habitId));

export const subscribeToHabits = (uid, callback) => {
  const q = query(userCol(uid, "habits"), orderBy("createdAt", "asc"));
  return onSnapshot(q, snap => {
    const habits = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(habits);
  });
};

// ─── NOTES ────────────────────────────────────────────────────────────────────
export const addNote = (uid, note) =>
  addDoc(userCol(uid, "notes"), { ...note, createdAt: serverTimestamp() });

export const updateNote = (uid, noteId, data) =>
  updateDoc(doc(db, "users", uid, "notes", noteId), { ...data, updatedAt: serverTimestamp() });

export const deleteNote = (uid, noteId) =>
  deleteDoc(doc(db, "users", uid, "notes", noteId));

export const subscribeToNotes = (uid, callback) => {
  const q = query(userCol(uid, "notes"), orderBy("createdAt", "desc"));
  return onSnapshot(q, snap => {
    const notes = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    callback(notes);
  });
};
