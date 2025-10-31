<template>
  <div class="me-background">
    <div class="dashboard-container">
      <el-row :gutter="16">
        <el-col :span="24">
          <!-- Header -->
          <div class="me-header-overlay">
            <div
              class="avatar-wrapper"
              @mouseenter="hovering = true"
              @mouseleave="hovering = false"
            >
              <el-upload
                class="avatar-uploader"
                :show-file-list="false"
                :before-upload="beforeAvatarUpload"
                :http-request="uploadAvatar"
              >
                <ElAvatar
                  :src="avatar || defaultAvatar"
                  :size="64"
                  class="me-avatar"
                />
                <div v-if="hovering" class="upload-overlay">
                  <el-icon><UploadFilled /></el-icon>
                  <span>Upload</span>
                </div>
              </el-upload>
            </div>

            <h2>Xin chào, {{ user.name }}!</h2>

            <el-button
              type="primary"
              size="small"
              style="margin-left: auto"
              @click="openEditModal"
            >
              Chỉnh sửa thông tin
            </el-button>
          </div>

          <el-row :gutter="16" style="margin-top: 20px">
            <!-- Cột dự án -->
            <el-col :xs="24" :md="24" :lg="16">
              <ElCard shadow="hover" style="height: 100%">
                <template #header>
                  <strong>Projects hiện tại</strong>
                </template>

                <ElTable
                  v-loading="projectStore.loading"
                  :data="paginatedProjects"
                  border
                  style="width: 100%"
                  @row-click="handleRowClick"
                  :height="'341px'"
                >
                  <ElTableColumn
                    prop="name"
                    label="Tên dự án"
                    min-width="200"
                  />
                  <ElTableColumn
                    prop="start_date"
                    label="Bắt đầu"
                    width="120"
                    :formatter="(r) => formatDate(r.start_date)"
                  />
                  <ElTableColumn
                    prop="end_date"
                    label="Kết thúc"
                    width="120"
                    :formatter="(r) => formatDate(r.end_date)"
                  />
                </ElTable>

                <div style="margin-top: 10px; text-align: right">
                  <el-pagination
                    background
                    layout="prev, pager, next"
                    :total="projectStore.projects.length"
                    :page-size="pageSize"
                    v-model:current-page="currentPage"
                  />
                </div>
              </ElCard>
            </el-col>

            <!-- Cột lời mời -->
            <el-col :xs="24" :md="24" :lg="8">
              <ElCard shadow="hover" style="height: 100%">
                <template #header>
                  <strong>Lời mời</strong>
                </template>

                <div class="scroll-area">
                  <ElEmpty
                    v-if="!inviteStore.inviteCount"
                    description="Không có lời mời nào"
                  />

                  <el-scrollbar v-else height="400px">
                    <div
                      v-for="item in inviteStore.invitesWithAvatar"
                      :key="item.id"
                      class="invite-item"
                    >
                      <div class="invite-header">
                        <ElAvatar :src="item.inviterAvatar" :size="32" />
                        <div class="invite-info">
                          <div>
                            <strong>{{ item.invited_by_name }}</strong>
                            mời bạn tham gia dự án
                            <strong>{{ item.project_name }}</strong>
                          </div>
                          <div class="invite-date">
                            {{ formatDate(item.created_at) }}
                          </div>
                        </div>
                      </div>

                      <div class="invite-actions">
                        <el-button
                          size="small"
                          type="primary"
                          @click="acceptInvite(item.id)"
                        >
                          Chấp nhận
                        </el-button>
                        <el-button
                          size="small"
                          type="danger"
                          plain
                          @click="rejectInvite(item.id)"
                        >
                          Từ chối
                        </el-button>
                      </div>
                      <el-divider />
                    </div>
                  </el-scrollbar>
                </div>
              </ElCard>
            </el-col>
          </el-row>
        </el-col>
      </el-row>
    </div>
  </div>
  <UserForm
    v-model="editModalVisible"
    :user="user"
    @saved="handleUserSaved"
  />
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import dayjs from "dayjs";
import { UploadFilled } from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";

import { useProjectStore } from "@/stores/projectStore";
import { useInviteStore } from "@/stores/inviteStore";

import AccountService from "@/services/Account.service";
import FileService from "@/services/File.service";
import defaultAvatar from "@/assets/default-avatar.png";
import UserForm from "@/components/UserForm.vue";

const router = useRouter();
const projectStore = useProjectStore();
const inviteStore = useInviteStore();

