<script lang="ts" setup>
import { useLanguage } from "@/stores/language";
import { getPosts as _getPosts, type GetPostsOption } from "@/utils/api";
import type { TagsOptions } from "@/utils/format_tags";
import type { Website } from "@/utils/website";
import { ElMessage } from "element-plus";
import { storeToRefs } from "pinia";
import { computed, ref } from "vue";

export interface PostListOptions {
  website: Website;
  tagOptions: TagsOptions;
}

const props = defineProps<PostListOptions>();
const { language } = storeToRefs(useLanguage());

const loading = ref(false);
const getFailed = ref(false);
const noMore = ref(false);
const posts = ref<Awaited<ReturnType<typeof _getPosts>>>([]);

const scrollbarId = ref(`scrollbar-id-${Date.now()}`);
const backTopTarget = computed(
  () => `#${scrollbarId.value}>.el-scrollbar__wrap`
);

let page = 1;
async function getPosts() {
  if (noMore.value || getFailed.value) return;
  loading.value = true;
  const option: GetPostsOption = { ...props.tagOptions, page };
  await _getPosts(props.website, option)
    .then((_) => {
      const postsId = posts.value.map((post) => post.id);
      posts.value = [
        ...posts.value,
        ..._.filter((post) => !postsId.includes(post.id)),
      ];
      if (_.length < 100) noMore.value = true;
      ++page;
    })
    .catch((error) => {
      if (
        document.querySelector(backTopTarget.value)!.getBoundingClientRect()
          .height >
        document
          .querySelector(`${backTopTarget.value}>.el-scrollbar__view>.posts`)!
          .getBoundingClientRect().height
      )
        getFailed.value = true;
      ElMessage.error(language.value.postListComponent.loadingFailed);
      throw error;
    })
    .finally(() => (loading.value = false));
}

async function update() {
  if (loading.value) return;
  page = 0;
  noMore.value = false;
  posts.value = [];
  await getPosts();
}

defineExpose({ update });

async function failedGetPosts() {
  getFailed.value = false;
  await getPosts();
}
</script>

<template>
  <ElScrollbar height="100%" :id="scrollbarId" class="posts-box">
    <ul
      class="posts"
      v-infinite-scroll="getPosts"
      :infinite-scroll-disabled="loading || noMore"
    >
      <li v-for="post in posts" :key="post.id" class="post-item">
        <ElImage
          :src="post.preview_url"
          class="post-preview"
          fit="contain"
        ></ElImage>
        <span>{{ post.id }}</span>
      </li>
    </ul>
    <ElAlert v-if="loading" class="loading" center :closable="false">
      <span>{{ language.postListComponent.loading }}</span>
      <ElIcon class="is-loading">
        <Loading />
      </ElIcon>
    </ElAlert>
    <ElAlert v-else-if="getFailed" type="error" center :closable="false">
      <ElSpace alignment="center">
        <span>{{ language.postListComponent.loadingFailed }}</span>
        <ElButton
          @click="failedGetPosts"
          icon="refresh"
          color="var(--el-color-error)"
          text
          plain
        />
      </ElSpace>
    </ElAlert>
    <ElAlert v-else-if="noMore" center type="success" :closable="false">
      <span>{{
        posts.length
          ? language.postListComponent.noMore
          : language.postListComponent.none
      }}</span>
      <ElButton
        @click="update"
        icon="refresh"
        color="var(--el-color-success)"
        text
        plain
      />
    </ElAlert>
  </ElScrollbar>
  <ElBacktop :target="backTopTarget" />
</template>

<style lang="scss" scoped>
.posts-box :deep(.el-scrollbar__view) {
  padding: 0 8px;
}

.posts {
  display: grid;
  grid-gap: 8px;
  grid-template-columns: repeat(auto-fill, 158px);
  justify-content: center;
  padding-top: 8px;

  .post-item {
    padding: 8px 4px 8px;
    background-color: #eee;
    text-align-last: center;

    .post-preview {
      display: block;
      height: 180px;
      padding-bottom: 8px;
    }
  }
}

.el-alert {
  height: 53px;

  .el-space {
    :deep() {
      &:last-child {
        margin-right: 0 !important;
      }
    }
  }
}

.loading {
  background-color: transparent;

  .is-loading {
    padding: 0 16px;
  }
}
</style>
