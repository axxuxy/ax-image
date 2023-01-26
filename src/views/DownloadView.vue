<script setup lang="ts">
import { useLanguage } from "@/stores/language";
import { storeToRefs } from "pinia";
import { ref, toRaw } from "vue";
import { useRouter } from "vue-router";
import Downloading from "@/components/DownloadingList.vue";
import Downloaded from "@/components/DownloadedList.vue";
import PostImage from "@/components/PostImage.vue";
import type { Website } from "@/utils/website";
import type { Post } from "@/utils/api";
import { formatTags, type Tag } from "@/utils/format_tags";

const { language } = storeToRefs(useLanguage());
const downloadState =
  ref<keyof typeof language.value.downloadPage.downloadStates>("downloading");
const router = useRouter();

const openPost = ref<Post & { website: Website }>();
function setOpenPost(post?: Post & { website: Website }) {
  openPost.value = toRaw(post);
}
function openParent(post: Post) {
  setOpenPost(Object.assign({ website: openPost.value!.website }, post));
}

function openTag(tag: Tag) {
  router.push({
    name: "home",
    query: {
      website: openPost.value!.website,
      tags: formatTags({
        tags: [tag],
      }),
    },
  });
  openPost.value = undefined;
}

function openChildren() {
  router.push({
    name: "home",
    query: {
      tags: formatTags({
        parent: openPost.value!.id,
      }),
      website: openPost.value!.website,
    },
  });
}
</script>

<template>
  <ElContainer class="download-page">
    <ElDrawer
      :model-value="!!openPost"
      direction="btt"
      destroy-on-close
      size="100%"
      :with-header="false"
      @closed="setOpenPost(undefined)"
    >
      <PostImage
        v-if="openPost"
        :website="openPost!.website"
        :post="openPost!"
        @close="setOpenPost(undefined)"
        @open-parent="openParent"
        @open-children="openChildren"
        @open-tag="openTag"
      ></PostImage>
    </ElDrawer>
    <ElHeader>
      <ElPageHeader @back="router.back" class="header">
        <template #content>
          <h1>{{ language.downloadPage.title }}</h1>
        </template>
      </ElPageHeader>
    </ElHeader>
    <ElMain>
      <ElTabs v-model="downloadState" type="card">
        <ElTabPane
          :label="language.downloadPage.downloadStates.downloading"
          name="downloading"
        >
          <Downloading
            v-if="downloadState === 'downloading'"
            @open-post="setOpenPost"
          ></Downloading>
        </ElTabPane>
        <ElTabPane
          :label="language.downloadPage.downloadStates.downloaded"
          name="downloaded"
        >
          <Downloaded
            v-if="downloadState === 'downloaded'"
            @open-post="setOpenPost"
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
