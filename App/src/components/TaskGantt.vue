<template>
  <div class="gantt-container">
    <div class="gantt-sidebar">
      <div class="sidebar-header">
        <div class="col-task">Task</div>
        <div class="col-assignee">Assignees</div>
        <div class="col-date">Start</div>
        <div class="col-date">Due</div>
      </div>
      
      <div class="sidebar-body">
        <div v-for="task in tasks" :key="task.id" class="sidebar-row">
          <div class="col-task">{{ task.title }}</div>
          <div class="col-assignee">
            <AvatarGroup :user-ids="task.assignees || []" :max="3" :size="28" />
          </div>
          <div class="col-date">{{ formatDate(task.start_date) }}</div>
          <div class="col-date">{{ formatDate(task.due_date) }}</div>
        </div>
      </div>
    </div>

    <div class="gantt-timeline" ref="timelineRef">
      <div class="timeline-header">
        <div class="header-months">
          <div 
            v-for="(month, index) in calendarData.months" 
            :key="index"
            class="month-block"
            :style="{ width: month.width + 'px' }"
          >
            {{ month.label }}
          </div>
        </div>
        <div class="header-days">
          <div 
            v-for="(day, index) in calendarData.days" 
            :key="index"
            class="day-block"
            :class="{ 'is-weekend': day.isWeekend, 'is-today': day.isToday }"
          >
            {{ day.label }}
          </div>
        </div>
        <div 
          class="today-marker-line" 
          :style="{ left: todayPosition + 'px' }"
          v-if="todayPosition >= 0"
        >
          <div class="today-head"></div>
        </div>
      </div>

      <div class="timeline-body">
        <div class="grid-background">
          <div 
            v-for="(day, index) in calendarData.days" 
            :key="index"
            class="grid-column"
            :class="{ 'is-weekend': day.isWeekend }"
          ></div>
        </div>

        <div v-for="task in tasks" :key="'bar-'+task.id" class="timeline-row">
          <div 
            class="task-bar"
            :style="getBarStyle(task)"
          >
            <div class="task-bar-progress" style="width: 40%"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import TaskService from '@/services/Task.service';
import AvatarGroup from './AvatarGroup.vue';

const props = defineProps({
  projectId: {
    type: String,
    required: true
  }
});

const tasks = ref([]);
const columnWidth = 40;
const timelineStart = ref(null);
const timelineEnd = ref(null);

