<template>
  <div class="file-list-view">
    <div v-if="files.length" class="file-grid">
      <FileCard
        v-for="f in files"
        :key="f.id"
        :file="f"
        :size="'large'"
      />
    </div>

    <div v-else class="no-file">
      <el-empty description="Chưa có file nào được tải lên" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useFileStore } from "@/stores/fileStore";

import FileCard from "@/components/FileCard.vue";

const props = defineProps({
  projectId: { type: Number, default: null },
  taskId: { type: Number, default: null },
  userId: { type: Number, default: null },
});

const formRef = ref(false);
const fileStore = useFileStore();

const { getFilesByTask, getFilesByProject, getFilesByUser } = fileStore;

const files = computed(() => {
  if (props.taskId) {
    return fileStore.getFilesByTask(props.taskId) || [];
  } else if (props.projectId && !props.userId) {
    return fileStore.getFilesByProject(props.projectId) || [];
  } else if (props.projectId && props.userId) {
    return fileStore.getFilesByUser(props.projectId, props.userId) || [];
  }
  return [];
});

const loadFiles = async () => {
  try {
    console.log(fileStore.getFilesByUser(props.projectId, props.userId))
    if (props.taskId) {
      await fileStore.loadFiles(props.taskId);
    } else if (props.projectId && !props.userId) {
      await fileStore.loadFilesByProject(props.projectId);
    } else if (props.projectId && props.userId) {
      await fileStore.loadFilesByUser(props.projectId, props.userId);
    }
  } catch (err) {
    console.error("Lỗi khi tải file:", err);
  }
};

const onUpload = () => (formRef.value = true);

onMounted(() => {
  loadFiles();
});
</script>

<style scoped>
.file-list-view {
  padding: 16px 20px;
  background-color: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.05);
  height: calc(100vh - 132px);
  overflow-y: scroll;
}

.title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.file-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 12px;
  margin-top: 12px;
}

.no-file {
  margin-top: 24px;
  color: #888;
  text-align: center;
}
</style>
