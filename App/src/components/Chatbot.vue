<template>
  <div>
    <!-- Floating Chat Panel -->
    <div class="chatbot-panel" v-show="visible">
      <div class="chatbot-header">
        <span>Trợ lý</span>
        <el-button :icon="Close" @click="visible = false" link style="color: white"></el-button>
      </div>

      <el-scrollbar class="chatbot-scroll" ref="scrollbarRef">
        <div v-if="loading" class="text-center my-2">
          <el-icon class="is-loading"><Loading /></el-icon> Đang tải...
        </div>

        <div v-else-if="!history.length" class="text-center py-4 text-gray-500">
          Chưa có lịch sử
        </div>

        <div v-else class="chatbot-history">
          <div v-for="item in history" :key="item.id" class="chat-item">
            <div class="q">{{ item.question }}</div>
            <div class="a" v-html="formatAnswer(item.answer)"></div>
            <div class="meta">
              <small>{{ formatDate(item.created_at) }}</small>
            </div>
          </div>
        </div>
      </el-scrollbar>

      <!-- Input Box -->
      <div class="chatbot-input">
        <el-input
          v-model="message"
          placeholder="Nhập câu hỏi..."
          size="small"
          @keyup.enter="sendMessage"
          clearable
        >
          <template #append>
            <el-button size="small" type="primary" @click="sendMessage">Gửi</el-button>
          </template>
        </el-input>
      </div>
    </div>

    <!-- Floating Button -->
    <el-button
      class="chatbot-float-btn"
      type="primary"
      circle
      size="large"
      @click="visible = !visible"
    >
      <el-icon><ChatDotRound /></el-icon>
    </el-button>
  </div>
</template>

<script setup>
import { ref, watch, nextTick, onMounted } from "vue";
import { ElMessage } from "element-plus";
import { ChatDotRound, Close, Loading } from "@element-plus/icons-vue";
import ChatbotService from "@/services/Chatbot.service";
import MarkdownIt from "markdown-it";
import { color } from "echarts";

const md = new MarkdownIt({
  linkify: true,
  breaks: true,
  html: true,
});

const props = defineProps({
  projectId: { type: [String, Number], required: true },
  userId: { type: [String, Number], required: true }
});

const visible = ref(false);
const loading = ref(false);
const history = ref([]);
const scrollbarRef = ref(null);
const message = ref("");

watch(() => props.projectId, () => {
  if (visible.value) fetchHistory();
});

async function fetchHistory() {
  loading.value = true;
  try {
    history.value = await ChatbotService.getHistoryByProject(props.projectId, props.userId);
    await nextTick();
    scrollToBottom();
  } catch (err) {
    console.error(err);
    ElMessage.error("Không thể tải lịch sử chatbot");
  } finally {
    loading.value = false;
  }
}

function scrollToBottom() {
  if (scrollbarRef.value && scrollbarRef.value.wrap) {
    scrollbarRef.value.wrap.scrollTop = scrollbarRef.value.wrap.scrollHeight;
  }
}

function formatAnswer(text) {
  if (!text) return "";
  return md.render(text);
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleString("vi-VN");
}

async function sendMessage() {
  const msg = message.value.trim();
  if (!msg) return;
  message.value = "";

  try {
    history.value.push({
      id: Date.now(),
      question: msg,
      answer: "Đang trả lời...",
      intent: "pending",
      created_at: new Date().toISOString(),
    });
    await nextTick();
    scrollToBottom();

    const res = await ChatbotService.createQuestion({
      projectId: props.projectId,
      userId: 1,
      question: msg,
    });

    const idx = history.value.findIndex(h => h.id === res.id || h.question === msg);
    if (idx !== -1) history.value[idx] = res;

    await nextTick();
    scrollToBottom();
  } catch (err) {
    console.error(err);
    ElMessage.error("Gửi câu hỏi thất bại");
  }
}

onMounted(() => {
  fetchHistory();
});
</script>

<style scoped>
.chatbot-float-btn {
  position: fixed;
  bottom: 25px;
  right: 25px;
  z-index: 2000;
  box-shadow: 0 4px 12px rgba(0,0,0,0.25);
}

/* Panel floating ở góc dưới bên phải */
.chatbot-panel {
  position: fixed;
  bottom: 80px;
  right: 25px;
  width: 360px;
  height: 480px;
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 6px 18px rgba(0,0,0,0.25);
  display: flex;
  flex-direction: column;
  z-index: 2000;
}

/* Header */
.chatbot-header {
  padding: 10px 12px;
  background: #409eff;
  color: white;
  font-weight: bold;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top-left-radius: 10px;
  border-top-right-radius: 10px;
}

/* Scroll area */
.chatbot-scroll {
  flex: 1;
  padding: 8px 12px;
  overflow-y: auto;
}

/* Chat items */
.chatbot-history {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.chat-item {
  border-radius: 10px;
  padding: 8px 10px;
  background: #f8f9fa;
}

.chat-item .q {
  background: #c3ecff;
  padding: 6px 8px;
  border-radius: 6px;
  margin-bottom: 8px;
    text-align: right;
  margin-left: auto;
}

.chat-item .a {
  background: #fffbe6;
  padding: 6px 8px;
  border-radius: 6px;
  margin-bottom: 4px;
}

.chat-item .meta {
  font-size: 11px;
  color: #909399;
  text-align: right;
}

.chat-item .a pre {
  background: #f5f5f5;
  padding: 6px;
  border-radius: 6px;
  overflow-x: auto;
}
.chat-item .a code {
  background: #f0f0f0;
  padding: 2px 4px;
  border-radius: 4px;
}

/* Input box */
.chatbot-input {
  padding: 8px 10px;
  border-top: 1px solid #eaeaea;
  background: #fafafa;
}
</style>
