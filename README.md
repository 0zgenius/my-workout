# 🏋️ IronCore Coach

**Full body strength, posture & recovery — one workout at a time.**

A full-stack fitness coaching web app with an infinite leveling system, full-body workouts, posture correction, streak tracking, and auto-difficulty adjustment.

---

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start the server
npm start

# Or run in dev mode (auto-restart)
npm run dev
```

Then open **http://localhost:3000** in your browser.

---

## 📋 Features

- **Authentication System** — Secure user signup & login with JWT & bcrypt
- **Per-User State** — Each user tracks their own streak, level, and history
- **Full Body Workouts** — Push, Posture & Back, Legs, Core, Recovery
- **Dashboard** — Level, streak, workout preview, weekly chart
- **Posture Correction** — Chin tucks, superman holds, wall posture
- **Auto Difficulty** — 3 easy → level up, 2 hard → level down
- **Progress Chart** — 14-day score & level trends (Chart.js)
- **Browser Notifications** — Morning (4 AM) & evening (7 PM) reminders
- **Infinite Levels** — Exercises evolve as you progress

---

## 🎮 Workout Categories

| Category | Exercises | Purpose |
|----------|-----------|---------|
| **💪 Push** | Wall, Incline, Knee, Full, Diamond Push-ups | Chest, shoulders, triceps |
| **🦴 Posture & Back** | Chin Tucks, Superman Hold, Wall Posture, Snow Angels | Spine alignment, upper back |
| **🦿 Legs** | Squats, Lunges, Glute Bridge | Lower body strength |
| **🎯 Core** | Plank, Leg Raises | Stability & injury prevention |
| **🌿 Recovery** | Full Body Stretch, Neck Stretch, Chest Stretch | Flexibility & mobility |

---

## 📈 Level Progression

| Level | Push | Posture | Legs | Core |
|-------|------|---------|------|------|
| 1–3 | Wall + Incline Push-ups | Chin Tucks + Wall Posture | Squats + Glute Bridge | Short Plank |
| 4–6 | Incline + Knee Push-ups | Chin Tucks + Superman + Wall | Squats + Lunges + Bridge | Plank + Leg Raises |
| 7–10 | Knee + Full Push-ups | Superman + Snow Angels + Chin | All three | Full Core |
| 11+ | Full + Diamond Push-ups | Advanced variations | All with higher reps | Advanced |

Reps and sets scale automatically with level.

---

## 🔗 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/signup` | Create a new user account |
| POST | `/api/login` | Authenticate and receive a JWT token |
| GET | `/api/me` | Get the currently logged-in user profile |
| GET | `/api/status` | Returns level, streak, history, today's workout (Protected) |
| POST | `/api/start` | Returns full-body workout for current level (Protected) |
| POST | `/api/complete` | Log workout with performance (Protected) |
| POST | `/api/reset` | Reset all progress (Protected) |

---

## 📁 Project Structure

```
workout/
├── server/
│   ├── server.js       # Express API + full-body workout generator + JWT auth
│   └── users.json      # User database (JSON file)
├── public/
│   ├── index.html      # Login/Signup & Dashboard
│   ├── css/styles.css  # Premium dark theme
│   └── js/
│       ├── app.js      # Main logic, auth flow + category rendering
│       ├── chart.js    # Chart.js integration
│       └── notifications.js
├── package.json
└── README.md
```

---

## License

MIT