const user = ref({ id: "", name: "" });
const avatar = ref("");
const hovering = ref(false);
const currentPage = ref(1);
const pageSize = ref(7);
const editModalVisible = ref(false);

const paginatedProjects = computed(() => {
  const ongoing = projectStore.projectsByStatus
    ? projectStore.projectsByStatus("Đang tiến hành")
    : projectStore.projects.filter(p => p.status === "Đang tiến hành");

  const start = (currentPage.value - 1) * pageSize.value;
  const end = start + pageSize.value;
  return ongoing.slice(start, end);
});


function formatDate(dateString) {
  return dateString ? dayjs(dateString).format("DD/MM/YYYY") : "";
}

function statusType(status) {
  switch (status) {
    case "Chưa bắt đầu":
      return "info";
    case "Đang tiến hành":
      return "warning";
    case "Hoàn thành":
      return "success";
    default:
      return "default";
  }
}

function openEditModal() {
  editModalVisible.value = true;
}

function handleRowClick(row) {
  router.push({ name: "tasks", params: { id: row.id } });
}

async function acceptInvite(id) {
  await inviteStore.acceptInvite(id);
  await inviteStore.fetchInvites();
}

async function rejectInvite(id) {
  await inviteStore.declineInvite(id);
  await inviteStore.fetchInvites();
}

function handleUserSaved() {
  loadData();
  ElMessage.success("Thông tin người dùng đã được cập nhật!");
}

function beforeAvatarUpload(file) {
  const isImage = file.type.startsWith("image/");

  if (!isImage) {
    ElMessage.error("Chỉ được chọn file ảnh!");
    return false;
  }
  return true;
}

async function uploadAvatar({ file }) {
  try {
    if (!user.value.id) {
      ElMessage.error("Không tìm thấy thông tin người dùng!");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    const res = await FileService.uploadAvatar(user.value.id, formData);

    if (res?.result?.file_url) {
      const updated = await FileService.getAvatar(user.value.id);
      avatar.value = updated?.file_url || res.result.file_url;
      avatar.value = `${avatar.value}?v=${Date.now()}`;
      ElMessage.success("Cập nhật ảnh đại diện thành công!");
    } else {
      ElMessage.warning("Không nhận được đường dẫn ảnh từ server.");
    }
  } catch (err) {
    console.error("Upload avatar lỗi:", err);
    ElMessage.error("Tải ảnh lên thất bại!");
  }
}

async function loadData() {
  try {
    const data = await AccountService.getCurrentUser();
    Object.assign(user.value, data);

    if (user.value.id) {
      try {
        const avatarData = await FileService.getAvatar(user.value.id);
        avatar.value = avatarData?.file_url || "";
      } catch {
        avatar.value = "";
      }

      await Promise.all([projectStore.fetchProjects(), inviteStore.fetchInvites()]);
    }
  } catch (err) {
    console.error("Không lấy được thông tin người dùng:", err);
  }
}

onMounted(async () => {
  loadData();
});
</script>

<style scoped>
.dashboard-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.me-background {
  background-image: url("@/assets/background.jpg");
  background-size: cover;
  background-position: center;
  height: 100vh;
  min-width: calc(100vw - 75px);
}

.me-header-overlay {
  background-color: rgba(255, 255, 255, 0.75);
  padding: 20px 30px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.me-avatar {
  border: 2px solid white;
}

.scroll-area {
  height: 400px;
  overflow-y: auto;
  padding-right: 8px;
}

.invite-item {
  padding: 10px 0;
}

.invite-header {
  display: flex;
  align-items: center;
  gap: 10px;
}

.invite-info {
  flex: 1;
}

.invite-date {
  font-size: 12px;
  color: gray;
}

.invite-actions {
  display: flex;
  flex-direction: row;
  gap: 6px;
  margin-top: 6px;
}

@media (max-width: 768px) {
  .me-background {
    padding: 16px;
  }

  .me-header-overlay {
    flex-direction: column;
    align-items: flex-start;
  }
}

.avatar-wrapper {
  position: relative;
  display: inline-block;
  cursor: pointer;
}

.avatar-uploader {
  display: inline-block;
  position: relative;
}

.upload-overlay {
  position: absolute;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.55);
  color: white;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-size: 12px;
  transition: opacity 0.2s;
  pointer-events: none;
}

.upload-overlay el-icon {
  font-size: 18px;
  margin-bottom: 4px;
}

.me-avatar {
  border: 2px solid white;
  transition: transform 0.2s;
}

.avatar-wrapper:hover .me-avatar {
  transform: scale(1.05);
}
</style>
