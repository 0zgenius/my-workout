const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;
const USERS_FILE = path.join(__dirname, 'users.json');
const JWT_SECRET = process.env.JWT_SECRET || 'ironcore_coach_secret_key_2026';
const JWT_EXPIRES = '7d';
const SALT_ROUNDS = 10;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

// ── Database Helpers ───────────────────────────────────

function readUsers() {
  if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, JSON.stringify({ users: [] }, null, 2));
  }
  const raw = fs.readFileSync(USERS_FILE, 'utf-8');
  return JSON.parse(raw);
}

function writeUsers(data) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(data, null, 2));
}

function findUser(email) {
  const db = readUsers();
  return db.users.find(u => u.email === email.toLowerCase().trim());
}

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

// ── Auth Middleware ─────────────────────────────────────

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided. Please log in.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userEmail = decoded.email;
    req.userName = decoded.name;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token. Please log in again.' });
  }
}

// ── Workout Generator ──────────────────────────────────

function generateWorkout(level) {
  const sets = Math.min(2 + Math.floor(level / 3), 6);
  const reps = Math.min(5 + level * 2, 30);
  const holdSec = Math.min(15 + level * 5, 120);
  const stretchSec = Math.min(20 + level * 3, 60);

  const categories = [];

  // PUSH
  const push = { category: 'Push', subtitle: 'Upper Body Strength', icon: '💪', exercises: [] };
  if (level <= 3) {
    push.exercises = [
      { name: 'Wall Push-ups', sets, reps, icon: '🧱' },
      { name: 'Incline Push-ups', sets: Math.max(sets - 1, 1), reps: Math.max(reps - 2, 3), icon: '📐' },
    ];
  } else if (level <= 6) {
    push.exercises = [
      { name: 'Incline Push-ups', sets, reps, icon: '📐' },
      { name: 'Knee Push-ups', sets, reps: Math.max(reps - 2, 3), icon: '🦵' },
    ];
  } else if (level <= 10) {
    push.exercises = [
      { name: 'Knee Push-ups', sets, reps, icon: '🦵' },
      { name: 'Full Push-ups', sets: Math.max(sets - 1, 1), reps: Math.max(reps - 4, 3), icon: '💪' },
    ];
  } else {
    push.exercises = [
      { name: 'Full Push-ups', sets, reps, icon: '💪' },
      { name: 'Diamond Push-ups', sets: Math.max(sets - 1, 1), reps: Math.max(reps - 6, 3), icon: '💎' },
    ];
  }
  categories.push(push);

  // POSTURE & BACK
  const posture = { category: 'Posture & Back', subtitle: 'Spine & Shoulder Alignment', icon: '🦴', exercises: [] };
  if (level <= 3) {
    posture.exercises = [
      { name: 'Chin Tucks', sets: Math.max(sets - 1, 1), reps: Math.min(reps, 12), icon: '🧏' },
      { name: 'Wall Posture Hold', sets: 1, reps: `${holdSec}s`, icon: '🧍' },
    ];
  } else if (level <= 6) {
    posture.exercises = [
      { name: 'Chin Tucks', sets: Math.max(sets - 1, 1), reps: Math.min(reps, 15), icon: '🧏' },
      { name: 'Superman Hold', sets: Math.max(sets - 1, 1), reps: `${Math.min(holdSec, 45)}s`, icon: '🦸' },
      { name: 'Wall Posture Hold', sets: 1, reps: `${holdSec}s`, icon: '🧍' },
    ];
  } else {
    posture.exercises = [
      { name: 'Superman Hold', sets, reps: `${Math.min(holdSec, 60)}s`, icon: '🦸' },
      { name: 'Reverse Snow Angels', sets: Math.max(sets - 1, 1), reps: Math.min(reps, 15), icon: '👼' },
      { name: 'Chin Tucks', sets: Math.max(sets - 1, 1), reps: Math.min(reps, 20), icon: '🧏' },
    ];
  }
  categories.push(posture);

  // LEGS
  const legs = { category: 'Legs', subtitle: 'Lower Body Strength', icon: '🦿', exercises: [] };
  if (level <= 3) {
    legs.exercises = [
      { name: 'Squats', sets, reps: Math.max(reps - 2, 5), icon: '🏋️' },
      { name: 'Glute Bridge', sets: Math.max(sets - 1, 1), reps: Math.max(reps - 2, 5), icon: '🌉' },
    ];
  } else if (level <= 6) {
    legs.exercises = [
      { name: 'Squats', sets, reps, icon: '🏋️' },
      { name: 'Lunges', sets: Math.max(sets - 1, 1), reps: Math.max(reps - 4, 4), icon: '🚶' },
      { name: 'Glute Bridge', sets: Math.max(sets - 1, 1), reps, icon: '🌉' },
    ];
  } else {
    legs.exercises = [
      { name: 'Squats', sets, reps, icon: '🏋️' },
      { name: 'Lunges', sets, reps: Math.max(reps - 2, 5), icon: '🚶' },
      { name: 'Glute Bridge', sets, reps, icon: '🌉' },
    ];
  }
  categories.push(legs);

  // CORE
  const core = { category: 'Core', subtitle: 'Stability & Strength', icon: '🎯', exercises: [] };
  if (level <= 3) {
    core.exercises = [
      { name: 'Plank', sets: 1, reps: `${Math.min(holdSec, 30)}s`, icon: '🧘' },
    ];
  } else if (level <= 6) {
    core.exercises = [
      { name: 'Plank', sets: Math.max(sets - 1, 1), reps: `${holdSec}s`, icon: '🧘' },
      { name: 'Leg Raises', sets: Math.max(sets - 1, 1), reps: Math.max(reps - 4, 5), icon: '🦿' },
    ];
  } else {
    core.exercises = [
      { name: 'Plank', sets, reps: `${holdSec}s`, icon: '🧘' },
      { name: 'Leg Raises', sets, reps: Math.max(reps - 2, 8), icon: '🦿' },
    ];
  }
  categories.push(core);

  // RECOVERY
  const recovery = { category: 'Recovery', subtitle: 'Flexibility & Mobility', icon: '🌿', exercises: [] };
  recovery.exercises = [
    { name: 'Full Body Stretch', sets: 1, reps: `${stretchSec}s`, icon: '🤸' },
    { name: 'Neck Stretch', sets: 1, reps: `${Math.max(stretchSec - 10, 15)}s`, icon: '🙆' },
    { name: 'Chest Stretch', sets: 1, reps: `${Math.max(stretchSec - 10, 15)}s`, icon: '🙌' },
  ];
  categories.push(recovery);

  const allExercises = categories.flatMap(c => c.exercises);
  return { level, categories, totalExercises: allExercises.length };
}

