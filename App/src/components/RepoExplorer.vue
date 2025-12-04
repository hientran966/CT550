<template>
  <div class="repo-explorer">
    <!-- Header -->
    <div class="repo-header">
      <div class="left">
        <i class="ri-bookmark-line"></i>
        <span>{{ repo.full_name }}</span>
      </div>
      <div class="right">
        <el-select v-model="currentBranch" @change="loadFiles" size="small" style="width: 200px">
          <el-option
            v-for="b in branches"
            :key="b.name"
            :label="b.name"
            :value="b.name"
          />
        </el-select>
        <el-button size="small" plain @click="openOnGitHub">
          <i class="ri-github-fill"></i> Mở trên GitHub
        </el-button>
      </div>
    </div>

    <!-- Tabs -->
    <el-tabs v-model="activeTab" @tab-click="onTabChange" class="repo-tabs">
      <!-- Files Tab -->
      <el-tab-pane label="Files" name="files">
        <el-table
          v-loading="loading.files"
          :data="files"
          border
          @row-click="onFileClick"
          style="width: 100%"
          max-height="350"
        >
          <el-table-column label="Tên" min-width="200">
            <template #default="{ row }">
              <i
                :class="row.type === 'dir' ? 'ri-folder-2-line' : 'ri-file-code-line'"
                style="margin-right: 6px"
              ></i>
              {{ row.name }}
            </template>
          </el-table-column>
          <el-table-column prop="type" label="Loại" width="120" />
        </el-table>
      </el-tab-pane>

      <!-- Commits Tab -->
      <el-tab-pane label="Commits" name="commits">
        <el-table v-loading="loading.commits" :data="commits" border>
          <el-table-column label="Commit" width="200">
            <template #default="{ row }">
              <a :href="row.html_url" target="_blank" class="commit-link">
                {{ row.sha.slice(0, 7) }}
              </a>
            </template>
          </el-table-column>
          <el-table-column label="Message" prop="commit.message" />
          <el-table-column label="Tác giả" width="180">
            <template #default="{ row }">
              <div class="author-cell">
                <img
                  v-if="row.author?.avatar_url"
                  :src="row.author.avatar_url"
                  class="avatar"
                />
                {{ row.commit.author.name }}
              </div>
            </template>
          </el-table-column>
          <el-table-column label="Thời gian" width="160">
            <template #default="{ row }">
              {{ timeAgo(row.commit.author.date) }}
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <!-- Pull Requests Tab -->
      <el-tab-pane label="Pull Requests" name="pulls">
        <el-table v-loading="loading.pulls" :data="pulls" border>
          <el-table-column label="Tiêu đề" min-width="260">
            <template #default="{ row }">
              <a :href="row.html_url" target="_blank" class="commit-link">
                #{{ row.number }} - {{ row.title }}
              </a>
            </template>
          </el-table-column>

          <el-table-column label="Người tạo" width="150">
            <template #default="{ row }">
              <div class="author-cell">
                <img
                  v-if="row.avatar_url"
                  :src="row.avatar_url"
                  class="avatar"
                />
                {{ row.user }}
              </div>
            </template>
          </el-table-column>

          <el-table-column label="Trạng thái" width="120">
            <template #default="{ row }">
              <el-tag
                :type="
                  row.state === 'open'
                    ? 'success'
                    : row.state === 'closed' && row.merged_at
                    ? 'info'
                    : 'danger'
                "
                size="small"
              >
                {{ row.merged_at ? "Merged" : row.state }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column label="Cập nhật" width="160">
            <template #default="{ row }">
              {{ timeAgo(row.updated_at) }}
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { ElMessage } from "element-plus";
import { getSocket } from "@/plugins/socket";
import GithubService from "@/services/GitHub.service";

const props = defineProps({
  repo: Object,
  installationId: Number,
});

const branches = ref([]);
const currentBranch = ref("");
const files = ref([]);
const commits = ref([]);
const pulls = ref([]);
const activeTab = ref("files");

const loading = ref({
  files: false,
  commits: false,
  pulls: false,
});

const loadBranches = async () => {
  try {
    const [owner, repoName] = props.repo.full_name.split("/");
    branches.value = await GithubService.listBranches(
      props.installationId,
      owner,
      repoName
    );
    if (branches.value.length) {
      currentBranch.value = branches.value[0].name;
      await loadFiles();
    }
  } catch (err) {
    ElMessage.error("Không tải được danh sách branch");
  }
};

const loadFiles = async () => {
  try {
    loading.value.files = true;
    const [owner, repoName] = props.repo.full_name.split("/");
    files.value = await GithubService.listRepoFiles(
      props.installationId,
      owner,
      repoName
    );
  } catch (err) {
    ElMessage.error("Không tải được danh sách file");
  } finally {
    loading.value.files = false;
  }
};

const loadCommits = async () => {
  try {
    loading.value.commits = true;
    const [owner, repoName] = props.repo.full_name.split("/");
    commits.value = await GithubService.listRecentCommits(
      props.installationId,
      owner,
      repoName
    );
  } catch (err) {
    ElMessage.error("Không tải được commits");
  } finally {
    loading.value.commits = false;
  }
};

const loadPulls = async () => {
  try {
    loading.value.pulls = true;
    const [owner, repoName] = props.repo.full_name.split("/");
    pulls.value = await GithubService.listPullRequests(
      props.installationId,
      owner,
      repoName,
      "all"
    );
  } catch (err) {
    ElMessage.error("Không tải được Pull Requests");
  } finally {
    loading.value.pulls = false;
  }
};

const onTabChange = async (tab) => {
  if (tab.props.name === "commits" && !commits.value.length) await loadCommits();
  if (tab.props.name === "pulls" && !pulls.value.length) await loadPulls();
};

const onFileClick = (file) => {
  if (file.type === "file") window.open(file.html_url, "_blank");
};

const openOnGitHub = () => {
  if (props.repo?.html_url) window.open(props.repo.html_url, "_blank");
  else ElMessage.warning("Không tìm thấy URL GitHub của repo này!");
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

onMounted(() => {
  loadBranches();

  const socket = getSocket();
  if (!socket) return;

  socket.on("git_push", (data) => {
    console.log("📌 Git PUSH received:", data);
    if (activeTab.value === "commits") {
      loadCommits();
    }
  });

  socket.on("git_commit", (commit) => {
    console.log("📌 Git COMMIT received:", commit);
    if (activeTab.value === "commits") {
      loadCommits();
    }
  });

  socket.on("git_event", (event) => {
    console.log("📌 Git EVENT received:", event);

    if (event.type === "pull_request" && activeTab.value === "pulls") {
      loadPulls();
    }

    if (event.type === "issue") {
      console.log("Issue event detected");
    }
  });
});
</script>

<style scoped>
.repo-explorer {
  padding: 10px;
}
.repo-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #ebeef5;
  padding-bottom: 8px;
  margin-bottom: 12px;
}
.repo-header .left {
  font-size: 18px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 6px;
}
.repo-header .right {
  display: flex;
  gap: 10px;
  align-items: center;
}
.repo-tabs {
  margin-top: 10px;
}
.commit-link {
  color: #409eff;
  text-decoration: none;
}
.commit-link:hover {
  text-decoration: underline;
}
.avatar {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  margin-right: 6px;
}
.author-cell {
  display: flex;
  align-items: center;
}
</style>