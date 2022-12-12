<script setup lang="ts">
import { configs as _configs } from "@/utils/website";
import { computed, ref, watch } from "vue";
import { useLanguage } from "@/stores/language";
import { storeToRefs } from "pinia";
import TagFilter from "@/components/TagFilter.vue";
import PostList from "@/components/PostList.vue";
import { type TagsOptions, formatTags, TagMode } from "@/utils/format_tags";
const { language } = storeToRefs(useLanguage());
const configs = computed(() =>
  _configs.map((config) => ({
    ...config,
    name: language.value.homePage.websites[config.website],
  }))
);
const website = ref(configs.value[0].website);

const showFilter = ref(false);

const tagOptions = ref<TagsOptions>({
  tags: [
    {
      tag: "original",
      mode: TagMode.is,
    },
    {
      tag: "name",
      mode: TagMode.not,
    },
    {
      tag: "name",
      mode: TagMode.or,
    },
  ],
});

const posts = ref<typeof PostList | null>(null);
const update = ref(false);
watch(update, async (value) => {
  if (value) await posts.value?.update();
  update.value = false;
});
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
            <ElSelect v-model="website">
              <ElOption
                v-for="config in configs"
                :key="config.website"
                :label="config.name"
                :value="config.website"
              >
              </ElOption>
            </ElSelect>
            <ElInput
              suffix-icon="search"
              class="search"
              :placeholder="language.homePage.search"
            >
              <template #prefix>
                <ElIcon @click="showFilter = true" class="show-filter">
                  <Filter />
                </ElIcon>
              </template>
            </ElInput>
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
          @close="showFilter = false"
          v-model:update="update"
        ></TagFilter>
      </ElPageHeader>
    </ElHeader>
    <ElMain>
      <PostList
        :website="website"
        :tag-options="tagOptions"
        :key="`${website}-${formatTags(tagOptions)}`"
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

      .search {
        :deep(.el-input__wrapper) {
          border-radius: 16px !important;
        }

        .show-filter {
          cursor: pointer;
        }
      }

      .filter {
        box-sizing: border-box;
        padding: 20px 20px 0;
      }
    }
  }

  main {
    height: 100%;
    padding: 0;
  }
}
</style>
