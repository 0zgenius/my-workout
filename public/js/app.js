/**
 * IronCore Coach — Main Application Logic
 * Handles auth, dashboard rendering, workout flow, and API communication.
 */

const API = '';

// ── Auth State ─────────────────────────────────────────
let token = localStorage.getItem('ironcore_token') || null;
let currentUser = null;

// ── App State ──────────────────────────────────────────
let state = {
  level: 1,
  streak: 0,
  totalWorkouts: 0,
  history: [],
  workout: null,
  workedOutToday: false,
};

// ── DOM Elements ───────────────────────────────────────
const $header         = document.getElementById('header');
const $headerActions  = document.getElementById('header-actions');
const $headerUserName = document.getElementById('header-user-name');
const $statsBar       = document.getElementById('stats-bar');
const $mainContent    = document.getElementById('main-content');

// Auth views
const $viewLogin      = document.getElementById('view-login');
const $viewSignup     = document.getElementById('view-signup');
const $loginForm      = document.getElementById('login-form');
const $signupForm     = document.getElementById('signup-form');
const $loginError     = document.getElementById('login-error');
const $signupError    = document.getElementById('signup-error');
const $linkToSignup   = document.getElementById('link-to-signup');
const $linkToLogin    = document.getElementById('link-to-login');
const $btnLogout      = document.getElementById('btn-logout');

// Dashboard elements
const $levelValue      = document.getElementById('level-value');
const $streakValue     = document.getElementById('streak-value');
const $totalValue      = document.getElementById('total-value');
const $exerciseList    = document.getElementById('exercise-list');
const $btnStart        = document.getElementById('btn-start');
const $doneToday       = document.getElementById('done-today');
const $workoutBadge    = document.getElementById('workout-badge');
const $historyList     = document.getElementById('history-list');
const $viewDashboard   = document.getElementById('view-dashboard');
const $viewWorkout     = document.getElementById('view-workout');
const $activeExercises = document.getElementById('active-exercises');
const $workoutLevelBadge = document.getElementById('workout-level-badge');
const $btnBack         = document.getElementById('btn-back');
const $toast           = document.getElementById('toast');
const $toastContent    = document.getElementById('toast-content');

const $btnEasy   = document.getElementById('btn-easy');
const $btnNormal = document.getElementById('btn-normal');
const $btnHard   = document.getElementById('btn-hard');

// ── Initialization ─────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  bindEvents();

  if (token) {
    // Try to restore session
    checkAuth();
  } else {
    showAuthView('login');
  }
});

function bindEvents() {
  // Auth events
  $loginForm.addEventListener('submit', handleLogin);
  $signupForm.addEventListener('submit', handleSignup);
  $linkToSignup.addEventListener('click', (e) => { e.preventDefault(); showAuthView('signup'); });
  $linkToLogin.addEventListener('click', (e) => { e.preventDefault(); showAuthView('login'); });
  $btnLogout.addEventListener('click', handleLogout);

  // Workout events
  $btnStart.addEventListener('click', startWorkout);
  $btnBack.addEventListener('click', showDashboard);
  [$btnEasy, $btnNormal, $btnHard].forEach(btn => {
    btn.addEventListener('click', () => completeWorkout(btn.dataset.performance));
  });
}

// ── Auth Helpers ───────────────────────────────────────

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
}

function saveToken(newToken) {
  token = newToken;
  localStorage.setItem('ironcore_token', newToken);
}

function clearToken() {
  token = null;
  currentUser = null;
  localStorage.removeItem('ironcore_token');
}

// ── View Management ────────────────────────────────────

function showAuthView(type) {
  // Hide app
  $statsBar.style.display = 'none';
  $mainContent.style.display = 'none';
  $headerActions.style.display = 'none';

  // Show correct auth view
  $viewLogin.classList.toggle('view--active', type === 'login');
  $viewSignup.classList.toggle('view--active', type === 'signup');

  // Clear errors
  $loginError.textContent = '';
  $signupError.textContent = '';
}

function showApp() {
  // Hide auth views
  $viewLogin.classList.remove('view--active');
  $viewSignup.classList.remove('view--active');

  // Show app
  $statsBar.style.display = 'grid';
  $mainContent.style.display = 'block';
  $headerActions.style.display = 'flex';

  // Show dashboard
  $viewDashboard.classList.add('view--active');
  $viewWorkout.classList.remove('view--active');

  // Set user name
  if (currentUser) {
    $headerUserName.textContent = `👤 ${currentUser.name}`;
  }

  // Load data
  loadStatus();
  initNotifications();
}

// ── Auth Actions ───────────────────────────────────────

