<template>
  <div class="chat-view">
    <el-scrollbar class="chat-messages" ref="scrollbarRef">
      <div v-for="msg in messages" :key="msg.id" class="message-item">
        <div class="avatar">
          <el-avatar :size="36">{{ msg.sender_name?.[0]?.toUpperCase() }}</el-avatar>
        </div>
        <div class="message-content">
          <div class="message-header">
            <span class="sender-name">{{ msg.sender_name }}</span>
            <span class="time">{{ msg.created_at }}</span>
          </div>
          <div class="text" v-html="parseMentions(msg.content)"></div>
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
        </div>
      </div>
    </el-scrollbar>

    <div class="chat-input">
      <el-upload
        class="upload-btn"
        action="/api/upload"
        :on-success="handleUploadSuccess"
        :show-file-list="false"
      >
        <el-button icon="Paperclip" circle />
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
import { ref, onMounted, nextTick, computed, onBeforeUnmount } from "vue";
import { ElMessage } from "element-plus";
import { getSocket } from "@/plugins/socket";
import { useChatStore } from "@/stores/chatStore";
import MentionInput from "@/components/MentionInput.vue";
import ChatService from "@/services/Chat.service";

const props = defineProps({
  channelId: { type: Number, required: true },
  currentUserId: { type: Number, required: true },
});

const chatStore = useChatStore();
const messages = computed(() => chatStore.getChatByChannel(props.channelId));
const members = ref([]);
const message = ref("");
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
  return text.replace(/@\[([^\]]+)\]\((\d+)\)/g, `<span class="mention">@$1</span>`);
}

function scrollToBottom() {
  nextTick(() => {
    const wrap = scrollbarRef.value?.wrapRef;
    if (wrap) wrap.scrollTop = wrap.scrollHeight;
  });
}
</script>

<style scoped>
.chat-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  border-radius: 10px;
  border: 1px solid #eee;
}
.chat-messages {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
}
.message-item {
  display: flex;
  margin-bottom: 12px;
}
.avatar {
  margin-right: 8px;
}
.message-content {
  background: #f5f5f5;
  border-radius: 8px;
  padding: 8px 12px;
  max-width: 70%;
}
.sender-name {
  font-weight: 600;
  margin-right: 6px;
}
.time {
  color: #999;
  font-size: 12px;
}
.text {
  margin-top: 4px;
  white-space: pre-wrap;
}
.attachments {
  margin-top: 6px;
}
.chat-input {
  display: flex;
  align-items: center;
  border-top: 1px solid #ddd;
  padding: 8px 12px;
  background: #fafafa;
  gap: 8px;
}
.message-input {
  flex: 1;
}
.mention {
  color: #409eff;
  font-weight: 500;
}
</style>