<script setup lang="ts">
import { RouterView } from "vue-router";
import { useLanguage } from "@/stores/language";
import { storeToRefs } from "pinia";
const { language } = storeToRefs(useLanguage());
</script>

<template>
  <ElScrollbar height="100vh" class="scrollbar">
    <ElConfigProvider :locale="language.elementPlus">
      <RouterView></RouterView>
    </ElConfigProvider>
  </ElScrollbar>
</template>

<style lang="scss" scoped>
.scrollbar > :deep(.el-scrollbar__bar) {
  z-index: 10;
}
</style>
