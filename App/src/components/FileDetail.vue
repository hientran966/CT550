<template>
  <el-row :gutter="0">
    <el-col :span="16" style="height: 99vh">
      <el-card style="height: 100%">
        <!-- HEADER -->
        <div class="file-header">
          <h3 class="file-name">{{ file.file_name }}</h3>

          <div style="display: flex; align-items: center; gap: 8px">
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

            <el-button
              v-if="canUploadVersion"
              type="primary"
              size="small"
              @click="handleUploadVersion"
            >
              <el-icon><Upload /></el-icon>
              Upload phiên bản mới
            </el-button>
          </div>
        </div>

        <!-- VIEWER -->
        <div class="file-viewer">
          <!-- IMAGE -->
          <div
            v-if="isImage"
            ref="imageWrapper"
            class="image-wrapper"
          >
            <img
              ref="imageEl"
              :src="currentVersion?.file_url"
              alt="preview"
              class="preview-img"
              @load="onImageLoad"
              draggable="false"
            />
            <canvas
              ref="canvasEl"
              class="draw-canvas"
              @mousedown="onMouseDown"
              @mousemove="onMouseMove"
              @mouseup="onMouseUp"
            ></canvas>

            <el-button
              v-if="!visualMode"
              plain
              type="primary"
              size="large"
              class="visual-btn"
              @click="toggleVisualMode"
            >
              <el-icon><Crop /></el-icon>
            </el-button>

            <el-button
              v-else
              plain
              type="success"
              size="large"
              class="visual-btn"
              @click="cancelVisualMode"
            >
              <el-icon><Close /></el-icon>
            </el-button>
          </div>

          <!-- PDF -->
          <iframe
            v-else-if="isPDF"
            :src="currentVersion?.file_url"
            class="file-frame"
          ></iframe>

          <!-- PREVIEW -->
          <iframe
            v-else-if="isPreviewable"
            :src="currentVersion?.file_url"
            class="file-frame"
          ></iframe>

          <!-- UNSUPPORTED -->
          <div v-else class="unsupported">
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

    <!-- COMMENT -->
    <el-col :span="8" style="height: 99vh">
      <el-card style="height: 100%">
        <template #header>
          <div style="font-weight: 600">Bình luận</div>
        </template>

        <div class="comment-list">
          <div
            v-for="comment in comments"
            :key="comment.id"
            class="comment-item"
            @click="showVisual(comment)"
          >
            <div class="comment-user">{{ comment.user.name }}</div>
            <div class="comment-text">{{ comment.content }}</div>
            <div class="comment-time">{{ comment.created_at }}</div>
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
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from "vue";
import { getSocket } from "@/plugins/socket";
import { dayjs } from "element-plus";
import CommentService from "@/services/Comment.service";
import FileService from "@/services/File.service";
import { Close, Crop, Upload } from "@element-plus/icons-vue";
import { useRoleStore } from "@/stores/roleStore";
import { ElMessage } from "element-plus";

let socket;
const props = defineProps({ file: Object });

const selectedVersionId = ref(null);
const comments = ref([]);
const newComment = ref("");
const visualMode = ref(false);
const isDrawing = ref(false);
const startPos = ref(null);
const endPos = ref(null);
const imageEl = ref(null);
const canvasEl = ref(null);
const imageWrapper = ref(null);
const activeVisualCommentId = ref(null);

const canUploadVersion = ref(false);
const roleStore = useRoleStore();

const file = computed(() => props.file);
const currentVersion = computed(() =>
  file.value?.versions?.find((v) => v.id === selectedVersionId.value)
);
const fileType = computed(() => {
  const ext =
    currentVersion.value?.file_type ||
    file.value?.file_name?.split(".").pop()?.toLowerCase() ||
    "";
  return ext.toLowerCase();
});
const isImage = computed(() =>
  ["jpg", "jpeg", "png", "gif", "webp"].includes(fileType.value)
);
const isPDF = computed(() => fileType.value === "pdf");
const isPreviewable = computed(() =>
  ["txt", "html", "svg"].includes(fileType.value)
);

