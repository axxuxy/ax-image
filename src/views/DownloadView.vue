<script setup lang="ts">
import { useLanguage } from "@/stores/language";
import { inject, ref } from "vue";
import { useRouter } from "vue-router";
import Downloading from "@/components/download/DownloadingList.vue";
import Downloaded from "@/components/download/DownloadedList.vue";
import type { Website } from "@/utils/website";
import type { Post } from "@/utils/api";
import { useCache } from "@/stores/cache";
import { downloadPageKeepAliveKey } from "@/inject";

const language = useLanguage();
const downloadState =
  ref<keyof typeof language.language.downloadPage.downloadStates>(
    "downloading"
  );
const router = useRouter();

const cache = useCache();
const keep = inject(downloadPageKeepAliveKey)!;
function openPost(post: Post & { website: Website }) {
  keep(true);
  cache.addPosts(post.website, [post]);
  router.push({
    name: "post",
    params: { id: post.id },
    query: { website: post.website },
  });
}
</script>

<template>
  <ElContainer class="download-page">
    <ElHeader>
      <ElPageHeader @back="router.back" class="header">
        <template #content>
          <h1>{{ language.language.downloadPage.title }}</h1>
        </template>
      </ElPageHeader>
    </ElHeader>
    <ElMain>
      <ElTabs v-model="downloadState" type="card">
        <ElTabPane
          :label="language.language.downloadPage.downloadStates.downloading"
          name="downloading"
        >
          <Downloading
            v-if="downloadState === 'downloading'"
            @open-post="openPost"
          ></Downloading>
        </ElTabPane>
        <ElTabPane
          :label="language.language.downloadPage.downloadStates.downloaded"
          name="downloaded"
        >
          <Downloaded
            v-if="downloadState === 'downloaded'"
            @open-post="openPost"
          ></Downloaded>
        </ElTabPane>
      </ElTabs>
    </ElMain>
  </ElContainer>
</template>

<style lang="scss" scoped>
.download-page {
  height: 100vh;

  header {
    position: sticky;
    top: 0;
    display: flex;
    align-items: center;
    background-color: #fff;
    border-bottom: 1px solid var(--el-border-color);
    z-index: 10;

    .el-page-header {
      width: 100%;

      h1 {
        font-size: var(--el-font-size-extra-large);
      }

      .show-filter {
        cursor: pointer;
      }
    }
  }

  main {
    .el-tabs {
      height: 100%;

      :deep(.el-tabs__content) {
        height: calc(100% - 56px);
        overflow: visible;

        & > div {
          height: 100%;
        }
      }
    }
  }
}
</style>
