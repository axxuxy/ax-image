<script setup lang="ts">
import { RouterView } from "vue-router";
import { useLanguage } from "@/stores/language";
import { computed, provide, ref } from "vue";
import { downloadPageKeepAliveKey } from "@/inject";
const language = useLanguage();

const downloadPageKeepAlive = ref(false);
function changeDownloadPageKeepAlive(keep: boolean) {
  downloadPageKeepAlive.value = keep;
}
provide(downloadPageKeepAliveKey, changeDownloadPageKeepAlive);

const exclude = computed(() => {
  const exclude: Array<string> = ["PostView"];
  if (!downloadPageKeepAlive.value) exclude.push("DownloadView");
  return exclude;
});
</script>

<template>
  <ElConfigProvider :locale="language.language.elementPlus">
    <RouterView v-slot="{ Component, route }">
      <KeepAlive :exclude="exclude">
        <component :is="Component" :key="route.fullPath" />
      </KeepAlive>
    </RouterView>
  </ElConfigProvider>
</template>