// ── Auth Routes ────────────────────────────────────────

/**
 * POST /api/signup
 * Body: { name, email, password }
 */
app.post('/api/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    if (name.trim().length < 2) {
      return res.status(400).json({ error: 'Name must be at least 2 characters.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    const normalEmail = email.toLowerCase().trim();

    // Check if user already exists
    if (findUser(normalEmail)) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // Create user with fresh workout data
    const newUser = {
      name: name.trim(),
      email: normalEmail,
      password: hashedPassword,
      createdAt: new Date().toISOString(),
      data: {
        level: 1,
        streak: 0,
        strongSessions: 0,
        hardSessions: 0,
        lastWorkoutDate: null,
        history: [],
      },
    };

    const db = readUsers();
    db.users.push(newUser);
    writeUsers(db);

    // Generate token
    const token = jwt.sign(
      { email: normalEmail, name: newUser.name },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES }
    );

    res.status(201).json({
      message: 'Account created successfully!',
      token,
      user: { name: newUser.name, email: normalEmail },
    });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Failed to create account.' });
  }
});

/**
 * POST /api/login
 * Body: { email, password }
 */
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const normalEmail = email.toLowerCase().trim();
    const user = findUser(normalEmail);

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      { email: normalEmail, name: user.name },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES }
    );

    res.json({
      message: `Welcome back, ${user.name}!`,
      token,
      user: { name: user.name, email: normalEmail },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Failed to log in.' });
  }
});

/**
 * GET /api/me
 * Returns current user info (protected).
 */
app.get('/api/me', authMiddleware, (req, res) => {
  const user = findUser(req.userEmail);
  if (!user) return res.status(404).json({ error: 'User not found.' });

  res.json({
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
  });
});

// ── Protected Workout Routes ───────────────────────────

/**
 * GET /api/status — Returns user's level, streak, history, and today's workout.
 */
