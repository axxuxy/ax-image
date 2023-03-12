<script setup lang="ts">
import { configs as _configs, type Config } from "@/utils/website";
import { computed, nextTick, onUnmounted, ref, watch } from "vue";
import { useLanguage } from "@/stores/language";
import { storeToRefs } from "pinia";
import TagFilter from "@/components/TagFilter.vue";
import PostList from "@/components/PostList.vue";
import { formatTags, restoreTags, type TagsOptions } from "@/utils/format_tags";
import type { Tag } from "@/components/tools/AddTagItem.vue";
import { useRoute, useRouter } from "vue-router";
import {
  addDwonloadListen,
  getDownloads,
  removeDwonloadListen,
} from "@/utils/download";
import { useConfig } from "@/stores/config";

const { language } = storeToRefs(useLanguage());
const configs = computed(() =>
  _configs.map((config) => ({
    ...config,
    name: language.value.homePage.websites[config.website],
  }))
);
const config = ref(
  (() => {
    const website = localStorage.getItem("website");
    return (
      configs.value.find((config) => config.website === website) ||
      configs.value[0]
    );
  })()
);
watch(config, (_) => {
  localStorage.setItem("website", _.website);
});
function websiteCommand(_: Config & { name: string }) {
  config.value = _;
}

const showFilter = ref(false);

const tagOptions = ref<TagsOptions>({});

const tags = computed(() => formatTags(tagOptions.value)?.split(" ")?.sort());
const postsKey = computed(() =>
  [config.value.website, ...(tags.value ?? [])].join(" ")
);
const posts = ref<InstanceType<typeof PostList>>();
const update = ref(false);
watch(update, async (value) => {
  if (value)
    await posts.value?.update()?.finally(() => {
      update.value = false;
    });
});

function search(_: TagsOptions) {
  showFilter.value = false;
  tagOptions.value = _;
}

function openChildren(id: number) {
  tagOptions.value = { parent: id };
}
function openTag(tag: Tag) {
  tagOptions.value = { tags: [tag] };
}

const router = useRouter();

const downloadCount = ref(0);
function updateDownloadingCount() {
  downloadCount.value = getDownloads().filter(
    (download) => !download.isStop
  ).length;
}
addDwonloadListen(updateDownloadingCount);
onUnmounted(() => removeDwonloadListen(updateDownloadingCount));
updateDownloadingCount();

function removeTag(tag: string) {
  tagOptions.value = restoreTags(
    tags.value!.filter((_) => _ !== tag).join(" ")
  );
}

const route = useRoute();
watch([config, tags], () => {
  router.push({
    name: "home",
    query: {
      tags: tags.value?.join(" "),
      website: config.value.website,
    },
  });
});
watch(
  route,
  (value) => {
    if (value.name === "home" && value.query.tags !== tags.value) {
      const _ = configs.value.find(
        (config) => config.website === value.query.website
      );
      if (_) config.value = _;
      // const tags = value.query.tags as string;
      // tagOptions.value = restoreTags(tags);
    }
  },
  {
    immediate: true,
  }
);

const { rating } = storeToRefs(useConfig());
watch(rating, () => {
  nextTick(() => {
    posts.value?.update();
  });
});
</script>

<template>
  <ElContainer class="container">
    <ElDrawer
      v-model="showFilter"
      direction="ttb"
      :with-header="false"
      size="auto"
      style="max-height: 100%"
    >
      <TagFilter
        class="filter"
        v-model="tagOptions"
        :website="config.website"
        @close="showFilter = false"
        @search="search"
      />
    </ElDrawer>
    <ElHeader height="auto">
      <ElPageHeader :class="{ 'filter-is-hidden': !showFilter }">
        <template #title>
          <RouterLink to="/">
            <h1>AX-image</h1>
          </RouterLink>
        </template>
        <template #extra>
          <div class="tags-box" v-if="tags">
            <ElScrollbar>
              <div class="tags">
                <ElTag
                  v-for="tag in tags"
                  :key="tag"
                  closable
                  @close="removeTag(tag)"
                  >{{ tag }}</ElTag
                >
              </div>
            </ElScrollbar>
          </div>
          <ElDropdown split-button @command="websiteCommand">
            <span>{{ config.name }}</span>
            <template #dropdown>
              <ElDropdownMenu>
                <ElDropdownItem
                  v-for="config in configs"
                  :key="config.website"
                  :command="config"
                  >{{ config.name }}
                </ElDropdownItem>
              </ElDropdownMenu>
            </template>
          </ElDropdown>
          <ElButton @click="showFilter = true" circle>
            <ElIcon>
              <i-ep-search />
            </ElIcon>
          </ElButton>
          <ElButton @click="update = true" :disabled="update" circle>
            <ElIcon>
              <i-ep-refresh-left />
            </ElIcon>
          </ElButton>

          <ElBadge :value="downloadCount" :hidden="!downloadCount">
            <ElButton @click="router.push('/download')" circle link>
              <ElIcon>
                <i-ep-download />
              </ElIcon>
            </ElButton>
          </ElBadge>
          <ElButton @click="router.push('/setting')" circle link>
            <i-ep-setting />
          </ElButton>
        </template>
      </ElPageHeader>
    </ElHeader>
    <ElMain>
      <PostList
        :website="config.website"
        :tag-options="tagOptions"
        :key="postsKey"
        ref="posts"
        @open-children="openChildren"
        @open-tag="openTag"
      >
      </PostList>
    </ElMain>
  </ElContainer>
</template>

<style lang="scss" scoped>
.container {
  height: 100vh;

  header {
    position: sticky;
    top: 0;
    // display: flex;
    min-height: 60px;
    // align-items: center;
    border-bottom: 1px solid var(--el-border-color);
    background-color: #fff;
    z-index: 10;

    .el-page-header {
      // display: flex;
      // align-items: center;
      width: 100%;
      // min-height: 100%;
      height: 100%;

      :deep(.el-page-header__header) {
        // min-height: 100%;
        height: 100%;

        .el-page-header__left {
          flex-shrink: 0;
        }

        .el-page-header__icon {
          display: none;
        }

        .el-divider {
          display: none;
        }

        .el-page-header__extra {
          height: 100%;
          flex: 1;
          flex-shrink: 1;
          display: flex;
          justify-content: end;
          align-items: center;
          overflow: hidden;
          // white-space: nowrap;

          & > div,
          & > button {
            margin-left: 12px;
            flex-shrink: 0;
          }

          // &>*:nth-child(1) {
          //   margin-left: 0;
          // }

          .tags-box {
            // display: inline-block;
            overflow: auto;
            flex: 1;
            display: flex;
            justify-content: end;
            overflow: hidden;

            .tags {
              display: flex;
              grid-gap: 12px;
              padding: 8px 0;
              // justify-content: end;
              // overflow: hidden;
              // flex: 1;
            }
          }
        }
      }

      h1 {
        display: inline-flex;
        align-items: center;
        height: 100%;
        color: #445;
        margin: 0;
        font-family: "freescpt";
        font-size: 36px;
        white-space: nowrap;
      }
    }
  }

  main {
    height: 100%;
    padding: 0;
  }
}
</style>
