<template>
  <div class="task-layout">
    <ProjectMenu />
    <div class="main-content">
      <Header :page="'task'" :project-id="projectId" @add="onAdd" @member-click="openMemberList" />
      <TaskKanban
        :tasks="tasksByProject[projectId] || []"
        :project-id="projectId"
        @open-detail="openTaskDetail"
        @update-task-status="t => taskStore.updateStatus(projectId, t)"
        @update-task="t => taskStore.updateTask(projectId, t)"
      />
    </div>
  </div>

  <TaskForm v-model="formRef" :project-id="projectId" @task-added="() => taskStore.loadTasks(projectId)" />
  <MemberList v-model="memberRef" :project_id="projectId" @member-updated="() => taskStore.loadTasks(projectId)" />
  <TaskDetail
    v-if="selectedTask"
    v-model="detailVisible"
    :task-id="selectedTask.id"
    :project-id="projectId"
  />
</template>

<script setup>
import { storeToRefs } from "pinia";
import { useTaskStore } from "@/stores/taskStore";
import { useRoute } from "vue-router";
import { onMounted, ref, watch } from "vue";

import Header from "@/components/Header.vue";
import TaskKanban from "@/components/TaskKanban.vue";
import TaskForm from "@/components/TaskForm.vue";
import MemberList from "@/components/MemberList.vue";
import ProjectMenu from "@/components/ProjectMenu.vue";
import TaskDetail from "@/components/TaskDetail.vue";

const route = useRoute();
const projectId = Number(route.params.id);

const taskStore = useTaskStore();
const { tasksByProject } = storeToRefs(taskStore);

const formRef = ref(false);
const memberRef = ref(false);
const selectedTask = ref(null);
const detailVisible = ref(false);

const onAdd = () => (formRef.value = true);
const openMemberList = () => (memberRef.value = true);

function openTaskDetailById(taskId) {
  const task = tasksByProject.value[projectId]?.find((t) => t.id === taskId);
  if (task) {
    detailVisible.value = true;
    selectedTask.value = task;
  }
}

function openTaskDetail(task) {
  selectedTask.value = task;
  detailVisible.value = true;
}

onMounted(() => {
  taskStore.loadTasks(projectId);
  if (route.query.task) {
    openTaskDetailById(Number(route.query.task));
  }
});
watch(
  () => route.query.task,
  (newVal) => {
    if (newVal) openTaskDetailById(Number(newVal));
  }
);
</script>

<style scoped>
.el-overlay-dialog {
  height: 100vh !important;
}
.task-layout {
  display: flex;
  height: 100vh;
}
.menu {
  width: 300px;
  min-width: 300px;
  max-width: 300px;
  height: 100vh;
}
.main-content{
  display: flex;
  flex-direction: column;
  flex: 1;
  height: 100vh;
}
.kanban {
  flex: 1;
  overflow-x: auto;
  margin: 0;
}
</style>