const loadComments = async () => {
  try {
    const res = await CommentService.getAllComments({
      file_version_id: selectedVersionId.value,
    });
    comments.value = (res || []).map((c) => ({
      ...c,
      created_at: dayjs(c.created_at).format("DD/MM/YYYY HH:mm"),
    }));
  } catch (err) {
    console.error("Lỗi khi load bình luận:", err);
  }
};

// --- ADD COMMENT ---
const addComment = async () => {
  try {
    const payload = {
      user_id: JSON.parse(localStorage.getItem("user") || "{}")?.id,
      file_id: props.file.id,
      file_version_id: selectedVersionId.value,
      content: newComment.value,
      project_id: props.file.project_id,
      owner_id: props.file.created_by,
    };

    if (startPos.value && endPos.value) {
      const x = Math.min(startPos.value.x, endPos.value.x);
      const y = Math.min(startPos.value.y, endPos.value.y);
      const width = Math.abs(endPos.value.x - startPos.value.x);
      const height = Math.abs(endPos.value.y - startPos.value.y);

      payload.visual = {
        shape_type: "rectangle",
        coordinates: { x, y, width, height },
        color: "#FF0000",
        opacity: 0.4,
      };
    }

    const res = await CommentService.createComment(payload);
    comments.value.unshift({
      ...res,
      created_at: dayjs(res.created_at).format("DD/MM/YYYY HH:mm"),
    });

    newComment.value = "";
    cancelVisualMode();
  } catch (err) {
    console.error("Lỗi khi gửi bình luận:", err);
  }
};

// --- VISUAL MODE ---
const toggleVisualMode = () => {
  visualMode.value = true;
  canvasEl.value.classList.add("drawing");
};
const cancelVisualMode = () => {
  visualMode.value = false;
  isDrawing.value = false;
  clearCanvas();
  startPos.value = null;
  endPos.value = null;
  canvasEl.value.classList.remove("drawing");
};

// --- CANVAS LOGIC ---
const onImageLoad = () => updateCanvasSize();
const updateCanvasSize = () => {
  nextTick(() => {
    const img = imageEl.value;
    const canvas = canvasEl.value;
    const wrapper = imageWrapper.value;
    if (!img || !canvas || !wrapper) return;

    const wrapperRect = wrapper.getBoundingClientRect();
    const naturalRatio = img.naturalWidth / img.naturalHeight;
    const wrapperRatio = wrapperRect.width / wrapperRect.height;

    let displayWidth, displayHeight, offsetX, offsetY;

    if (naturalRatio > wrapperRatio) {
      displayWidth = wrapperRect.width;
      displayHeight = wrapperRect.width / naturalRatio;
      offsetX = 0;
      offsetY = (wrapperRect.height - displayHeight) / 2;
    } else {
      displayHeight = wrapperRect.height;
      displayWidth = wrapperRect.height * naturalRatio;
      offsetY = 0;
      offsetX = (wrapperRect.width - displayWidth) / 2;
    }

    canvas.width = displayWidth;
    canvas.height = displayHeight;
    canvas.style.width = `${displayWidth}px`;
    canvas.style.height = `${displayHeight}px`;
    canvas.style.left = `${offsetX}px`;
    canvas.style.top = `${offsetY}px`;
  });
};

const onMouseDown = (e) => {
  if (!visualMode.value) return;
  const rect = canvasEl.value.getBoundingClientRect();
  startPos.value = { x: e.clientX - rect.left, y: e.clientY - rect.top };
  isDrawing.value = true;
};

const onMouseMove = (e) => {
  if (!visualMode.value || !isDrawing.value) return;
  const rect = canvasEl.value.getBoundingClientRect();
  endPos.value = { x: e.clientX - rect.left, y: e.clientY - rect.top };
  const ctx = canvasEl.value.getContext("2d");
  clearCanvas();
  drawRect(ctx, startPos.value, endPos.value);
};

const onMouseUp = () => {
  if (!visualMode.value || !isDrawing.value) return;
  isDrawing.value = false;
};

