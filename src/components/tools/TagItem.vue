<script lang="ts" setup>
import type { TagType } from "@/utils/api";
import type { Tag } from "@/utils/format_tags";
import { computed } from "vue";

const props = defineProps<{
  tag: Tag;
  type?: TagType;
}>();

const tag = computed(() => [props.tag.mode, props.tag.name].join(""));

const typeClass = computed(() =>
  props.type ? ["--tag", `--tag-${props.type}`] : undefined
);
</script>

<template>
  <ElTag :class="typeClass">
    {{ tag }}
  </ElTag>
</template>
