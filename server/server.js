require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const { pool, initializeDB } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'ironcore_coach_secret_key_2026';
const JWT_EXPIRES = '7d';
const SALT_ROUNDS = 10;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

// Initialize Postgres
initializeDB();

// ── Helpers ───────────────────────────────────────────
function getToday() {
  return new Date().toISOString().slice(0, 10);
}

// ── Auth Middleware ────────────────────────────────────
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

app.post('/api/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) return res.status(400).json({ error: 'Name, email, and password required.' });
    if (name.trim().length < 2) return res.status(400).json({ error: 'Name must be at least 2 characters.' });
    if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters.' });

    const normalEmail = email.toLowerCase().trim();

    // Check existing
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [normalEmail]);
    if (existing.rows.length > 0) return res.status(409).json({ error: 'Account with this email already exists.' });

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    await pool.query(
      'INSERT INTO users (name, email, password) VALUES ($1, $2, $3)',
      [name.trim(), normalEmail, hashedPassword]
    );

    const token = jwt.sign({ email: normalEmail, name: name.trim() }, JWT_SECRET, { expiresIn: JWT_EXPIRES });

    res.status(201).json({
      message: 'Account created successfully!',
      token,
      user: { name: name.trim(), email: normalEmail }
    });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Failed to create account.' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required.' });

    const normalEmail = email.toLowerCase().trim();
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [normalEmail]);

    if (result.rows.length === 0) return res.status(401).json({ error: 'Invalid email or password.' });

    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'Invalid email or password.' });

    const token = jwt.sign({ email: user.email, name: user.name }, JWT_SECRET, { expiresIn: JWT_EXPIRES });

    res.json({
      message: `Welcome back, ${user.name}!`,
      token,
      user: { name: user.name, email: user.email }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Failed to log in.' });
  }
});

app.get('/api/me', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT name, email, created_at FROM users WHERE email = $1', [req.userEmail]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found.' });

    const user = result.rows[0];
    res.json({
      name: user.name,
      email: user.email,
      createdAt: user.created_at
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// ── Protected Workout Routes ───────────────────────────

app.get('/api/status', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [req.userEmail]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found.' });

    const user = result.rows[0];
    const workout = generateWorkout(user.level);
    const today = getToday();
    const history = user.history || [];
    const workedOutToday = history.some(h => h.date === today);

    res.json({
      level: user.level,
      streak: user.streak,
      history: history,
      workout,
      workedOutToday,
      totalWorkouts: user.total_workouts,
      userName: user.name,
    });
  } catch (err) {
    console.error('Error reading status:', err);
    res.status(500).json({ error: 'Failed to read status.' });
  }
});

app.post('/api/start', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT level FROM users WHERE email = $1', [req.userEmail]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found.' });

    const workout = generateWorkout(result.rows[0].level);
    res.json({ workout });
  } catch (err) {
    console.error('Error starting workout:', err);
    res.status(500).json({ error: 'Failed to start workout.' });
  }
});

app.post('/api/complete', authMiddleware, async (req, res) => {
  try {
    const { performance } = req.body;
    if (!['easy', 'normal', 'hard'].includes(performance)) {
      return res.status(400).json({ error: 'Invalid performance.' });
    }

    const result = await pool.query('SELECT * FROM users WHERE email = $1', [req.userEmail]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found.' });

    const user = result.rows[0];
    const history = user.history || [];
    const today = getToday();
    const scoreMap = { easy: 3, normal: 2, hard: 1 };
    const score = scoreMap[performance];

    let newStreak = user.streak;
    let newTotal = user.total_workouts;
    let newStrong = user.strong_sessions;
    let newHard = user.hard_sessions;
    let newLevel = user.level;

    // Streak logic
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);
    
    // Find last workout date
    const lastHistory = history.length > 0 ? history[history.length - 1] : null;
    const lastWorkoutDate = lastHistory ? lastHistory.date : null;

    if (lastWorkoutDate === today) {
      const idx = history.findIndex(h => h.date === today);
      if (idx !== -1) {
        history[idx].performance = performance;
        history[idx].score = score;
      }
    } else {
      if (lastWorkoutDate === yesterdayStr || lastWorkoutDate === today) {
        newStreak += 1;
      } else {
        newStreak = 1;
      }
      history.push({ date: today, performance, score, level: user.level });
      newTotal += 1;
    }

    // Level adjustment
    if (performance === 'easy') {
      newStrong += 1;
      newHard = 0;
    } else if (performance === 'normal') {
      newHard = 0;
    } else if (performance === 'hard') {
      newHard += 1;
      newStrong = 0;
    }

    let levelChange = null;
    if (newStrong >= 3) {
      newLevel += 1;
      newStrong = 0;
      levelChange = 'up';
    } else if (newHard >= 2) {
      newLevel = Math.max(1, newLevel - 1);
      newHard = 0;
      levelChange = 'down';
    }

    const updateQuery = `
      UPDATE users 
      SET level = $1, streak = $2, strong_sessions = $3, hard_sessions = $4, history = $5, total_workouts = $6 
      WHERE email = $7
    `;
    
    await pool.query(updateQuery, [
      newLevel, newStreak, newStrong, newHard, JSON.stringify(history), newTotal, req.userEmail
    ]);

    const workout = generateWorkout(newLevel);

    res.json({
      level: newLevel,
      streak: newStreak,
      score,
      levelChange,
      workout,
      totalWorkouts: newTotal,
      message: levelChange === 'up'
        ? `🔥 Level Up! You're now Level ${newLevel}!`
        : levelChange === 'down'
        ? `💪 Adjusted to Level ${newLevel}. Keep pushing!`
        : `✅ Workout logged. Keep going!`,
    });
  } catch (err) {
    console.error('Error completing workout:', err);
    res.status(500).json({ error: 'Failed to complete workout.' });
  }
});

app.post('/api/reset', authMiddleware, async (req, res) => {
  try {
    const updateQuery = `
      UPDATE users 
      SET level = 1, streak = 0, strong_sessions = 0, hard_sessions = 0, history = '[]'::jsonb, total_workouts = 0 
      WHERE email = $1
    `;
    await pool.query(updateQuery, [req.userEmail]);
    
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

// Export app for serverless deployment (Vercel)
module.exports = app;

// Listen on port if not running in a serverless environment
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`\n⚡ IronCore Coach backend running on port ${PORT}\n`);
  });
}