const getDaysDiff = (d1, d2) => {
  const date1 = new Date(d1);
  const date2 = new Date(d2);
  date1.setHours(0,0,0,0);
  date2.setHours(0,0,0,0);
  return Math.round((date2 - date1) / 86400000);
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const calendarData = computed(() => {
  if (!timelineStart.value || !timelineEnd.value) {
    return { days: [], months: [] };
  }

  const days = [];
  const months = [];
  
  let currentDate = new Date(timelineStart.value);
  const endDate = new Date(timelineEnd.value);
  
  let currentMonthLabel = '';
  let currentMonthWidth = 0;

  while (currentDate <= endDate) {
    const fullDate = new Date(currentDate);

    days.push({
      label: fullDate.toLocaleDateString('en-US', { weekday: 'narrow' }),
      date: fullDate,
      isWeekend: currentDate.getDay() === 0 || currentDate.getDay() === 6,
      isToday: fullDate.toDateString() === new Date().toDateString()
    });

    const monthLabel = currentDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

    if (monthLabel !== currentMonthLabel) {
      if (currentMonthLabel) {
        months.push({ label: currentMonthLabel, width: currentMonthWidth });
      }
      currentMonthLabel = monthLabel;
      currentMonthWidth = 0;
    }

    currentMonthWidth += columnWidth;
    currentDate.setDate(currentDate.getDate() + 1);
  }

  if (currentMonthLabel) {
    months.push({ label: currentMonthLabel, width: currentMonthWidth });
  }

  return { days, months };
});

const todayPosition = computed(() => {
  if (!timelineStart.value) return -1;
  const today = new Date();
  const diff = getDaysDiff(timelineStart.value, today);
  if (diff < 0) return -1;
  return diff * columnWidth + columnWidth / 2;
});

const getBarStyle = (task) => {
  const start = new Date(task.start_date);
  const end = new Date(task.due_date);
  
  const offsetDays = getDaysDiff(timelineStart.value, start);
  const durationDays = getDaysDiff(start, end) + 1;

  return {
    left: `${offsetDays * columnWidth}px`,
    width: `${durationDays * columnWidth}px`
  };
};

onMounted(async () => {
  const data = await TaskService.getByProject(props.projectId);

  const validTasks = data.filter(t => t.start_date && t.due_date);
  tasks.value = validTasks;

  if (validTasks.length > 0) {
    const starts = validTasks.map(t => new Date(t.start_date));
    const ends = validTasks.map(t => new Date(t.due_date));

    timelineStart.value = new Date(Math.min(...starts));
    timelineEnd.value = new Date(Math.max(...ends));
  } else {
    const today = new Date();
    timelineStart.value = new Date(today.getFullYear(), today.getMonth(), 1);
    timelineEnd.value = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  }
});
</script>

<style scoped>
:root {
  --g-header-bg: #313338;
  --g-text-muted: #949ba4;
  --g-blue: #5865f2;
  --g-row-hover: #35373c;
}

.gantt-container {
  display: flex;
  height: calc(100vh - 100px);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  font-size: 13px;
  overflow: hidden;
}

.gantt-sidebar {
  width: 400px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  z-index: 2;
}

.sidebar-header {
  height: 60px;
  display: flex;
  align-items: center;
  font-weight: 600;
  color: #949ba4;
}

.sidebar-row {
  height: 40px;
  display: flex;
  align-items: center;
  transition: background 0.2s;
}

.col-task { flex: 1; padding-left: 15px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: flex; align-items: center; gap: 8px;}
.col-assignee { width: 80px; display: flex; justify-content: center; }
.col-date { width: 80px; text-align: right; padding-right: 15px; color: #949ba4; }

.gantt-timeline {
  flex: 1;
  overflow-x: auto;
  overflow-y: hidden;
  position: relative;
}

.timeline-header {
  position: sticky;
  top: 0;
  z-index: 10;
}

.header-months {
  display: flex;
  height: 30px;
}
.month-block {
  padding-left: 8px;
  line-height: 30px;
  font-weight: 600;
  color: #949ba4;
  box-sizing: border-box;
}

.header-days {
  display: flex;
  height: 30px;
}
.day-block {
  width: 40px;
  flex-shrink: 0;
  text-align: center;
  line-height: 30px;
  color: #949ba4;
  font-size: 11px;
}

.timeline-body {
  position: relative;
}

.grid-background {
  display: flex;
  position: absolute;
  top: 0; bottom: 0; left: 0; right: 0;
  pointer-events: none;
}
.grid-column {
  width: 40px;
  flex-shrink: 0;
}

.timeline-row {
  height: 40px;
  position: relative;
  border-bottom: 1px solid transparent;
  margin-top: 1px;
}

.task-bar {
  position: absolute;
  top: 8px;
  height: 24px;
  background-color: #5ea2ff;
  border-radius: 4px;
  opacity: 0.9;
  cursor: pointer;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0,0,0,0.3);
}

.task-bar:hover {
  filter: brightness(1.1);
}

.task-bar-progress {
  height: 100%;
  background-color: #3b82f6;
  border-radius: 4px 0 0 4px;
}

.today-marker-line {
  position: absolute;
  top: 30px;
  bottom: 0;
  width: 2px;
  border-left: 2px dashed #f23f42;
  z-index: 20;
  pointer-events: none;
  height: 100vh;
}
.today-head {
  position: absolute;
  top: -4px;
  left: -5px;
  width: 8px;
  height: 8px;
  background-color: #f23f42;
  border-radius: 50%;
}
</style>
