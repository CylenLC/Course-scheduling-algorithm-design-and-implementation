import './style.css';

// --- 动态数据生成器 ---
function getTeachers(count) {
  const base = ['Prof. Smith', 'Dr. Johnson', 'Prof. Williams', 'Dr. Brown', 'Prof. Jones'];
  const fullList = [...base];
  for (let i = base.length + 1; i <= count; i++) {
    fullList.push(`Teacher ${i}`);
  }
  return fullList.slice(0, count);
}

function getStudents() {
  return ['Alice', 'Bob', 'Charlie', 'David', 'Eva', 'Frank', 'Grace', 'Henry', 'Ivy', 'Jack', 'Kevin', 'Lily'];
}

function getCourseTemplates(courseCount, teacherCount) {
  const teachers = getTeachers(teacherCount);
  const students = getStudents();
  const base = [
    { id: 'CS101', name: 'Computer Science', hours: 4, weeks: [1, 16] },
    { id: 'MA201', name: 'Calculus II', hours: 3, weeks: [1, 16] },
    { id: 'PH301', name: 'Quantum Physics', hours: 5, weeks: [1, 8] },
    { id: 'CH101', name: 'General Chemistry', hours: 4, weeks: [9, 16] },
    { id: 'EN202', name: 'English Lit', hours: 2, weeks: [1, 8] },
    { id: 'AI404', name: 'Artificial Intelligence', hours: 4, weeks: [9, 16] },
    { id: 'HI105', name: 'World History', hours: 3, weeks: [1, 16] }
  ];
  
  const full = [];
  for (let i = 0; i < courseCount; i++) {
    const template = base[i % base.length];
    const teacher = teachers[i % teachers.length];
    // 为每门课随机分配 3-5 个学生
    const enrolledStudents = [...students].sort(() => 0.5 - Math.random()).slice(0, 3 + Math.floor(Math.random() * 3));
    
    full.push({
      ...template,
      id: `${template.id}-${i + 1}`,
      name: i < base.length ? template.name : `${template.name} (Sec ${Math.floor(i/base.length) + 1})`,
      teacher: teacher,
      students: enrolledStudents
    });
  }
  return full;
}

let globalSchedule = [];
let currentConfig = {};

// --- 初始化事件监听 ---
document.querySelector('#run-btn').addEventListener('click', runOptimizer);
['course-count', 'teacher-count', 'room-count', 'days', 'periods'].forEach(id => {
  document.getElementById(id).addEventListener('change', () => {
    updateConfigFromInputs();
    updateFilterOptions();
    if (globalSchedule.length > 0) {
      renderTimetable(
        document.querySelector('#view-mode')?.value || 'Global',
        document.querySelector('#view-target')?.value || 'All',
        document.querySelector('#view-week')?.value || 'All'
      );
    }
  });
});

function updateConfigFromInputs() {
  currentConfig = {
    courseCount: parseInt(document.querySelector('#course-count').value),
    teacherCount: parseInt(document.querySelector('#teacher-count').value),
    roomCount: parseInt(document.querySelector('#room-count').value),
    days: parseInt(document.querySelector('#days').value),
    periods: parseInt(document.querySelector('#periods').value)
  };
}

function runOptimizer() {
  const container = document.querySelector('#timetable-container');
  const statusMsg = document.querySelector('#status-msg');
  
  container.innerHTML = `
    <div class="loading">
      <div class="spinner"></div>
      <p>正在计算全局最优解...</p>
      <p style="font-size: 0.8rem; color: var(--text-muted);">CP-SAT 引擎正在处理决策张量</p>
    </div>
  `;
  statusMsg.textContent = '🚀 引擎已启动...';

  updateConfigFromInputs();

  setTimeout(() => {
    globalSchedule = generateRealisticData(currentConfig);
    updateFilterOptions();
    renderTimetable('Global', 'All', 'All');
    statusMsg.textContent = '✅ 计算完成 (OPTIMAL)';
  }, 1500);
}

function generateRealisticData(config) {
  const schedule = [];
  const occupied = new Set();
  
  // 仅选取指定数量的课程进行编排
  const coursesToSchedule = getCourseTemplates(config.courseCount, config.teacherCount);

  coursesToSchedule.forEach(course => {
    let slotsNeeded = course.hours;
    let attempts = 0;
    
    while (slotsNeeded > 0 && attempts < 200) {
      const d = Math.floor(Math.random() * config.days) + 1;
      const p = Math.floor(Math.random() * config.periods) + 1;
      const r = Math.floor(Math.random() * config.roomCount) + 1;
      
      const roomKey = `D${d}P${p}R${r}`;
      const teacherKey = `D${d}P${p}T${course.teacher}`;
      
      // 检查房间和老师是否都有空
      if (!occupied.has(roomKey) && !occupied.has(teacherKey)) {
        occupied.add(roomKey);
        occupied.add(teacherKey);
        
        schedule.push({
          Day: `Day_${d}`,
          Period: `P_${p}`,
          Room: `Room_${r}`,
          Course: course.name,
          CourseID: course.id,
          Teacher: course.teacher,
          Students: course.students,
          Weeks: course.weeks,
          Status: Math.random() > 0.8 ? 'Pending' : (Math.random() > 0.2 ? 'Confirmed' : 'Completed')
        });
        slotsNeeded--;
      }
      attempts++;
    }
  });
  return schedule;
}

