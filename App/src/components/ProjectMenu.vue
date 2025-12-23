<template>
  <el-menu
    :default-active="activeView"
    :collapse="!isExpanded"
    class="el-menu-vertical-demo"
    @select="handleSelect"
  >
    <el-menu-item index="kanban">
      <el-icon><Menu /></el-icon>
      <span>Danh sách Task</span>
    </el-menu-item>

    <el-menu-item index="gantt">
      <el-icon><Guide /></el-icon>
      <span>Gantt</span>
    </el-menu-item>
    
    <el-menu-item index="timeline">
      <el-icon><Calendar /></el-icon>
      <span>Lịch</span>
    </el-menu-item>

    <el-menu-item index="report">
      <el-icon><PieChart /></el-icon>
      <span>Thông tin</span>
    </el-menu-item>

    <el-menu-item index="github">
      <el-icon><Collection /></el-icon>
      <span>Code</span>
    </el-menu-item>
    
    <el-sub-menu index="file">
      <template #title>
        <el-icon><Files /></el-icon>
        <span>Files</span>
      </template>
      <el-menu-item index="file-all">Tất cả File</el-menu-item>
      <el-menu-item index="file-user">File của bạn</el-menu-item>
    </el-sub-menu>

    <el-sub-menu index="chat">
      <template #title>
        <el-icon><ChatSquare /></el-icon>
        <span>Kênh thảo luận</span>
      </template>
      <el-menu-item
        v-for="ch in channels"
        :key="ch.id"
        :index="`chat-${ch.id}`"
      >
        {{ ch.name }}
      </el-menu-item>
      <el-menu-item index="chat-add">Thêm kênh mới</el-menu-item>
    </el-sub-menu>
  </el-menu>
</template>

<script setup>
import { onMounted, watch, computed } from "vue";
import { useChatStore } from "@/stores/chatStore";
import {
  Files, Guide, Menu, PieChart, ChatSquare, Collection, Calendar
} from "@element-plus/icons-vue";
import AccountService from "@/services/Account.service";

const props = defineProps({
  activeView: String,
  projectId: Number,
  isExpanded: Boolean
});

const emit = defineEmits(["update:view", "select-channel", "chat-add"]);

const chatStore = useChatStore();

const channels = computed(() => chatStore.channels);

function handleSelect(key) {
  if (key === "chat-add") {
    emit("chat-add");
    return;
  }

  if (key.startsWith("chat-")) {
    const id = Number(key.replace("chat-", ""));
    emit("update:view", "chat");
    emit("select-channel", id);
    return;
  }

  emit("update:view", key);
}

async function loadChannels() {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    const userId = user?.id || null;
    await chatStore.loadChannelByUser(userId);
  } catch (err) {
    console.error("Lỗi khi tải kênh chat:", err);
  }
}

onMounted(loadChannels);

watch(() => props.projectId, loadChannels);
</script>

<style scoped>
.el-menu-vertical-demo:not(.el-menu--collapse) {
  width: 200px;
  height: 100vh;
  border-right: 1px solid #e0e0e0;
}
</style>