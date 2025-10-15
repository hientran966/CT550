<template>
  <div class="me-background">
    <div class="dashboard-container">
      <el-row :gutter="16">
        <el-col :span="24">
          <div class="me-header-overlay">
            <ElAvatar :src="avatar" :size="64" class="me-avatar" />
            <h2>Xin chào, {{ user.name }}!</h2>
          </div>

          <el-row :gutter="16" style="margin-top: 20px">
            <!-- Cột dự án -->
            <el-col :xs="24" :md="24" :lg="16">
              <ElCard shadow="hover" style="height: 100%">
                <template #header>
                  <strong>Dự án</strong>
                </template>

                <ElTable
                  :data="project"
                  border
                  style="width: 100%"
                  @row-click="handleRowClick"
                >
                  <ElTableColumn
                    prop="name"
                    label="Tên dự án"
                    min-width="200"
                  />
                  <ElTableColumn
                    prop="description"
                    label="Mô tả"
                    min-width="250"
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
                  <ElTableColumn prop="status" label="Trạng thái" width="150">
                    <template #default="{ row }">
                      <el-tag
                        :type="statusType(row.status)"
                        disable-transitions
                      >
                        {{ row.status }}
                      </el-tag>
                    </template>
                  </ElTableColumn>
                </ElTable>
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
                    v-if="!invited.length"
                    description="Không có lời mời nào"
                  />

                  <el-scrollbar v-else height="400px">
                    <div
                      v-for="item in invited"
                      :key="item.id"
                      class="invite-item"
                    >
                      <ElAvatar :src="item.invite_avatar" :size="32" />
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
                      <div class="invite-actions">
                        <el-button
                          size="small"
                          type="primary"
                          @click="acceptInvite(item.id)"
                          >Chấp nhận</el-button
                        >
                        <el-button
                          size="small"
                          type="danger"
                          plain
                          @click="rejectInvite(item.id)"
                          >Từ chối</el-button
                        >
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
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import dayjs from "dayjs";

import AccountService from "@/services/Account.service";
import ProjectService from "@/services/Project.service";
import MemberService from "@/services/Member.service";
import FileService from "@/services/File.service";

const router = useRouter();

const project = ref([]);
const invited = ref([]);
const user = ref({ id: "", name: "" });
const avatar = ref("");

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

function handleRowClick(row) {
  router.push({
    name: "tasks",
    params: { id: row.id },
  });
}

async function loadProjects() {
  try {
    project.value = await ProjectService.getProjectsByAccountId(user.value.id);
  } catch (err) {
    console.error("Không thể lấy danh sách project:", err);
  }
}

async function loadInvites() {
  try {
    const invites = await MemberService.getInviteList(user.value.id);
    invited.value = await Promise.all(
      invites.map(async (item) => {
        let inviteAvatar = "";
        try {
          const res = await FileService.getAvatar(item.invited_by);
          inviteAvatar = res?.file_url || "";
        } catch {
          inviteAvatar = "";
        }
        return {
          ...item,
          invite_avatar: inviteAvatar,
        };
      })
    );
  } catch (err) {
    console.error("Không thể lấy danh sách lời mời:", err);
  }
}

async function acceptInvite(inviteId) {
  try {
    await MemberService.acceptInvite(inviteId, user.value.id);
    await Promise.all([loadInvites(), loadProjects()]);
  } catch (err) {
    console.error("Lỗi khi chấp nhận lời mời:", err);
  }
}

async function rejectInvite(inviteId) {
  try {
    await MemberService.declineInvite(inviteId, user.value.id);
    await loadInvites();
  } catch (err) {
    console.error("Lỗi khi từ chối lời mời:", err);
  }
}

onMounted(async () => {
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

      await Promise.all([loadProjects(), loadInvites()]);
    }
  } catch (err) {
    console.error("Không lấy được thông tin người dùng:", err);
  }
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
  display: flex;
  align-items: flex-start;
  flex-direction: column;
  gap: 5px;
  padding: 10px 0;
}

.invite-date {
  font-size: 12px;
  color: gray;
}

.invite-actions {
  display: flex;
  flex-direction: row;
  gap: 6px;
  align-items: flex-end;
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
</style>
