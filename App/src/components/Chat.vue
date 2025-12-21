<template>
  <div class="chat-view">
    <!-- Danh sách tin nhắn -->
    <el-scrollbar class="chat-messages" ref="scrollbarRef">
      <div
        v-for="msg in messages"
        :key="msg.id"
        class="message-item"
        :ref="el => setMessageRef(el, msg.id)"
      >
        <div class="message-row">
          <div class="avatar-col">
            <el-avatar :size="40" :src="msg.sender_avatar">
              {{ msg.sender_name?.[0]?.toUpperCase() }}
            </el-avatar>
          </div>

          <div class="content-col">
            <div class="message-header">
              <span class="sender-name">{{ msg.sender_name }}</span>
              <span class="time">{{ formatTime(msg.created_at) }}</span>
            </div>

            <div class="message-body" v-html="parseMentions(msg.content)"></div>

            <div v-if="msg.have_file && msg.files?.length" class="attachments">
              <div class="file-grid">
                <FileCard
                  v-for="file in msg.files"
                  :key="file.id"
                  :file="file"
                  :size="'small'"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </el-scrollbar>

    <!-- Danh sách file đang chọn để gửi -->
    <div v-if="uploadedFiles.length" class="file-preview-list">
      <div
        v-for="(file, index) in uploadedFiles"
        :key="index"
        class="file-preview-item"
      >
        <span>{{ file.name }}</span>
        <el-icon @click="removeFile(index)" class="remove-icon">✕</el-icon>
      </div>
    </div>

    <!-- Ô nhập tin nhắn -->
    <div class="chat-input">
      <el-upload
        class="upload-btn"
        :auto-upload="false"
        multiple
        :on-change="handleFileSelect"
        :show-file-list="false"
      >
        <el-button :icon="Paperclip" circle />
      </el-upload>

      <MentionInput
        v-model="message"
        :users="members"
        @mention="handleMention"
        placeholder="Nhập tin nhắn, nhấn @ để nhắc đến ai đó..."
        class="message-input"
      />

      <el-button type="primary" @click="sendMessage" :loading="sending">
        Gửi
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick, computed, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { getSocket } from "@/plugins/socket";

import { ElMessage } from "element-plus";
import { Paperclip } from "@element-plus/icons-vue";

import MentionInput from "@/components/MentionInput.vue";
import FileCard from "@/components/FileCard.vue";

import ChatService from "@/services/Chat.service";
import { useChatStore } from "@/stores/chatStore";

const props = defineProps({
  channelId: { type: Number, required: true },
  currentUserId: { type: Number, required: true },
});

const chatStore = useChatStore();
const route = useRoute();
const router = useRouter();

const messages = computed(() => chatStore.getChatByChannel(props.channelId));
const message = ref("");
const members = ref([]);
const uploadedFiles = ref([]);
const sending = ref(false);
const scrollbarRef = ref();
const messageRefs = ref(new Map());
let socket;

function handleIncomingMessage(msg) {
  if (msg.channel_id === props.channelId) {
    if (msg.sender_id === props.currentUserId) return;
    chatStore.chatByChannel[props.channelId].push(msg);
    scrollToBottom();
  }
}

async function loadMembers() {
  try {
    members.value = await ChatService.getChannelMembers(props.channelId);
  } catch {
    ElMessage.error("Không thể tải danh sách thành viên");
  }
}

function handleFileSelect(uploadFile) {
  if (uploadFile?.raw) {
    uploadedFiles.value.push(uploadFile.raw);
  }
}

function removeFile(index) {
  uploadedFiles.value.splice(index, 1);
}

async function sendMessage() {
  if (!message.value.trim() && uploadedFiles.value.length === 0) return;
  sending.value = true;
  try {
    const saved = await ChatService.sendMessageWithFiles({
      channel_id: props.channelId,
      sender_id: props.currentUserId,
      content: message.value,
      files: uploadedFiles.value,
    });

    chatStore.chatByChannel[props.channelId].push(saved);

    message.value = "";
    uploadedFiles.value = [];
    scrollToBottom();
  } catch (err) {
    console.error(err);
    ElMessage.error("Không thể gửi tin nhắn");
  } finally {
    sending.value = false;
  }
}

function parseMentions(text) {
  if (!text) return "";

  return text.replace(
    /<@user:(\d+)>/g,
    (match, userId) => {
      const user = members.value.find(
        (u) => String(u.user_id) === String(userId)
      );
      const name = user?.name || "unknown";
      return `<span class="mention" data-user-id="${userId}">@${name}</span>`;
    }
  );
}

