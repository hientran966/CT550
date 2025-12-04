<template>
  <div class="github-integration">
    <div v-if="!canManageIntegration" class="no-permission section-box">
      <h4>Repo đã gắn với project</h4>
      <el-table
        v-if="projectRepos.length"
        :data="projectRepos"
        border
        height="200"
        style="margin-top: 10px"
      >
        <el-table-column prop="full_name" label="Repository" />
        <el-table-column prop="html_url" label="URL">
          <template #default="{ row }">
            <a :href="row.html_url" target="_blank">{{ row.html_url }}</a>
          </template>
        </el-table-column>
      </el-table>

      <el-empty
        v-else
        description="Chưa có repository nào được gắn với project"
      />
    </div>

    <div v-else class="integration-container section-box">
      <div v-if="!installation" class="not-connected">
        <p>Chưa kết nối GitHub App với dự án này.</p>
        <el-button type="primary" @click="connectGitHub">
          Mở trang cài đặt GitHub App
        </el-button>
        <el-button
          type="success"
          plain
          @click="dialogVisible = true"
          style="margin-left: 8px"
        >
          Nhập Installation ID
        </el-button>
      </div>

      <div v-else class="connected-section">
        <div class="repo-section">
          <div class="table-block">
            <h4>Repository</h4>
            <div class="button-col">
              <el-button
                size="small"
                type="success"
                plain
                @click="repoDialogVisible = true"
                style="margin-bottom: 8px"
              >
                Mở danh sách repository
              </el-button>
              <el-button
                type="danger" 
                size="small"
                plain
                @click="unlinkInstall"
                style="margin-bottom: 8px"
              >
                Hủy kết nối
              </el-button>
            </div>
            <el-table
              v-if="projectRepos.length"
              :data="projectRepos"
              border
              height="180"
              @row-click="onRepoClick"
            >
              <el-table-column prop="full_name" label="Repository" />
              <el-table-column label="URL" width="280">
                <template #default="{ row }">
                  <a :href="row.html_url" target="_blank" @click.stop>
                    Truy cập GitHub
                  </a>
                </template>
              </el-table-column>
              <el-table-column label="Hoạt động" width="160">
                <template #default="{ row }">
                  {{ row.lastCommitDate ? timeAgo(row.lastCommitDate) : "–" }}
                </template>
              </el-table-column>
            </el-table>

            <el-empty
              v-else
              description="Chưa có repository nào được gắn với project"
              :image-size="100"
              class="empty-box"
            />
          </div>
        </div>
      </div>
    </div>

    <el-dialog
      title="Nhập Installation ID"
      v-model="dialogVisible"
      width="400px"
    >
      <el-input v-model="manualInstallId" placeholder="Nhập Installation ID" />
      <template #footer>
        <el-button @click="dialogVisible = false">Hủy</el-button>
        <el-button type="primary" @click="saveManualInstall">Lưu</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="explorerVisible" width="80%" top="5vh" destroy-on-close>
      <RepoExplorer
        v-if="activeRepo && installation && installation.installation_id"
        :repo="activeRepo"
        :installationId="installation.installation_id"
      />
    </el-dialog>
    <RepoSelectDialog
      v-model="repoDialogVisible"
      :installationId="installation?.installation_id"
      :currentProjectRepos="projectRepos"
      :project-id="projectId"
      @save="saveSelectedRepos"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { useRoute } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import { useRoleStore } from "@/stores/roleStore";
import { getSocket } from "@/plugins/socket";
import GitHubService from "@/services/GitHub.service.js";
import RepoExplorer from "@/components/RepoExplorer.vue";
import RepoSelectDialog from "@/components/RepoSelectDialog.vue";

const route = useRoute();
const projectId = route.params.id;

const roleStore = useRoleStore();
const role = ref("viewer");

const installation = ref(null);
const projectRepos = ref([]);
const dialogVisible = ref(false);
const manualInstallId = ref("");
const activeRepo = ref(null);
const explorerVisible = ref(false);
const repoDialogVisible = ref(false);

const onRepoClick = (row) => {
  activeRepo.value = row;
  explorerVisible.value = true;
};

const canManageIntegration = computed(() =>
  ["owner", "manager"].includes(role.value)
);

