<template>
  <el-row :gutter="0">
    <el-col :span="16">
      <el-card>
        <div
          style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px"
        >
          <h3 style="margin: 0">{{ file.file_name }}</h3>
          <el-select
            v-if="file?.versions?.length"
            v-model="selectedVersionId"
            placeholder="Chọn phiên bản"
            size="small"
            style="width: 160px"
          >
            <el-option
              v-for="v in file.versions"
              :key="v.id"
              :label="'Version ' + v.version_number"
              :value="v.id"
            />
          </el-select>
        </div>

        <div
          style="
            width: 100%;
            height: 500px;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 1px solid #eee;
            border-radius: 8px;
            overflow: hidden;
          "
        >
          <!-- Ảnh -->
          <img
            v-if="isImage"
            :src="currentVersion?.file_url"
            alt="file preview"
            style="width: 100%; height: 100%; object-fit: contain"
          />

          <!-- PDF -->
          <iframe
            v-else-if="isPDF"
            :src="currentVersion?.file_url"
            style="width: 100%; height: 100%; border: none"
          ></iframe>

          <!-- Các loại có thể hiển thị qua iframe -->
          <iframe
            v-else-if="isPreviewable"
            :src="currentVersion?.file_url"
            style="width: 100%; height: 100%; border: none"
          ></iframe>

          <!-- Không hỗ trợ -->
          <div v-else style="text-align: center">
            <el-empty description="Không thể xem trước tệp này">
              <el-button
                type="primary"
                :href="currentVersion?.file_url"
                download
              >
                Tải xuống 
              </el-button>
            </el-empty>
          </div>
        </div>
      </el-card>
    </el-col>

    <el-col :span="8">
      <el-card style="height: 100%">
        <template #header>
          <div style="font-weight: 600">Bình luận</div>
        </template>

        <div
          style="max-height: 400px; overflow-y: auto; margin-bottom: 12px"
        >
          <div
            v-for="comment in comments"
            :key="comment.id"
            style="margin-bottom: 12px"
          >
            <div style="font-weight: 500">{{ comment.user.name }}</div>
            <div style="font-size: 13px; color: #555">
              {{ comment.content }}
            </div>
            <div style="font-size: 12px; color: #aaa">
              {{ comment.created_at }}
            </div>
            <el-divider />
          </div>
        </div>

        <el-input
          v-model="newComment"
          placeholder="Nhập bình luận..."
          type="textarea"
          rows="2"
          style="margin-bottom: 8px"
        />
        <el-button
          type="primary"
          @click="addComment"
          :disabled="!newComment.trim()"
        >
          Gửi
        </el-button>
      </el-card>
    </el-col>
  </el-row>
</template>

<script setup>
import CommentService from "@/services/Comment.service";
import { dayjs } from "element-plus";
import { ref, computed, watch, onMounted } from "vue";

const props = defineProps({
  file: {
    type: Object,
    required: true,
  },
});

const file = computed(() => props.file);

const selectedVersionId = ref(null);

watch(
  () => file.value,
  (newFile) => {
    if (newFile?.versions?.length) {
      selectedVersionId.value = newFile.versions.at(-1).id;
    } else {
      selectedVersionId.value = null;
    }
  },
  { immediate: true }
);

const currentVersion = computed(() => {
  if (!file.value?.versions) return null;
  return file.value.versions.find((v) => v.id === selectedVersionId.value);
});

const fileType = computed(() => {
  const typeFromVersion = currentVersion.value?.file_type;
  if (typeFromVersion) return typeFromVersion.toLowerCase();

  const name = currentVersion.value?.file_url || file.value?.file_name || "";
  const ext = name.split(".").pop()?.toLowerCase() || "";
  return ext;
});

const isImage = computed(() =>
  ["jpg", "jpeg", "png", "gif", "webp"].includes(fileType.value)
);
const isPDF = computed(() => fileType.value === "pdf");
const isPreviewable = computed(() =>
  ["txt", "html", "svg"].includes(fileType.value)
);

const comments = ref();

const newComment = ref("");

const addComment = () => {
  comments.value.push({
    id: comments.value.length + 1,
    user: "Bạn",
    content: newComment.value,
    created_at: new Date().toLocaleString(),
  });
  newComment.value = "";
};
const loadComments = async () => {
  try {
    const res = await CommentService.getAllComments({
      file_version_id: selectedVersionId.value,
    });
    console.log(selectedVersionId.value);

    comments.value = (res || []).map((c) => ({
      ...c,
      created_at: dayjs(c.created_at).format("DD/MM/YYYY HH:mm"),
    }));
  } catch (err) {
    console.error("Lỗi khi load bình luận:", err);
  }
};

watch(selectedVersionId, (newVal) => {
  if (newVal) loadComments();
});

onMounted(loadComments);
</script>

<style scoped>
.el-card {
  height: 100%;
}
</style>