app.get('/api/status', authMiddleware, (req, res) => {
  try {
    const user = findUser(req.userEmail);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    const data = user.data;
    const workout = generateWorkout(data.level);
    const today = getToday();
    const workedOutToday = data.history.some(h => h.date === today);

    res.json({
      level: data.level,
      streak: data.streak,
      history: data.history,
      workout,
      workedOutToday,
      totalWorkouts: data.history.length,
      userName: user.name,
    });
  } catch (err) {
    console.error('Error reading status:', err);
    res.status(500).json({ error: 'Failed to read status.' });
  }
});

/**
 * POST /api/start — Returns the workout for the user's current level.
 */
app.post('/api/start', authMiddleware, (req, res) => {
  try {
    const user = findUser(req.userEmail);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    const workout = generateWorkout(user.data.level);
    res.json({ workout });
  } catch (err) {
    console.error('Error starting workout:', err);
    res.status(500).json({ error: 'Failed to start workout.' });
  }
});

/**
 * POST /api/complete — Log workout with performance rating.
 */
app.post('/api/complete', authMiddleware, (req, res) => {
  try {
    const { performance } = req.body;
    if (!['easy', 'normal', 'hard'].includes(performance)) {
      return res.status(400).json({ error: 'Invalid performance. Use easy, normal, or hard.' });
    }

    const db = readUsers();
    const userIdx = db.users.findIndex(u => u.email === req.userEmail);
    if (userIdx === -1) return res.status(404).json({ error: 'User not found.' });

    const data = db.users[userIdx].data;
    const today = getToday();
    const scoreMap = { easy: 3, normal: 2, hard: 1 };
    const score = scoreMap[performance];

    // Streak logic
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);

    if (data.lastWorkoutDate === today) {
      const idx = data.history.findIndex(h => h.date === today);
      if (idx !== -1) {
        data.history[idx].performance = performance;
        data.history[idx].score = score;
      }
    } else {
      if (data.lastWorkoutDate === yesterdayStr || data.lastWorkoutDate === today) {
        data.streak += 1;
      } else if (data.lastWorkoutDate !== null) {
        data.streak = 1;
      } else {
        data.streak = 1;
      }

      data.lastWorkoutDate = today;
      data.history.push({ date: today, performance, score, level: data.level });
    }

    // Level adjustment
    if (performance === 'easy') {
      data.strongSessions += 1;
      data.hardSessions = 0;
    } else if (performance === 'normal') {
      data.hardSessions = 0;
    } else if (performance === 'hard') {
      data.hardSessions += 1;
      data.strongSessions = 0;
    }

    let levelChange = null;
    if (data.strongSessions >= 3) {
      data.level += 1;
      data.strongSessions = 0;
      levelChange = 'up';
    } else if (data.hardSessions >= 2) {
      data.level = Math.max(1, data.level - 1);
      data.hardSessions = 0;
      levelChange = 'down';
    }

    writeUsers(db);

    const workout = generateWorkout(data.level);

    res.json({
      level: data.level,
      streak: data.streak,
      score,
      levelChange,
      workout,
      totalWorkouts: data.history.length,
      message: levelChange === 'up'
        ? `🔥 Level Up! You're now Level ${data.level}!`
        : levelChange === 'down'
        ? `💪 Adjusted to Level ${data.level}. Keep pushing!`
        : `✅ Workout logged. Keep going!`,
    });
  } catch (err) {
    console.error('Error completing workout:', err);
    res.status(500).json({ error: 'Failed to complete workout.' });
  }
});

/**
 * POST /api/reset — Resets user's progress.
 */
app.post('/api/reset', authMiddleware, (req, res) => {
  try {
    const db = readUsers();
    const userIdx = db.users.findIndex(u => u.email === req.userEmail);
    if (userIdx === -1) return res.status(404).json({ error: 'User not found.' });

    db.users[userIdx].data = {
      level: 1,
      streak: 0,
      strongSessions: 0,
      hardSessions: 0,
      lastWorkoutDate: null,
      history: [],
    };
    writeUsers(db);
    res.json({ message: 'Progress reset.' });
  } catch (err) {
    console.error('Error resetting:', err);
    res.status(500).json({ error: 'Failed to reset progress.' });
  }
});

// ── Serve frontend ─────────────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// ── Start ──────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n⚡ IronCore Coach running at http://localhost:${PORT}\n`);
});
