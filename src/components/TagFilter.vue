<script lang="ts" setup>
import type { TagsOptions } from "@/utils/format_tags";
export interface TagsFilterOption extends TagsOptions {}
defineProps<TagsFilterOption>();
</script>

<template>
  <ElSpace direction="vertical" class="tags-box" alignment="start">
    <ElSpace wrap class="tag-list">
      <p>This's tag list of tags tilter.</p>
    </ElSpace>
    <ElSpace wrap class="tag-filter">
      <p>This's tag filter items of tags tilter.</p>
    </ElSpace>
    <p>Tag filter props is:</p>
    <code>
      {{ $props }}
    </code>
  </ElSpace>
</template>

<style lang="scss" scoped>
.tag-list,
.tag-filter {
  width: 100%;
}

code {
  white-space: pre-wrap;
}
</style>
