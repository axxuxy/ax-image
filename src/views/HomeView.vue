<script setup lang="ts">
import { configs as _configs } from "@/utils/website";
import { computed, ref } from "vue";
import { useLanguage } from "@/stores/language";
import { storeToRefs } from "pinia";
import TagFilter from "@/components/TagFilter.vue";
import PostList from "@/components/PostList.vue";
import type { TagsOptions } from "@/utils/format_tags";
const { language } = storeToRefs(useLanguage());
const configs = computed(() =>
  _configs.map((config) => ({
    ...config,
    name: language.value.homePage.websites[config.website],
  }))
);
const website = ref(configs.value[0].website);

const showFilter = ref(false);

const tagsOption = ref<TagsOptions>();
</script>

<template>
  <ElContainer>
    <ElHeader>
      <div class="log">
        <RouterLink to="/">
          <h1>AX-image</h1>
        </RouterLink>
      </div>
      <ElSpace size="large">
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
    </ElHeader>
    <TagFilter
      v-bind="tagsOption"
      class="filter"
      v-show="showFilter"
    ></TagFilter>
    <ElMain>
      <PostList :website="website" v-bind="tagsOption"></PostList>
    </ElMain>
  </ElContainer>
</template>

<style lang="scss" scoped>
header {
  display: flex;
  margin: 0;
  border-bottom: 1px solid var(--el-border-color);

  .log {
    width: 100%;

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

  .search {
    :deep(.el-input__wrapper) {
      border-radius: 16px !important;
    }

    .show-filter {
      cursor: pointer;
    }
  }
}

.filter {
  box-sizing: border-box;
  padding: 20px 20px 0;
}
</style>
