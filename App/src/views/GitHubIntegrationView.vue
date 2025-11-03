<template>
  <div class="github-integration">
    <el-card class="box-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span>🔗 Kết nối GitHub Repository</span>
        </div>
      </template>

      <!-- Nếu chưa có installation -->
      <div v-if="!installation">
        <p>Chưa kết nối GitHub App với dự án này.</p>
        <el-button type="primary" @click="connectGitHub">
          Mở trang cài đặt GitHub App
        </el-button>

        <el-button type="success" plain @click="dialogVisible = true" style="margin-left: 8px">
          Nhập Installation ID thủ công
        </el-button>
      </div>

      <!-- Nếu đã có installation -->
      <div v-else>
        <p>
          <b>Installation:</b> {{ installation.account_login || "—" }}  
          <br />
          <b>Installation ID:</b> {{ installation.installation_id }}
        </p>

        <el-divider />

        <div class="repo-section">
          <el-button
            type="success"
            :loading="loadingRepos"
            @click="fetchRepos"
          >
            Tải danh sách Repositories
          </el-button>

          <el-table
            v-if="repos.length"
            :data="repos"
            style="margin-top: 20px"
            border
          >
            <el-table-column prop="full_name" label="Repository" />
            <el-table-column label="URL">
              <template #default="{ row }">
                <a :href="row.html_url" target="_blank">{{ row.html_url }}</a>
              </template>
            </el-table-column>
            <el-table-column label="Private">
              <template #default="{ row }">
                <el-tag :type="row.private ? 'danger' : 'success'">
                  {{ row.private ? 'Yes' : 'No' }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
    </el-card>

    <!-- Hộp thoại nhập thủ công -->
    <el-dialog title="Nhập Installation ID" v-model="dialogVisible" width="400px">
      <el-input
        v-model="manualInstallId"
        placeholder="Nhập Installation ID (ví dụ: 92826906)"
      />
      <template #footer>
        <el-button @click="dialogVisible = false">Hủy</el-button>
        <el-button type="primary" @click="saveManualInstall">Lưu</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRoute } from "vue-router";
import { ElMessage } from "element-plus";
import GitHubService from "@/services/GitHub.service.js";
import axios from "axios";

const route = useRoute();
const projectId = route.query.project || 1;

const installation = ref(null);
const repos = ref([]);
const loadingRepos = ref(false);
const dialogVisible = ref(false);
const manualInstallId = ref("");

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

/** ✅ Mở trang cài đặt GitHub App trong tab mới */
const connectGitHub = () => {
  const appInstallUrl = `https://github.com/apps/pmb2111798/installations/new?state=${projectId}`;
  window.open(appInstallUrl, "_blank");
};

/** ✅ Lưu installation ID thủ công */
const saveManualInstall = async () => {
  if (!manualInstallId.value) {
    return ElMessage.warning("Vui lòng nhập Installation ID!");
  }
  try {
    const res = await axios.post(`${API_BASE}/github/save-installation`, {
      installation_id: manualInstallId.value,
      project_id: projectId,
    });
    installation.value = res.data;
    ElMessage.success("Đã lưu Installation ID thành công!");
    dialogVisible.value = false;
  } catch (err) {
    ElMessage.error("Lỗi lưu installation: " + (err.response?.data?.message || err.message));
  }
};

/** ✅ Lấy installation hiện tại của project */
const fetchInstallation = async () => {
  try {
    const res = await GitHubService.getInstallationByProject(projectId);
    installation.value = res;
  } catch {
    installation.value = null;
  }
};

/** ✅ Lấy danh sách repo */
const fetchRepos = async () => {
  if (!installation.value) return;
  loadingRepos.value = true;
  try {
    repos.value = await GitHubService.getRepos(installation.value.installation_id);
  } catch (err) {
    ElMessage.error("Lỗi tải repositories: " + (err.response?.data?.message || err.message));
  } finally {
    loadingRepos.value = false;
  }
};

onMounted(fetchInstallation);
</script>

<style scoped>
.github-integration {
  padding: 20px;
  max-width: 800px;
  margin: auto;
}
.card-header {
  font-weight: bold;
  font-size: 1.1rem;
}
.repo-section {
  margin-top: 10px;
}
</style>