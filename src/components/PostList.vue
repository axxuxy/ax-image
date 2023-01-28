<script lang="ts" setup>
import { useLanguage } from "@/stores/language";
import {
  getPosts as _getPosts,
  type GetPostsOption,
  type Post,
} from "@/utils/api";
import type { TagsOptions } from "@/utils/format_tags";
import type { Website } from "@/utils/website";
import { ElMessage } from "element-plus";
import { storeToRefs } from "pinia";
import { computed, ref } from "vue";
import PostImage from "@/components/PostImage.vue";
import type { Tag } from "@/components/tools/AddTagItem.vue";

export interface PostListOptions {
  website: Website;
  tagOptions: TagsOptions;
}

const props = defineProps<PostListOptions>();
const { language } = storeToRefs(useLanguage());
const emit = defineEmits<{
  (event: "openChildren", id: number): void;
  (event: "openTag", tag: Tag): void;
}>();

const loading = ref(false);
const getFailed = ref(false);
const noMore = ref(false);
const posts = ref<Array<Post>>([]);

const scrollbarId = ref(`scrollbar-id-${Date.now()}`);
const backTopTarget = computed(
  () => `#${scrollbarId.value}>.el-scrollbar__wrap`
);

let page = 1;
async function getPosts(limit = 100) {
  if (noMore.value || getFailed.value) return;
  loading.value = true;
  const option: GetPostsOption = { ...props.tagOptions, page, limit };
  await _getPosts(props.website, option)
    .then((_) => {
      const postsId = posts.value.map((post) => post.id);
      posts.value = [
        ...posts.value,
        ..._.filter((post) => !postsId.includes(post.id)),
      ];
      if (_.length < limit) noMore.value = true;
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

/// FIXME In update, if no auto load full container.
async function update() {
  if (loading.value) return;
  page = 0;
  posts.value = [];
  getFailed.value = false;
  noMore.value = false;
  await getPosts();
}

defineExpose({ update });

async function failedGetPosts() {
  getFailed.value = false;
  await getPosts();
}

const openPost = ref<Post>();
function setOpenPost(post?: Post) {
  openPost.value = post;
}
/// XXX The can move other place.
function openChildren(id: number) {
  emit("openChildren", id);
}
function openTag(tag: Tag) {
  emit("openTag", tag);
}
</script>

<template>
  <ElDrawer
    :model-value="!!openPost"
    direction="btt"
    destroy-on-close
    @closed="openPost = undefined"
    size="100%"
    :with-header="false"
  >
    <PostImage
      v-if="openPost"
      :website="website"
      :post="openPost!"
      @close="setOpenPost(undefined)"
      @open-parent="setOpenPost"
      @open-children="openChildren"
      @open-tag="openTag"
    />
  </ElDrawer>
  <ElScrollbar height="100%" :id="scrollbarId" class="posts-box">
    <ul
      class="posts"
      :class="{ empty: !posts.length }"
      v-infinite-scroll="getPosts"
      :infinite-scroll-disabled="loading || noMore"
    >
      <li v-for="post in posts" :key="post.id" class="post-item">
        <div class="post-preview" @click="setOpenPost(post)">
          <img :src="post.preview_url" />
        </div>
        <span>{{ post.id }}</span>
      </li>
    </ul>
    <!-- FIXME In alert with post list not have space. -->
    <ElAlert v-if="loading" class="loading" center :closable="false">
      <span>{{ language.postListComponent.loading }}</span>
      <ElIcon class="is-loading">
        <i-ep-loading />
      </ElIcon>
    </ElAlert>
    <ElAlert v-else-if="getFailed" type="error" center :closable="false">
      <ElSpace alignment="center">
        <span>{{ language.postListComponent.loadingFailed }}</span>
        <ElButton
          @click="failedGetPosts"
          color="var(--el-color-error)"
          text
          plain
        >
          <ElIcon>
            <i-ep-refresh />
          </ElIcon>
        </ElButton>
      </ElSpace>
    </ElAlert>
    <ElAlert v-else-if="noMore" center type="info" :closable="false">
      <span>{{
        posts.length
          ? language.postListComponent.noMore
          : language.postListComponent.none
      }}</span>
      <ElButton @click="update" text plain>
        <ElIcon>
          <i-ep-refresh />
        </ElIcon>
      </ElButton>
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
  padding: 8px 0;

  .post-item {
    padding: 8px 4px;
    background-color: #eee;
    text-align-last: center;

    .post-preview {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 180px;
      padding-bottom: 8px;
      user-select: none;
      cursor: pointer;

      img {
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
      }
    }
  }

  &.empty {
    padding-bottom: 0;
  }
}

.el-alert {
  height: 53px;
  margin-bottom: 8px;

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