const drawRect = (ctx, start, end) => {
  if (!start || !end) return;
  const x = Math.min(start.x, end.x);
  const y = Math.min(start.y, end.y);
  const width = Math.abs(end.x - start.x);
  const height = Math.abs(end.y - start.y);
  ctx.beginPath();
  ctx.strokeStyle = "#FF0000";
  ctx.lineWidth = 2;
  ctx.globalAlpha = 1;
  ctx.strokeRect(x, y, width, height);
  ctx.globalAlpha = 0.3;
  ctx.fillStyle = "#FF0000";
  ctx.fillRect(x, y, width, height);
  ctx.globalAlpha = 1;
};
const clearCanvas = () => {
  const ctx = canvasEl.value.getContext("2d");
  ctx.clearRect(0, 0, canvasEl.value.width, canvasEl.value.height);
};

// --- SHOW VISUAL ---
const showVisual = (comment) => {
  const ctx = canvasEl.value.getContext("2d");

  if (activeVisualCommentId.value === comment.id) {
    clearCanvas();
    activeVisualCommentId.value = null;
    return;
  }

  clearCanvas();

  if (!comment.visual) {
    activeVisualCommentId.value = null;
    return;
  }

  const coords = comment.visual.coordinates || {};
  drawRect(ctx, coords, {
    x: coords.x + coords.width,
    y: coords.y + coords.height,
  });

  activeVisualCommentId.value = comment.id;
};

// --- UPLOAD VERSION ---
const handleUploadVersion = async () => {
  try {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "*/*";
    input.click();

    input.onchange = async () => {
      const fileData = input.files[0];
      if (!fileData) return;

      const formData = new FormData();
      formData.append("file", fileData);
      formData.append("file_id", file.value.id);
      formData.append("project_id", file.value.project_id);
      formData.append(
        "uploaded_by",
        JSON.parse(localStorage.getItem("user")).id
      );

      const res = await FileService.uploadVersion(formData);

      ElMessage.success("Tải lên phiên bản mới thành công!");
      file.value.versions.push(res.data);
      selectedVersionId.value = res.data.id;
    };
  } catch (err) {
    console.error("Lỗi khi upload phiên bản:", err);
    ElMessage.error("Tải lên thất bại, vui lòng thử lại!");
  }
};

// --- WATCH + SOCKET ---
watch(
  () => file.value,
  (newFile) => {
    if (newFile?.versions?.length)
      selectedVersionId.value = newFile.versions.at(-1).id;
    else selectedVersionId.value = null;
  },
  { immediate: true }
);
watch(selectedVersionId, (val) => val && loadComments());

onMounted(async () => {
  loadComments();
  canUploadVersion.value = await roleStore.canUpdateFileVersion(
    file.value.id,
    file.value.project_id
  );

  socket = getSocket();
  socket.on("comment", (event) => {
    if (event.action === "create") comments.value.unshift(event.data);
  });

  const observer = new ResizeObserver(() => updateCanvasSize());
  if (imageWrapper.value) observer.observe(imageWrapper.value);
});

onUnmounted(() => {
  socket?.off("comment");
});
</script>

<style scoped>
.file-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.file-name {
  max-width: 350px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-align: center;
}
.file-viewer {
  width: 100%;
  height: 600px;
  border: 1px solid #afafaf;
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
}
.file-frame {
  width: 100%;
  height: 100%;
  border: none;
  display: block;
  object-fit: contain;
}
.image-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  user-select: none;
  display: flex;
  justify-content: center;
  align-items: center;
}
.preview-img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  display: block;
}
.draw-canvas {
  position: absolute;
  z-index: 2;
  pointer-events: none;
  border: none;
}
.draw-canvas.drawing {
  pointer-events: auto;
}
.visual-btn {
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 10;
}
.comment-list {
  max-height: 500px;
  overflow-y: auto;
  margin-bottom: 12px;
}
.comment-item {
  cursor: pointer;
}
.comment-item:hover {
  background-color: #f5f5f5;
}
.comment-user {
  font-weight: 500;
}
.comment-text {
  font-size: 13px;
  color: #555;
}
.comment-time {
  font-size: 12px;
  color: #aaa;
}
</style>