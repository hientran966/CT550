<template>
  <div class="repo-explorer">
    <el-card style="border: 0; box-shadow: none">
      <template #header>
        <div class="repo-header">
          <span>{{ repo.full_name }}</span>
          <div>
            <el-button type="primary" size="small" plain @click="openOnGitHub">
              Mở trên GitHub
            </el-button>
          </div>
        </div>
      </template>

      <!-- Files -->
      <el-table :data="files" border @row-click="onFileClick" max-height="250">
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

const openOnGitHub = () => {
  if (props.repo?.html_url) {
    window.open(props.repo.html_url, "_blank");
  } else {
    ElMessage.warning("Không tìm thấy URL GitHub của repo này!");
  }
};

onMounted(loadData);
</script>

<style scoped>
.repo-explorer {
  padding: 10px;
}

.repo-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  font-size: 16px;
}

.repo-header span {
  color: #303133;
  font-size: 18px;
  font-weight: 600;
}

.el-table {
  margin-top: 10px;
  border-radius: 8px;
  overflow: hidden;
}

.el-table th {
  background-color: #f5f7fa;
  color: #606266;
  font-weight: 600;
}

h4 {
  margin-top: 24px;
  margin-bottom: 8px;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.el-button {
  transition: all 0.2s;
}

.el-button:hover {
  background-color: #ecf5ff;
  border-color: #409eff;
  color: #409eff;
}
</style>