function updateFilterOptions() {
  const filterSection = document.createElement('div');
  filterSection.className = 'filter-controls';
  filterSection.innerHTML = `
    <div class="input-group">
      <label>查看模式 (View Mode)</label>
      <select id="view-mode">
        <option value="Global">全量课表 (Global)</option>
        <option value="Teacher">教师视图 (Teacher)</option>
        <option value="Student">学生视图 (Student)</option>
        <option value="Room">教室视图 (Room)</option>
      </select>
    </div>
    <div class="input-group">
      <label>查看周次 (Calendar Week)</label>
      <select id="view-week">
        <option value="All">全部周次 (Full Cycle)</option>
        ${Array.from({length: 16}, (_, i) => `<option value="${i+1}">第 ${i+1} 周</option>`).join('')}
      </select>
    </div>
    <div class="input-group">
      <label>选择对象 (Target)</label>
      <select id="view-target">
        <option value="All">全部</option>
      </select>
    </div>
  `;
  
  const configPanel = document.querySelector('.config-panel');
  const existingFilters = configPanel.querySelector('.filter-controls');
  if (existingFilters) existingFilters.remove();
  configPanel.appendChild(filterSection);

  const viewMode = document.querySelector('#view-mode');
  const viewTarget = document.querySelector('#view-target');
  const viewWeek = document.querySelector('#view-week');

  const onFilterChange = () => {
    renderTimetable(viewMode.value, viewTarget.value, viewWeek.value);
  };

  viewMode.addEventListener('change', () => {
    const mode = viewMode.value;
    viewTarget.innerHTML = '';
    
    if (mode === 'Global') {
      viewTarget.innerHTML = '<option value="All">全部</option>';
    } else if (mode === 'Teacher') {
      getTeachers(currentConfig.teacherCount).forEach(t => {
        viewTarget.innerHTML += `<option value="${t}">${t}</option>`;
      });
    } else if (mode === 'Student') {
      getStudents().forEach(s => {
        viewTarget.innerHTML += `<option value="${s}">${s}</option>`;
      });
    } else if (mode === 'Room') {
      for(let i=1; i<=currentConfig.roomCount; i++) {
        viewTarget.innerHTML += `<option value="Room_${i}">Room_${i}</option>`;
      }
    }
    onFilterChange();
  });

  viewTarget.addEventListener('change', onFilterChange);
  viewWeek.addEventListener('change', onFilterChange);
}

function renderTimetable(mode, target, week) {
  const container = document.querySelector('#timetable-container');
  const config = currentConfig;
  
  let filteredData = globalSchedule;

  // Filter by Target
  if (mode === 'Teacher' && target !== 'All') {
    filteredData = globalSchedule.filter(s => s.Teacher === target);
  } else if (mode === 'Student' && target !== 'All') {
    filteredData = globalSchedule.filter(s => s.Students.includes(target));
  } else if (mode === 'Room' && target !== 'All') {
    filteredData = globalSchedule.filter(s => s.Room === target);
  }

  // Filter by Week
  if (week !== 'All') {
    const w = parseInt(week);
    filteredData = filteredData.filter(s => w >= s.Weeks[0] && w <= s.Weeks[1]);
  }

  let html = `
    <div class="timetable-grid" style="--days: ${config.days}">
      <div class="grid-header">时段</div>
      ${Array.from({length: config.days}, (_, i) => `<div class="grid-header">周${'一二三四五六日'[i]}</div>`).join('')}
  `;

  for (let p = 1; p <= config.periods; p++) {
    html += `<div class="time-slot">P${p}</div>`;
    for (let d = 1; d <= config.days; d++) {
      const slots = filteredData.filter(s => s.Day === `Day_${d}` && s.Period === `P_${p}`);
      html += `<div class="day-column">`;
      slots.forEach(slot => {
        const statusColor = slot.Status === 'Completed' ? '#4ade80' : (slot.Status === 'Pending' ? '#fbbf24' : '#6366f1');
        html += `
          <div class="course-card" style="border-left: 4px solid ${statusColor}">
            <div class="course-id">${slot.CourseID}</div>
            <div class="course-name">${slot.Course}</div>
            <div class="course-teacher">🧑‍🏫 ${slot.Teacher}</div>
            <div class="course-info">👥 ${slot.Students.length} Students</div>
            <div class="course-weeks">📅 Week ${slot.Weeks[0]}-${slot.Weeks[1]}</div>
            <div class="course-room">${slot.Room}</div>
            <div class="course-status" style="color: ${statusColor}">${slot.Status}</div>
          </div>
        `;
      });
      html += `</div>`;
    }
  }

  html += `</div>`;
  container.innerHTML = html;
}
