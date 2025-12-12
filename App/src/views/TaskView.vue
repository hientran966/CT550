<template>
  <div class="task-layout">
    <ProjectMenu
      :active-view="activeView"
      :project-id="projectId"
      :is-expanded="isExpanded"
      @update:view="activeView = $event"
      @select-channel="selectedChannel = $event"
      @chat-add="chatModal = true"
    />

    <div class="main-content" :style="{ maxWidth: `calc(100vw - ${isExpanded ? 200 : 64}px)` }">
      <Header
        :page="'task'"
        :project-id="projectId"
        :is-expanded="isExpanded"
        :members="members"
        @add="onAdd"
        @delete-project="onDeleteProject"
        @ai-gen="handleAIGen"
        @member-click="openMemberList"
        @toggle-menu="isExpanded = !isExpanded"
      />

      <div class="content-body">
        <TaskKanban
          v-if="activeView === 'kanban'"
          :tasks="taskStore.filteredTasksByProject(projectId)"
          :project-id="projectId"
          @open-detail="openTaskDetail"
          @update-task-status="(t) => taskStore.updateStatus(projectId, t)"
          @update-task="(t) => taskStore.updateTask(projectId, t)"
        />

        <Timeline
          v-else-if="activeView === 'timeline'"
          :project-id="projectId"
        />
        <TaskGantt
          v-else-if="activeView === 'gantt'"
          :project-id="projectId"
        />
        <Report v-else-if="activeView === 'report'" :project-id="projectId" />
        <GitHubIntegration v-else-if="activeView === 'github'" />

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
  <ChannelForm
    v-model="chatModal"
    :project-id="projectId"
    @channel-added="() => {}"
  />
  <MemberList
    v-model="memberListRef"
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
import { useRoute, useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { useTaskStore } from "@/stores/taskStore";

import MemberService from "@/services/Member.service";
import ChatService from "@/services/Chat.service";
import OllamaService from "@/services/Ollama.service";
import ProjectService from "@/services/Project.service";

import ProjectMenu from "@/components/ProjectMenu.vue";
import Header from "@/components/Header.vue";
import TaskKanban from "@/components/TaskKanban.vue";
import Timeline from "@/components/Timeline.vue";
import Report from "@/components/Report.vue";
import GitHubIntegration from "@/components/GitHubIntegration.vue";
import FileList from "@/components/FileList.vue";
import Chat from "@/components/Chat.vue";
import TaskForm from "@/components/TaskForm.vue";
import ChannelForm from "@/components/ChannelForm.vue";
import MemberList from "@/components/MemberList.vue";
import TaskDetail from "@/components/TaskDetail.vue";
import TaskGantt from "@/components/TaskGantt.vue";

const route = useRoute();
const router = useRouter();
const projectId = Number(route.params.id);
const user = JSON.parse(localStorage.getItem("user") || "{}");
const userId = user?.id || null;

const taskStore = useTaskStore();

const activeView = ref("kanban");
const selectedChannel = ref(null);
const formRef = ref(false);
const members = ref([]);
const memberListRef = ref(false);
const selectedTask = ref(null);
const detailVisible = ref(false);
const chatModal = ref(false);
const isExpanded = ref(true);

const onAdd = () => (formRef.value = true);
const openMemberList = () => (memberListRef.value = true);

async function loadMembers() {
  if (activeView.value == 'chat') {
    const res  = await ChatService.getChannelMembers(selectedChannel.value);
    members.value = Array.isArray(res) ? res : [];
    return;
  }
  const res = await MemberService.getByProjectId(projectId);
  members.value = Array.isArray(res) ? res : [];
}

function openTaskDetail(task) {
  selectedTask.value = task;
  detailVisible.value = true;
}

function openTaskDetailById(taskId) {
  const task = taskStore
    .getTasksByProject(projectId)
    ?.find((t) => t.id === taskId);
  if (task) {
    selectedTask.value = task;
    detailVisible.value = true;
  }
}

function removeQueryParam(param) {
  const newQuery = { ...route.query };
  delete newQuery[param];

  router.replace({
    query: newQuery
  });
}

function handleAIGen(count) {
  OllamaService.generateTasks({
    projectId,
    userId: userId,
    taskCount: count
  }).then(() => {
    taskStore.loadTasks(projectId);
  });
}

async function onDeleteProject(projectId) {
  try {
    const res = await await ProjectService.deleteProject(projectId, userId);
    ElMessage.success("Xóa project thành công");

    router.push("/projects");
  } catch (err) {
    console.error(err);
  }
}


onMounted(() => {
  taskStore.loadTasks(projectId);
  loadMembers();

  if (route.query.task) {
    openTaskDetailById(Number(route.query.task));
    removeQueryParam("task");
  }
  if (route.query.channel) {
    activeView.value = "chat";
    selectedChannel.value = Number(route.query.channel);

    removeQueryParam("channel");
  }
});

watch(
  () => route.query.task,
  (newVal) => newVal && openTaskDetailById(Number(newVal))
);
watch(
  () => route.query.channel,
  (newVal) => {
    if (newVal) {
      activeView.value = "chat";
      selectedChannel.value = Number(newVal);
      removeQueryParam("channel");
    }
  }
);
watch(
  [activeView, selectedChannel],
  async () => {
    await loadMembers();
  }
);
</script>

<style scoped>
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: calc(100vh - 60px);
  background-color: #f5f6f8;
  overflow: hidden;
}
</style>