function setMessageRef(el, messageId) {
  if (el) {
    messageRefs.value.set(messageId, el);
  } else {
    messageRefs.value.delete(messageId);
  }
}

function scrollToMessage(messageId) {
  nextTick(() => {
    const scrollbar = scrollbarRef.value;
    const wrap = scrollbar?.wrapRef;
    const target = messageRefs.value.get(messageId);
    if (!scrollbar || !wrap || !target) return;

    const wrapRect = wrap.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();

    const offset =
      targetRect.top - wrapRect.top + wrap.scrollTop - 20;

    scrollbar.setScrollTop(offset);

    target.classList.add("highlight");
    setTimeout(() => target.classList.remove("highlight"), 600);
  });
}

function scrollToBottom() {
  nextTick(() => {
    const wrap = scrollbarRef.value?.wrapRef;
    if (wrap) wrap.scrollTop = wrap.scrollHeight;
  });
}

function formatTime(dateStr) {
  if (!dateStr || typeof dateStr !== "string") return "";

  try {
    if (dateStr.includes("/")) {
      const [datePart, timePart] = dateStr.split(" ");
      if (!datePart || !timePart) return dateStr;

      const [day, month, year] = datePart.split("/").map(Number);
      const [hour, minute] = timePart.split(":").map(Number);

      const date = new Date(year, month - 1, day, hour, minute);
      if (isNaN(date.getTime())) return dateStr;

      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    }

    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

onMounted(async () => {
  socket = getSocket();
  if (!socket) return;

  await chatStore.loadChats(props.channelId);
  await loadMembers();

  socket.emit("join_channel", props.channelId);
  if (!hasTargetMessage.value) {
    scrollToBottom();
  }

  socket.on("chat_message", handleIncomingMessage);
});

onBeforeUnmount(() => {
  if (socket) socket.off("chat_message", handleIncomingMessage);
});

watch(
  messages,
  (newMessages) => {
    const targetMessageId = Number(route.query.message);
    if (!targetMessageId) return;

    const exists = newMessages.some(m => m.id === targetMessageId);
    if (!exists) return;

    scrollToMessage(targetMessageId);

    router.replace({
      query: { },
    });
  },
  { flush: "post" }
);
</script>

<style scoped>
.chat-view {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 105px);
  border: 1px solid #eee;
  border-radius: 10px;
  background: #fff;
}

.message-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  overflow: hidden;
}

.avatar-col {
  flex: 0 0 40px; 
}

.content-col {
  flex: 1;
  min-width: 0;
}

@media (max-width: 520px) {
  .message-row {
    gap: 6px;
  }
  .avatar-col {
    flex: 0 0 32px;
  }
  .sender-name {
    font-size: 14px;
  }
}

:deep(.el-scrollbar__wrap),
:deep(.el-scrollbar__view) {
  overflow-x: hidden;
  max-width: 100%;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden !important;
}

.message-item {
  padding: 20px;
  border-bottom: 1px solid #f0f0f0;
  box-sizing: border-box;
  transition: background-color 0.6s ease;
}

.message-item.highlight {
  background: #d1edff;
  border-radius: 8px;
}

.avatar-col {
  display: flex;
  justify-content: center;
}

.message-header {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.sender-name {
  font-weight: 600;
  color: #333;
}

.time {
  font-size: 13px;
  color: #999;
}

.message-body {
  margin-top: 6px;
  line-height: 1.6;
  color: #444;
  white-space: pre-wrap;
  word-break: break-word;
  overflow-wrap: anywhere;
  max-width: 100%;
}

.attachments {
  margin-top: 10px;
}

.file-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 8px;
}

.chat-input {
  display: flex;
  align-items: center;
  border-top: 1px solid #ddd;
  padding: 10px 14px;
  background: #fafafa;
  gap: 10px;
}

.message-input {
  flex: 1;
}

.mention {
  color: #409eff;
  font-weight: 500;
}

.content-col {
  padding-left: 10px;
}

.file-preview-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 8px 14px;
  border-top: 1px solid #eee;
  background: #f9f9f9;
}

.file-preview-item {
  background: #eef3ff;
  padding: 6px 10px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
}

.remove-icon {
  cursor: pointer;
  color: #999;
}

.remove-icon:hover {
  color: #f56c6c;
}
</style>
