# Karyika — कार्यिका
### Modern Productivity App — Students, Teachers & Professionals ke liye

> React + Firebase + Vercel — Free mein deploy karo!

---

## 🚀 Local Setup (Step by Step)

### Step 1 — Project download karo
```bash
# GitHub se clone karo
git clone https://github.com/YOUR_USERNAME/karyika.git
cd karyika
```

### Step 2 — Dependencies install karo
```bash
npm install
```

### Step 3 — App run karo
```bash
npm run dev
```
Browser mein khulega: `http://localhost:5173`

---

## 🔥 Firebase Setup (Already done hai — bas Firestore Rules set karo)

Firebase Console → Firestore Database → Rules → Paste karo:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

**Publish** kar do! ✅

---

## 🌐 GitHub pe Upload karo

```bash
# GitHub par naya repo banao: "karyika"
git init
git add .
git commit -m "🚀 Karyika — First commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/karyika.git
git push -u origin main
```

---

## ⚡ Vercel pe Deploy karo

1. [vercel.com](https://vercel.com) kholo
2. **"New Project"** → GitHub se **karyika** repo select karo
3. Settings:
   - Framework: **Vite**
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. **Deploy** click karo!

2 minute mein live ho jaayega! 🎉

---

## 📁 Folder Structure

```
karyika/
├── src/
│   ├── firebase/
│   │   ├── config.js       ← Firebase connection
│   │   └── services.js     ← All database operations
│   ├── hooks/
│   │   └── useAuth.jsx     ← Authentication
│   ├── components/
│   │   ├── UI.jsx          ← Reusable components
│   │   └── Sidebar.jsx     ← Navigation
│   ├── pages/
│   │   ├── AuthPage.jsx    ← Login/Signup
│   │   ├── Dashboard.jsx   ← Home page
│   │   ├── TasksPage.jsx   ← Task management
│   │   └── OtherPages.jsx  ← Habits, Notes, Calendar, Timer, Settings
│   ├── App.jsx             ← Root component
│   ├── main.jsx            ← Entry point
│   └── index.css           ← Global styles
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

---

## ✨ Features

- ✅ Email + Google Login
- ✅ Firebase Firestore — real-time sync
- ✅ Tasks (add/edit/delete/filter/search)
- ✅ Habit Tracker with streaks
- ✅ Calendar view
- ✅ Pomodoro Focus Timer
- ✅ Notes (color coded)
- ✅ Dark Mode
- ✅ Responsive (mobile + desktop)
- ✅ Browser notifications

---

**Made with ❤️ for Kartar Aryavart**
