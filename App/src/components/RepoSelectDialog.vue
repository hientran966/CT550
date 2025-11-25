<template>
  <el-dialog
    v-model="visibleProxy"
    title="Danh sách Repository"
    width="70%"
    @open="onOpen"
  >
    <el-button
      size="small"
      type="primary"
      plain
      @click="connectGitHub"
      style="margin-bottom: 8px"
    >
      Mở trang cài đặt GitHub App
    </el-button>
    <el-table
      v-if="repos.length"
      :data="repos"
      border
      height="400"
      @selection-change="onSelectionChange"
      ref="repoTableRef"
    >
      <el-table-column type="selection" width="55" />
      <el-table-column prop="full_name" label="Repository" />
      <el-table-column label="Private" width="120">
        <template #default="{ row }">
          <el-tag :type="row.private ? 'danger' : 'success'">
            {{ row.private ? "Private" : "Public" }}
          </el-tag>
        </template>
      </el-table-column>
    </el-table>

    <el-empty v-else image-size="100" description="Không có repository nào" />

    <template #footer>
      <el-button @click="visibleProxy = false">Đóng</el-button>
      <el-button type="primary" :disabled="!selected.length" @click="emitSave">
        Lưu
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, watch } from "vue";
import GitHubService from "@/services/GitHub.service.js";

const props = defineProps({
  modelValue: Boolean,
  projectId: Number,
  installationId: Number,
  currentProjectRepos: Array,
});

const emit = defineEmits(["update:modelValue", "save"]);

const repos = ref([]);
const selected = ref([]);
const repoTableRef = ref(null);

const visibleProxy = ref(false);

watch(
  () => props.modelValue,
  (v) => (visibleProxy.value = v)
);

watch(visibleProxy, (v) => emit("update:modelValue", v));

const onOpen = async () => {
  if (!props.installationId) return;

  repos.value = await GitHubService.listReposByInstallation(
    props.installationId
  );

  setTimeout(() => {
    repos.value.forEach((repo) => {
      if (
        props.currentProjectRepos.some((p) => p.full_name === repo.full_name)
      ) {
        repoTableRef.value.toggleRowSelection(repo, true);
      }
    });
  }, 100);
};

const onSelectionChange = (rows) => {
  selected.value = rows;
};

const connectGitHub = () => GitHubService.connectApp(props.projectId);

const emitSave = () => {
  emit("save", selected.value);
  visibleProxy.value = false;
};
</script>
