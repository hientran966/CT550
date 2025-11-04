<template>
  <div class="repo-explorer">
    <el-card style="border: 0; box-shadow: none;">
      <template #header>
        <div class="flex justify-between items-center">
          <span>{{ repo.full_name }}</span>
        </div>
      </template>

      <!-- Files -->
      <el-table :data="files" border @row-click="onFileClick">
        <el-table-column prop="name" label="Tên" />
        <el-table-column prop="type" label="Loại" width="120" />
      </el-table>

      <!-- Commits -->
      <h4 style="margin-top: 20px">Hoạt động gần đây</h4>
      <el-table :data="commits" border>
        <el-table-column label="Commit" prop="sha" width="220">
          <template #default="{ row }">
            <a :href="row.html_url" target="_blank">{{
              row.sha.slice(0, 7)
            }}</a>
          </template>
        </el-table-column>
        <el-table-column label="Message" prop="commit.message" />
        <el-table-column
          label="Người gửi"
          prop="commit.author.name"
          width="150"
        />
        <el-table-column
          label="Thời gian"
          prop="commit.author.date"
          width="150"
        >
          <template #default="{ row }">
            {{ timeAgo(row.commit.author.date) }}
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { ElMessage } from "element-plus";
import GitHubService from "@/services/GitHub.service.js";

const props = defineProps({
  repo: Object,
  installationId: Number,
});

const files = ref([]);
const commits = ref([]);

const onFileClick = (file) => {
  if (file.type === "file") {
    window.open(file.html_url, "_blank");
  }
};

const loadData = async () => {
  try {
    const [owner, repoName] = props.repo.full_name.split("/");

    files.value = await GitHubService.listRepoFiles(
      props.installationId,
      owner,
      repoName
    );

    commits.value = await GitHubService.listRecentCommits(
      props.installationId,
      owner,
      repoName
    );
    console.log(files.value, commits.value);
  } catch (err) {
    ElMessage.error("Không tải được dữ liệu repo: " + err.message);
  }
};

const timeAgo = (isoString) => {
  const date = new Date(isoString);
  const diff = (Date.now() - date.getTime()) / 1000;

  if (diff < 60) return "Vừa xong";
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)} ngày trước`;

  return date.toLocaleDateString("vi-VN");
};

onMounted(loadData);
</script>

<style scoped>
.repo-explorer {
  padding: 20px;
}
</style>
