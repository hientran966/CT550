<template>
  <el-card
    :style="cardStyle"
    class="file-card"
    shadow="hover"
    @click="goToDetail"
  >
    <!-- Hiển thị ảnh nếu là hình -->
    <img
      v-if="isImage && latestVersion"
      :src="latestVersion.file_url"
      alt="file preview"
      :style="imageStyle"
    />

    <!-- Nếu không phải hình -->
    <div
      v-else
      :style="{
        width: '100%',
        height: imageHeight,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }"
    >
      <img
        :src="fileIcon"
        alt="file icon"
        :style="{
          width: iconSize,
          height: iconSize,
          objectFit: 'contain',
          opacity: 0.7
        }"
      />
    </div>

    <!-- Footer -->
    <template #footer>
      <div class="footer-wrapper">
        <el-tag
          v-if="latestVersion && latestVersion.version_number > 1"
          type="primary"
          size="small"
          effect="plain"
        >
          V{{ latestVersion.version_number }}
        </el-tag>

        <div class="file-name" :title="file.file_name">
          {{ file.file_name }}
        </div>
      </div>
    </template>
  </el-card>
</template>

<script setup>
import { computed } from "vue";
import { useRouter } from "vue-router";

import excelIcon from "@/assets/icons/excel-icon.png";
import wordIcon from "@/assets/icons/word-icon.png";
import pdfIcon from "@/assets/icons/pdf-icon.png";
import fileIconDefault from "@/assets/icons/file-icon.png";

const props = defineProps({
  file: { type: Object, required: true },
  size: { type: String, default: "large" },
});

const router = useRouter();

const latestVersion = computed(() => {
  return (
    props.file?.latest_version ||
    props.file?.versions?.[props.file.versions.length - 1] ||
    null
  );
});

const fileType = computed(() => {
  const ext =
    latestVersion.value?.file_type ||
    props.file?.file_name?.split(".").pop()?.toLowerCase() ||
    "";
  return ext;
});

const isImage = computed(() =>
  ["jpg", "jpeg", "png", "gif", "webp"].includes(fileType.value)
);

const fileIcon = computed(() => {
  switch (fileType.value) {
    case "doc":
    case "docx":
      return wordIcon;
    case "xls":
    case "xlsx":
      return excelIcon;
    case "pdf":
      return pdfIcon;
    default:
      return fileIconDefault;
  }
});

const imageHeight = computed(() => {
  switch (props.size) {
    case "small":
      return "160px";
    case "medium":
      return "200px";
    default:
      return "240px";
  }
});

const iconSize = computed(() => {
  switch (props.size) {
    case "small":
      return "64px";
    case "medium":
      return "80px";
    default:
      return "96px";
  }
});

const cardStyle = computed(() => {
  switch (props.size) {
    case "small":
      return "max-width: 200px; text-align: center; cursor: pointer;";
    case "medium":
      return "max-width: 320px; text-align: center; cursor: pointer;";
    default:
      return "max-width: 480px; text-align: center; cursor: pointer;";
  }
});

const imageStyle = computed(() => ({
  width: "100%",
  height: imageHeight.value,
  objectFit: "cover",
  borderRadius: "8px",
}));

const goToDetail = () => {
  if (!props.file?.id) return;
  router.push({ name: "file", params: { id: props.file.id } });
};
</script>

<style scoped>
:deep(.el-card__body) {
  padding: 0 !important;
}

.file-card {
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}
.file-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.footer-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  flex-wrap: nowrap;
  padding: 6px;
}

.file-name {
  font-weight: 500;
  max-width: 140px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: center;
}
</style>