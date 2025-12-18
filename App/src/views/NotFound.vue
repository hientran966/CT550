<template>
  <el-result
    :icon="icon"
    :title="title"
    :sub-title="subTitle"
    class="not-found"
  >
    <template #extra>
      <el-space>
        <el-button type="primary" @click="goHome">
          Về trang chính
        </el-button>
        <el-button @click="goBack">
          Quay lại
        </el-button>
      </el-space>
    </template>
  </el-result>
</template>

<script setup>
import { computed } from "vue";
import { useRouter, useRoute } from "vue-router";

const router = useRouter();
const route = useRoute();

const code = computed(() => {
  return (
    route.query.code ||
    (route.meta?.forbidden ? 403 : 404)
  );
});

const title = computed(() =>
  code.value == 403
    ? "Truy cập bị từ chối"
    : "Không tìm thấy trang"
);

const subTitle = computed(() =>
  code.value == 403
    ? "Bạn không có quyền truy cập vào nội dung này."
    : "Trang bạn truy cập không tồn tại hoặc đã bị xóa."
);

const icon = computed(() =>
  code.value == 403 ? "warning" : "error"
);

const goHome = () => {
  router.push("/");
};

const goBack = () => {
  router.back();
};
</script>

<style scoped>
.not-found {
  margin-top: 10vh;
}
</style>