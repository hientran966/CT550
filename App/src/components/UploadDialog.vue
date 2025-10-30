<template>
  <el-dialog
    v-model="visible"
    :title="dialogTitle"
    width="500px"
    :before-close="handleClose"
    :close-on-click-modal="false"
    :destroy-on-close="true"
  >
    <el-upload
      ref="uploader"
      drag
      multiple
      :auto-upload="false"
      :file-list="fileList"
      :on-change="handleFileChange"
      class="upload"
      accept="*"
    >
      <el-icon class="el-icon--upload"><upload-filled /></el-icon>
      <div class="el-upload__text">
        Thả file vào đây hoặc <em>click để chọn</em>
      </div>
    </el-upload>

    <template #footer>
      <el-button @click="handleClose">Hủy</el-button>
      <el-button type="primary" @click="submitFiles" :loading="loading">
        {{ fileId ? "Upload version" : "Upload" }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed } from "vue";
import { UploadFilled } from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";
import FileService from "@/services/File.service";

const props = defineProps({
  modelValue: Boolean,
  projectId: Number,
  taskId: Number,
  fileId: Number,
});

const emit = defineEmits(["update:modelValue", "file-added"]);

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
});

const fileList = ref([]);
const loading = ref(false);

const dialogTitle = computed(() =>
  props.fileId ? "Upload version mới" : "Upload File"
);

function handleClose() {
  visible.value = false;
  fileList.value = [];
}

function handleFileChange(file, files) {
  fileList.value = files;
}

async function submitFiles() {
  if (fileList.value.length === 0) {
    return ElMessage.warning("Vui lòng chọn ít nhất một file.");
  }

  try {
    loading.value = true;

    const user = JSON.parse(localStorage.getItem("user"));
    const createdBy = user?.id ?? null;

    for (const file of fileList.value) {
      const formData = new FormData();
      formData.append("file", file.raw);
      formData.append("file_name", file.name);
      if (props.projectId) formData.append("project_id", props.projectId.toString());
      if (props.taskId) formData.append("task_id", props.taskId.toString());
      if (createdBy) formData.append("created_by", createdBy.toString());

      if (props.fileId) {
        await FileService.uploadVersion(props.fileId, formData);
      } else {
        await FileService.uploadFile(formData);
      }
    }

    ElMessage.success(props.fileId ? "Upload version thành công!" : "Upload thành công!");
    emit("file-added");
    handleClose();
  } catch (err) {
    console.error(err);
    ElMessage.error("Đã xảy ra lỗi khi upload file");
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.upload {
  width: 100%;
  margin-top: 20px;
}
</style>