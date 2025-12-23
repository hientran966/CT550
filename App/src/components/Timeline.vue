<template>
  <div class="calendar-container">
    <el-card>
      <el-calendar v-model="currentDate">
        <template #date-cell="{ data }">
          <div class="calendar-cell" @click="showTasksOfDay(data.day)">
            <div class="date-label">{{ data.day.split('-')[2] }}</div>

            <div v-if="getTasksForDate(data.day).length > 0">
              <div
                v-for="(task, index) in getTasksForDate(data.day).slice(0, 2)"
                :key="task.id"
                class="task-item"
                :style="{ backgroundColor: getStatusColor(task.status) }"
              >
                <span class="task-title">{{ task.title }}</span>
                <span class="task-progress">{{ task.latest_progress ?? 0 }}%</span>
              </div>

              <div
                v-if="getTasksForDate(data.day).length > 2"
                class="more-tasks"
              >
                + {{ getTasksForDate(data.day).length - 2 }} công việc khác
              </div>
            </div>
          </div>
        </template>
      </el-calendar>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { ElMessageBox } from "element-plus";
import { getSocket } from "@/plugins/socket";

import { useTaskStore } from "@/stores/taskStore";

const props = defineProps({
  projectId: Number,
  tasks: {
    type: Array,
    default: () => []
  }
});

const tasks = ref([]);
const taskStore = useTaskStore();

// Đảm bảo không bị lệch múi giờ
const currentDate = ref(formatLocalDate(new Date()));

// Format Date thành yyyy-MM-dd theo múi giờ địa phương (VN)
function formatLocalDate(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getTasksForDate(dateString) {
  const targetDate = formatLocalDate(dateString);
  return tasks.value.filter((task) => {
    if (!task.start_date) return false;
    const start = formatLocalDate(task.start_date);
    const end = task.due_date ? formatLocalDate(task.due_date) : start;
    return targetDate >= start && targetDate <= end;
  });
}

function getStatusColor(status) {
  switch (status) {
    case "todo":
      return "#f56c6c";
    case "in_progress":
      return "#e6a23c";
    case "done":
      return "#67c23a";
    default:
      return "#909399";
  }
}

function showTasksOfDay(dateString) {
  const tasksInDay = getTasksForDate(dateString);
  const formattedDate = new Date(dateString).toLocaleDateString("vi-VN");

  let listHtml = "";

  if (tasksInDay.length === 0) {
    listHtml = `<div style="color:#909399;text-align:center;padding:8px 0;">Không có công việc nào trong ngày này.</div>`;
  } else {
    listHtml = tasksInDay
      .map(
        (t) =>
          `<div style="margin-bottom:6px">
            <b>${t.title}</b> — <i>${t.latest_progress ?? 0}%</i> 
            <span style="color:${getStatusColor(t.status)}">(${t.status})</span>
          </div>`
      )
      .join("");
  }

  ElMessageBox.alert(listHtml, `Công việc ngày ${formattedDate}`, {
    dangerouslyUseHTMLString: true,
    confirmButtonText: "Đóng",
    customClass: "task-dialog-box",
  });
}

async function loadTask() {
  const res = await taskStore.getTasksByProject(props.projectId);
  tasks.value = res || [];
}

onMounted(async () => {
  await loadTask();

  const socket = getSocket();
  if (!socket) return;

  socket.on("task_updated", async () => {
    await taskStore.loadTasks(props.projectId);
    await loadTask();
  });
});
</script>

<style scoped>
.calendar-container {
  margin: 20px;
}

.calendar-cell {
  min-height: 80px;
  position: relative;
}

.date-label {
  font-weight: bold;
  margin-bottom: 4px;
}

.task-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: white;
  border-radius: 6px;
  padding: 2px 6px;
  font-size: 12px;
  margin-top: 3px;
}

.task-title {
  flex: 1;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.task-progress {
  margin-left: 4px;
  font-weight: bold;
}

.more-tasks {
  color: #409eff;
  font-size: 12px;
  cursor: pointer;
  margin-top: 4px;
  text-align: right;
}

.more-tasks:hover {
  text-decoration: underline;
}

:deep(.el-calendar-day) {
  height: 90px !important;
  min-height: 90px !important;
  max-height: 90px !important;
}
</style>