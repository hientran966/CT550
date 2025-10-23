<template>
  <el-input
    v-model="content"
    type="textarea"
    :rows="2"
    :placeholder="placeholder"
    @input="onInput"
    @keydown.down.prevent="highlightNext"
    @keydown.up.prevent="highlightPrev"
    @keydown.enter.prevent="selectMention"
  ></el-input>

  <div v-if="showDropdown" class="mention-dropdown">
    <div
      v-for="(user, idx) in filteredUsers"
      :key="user.id"
      :class="['mention-item', { active: idx === activeIndex }]"
      @click="chooseUser(user)"
    >
      {{ user.name }}
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from "vue";

const props = defineProps({
  modelValue: String,
  users: Array,
  placeholder: String,
});
const emit = defineEmits(["update:modelValue", "mention"]);

const content = ref(props.modelValue);
const query = ref("");
const showDropdown = ref(false);
const activeIndex = ref(0);

watch(content, (val) => {
  emit("update:modelValue", val);
  const match = val.match(/@(\w*)$/);
  if (match) {
    query.value = match[1];
    showDropdown.value = true;
  } else {
    showDropdown.value = false;
  }
});

const filteredUsers = computed(() =>
  props.users.filter((u) => u.name.toLowerCase().includes(query.value.toLowerCase()))
);

function onInput(val) {
  content.value = val;
}

function chooseUser(user) {
  content.value = content.value.replace(/@(\w*)$/, `@[${user.name}](${user.id}) `);
  emit("mention", user);
  showDropdown.value = false;
}

function highlightNext() {
  if (showDropdown.value && activeIndex.value < filteredUsers.value.length - 1)
    activeIndex.value++;
}

function highlightPrev() {
  if (showDropdown.value && activeIndex.value > 0) activeIndex.value--;
}

function selectMention() {
  if (showDropdown.value) chooseUser(filteredUsers.value[activeIndex.value]);
}
</script>

<style scoped>
.mention-dropdown {
  position: absolute;
  background: white;
  border: 1px solid #ddd;
  border-radius: 6px;
  z-index: 10;
  width: 200px;
  max-height: 150px;
  overflow-y: auto;
}
.mention-item {
  padding: 6px 8px;
  cursor: pointer;
}
.mention-item.active {
  background: #f0f9ff;
  color: #409eff;
}
</style>