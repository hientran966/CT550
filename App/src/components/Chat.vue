<template>
  <div class="chat-view">
    <!-- Danh sách tin nhắn -->
    <el-scrollbar class="chat-messages" ref="scrollbarRef">
      <div v-for="msg in messages" :key="msg.id" class="message-item">
        <el-row :gutter="8">
          <el-col :span="1" class="avatar-col">
            <el-avatar :size="40" :src="msg.sender_avatar">
              {{ msg.sender_name?.[0]?.toUpperCase() }}
            </el-avatar>
          </el-col>

          <el-col :span="23" class="content-col" style="padding-left: 10px;">
            <div class="message-header">
              <span class="sender-name">{{ msg.sender_name }}</span>
              <span class="time">{{ formatTime(msg.created_at) }}</span>
            </div>
            <div class="message-body" v-html="parseMentions(msg.content)"></div>

            <div v-if="msg.files?.length" class="attachments">
              <el-link
                v-for="file in msg.files"
                :key="file.id"
                :href="file.url"
                target="_blank"
                :underline="false"
              >
                📎 {{ file.file_name }}
              </el-link>
            </div>
          </el-col>
        </el-row>
      </div>
    </el-scrollbar>

    <!-- Ô nhập -->
    <div class="chat-input">
      <el-upload
        class="upload-btn"
        action="/api/upload"
        :on-success="handleUploadSuccess"
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
import { ref, onMounted, onBeforeUnmount, nextTick, computed } from "vue";
import { ElMessage } from "element-plus";
import { useChatStore } from "@/stores/chatStore";
import { getSocket } from "@/plugins/socket";
import MentionInput from "@/components/MentionInput.vue";
import ChatService from "@/services/Chat.service";
import { Paperclip } from "@element-plus/icons-vue";

const props = defineProps({
  channelId: { type: Number, required: true },
  currentUserId: { type: Number, required: true },
});

const chatStore = useChatStore();
const messages = computed(() => chatStore.getChatByChannel(props.channelId));
const message = ref("");
const members = ref([]);
const uploadedFiles = ref([]);
const sending = ref(false);
const scrollbarRef = ref();
let socket;

onMounted(async () => {
  socket = getSocket();
  if (!socket) return;
  await chatStore.loadChats(props.channelId);
  await loadMembers();
  socket.emit("join_channel", props.channelId);
  scrollToBottom();
  socket.on("chat_message", handleIncomingMessage);
});

onBeforeUnmount(() => {
  if (socket) socket.off("chat_message", handleIncomingMessage);
});

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

function handleUploadSuccess(res) {
  if (res && res.file) uploadedFiles.value.push(res.file);
}

async function sendMessage() {
  if (!message.value.trim() && uploadedFiles.value.length === 0) return;
  sending.value = true;
  try {
    const payload = {
      channel_id: props.channelId,
      sender_id: props.currentUserId,
      content: message.value,
      files: uploadedFiles.value.map((f) => f.id),
    };

    const saved = await chatStore.addChat(props.channelId, payload);
    chatStore.chatByChannel[props.channelId].push(saved);
    socket.emit("chat_message", saved);

    message.value = "";
    uploadedFiles.value = [];
    scrollToBottom();
  } catch {
    ElMessage.error("Không thể gửi tin nhắn");
  } finally {
    sending.value = false;
  }
}

function handleMention(user) {
  console.log("Mentioned user:", user);
}

function parseMentions(text) {
  if (!text) return "";
  return text.replace(
    /@\[([^\]]+)\]\((\d+)\)/g,
    `<span class="mention">@$1</span>`
  );
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

      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }

    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}
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

.chat-messages {
  flex: 1;
  padding: 16px 20px;
  overflow-y: auto;
}

.message-item {
  padding: 16px 0;
  border-bottom: 1px solid #f0f0f0;
  width: 90%;
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
  margin-top: 6px;
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
</style>