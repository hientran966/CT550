<template>
  <el-menu
    :default-active="activeView"
    class="el-menu-vertical-demo"
    @select="handleSelect"
  >
    <el-menu-item index="kanban">
      <el-icon><Menu /></el-icon>
      <span>Danh sách Task</span>
    </el-menu-item>

    <el-menu-item index="timeline">
      <el-icon><Guide /></el-icon>
      <span>Timeline</span>
    </el-menu-item>

    <el-menu-item index="report">
      <el-icon><PieChart /></el-icon>
      <span>Báo cáo</span>
    </el-menu-item>

    <el-menu-item index="github">
      <el-icon><Collection /></el-icon>
      <span>Repos</span>
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
        <span>Chat</span>
      </template>
      <el-menu-item
        v-for="ch in channels"
        :key="ch.id"
        :index="`chat-${ch.id}`"
      >
        {{ ch.name }}
      </el-menu-item>
    </el-sub-menu>
  </el-menu>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { Files, Guide, Menu, PieChart, ChatSquare, Collection } from "@element-plus/icons-vue";
import ChatService from "@/services/Chat.service";

const props = defineProps({
  activeView: { type: String, required: true },
  projectId: { type: Number, required: true },
});
const emit = defineEmits(["update:view", "select-channel"]);

const channels = ref([]);

function handleSelect(key) {
  if (key.startsWith("chat-")) {
    const id = Number(key.replace("chat-", ""));
    emit("update:view", "chat");
    emit("select-channel", id);
  } else {
    emit("update:view", key);
  }
}

onMounted(async () => {
  try {
    channels.value = await ChatService.getChannelsByProject(props.projectId);
  } catch {
    console.error("Không thể tải danh sách kênh chat");
  }
});
</script>

<style scoped>
.el-menu-vertical-demo:not(.el-menu--collapse) {
  width: 200px;
  height: 100vh;
  border-right: 1px solid #e0e0e0;
}
</style>