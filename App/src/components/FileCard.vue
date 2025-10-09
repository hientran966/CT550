<template>
  <el-card :style="cardStyle">
    <img
      v-if="isImage && latestVersion"
      :src="latestVersion.file_url"
      alt="file preview"
      :style="imageStyle"
    />

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

    <template #footer>
      <div style="display: flex; align-items: center; justify-content: center; gap: 6px">
        <el-tag
          v-if="versionCount > 1"
          type="primary"
          size="small"
          effect="plain"
        >
          V{{ versionCount }}
        </el-tag>
        <span style="font-weight: 500">{{ file.file_name }}</span>
      </div>
    </template>
  </el-card>
</template>

<script setup>
import { computed } from "vue";

import excelIcon from "@/assets/icons/excel-icon.png";
import wordIcon from "@/assets/icons/word-icon.png";
import pdfIcon from "@/assets/icons/pdf-icon.png";
import fileIconDefault from "@/assets/icons/file-icon.png";

const props = defineProps({
  file: {
    type: Object,
    required: true,
  },
  size: {
    type: String,
    default: "large",
  },
});

const latestVersion = computed(() => {
  const versions = props.file?.versions;
  if (!versions || !versions.length) return null;
  return versions.reduce((a, b) =>
    a.version_number > b.version_number ? a : b
  );
});

const versionCount = computed(() => props.file?.versions?.length || 0);

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
      return "max-width: 200px; text-align: center";
    case "medium":
      return "max-width: 320px; text-align: center";
    default:
      return "max-width: 480px; text-align: center";
  }
});

const imageStyle = computed(() => ({
  width: "100%",
  height: imageHeight.value,
  objectFit: "cover",
  borderRadius: "8px",
}));
</script>

<style scoped>
:deep(.el-card__body) {
  padding: 0 !important;
}

</style>