async function checkAuth() {
  try {
    const res = await fetch(`${API}/api/me`, {
      headers: authHeaders(),
    });

    if (res.ok) {
      const data = await res.json();
      currentUser = data;
      showApp();
    } else {
      clearToken();
      showAuthView('login');
    }
  } catch (err) {
    clearToken();
    showAuthView('login');
  }
}

async function handleLogin(e) {
  e.preventDefault();
  $loginError.textContent = '';

  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;

  const submitBtn = document.getElementById('btn-login-submit');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Logging in...';

  try {
    const res = await fetch(`${API}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (res.ok) {
      saveToken(data.token);
      currentUser = data.user;
      showToast(data.message, null);
      showApp();
    } else {
      $loginError.textContent = data.error || 'Login failed.';
    }
  } catch (err) {
    $loginError.textContent = 'Connection error. Please try again.';
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Log In';
  }
}

async function handleSignup(e) {
  e.preventDefault();
  $signupError.textContent = '';

  const name = document.getElementById('signup-name').value;
  const email = document.getElementById('signup-email').value;
  const password = document.getElementById('signup-password').value;

  const submitBtn = document.getElementById('btn-signup-submit');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Creating account...';

  try {
    const res = await fetch(`${API}/api/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await res.json();

    if (res.ok) {
      saveToken(data.token);
      currentUser = data.user;
      showToast('🎉 Welcome to IronCore Coach!', null);
      showApp();
    } else {
      $signupError.textContent = data.error || 'Signup failed.';
    }
  } catch (err) {
    $signupError.textContent = 'Connection error. Please try again.';
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Create Account';
  }
}

function handleLogout() {
  clearToken();
  state = { level: 1, streak: 0, totalWorkouts: 0, history: [], workout: null, workedOutToday: false };
  showAuthView('login');
  showToast('👋 Logged out successfully.', null);
}

// ── API Calls (protected) ──────────────────────────────

async function loadStatus() {
  try {
    const res = await fetch(`${API}/api/status`, { headers: authHeaders() });

    if (res.status === 401) {
      clearToken();
      showAuthView('login');
      return;
    }

    const data = await res.json();
    state = { ...state, ...data };

    if (data.userName) {
      currentUser = { name: data.userName };
      $headerUserName.textContent = `👤 ${data.userName}`;
    }

    renderDashboard();
    renderChart(data.history);
  } catch (err) {
    console.error('Failed to load status:', err);
  }
}

async function startWorkout() {
  try {
    const res = await fetch(`${API}/api/start`, {
      method: 'POST',
      headers: authHeaders(),
    });

    if (res.status === 401) { clearToken(); showAuthView('login'); return; }

    const data = await res.json();
    state.workout = data.workout;
    showWorkoutView();
  } catch (err) {
    console.error('Failed to start workout:', err);
  }
}

async function completeWorkout(performance) {
  [$btnEasy, $btnNormal, $btnHard].forEach(b => b.disabled = true);

  try {
    const res = await fetch(`${API}/api/complete`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ performance }),
    });

    if (res.status === 401) { clearToken(); showAuthView('login'); return; }

    const data = await res.json();
    showToast(data.message, data.levelChange);

    state.level = data.level;
    state.streak = data.streak;
    state.totalWorkouts = data.totalWorkouts;
    state.workedOutToday = true;
    state.workout = data.workout;

    await loadStatus();

    setTimeout(() => {
      showDashboard();
      [$btnEasy, $btnNormal, $btnHard].forEach(b => b.disabled = false);
    }, 1200);
  } catch (err) {
    console.error('Failed to complete workout:', err);
    [$btnEasy, $btnNormal, $btnHard].forEach(b => b.disabled = false);
  }
}

// ── Rendering ──────────────────────────────────────────

function renderDashboard() {
  animateValue($levelValue, state.level);
  animateValue($streakValue, state.streak);
  animateValue($totalValue, state.totalWorkouts);

  if (state.workedOutToday) {
    $btnStart.style.display = 'none';
    $doneToday.style.display = 'flex';
    $workoutBadge.textContent = 'Done ✓';
    $workoutBadge.classList.add('badge--done');
  } else {
    $btnStart.style.display = 'flex';
    $doneToday.style.display = 'none';
    $workoutBadge.textContent = 'Ready';
    $workoutBadge.classList.remove('badge--done');
  }

  if (state.workout && state.workout.categories) {
    $exerciseList.innerHTML = state.workout.categories.map(cat => `
      <div class="category-group">
        <div class="category-header">
          <span class="category-header__icon">${cat.icon}</span>
          <span class="category-header__name">${cat.category}</span>
        </div>
        ${cat.exercises.map(ex => `
          <div class="exercise-item">
            <div class="exercise-item__icon">${ex.icon}</div>
            <div class="exercise-item__info">
              <div class="exercise-item__name">${ex.name}</div>
              <div class="exercise-item__detail">${ex.sets} sets × ${ex.reps} reps</div>
            </div>
            <a href="https://www.youtube.com/results?search_query=${encodeURIComponent('how to do ' + ex.name + ' exercise')}" target="_blank" rel="noopener noreferrer" class="exercise-youtube-link" title="Watch Tutorial">🎥</a>
          </div>
        `).join('')}
      </div>
    `).join('');
  }

  renderHistory();
}

