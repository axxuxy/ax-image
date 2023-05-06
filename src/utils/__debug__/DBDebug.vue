<script setup lang="ts">
import { ref } from "vue";
import DownloadedDBDebug from "@/utils/__debug__/DownloadedDBDebug.vue";
import SearchHistoryDBDebug from "@/utils/__debug__/SearchHistoryDBDebug.vue";

enum Tab {
  downloadedInfo = "downloaded info",
  searchHistoryInfo = "search history info",
}

const tab = ref(Tab.searchHistoryInfo);
</script>

<template>
  <ElTabs v-model="tab">
    <ElTabPane :label="Tab.downloadedInfo" :name="Tab.downloadedInfo">
      <DownloadedDBDebug />
    </ElTabPane>
    <ElTabPane :label="Tab.searchHistoryInfo" :name="Tab.searchHistoryInfo">
      <SearchHistoryDBDebug />
    </ElTabPane>
  </ElTabs>
</template>
