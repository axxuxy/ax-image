<script setup lang="ts">
import { RouterView } from "vue-router";
import { useLanguage } from "@/stores/language";
import { storeToRefs } from "pinia";
const { language } = storeToRefs(useLanguage());
</script>

<template>
  <ElConfigProvider :locale="language.elementPlus">
    <RouterView v-slot="{ Component }">
      <KeepAlive include="HomeView">
        <component :is="Component" />
      </KeepAlive>
    </RouterView>
  </ElConfigProvider>
</template>
