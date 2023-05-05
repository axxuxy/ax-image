<script lang="ts" setup>
import type { Post } from "@/utils/api";

defineProps<{
  posts: Array<Post>;
}>();
const emit = defineEmits<{
  (event: "clickPost", post: Post): void;
}>();
</script>

<template>
  <ul class="posts">
    <li v-for="post in posts" :key="post.id" class="post-item">
      <div class="post-preview" @click="emit('clickPost', post)">
        <img :src="post.preview_url" />
      </div>
      <span>{{ post.id }}</span>
    </li>
  </ul>
</template>

<style lang="scss" scoped>
.posts {
  display: grid;
  grid-gap: 8px;
  grid-template-columns: repeat(auto-fill, 158px);
  justify-content: center;

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
