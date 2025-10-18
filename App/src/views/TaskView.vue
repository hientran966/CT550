<template>
  <div class="task-layout">
    <ProjectMenu />
    <div class="main-content">
      <Header :page="'task'" :project-id="projectId" @add="onAdd" @member-click="openMemberList" />
      <TaskKanban
        :tasks="tasksByProject[projectId] || []"
        :project-id="projectId"
        @update-task-status="t => taskStore.updateStatus(projectId, t)"
        @update-task="t => taskStore.updateTask(projectId, t)"
      />
    </div>
  </div>

  <TaskForm v-model="formRef" :project-id="projectId" @task-added="() => taskStore.loadTasks(projectId)" />
  <MemberList v-model="memberRef" :project_id="projectId" @member-updated="() => taskStore.loadTasks(projectId)" />
</template>

<script setup>
import { storeToRefs } from "pinia";
import { useTaskStore } from "@/stores/taskStore";
import { useRoute } from "vue-router";
import { onMounted, ref } from "vue";

import Header from "@/components/Header.vue";
import TaskKanban from "@/components/TaskKanban.vue";
import TaskForm from "@/components/TaskForm.vue";
import MemberList from "@/components/MemberList.vue";
import ProjectMenu from "@/components/ProjectMenu.vue";

const route = useRoute();
const projectId = Number(route.params.id);

const taskStore = useTaskStore();
const { tasksByProject } = storeToRefs(taskStore);

const formRef = ref(false);
const memberRef = ref(false);

const onAdd = () => (formRef.value = true);
const openMemberList = () => (memberRef.value = true);

onMounted(() => {
  taskStore.loadTasks(projectId);
});
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