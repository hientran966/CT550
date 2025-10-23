<template>
  <div class="task-layout">
    <ProjectMenu
      :active-view="activeView"
      :project-id="projectId"
      @update:view="activeView = $event"
      @select-channel="selectedChannel = $event"
    />

    <div class="main-content">
      <Header
        :page="'task'"
        :project-id="projectId"
        @add="onAdd"
        @member-click="openMemberList"
      />

      <div class="content-body">
        <TaskKanban
          v-if="activeView === 'kanban'"
          :tasks="tasksByProject[projectId] || []"
          :project-id="projectId"
          @open-detail="openTaskDetail"
          @update-task-status="t => taskStore.updateStatus(projectId, t)"
          @update-task="t => taskStore.updateTask(projectId, t)"
        />

        <Timeline v-else-if="activeView === 'timeline'" :project-id="projectId" />
        <Report v-else-if="activeView === 'report'" :project-id="projectId" />

        <FileList
          v-else-if="activeView === 'file-all'"
          :project-id="projectId"
        />
        <FileList
          v-else-if="activeView === 'file-user'"
          :project-id="projectId"
          :user-id="userId"
        />

        <Chat
          v-else-if="activeView === 'chat' && selectedChannel"
          :channel-id="selectedChannel"
          :current-user-id="userId"
        />
      </div>
    </div>
  </div>

  <TaskForm
    v-model="formRef"
    :project-id="projectId"
    @task-added="() => taskStore.loadTasks(projectId)"
  />
  <MemberList
    v-model="memberRef"
    :project_id="projectId"
    @member-updated="() => taskStore.loadTasks(projectId)"
  />
  <TaskDetail
    v-if="selectedTask"
    v-model="detailVisible"
    :task-id="selectedTask.id"
    :project-id="projectId"
  />
</template>

<script setup>
import { ref, onMounted, watch } from "vue";
import { storeToRefs } from "pinia";
import { useTaskStore } from "@/stores/taskStore";
import { useRoute } from "vue-router";

import Header from "@/components/Header.vue";
import ProjectMenu from "@/components/ProjectMenu.vue";
import TaskKanban from "@/components/TaskKanban.vue";
import Timeline from "@/components/Timeline.vue";
import Report from "@/components/Report.vue";
import FileList from "@/components/FileList.vue";
import Chat from "@/components/Chat.vue";
import TaskForm from "@/components/TaskForm.vue";
import MemberList from "@/components/MemberList.vue";
import TaskDetail from "@/components/TaskDetail.vue";

const route = useRoute();
const projectId = Number(route.params.id);
const user = JSON.parse(localStorage.getItem("user") || "{}");
const userId = user?.id || null;

const activeView = ref("kanban");
const selectedChannel = ref(null);

const taskStore = useTaskStore();
const { tasksByProject } = storeToRefs(taskStore);

const formRef = ref(false);
const memberRef = ref(false);
const selectedTask = ref(null);
const detailVisible = ref(false);

const onAdd = () => (formRef.value = true);
const openMemberList = () => (memberRef.value = true);

function openTaskDetail(task) {
  selectedTask.value = task;
  detailVisible.value = true;
}

function openTaskDetailById(taskId) {
  const task = tasksByProject.value[projectId]?.find((t) => t.id === taskId);
  if (task) {
    selectedTask.value = task;
    detailVisible.value = true;
  }
}

onMounted(() => {
  taskStore.loadTasks(projectId);
  if (route.query.task) openTaskDetailById(Number(route.query.task));
});

watch(
  () => route.query.task,
  (newVal) => newVal && openTaskDetailById(Number(newVal))
);
</script>