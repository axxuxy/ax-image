<script setup lang="ts">
import { configs as _configs, type Config } from "@/utils/website";
import { computed, ref, watch } from "vue";
import { useLanguage } from "@/stores/language";
import { storeToRefs } from "pinia";
import TagFilter, { type TagFilterOptions } from "@/components/TagFilter.vue";
import PostList from "@/components/PostList.vue";
import { formatTags } from "@/utils/format_tags";
import type { Tag } from "@/components/tools/AddTagItem.vue";
import { useRouter } from "vue-router";

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

const tagOptions = ref<TagFilterOptions>({});

const postsKey = computed(() =>
  [
    config.value.website,
    ...(formatTags(tagOptions.value)?.split(" ")?.sort() ?? []),
  ].join(" ")
);
const posts = ref<typeof PostList | null>(null);
const update = ref(false);
watch(update, async (value) => {
  if (value) await posts.value?.update();
  update.value = false;
});

function search(_: TagFilterOptions) {
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
          <ElButton icon="search" @click="showFilter = true" circle></ElButton>
          <ElButton
            icon="refresh-left"
            @click="update = true"
            :disabled="update"
            circle
          ></ElButton>
          <ElButton
            @click="router.push('/download')"
            icon="download"
            circle
            link
          ></ElButton>
          <ElButton
            @click="router.push('/setting')"
            icon="setting"
            circle
            link
          ></ElButton>
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
    display: flex;
    min-height: 60px;
    align-items: center;
    border-bottom: 1px solid var(--el-border-color);
    background-color: #fff;
    z-index: 10;

    .el-page-header {
      width: 100%;

      :deep(.el-page-header__header) {
        .el-page-header__icon {
          display: none;
        }

        .el-divider {
          display: none;
        }

        .el-page-header__extra {
          & > div,
          & > button {
            margin-left: 12px;
          }

          & > *:nth-child(1) {
            margin-left: 0;
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