const timeAgo = (isoString) => {
  if (!isoString) return "–";
  const date = new Date(isoString);
  const diff = (Date.now() - date.getTime()) / 1000;

  if (diff < 60) return "Vừa xong";
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)} ngày trước`;

  return date.toLocaleDateString("vi-VN");
};

const connectGitHub = () => GitHubService.connectApp(projectId);

const saveManualInstall = async () => {
  if (!manualInstallId.value)
    return ElMessage.warning("Vui lòng nhập Installation ID!");
  try {
    await GitHubService.linkInstallation(projectId, manualInstallId.value);
    ElMessage.success("Đã liên kết installation thành công!");
    dialogVisible.value = false;
    await fetchInstallation();
  } catch (err) {
    ElMessage.error(
      "Lỗi khi lưu installation: " +
        (err.response?.data?.message || err.message)
    );
  }
};

const fetchInstallation = async () => {
  try {
    installation.value = await GitHubService.getInstallationByProject(
      projectId
    );
    if (installation.value) await fetchProjectRepos();
  } catch {
    installation.value = null;
  }
};

const fetchProjectRepos = async () => {
  try {
    projectRepos.value = await GitHubService.getProjectRepos(projectId);

    if (installation.value?.installation_id && projectRepos.value.length) {
      const promises = projectRepos.value.map(async (repo) => {
        try {
          const [owner, repoName] = repo.full_name.split("/");
          const commits = await GitHubService.listRecentCommits(
            installation.value.installation_id,
            owner,
            repoName
          );

          if (commits.length > 0) {
            repo.lastCommitDate = commits[0].commit.author.date;
            repo.lastCommitMessage = commits[0].commit.message;
          } else {
            repo.lastCommitDate = null;
            repo.lastCommitMessage = "Chưa có commit";
          }
        } catch {
          repo.lastCommitDate = null;
          repo.lastCommitMessage = "Không tải được commit";
        }
      });

      await Promise.all(promises);
    }
  } catch {
    ElMessage.error("Không tải được danh sách repo của project.");
  }
};

const unlinkInstall = async () => {
  try {
    await ElMessageBox.confirm(
      "Bạn có chắc chắn muốn hủy kết nối GitHub App khỏi dự án này không?<br/>" +
        "<b>Tất cả các repository đã liên kết sẽ bị ngắt kết nối.</b>",
      "Xác nhận hủy kết nối",
      {
        confirmButtonText: "Xác nhận",
        cancelButtonText: "Hủy",
        type: "warning",
        dangerouslyUseHTMLString: true,
      }
    );

    await GitHubService.unlinkInstallation(projectId);
    installation.value = null;
    projectRepos.value = [];
    ElMessage.success("Đã hủy kết nối GitHub App!");
  } catch (err) {
    if (err !== "cancel") {
      ElMessage.error(
        "Lỗi khi hủy kết nối: " + (err.response?.data?.message || err.message)
      );
    } else {
      ElMessage.info("Đã hủy thao tác.");
    }
  }
};

const saveSelectedRepos = async (repos) => {
  try {
    await GitHubService.saveProjectRepos(projectId, repos);
    ElMessage.success("Đã lưu danh sách repo!");
    await fetchProjectRepos();
  } catch (err) {
    ElMessage.error(
      "Lỗi lưu repo: " + (err.response?.data?.message || err.message)
    );
  }
};

onMounted(async () => {
  const projectRole = await roleStore.fetchProjectRole(projectId);
  role.value = projectRole.role;
  await fetchInstallation();

  const socket = getSocket();
  if (!socket) return;

  socket.on("git_push", () => {
    fetchProjectRepos();
  });


  socket.on("git_commit", () => {
    fetchProjectRepos();
  });
});
</script>

<style scoped>
.github-integration {
  display: flex;
  flex-direction: column;
  max-width: 900px;
  margin: 0 auto;
  gap: 20px;
  height: calc(100vh - 100px);
  padding: 0 auto;
}

.header {
  text-align: center;
  margin-bottom: 10px;
}

.section-box {
  height: 100%;
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  padding: 0 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.repo-section {
  display: flex;
  flex-direction: column;
  gap: 30px;
  margin-top: 10px;
}

.table-block {
  display: flex;
  flex-direction: column;
}

.table-block .el-table,
.table-block .el-empty {
  height: 180px;
}

.empty-box {
  height: 180px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.no-permission {
  text-align: center;
}

.install-info {
  background: #f6f8fa;
  border: 1px solid #ebeef5;
  padding: 10px;
  border-radius: 6px;
  margin-bottom: 15px;
}
.not-connected {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 240px;
  color: #606266;
  text-align: center;
  padding: 20px;
  transition: all 0.3s ease;
}

.not-connected p {
  font-size: 15px;
  margin-bottom: 16px;
  color: #303133;
}

.not-connected .el-button {
  font-weight: 500;
  margin: 5px;
}
.button-col {
  flex-direction: row;
}
</style>
