<script lang="ts" setup>
import type { TagsOptions } from "@/utils/format_tags";
import type { Website } from "@/utils/website";

export interface PostListOptions extends TagsOptions {
  website: Website;
}

defineProps<PostListOptions>();
</script>

<template>
  <p>This's post list component.</p>
  <p>Post list props is:</p>
  <code>
    {{ $props }}
  </code>
</template>

<style lang="scss" scoped>
code {
  white-space: pre-wrap;
}
</style>
