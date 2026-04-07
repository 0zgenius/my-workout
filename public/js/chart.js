/**
 * IronCore Coach — Chart.js Integration
 * Renders a weekly progress line chart with gradient fill.
 */

let progressChart = null;

function renderChart(history) {
  const canvas = document.getElementById('progress-chart');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');

  // Get last 14 days
  const days = [];
  const scores = [];
  const levels = [];
  const today = new Date();

  for (let i = 13; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });

    days.push(dayLabel);

    const entry = history.find(h => h.date === dateStr);
    scores.push(entry ? entry.score : null);
    levels.push(entry ? entry.level : null);
  }

  // Create gradient
  const gradient = ctx.createLinearGradient(0, 0, 0, 220);
  gradient.addColorStop(0, 'rgba(99, 102, 241, 0.3)');
  gradient.addColorStop(1, 'rgba(99, 102, 241, 0.0)');

  const levelGradient = ctx.createLinearGradient(0, 0, 0, 220);
  levelGradient.addColorStop(0, 'rgba(16, 185, 129, 0.15)');
  levelGradient.addColorStop(1, 'rgba(16, 185, 129, 0.0)');

  // Destroy existing chart if any
  if (progressChart) {
    progressChart.destroy();
  }

  progressChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: days,
      datasets: [
        {
          label: 'Score',
          data: scores,
          borderColor: '#818cf8',
          backgroundColor: gradient,
          borderWidth: 2.5,
          fill: true,
          tension: 0.4,
          pointRadius: (ctx) => scores[ctx.dataIndex] !== null ? 5 : 0,
          pointHoverRadius: 8,
          pointBackgroundColor: '#818cf8',
          pointBorderColor: '#0d0d1a',
          pointBorderWidth: 2,
          spanGaps: false,
        },
        {
          label: 'Level',
          data: levels,
          borderColor: '#34d399',
          backgroundColor: levelGradient,
          borderWidth: 2,
          borderDash: [6, 4],
          fill: true,
          tension: 0.4,
          pointRadius: (ctx) => levels[ctx.dataIndex] !== null ? 4 : 0,
          pointHoverRadius: 7,
          pointBackgroundColor: '#34d399',
          pointBorderColor: '#0d0d1a',
          pointBorderWidth: 2,
          spanGaps: false,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false,
      },
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: {
            color: '#8888aa',
            font: { family: "'Inter', sans-serif", size: 11 },
            boxWidth: 12,
            boxHeight: 2,
            padding: 16,
            usePointStyle: false,
          },
        },
        tooltip: {
          backgroundColor: 'rgba(13, 13, 26, 0.95)',
          titleColor: '#e8e8f0',
          bodyColor: '#8888aa',
          borderColor: 'rgba(255, 255, 255, 0.06)',
          borderWidth: 1,
          padding: 12,
          cornerRadius: 8,
          displayColors: true,
          titleFont: { family: "'Inter', sans-serif", weight: '600', size: 12 },
          bodyFont: { family: "'Inter', sans-serif", size: 11 },
          callbacks: {
            label: function(context) {
              if (context.dataset.label === 'Score') {
                const scoreLabels = { 1: 'Hard', 2: 'Normal', 3: 'Easy' };
                return `Score: ${context.formattedValue} (${scoreLabels[context.raw] || ''})`;
              }
              return `Level: ${context.formattedValue}`;
            },
          },
        },
      },
      scales: {
        x: {
          grid: {
            color: 'rgba(255, 255, 255, 0.03)',
            drawBorder: false,
          },
          ticks: {
            color: '#555577',
            font: { family: "'Inter', sans-serif", size: 10 },
            maxRotation: 45,
          },
          border: { display: false },
        },
        y: {
          min: 0,
          grid: {
            color: 'rgba(255, 255, 255, 0.03)',
            drawBorder: false,
          },
          ticks: {
            color: '#555577',
            font: { family: "'Inter', sans-serif", size: 10 },
            stepSize: 1,
          },
          border: { display: false },
        },
      },
      animation: {
        duration: 1000,
        easing: 'easeOutQuart',
      },
    },
  });
}