function renderHistory() {
  if (!state.history || state.history.length === 0) {
    $historyList.innerHTML = '<p class="empty-state">No workouts yet. Start your first one! 💪</p>';
    return;
  }

  const recent = [...state.history].reverse().slice(0, 10);
  $historyList.innerHTML = recent.map(entry => {
    const date = new Date(entry.date).toLocaleDateString('en-US', {
      weekday: 'short', month: 'short', day: 'numeric'
    });
    return `
      <div class="history-entry animate-in">
        <span class="history-entry__date">${date}</span>
        <span class="history-entry__perf history-entry__perf--${entry.performance}">${entry.performance}</span>
        <span class="history-entry__level">Lvl ${entry.level || '?'}</span>
      </div>
    `;
  }).join('');
}

// ── View Switching ─────────────────────────────────────

function showWorkoutView() {
  $viewDashboard.classList.remove('view--active');
  $viewWorkout.classList.add('view--active');
  renderActiveWorkout();
}

function showDashboard() {
  $viewWorkout.classList.remove('view--active');
  $viewDashboard.classList.add('view--active');
}

function renderActiveWorkout() {
  if (!state.workout) return;

  $workoutLevelBadge.textContent = `Level ${state.workout.level}`;

  let exIndex = 0;
  $activeExercises.innerHTML = state.workout.categories.map(cat => {
    const exercisesHtml = cat.exercises.map(ex => {
      const idx = exIndex++;
      return `
        <div class="active-exercise" id="active-ex-${idx}">
          <div class="active-exercise__icon">${ex.icon}</div>
          <div class="active-exercise__info">
            <div class="active-exercise__name">${ex.name}</div>
            <div class="active-exercise__sets">${ex.sets} sets × ${ex.reps} reps</div>
          </div>
          <a href="https://www.youtube.com/results?search_query=${encodeURIComponent('how to do ' + ex.name + ' exercise')}" target="_blank" rel="noopener noreferrer" class="active-youtube-link" title="Watch Tutorial">🎥</a>
          <button class="active-exercise__check" onclick="toggleExercise(${idx})" aria-label="Mark ${ex.name} complete">✓</button>
        </div>
      `;
    }).join('');

    return `
      <div class="active-category">
        <div class="active-category__header">
          <span class="active-category__icon">${cat.icon}</span>
          <div>
            <div class="active-category__name">${cat.category}</div>
            <div class="active-category__subtitle">${cat.subtitle}</div>
          </div>
        </div>
        ${exercisesHtml}
      </div>
    `;
  }).join('');
}

function toggleExercise(index) {
  const el = document.getElementById(`active-ex-${index}`);
  const check = el.querySelector('.active-exercise__check');
  el.classList.toggle('completed');
  check.classList.toggle('checked');
}

// ── Toast ──────────────────────────────────────────────

function showToast(message, levelChange) {
  $toastContent.textContent = message;
  $toast.className = 'toast toast--visible';

  if (levelChange === 'up') {
    $toast.classList.add('toast--levelup');
    const lvlEl = document.getElementById('stat-level');
    if (lvlEl) { lvlEl.classList.add('level-up-flash'); setTimeout(() => lvlEl.classList.remove('level-up-flash'), 600); }
  } else if (levelChange === 'down') {
    $toast.classList.add('toast--leveldown');
  }

  setTimeout(() => { $toast.className = 'toast'; }, 3000);
}

// ── Utilities ──────────────────────────────────────────

function animateValue(el, target) {
  const current = parseInt(el.textContent) || 0;
  if (current === target) { el.textContent = target; return; }

  const duration = 500;
  const startTime = performance.now();

  function update(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const value = Math.round(current + (target - current) * eased);
    el.textContent = value;

    if (progress < 1) {
      requestAnimationFrame(update);
    } else {
      el.textContent = target;
      el.classList.add('streak-bump');
      setTimeout(() => el.classList.remove('streak-bump'), 400);
    }
  }

  requestAnimationFrame(update);
}
