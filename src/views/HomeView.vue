<script setup lang="ts">
import { configs as _configs, type Config } from "@/utils/website";
import { computed, ref, watch } from "vue";
import { useLanguage } from "@/stores/language";
import { storeToRefs } from "pinia";
import TagFilter, { type TagFilterOptions } from "@/components/TagFilter.vue";
import PostList from "@/components/PostList.vue";
import { formatTags } from "@/utils/format_tags";
const { language } = storeToRefs(useLanguage());
const configs = computed(() =>
  _configs.map((config) => ({
    ...config,
    name: language.value.homePage.websites[config.website],
  }))
);
const config = ref(configs.value[0]);
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
  tagOptions.value = _;
}
</script>

<template>
  <ElContainer class="container">
    <ElHeader height="auto">
      <ElPageHeader :class="{ 'filter-is-hidden': !showFilter }">
        <template #title>
          <RouterLink to="/">
            <h1>AX-image</h1>
          </RouterLink>
        </template>
        <template #extra>
          <ElSpace>
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
            <ElButton
              icon="search"
              @click="showFilter = true"
              circle
            ></ElButton>
            <ElButton
              icon="refresh-left"
              @click="update = true"
              :disabled="update"
              circle
            ></ElButton>
            <ElLink :underline="false" href="/download">
              <ElIcon size="20">
                <Download />
              </ElIcon>
            </ElLink>
            <ElLink :underline="false" href="/setting">
              <ElIcon size="20">
                <Setting />
              </ElIcon>
            </ElLink>
          </ElSpace>
        </template>
        <TagFilter
          class="filter"
          v-model="tagOptions"
          v-show="showFilter"
          :website="config.website"
          @close="showFilter = false"
          @search="search"
        />
      </ElPageHeader>
    </ElHeader>
    <ElMain>
      <PostList
        :website="config.website"
        :tag-options="tagOptions"
        :key="postsKey"
        ref="posts"
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
    margin: 0;
    border-bottom: 1px solid var(--el-border-color);
    background-color: #fff;
    z-index: 10;

    .el-page-header {
      width: 100%;
      box-sizing: border-box;

      :deep(.el-page-header__header) {
        min-height: 60px;

        .el-page-header__icon {
          display: none;
        }

        .el-divider {
          display: none;
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

      &.filter-is-hidden {
        :deep(.el-page-header__main) {
          border-top: none;
        }
      }

      :deep(.el-page-header__main) {
        margin: 0;
      }

      .filter {
        box-sizing: border-box;
        padding: 12px;
      }
    }
  }

  main {
    height: 100%;
    padding: 0;
  }
}
</style>
