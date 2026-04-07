/**
 * IronCore Coach — Browser Notifications
 * Handles morning & evening workout reminders via the Notification API.
 */

const NOTIFICATION_HOURS = {
  morning: 4,   // 4:00 AM
  evening: 19,  // 7:00 PM
};

const MOTIVATIONAL_MESSAGES = [
  "💪 Time to crush it! Your workout is waiting.",
  "🔥 Don't break the streak! Let's go!",
  "🏋️ Iron doesn't lift itself. Get after it!",
  "⚡ Your future self will thank you. Start now!",
  "🛡️ Level up today. One push-up at a time.",
  "🎯 Consistency beats perfection. Show up!",
  "🦾 You're stronger than you think. Prove it!",
  "📈 Progress is built daily. Let's add to it!",
];

let notificationsEnabled = false;
let notificationInterval = null;

function initNotifications() {
  const btn = document.getElementById('btn-notifications');
  if (!btn) return;

  // Check if notifications are already permitted
  if ('Notification' in window && Notification.permission === 'granted') {
    notificationsEnabled = true;
    btn.classList.add('active');
    startNotificationScheduler();
  }

  btn.addEventListener('click', toggleNotifications);
}

async function toggleNotifications() {
  const btn = document.getElementById('btn-notifications');

  if (!('Notification' in window)) {
    alert('Your browser does not support notifications.');
    return;
  }

  if (notificationsEnabled) {
    // Turn off
    notificationsEnabled = false;
    btn.classList.remove('active');
    if (notificationInterval) clearInterval(notificationInterval);
    return;
  }

  // Request permission
  const permission = await Notification.requestPermission();

  if (permission === 'granted') {
    notificationsEnabled = true;
    btn.classList.add('active');
    startNotificationScheduler();

    // Send a confirmation notification
    new Notification('🏋️ IronCore Coach', {
      body: 'Notifications enabled! We\'ll remind you at 4 AM and 7 PM.',
      icon: '🏋️',
    });
  }
}

function startNotificationScheduler() {
  // Check every minute
  if (notificationInterval) clearInterval(notificationInterval);

  let lastNotifiedHour = -1;

  notificationInterval = setInterval(() => {
    if (!notificationsEnabled) return;

    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();

    // Fire at the exact hour, minute 0
    if (minute === 0 && hour !== lastNotifiedHour) {
      if (hour === NOTIFICATION_HOURS.morning || hour === NOTIFICATION_HOURS.evening) {
        sendReminder(hour === NOTIFICATION_HOURS.morning ? 'morning' : 'evening');
        lastNotifiedHour = hour;
      }
    }
  }, 30000); // Check every 30 seconds
}

function sendReminder(timeOfDay) {
  const msg = MOTIVATIONAL_MESSAGES[Math.floor(Math.random() * MOTIVATIONAL_MESSAGES.length)];
  const title = timeOfDay === 'morning'
    ? '☀️ Good Morning, Champ!'
    : '🌙 Evening Reminder';

  if (Notification.permission === 'granted') {
    new Notification(title, {
      body: msg,
      tag: `ironcore-${timeOfDay}`,
    });
  }
}
