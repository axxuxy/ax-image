<script setup lang="ts">
import type { Post } from "@/utils/api";
import AspectRatio from "@/components/tools/AspectRatio.vue";

const props = defineProps<{
  post: Post;
}>();

const allImage = [
  props.post.preview_url,
  props.post.sample_url,
  props.post.jpeg_url,
  props.post.file_url,
]
  .filter((url) => url)
  .map((_) => decodeURI(_));

const url = decodeURI(props.post.sample_url);
</script>

<template>
  <ElImage
    class="img"
    fit="scale-down"
    :src="url"
    :preview-src-list="allImage"
    :initial-index="1"
    :z-index="100"
  >
    <template #placeholder>
      <AspectRatio class="loading">
        <ElSkeleton :loading="true" animated>
          <template #template>
            <ElSkeletonItem variant="image"></ElSkeletonItem>
          </template>
        </ElSkeleton>
      </AspectRatio>
    </template>
    <template #error>
      <img
        class="error"
        width="100"
        height="100"
        src="@/assets/picture-loading-failed.svg"
      />
    </template>
  </ElImage>
</template>

<style lang="scss" scoped>
.img {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;

  & > :deep(img) {
    cursor: zoom-in;

    &.is-loading {
      display: none;
    }

    &.error {
      cursor: auto;
    }
  }

  :deep(.el-image__wrapper) {
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .loading {
    width: 80%;
    height: 80%;
  }

  .el-skeleton {
    & > .el-skeleton__item.el-skeleton__image {
      width: auto;
      height: auto;
      aspect-ratio: 1;
    }
  }
}
</style>
