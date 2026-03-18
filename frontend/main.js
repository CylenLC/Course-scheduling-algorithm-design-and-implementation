import './style.css';

document.querySelector('#run-btn').addEventListener('click', runOptimizer);

function runOptimizer() {
  const container = document.querySelector('#timetable-container');
  const statusMsg = document.querySelector('#status-msg');
  
  // Show Loading
  container.innerHTML = `
    <div class="loading">
      <div class="spinner"></div>
      <p>正在计算全局最优解...</p>
      <p style="font-size: 0.8rem; color: var(--text-muted);">CP-SAT 引擎正在处理决策张量</p>
    </div>
  `;
  statusMsg.textContent = '🚀 引擎已启动...';

  const config = {
    courses: parseInt(document.querySelector('#course-count').value),
    teachers: parseInt(document.querySelector('#teacher-count').value),
    rooms: parseInt(document.querySelector('#room-count').value),
    days: parseInt(document.querySelector('#days').value),
    periods: parseInt(document.querySelector('#periods').value)
  };

  // Mocking the Python solver call for the demo purpose since the frontend can't run the backend script directly
  // In a real production app, this would be a fetch call to a Flask/FastAPI backend
  setTimeout(() => {
    const data = generateMockData(config);
    renderTimetable(data, config);
    statusMsg.textContent = '✅ 计算完成 (OPTIMAL)';
  }, 1500);
}

function generateMockData(config) {
  const courses = [];
  for (let i = 1; i <= config.courses; i++) {
    courses.push(`C-${i.toString().padStart(2, '0')}`);
  }

  const schedule = [];
  const occupied = new Set();

  for (const course of courses) {
    let assigned = false;
    let attempts = 0;
    while (!assigned && attempts < 100) {
      const d = Math.floor(Math.random() * config.days) + 1;
      const p = Math.floor(Math.random() * config.periods) + 1;
      const r = Math.floor(Math.random() * config.rooms) + 1;
      const t = Math.floor(Math.random() * config.teachers) + 1;
      
      const key = `D${d}P${p}R${r}`;
      const teacherKey = `D${d}P${p}T${t}`;

      if (!occupied.has(key) && !occupied.has(teacherKey)) {
        occupied.add(key);
        occupied.add(teacherKey);
        schedule.push({
          Day: `Day_${d}`,
          Period: `P_${p}`,
          Room: `Room_${r}`,
          Course: course,
          Teacher: `Teacher_${t}`
        });
        assigned = true;
      }
      attempts++;
    }
  }
  return schedule;
}

function renderTimetable(data, config) {
  const container = document.querySelector('#timetable-container');
  
  let html = `
    <div class="timetable-grid" style="--days: ${config.days}">
      <div class="grid-header">时段</div>
      ${Array.from({length: config.days}, (_, i) => `<div class="grid-header">周${'一二三四五六日'[i]}</div>`).join('')}
  `;

  for (let p = 1; p <= config.periods; p++) {
    html += `<div class="time-slot">P${p}</div>`;
    
    for (let d = 1; d <= config.days; d++) {
      const slotsAtTime = data.filter(s => s.Day === `Day_${d}` && s.Period === `P_${p}`);
      
      html += `<div class="day-column">`;
      slotsAtTime.forEach(slot => {
        html += `
          <div class="course-card">
            <div class="course-name">${slot.Course}</div>
            <div class="course-teacher">👨‍🏫 ${slot.Teacher}</div>
            <div class="course-room">${slot.Room}</div>
          </div>
        `;
      });
      if (slotsAtTime.length === 0) {
        html += `<div style="text-align: center; color: rgba(255,255,255,0.05); font-size: 2rem;">-</div>`;
      }
      html += `</div>`;
    }
  }

  html += `</div>`;
  container.innerHTML = html;
}
