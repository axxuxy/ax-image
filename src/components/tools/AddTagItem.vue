<script lang="ts" setup>
import type { Tag as ApiTag } from "@/utils/api";
import { type Tag as FormatTag, TagMode } from "@/utils/format_tags";

export interface Tag extends ApiTag, FormatTag {}

const props = defineProps<{
  tag: ApiTag;
}>();
const emit = defineEmits({
  select: (tag: Tag) => tag || false,
});
function clickIs() {
  emit("select", { ...props.tag, mode: TagMode.is });
}
function clickOr() {
  emit("select", { ...props.tag, mode: TagMode.or });
}
function clickNot() {
  emit("select", { ...props.tag, mode: TagMode.not });
}
</script>

<template>
  <ElSpace>
    <ElTag :class="['--tag', 'select', `--tag-${tag.type}`]" @click="clickIs">
      <ElIcon>
        <span>+</span>
      </ElIcon>
      <span>{{ tag.name }}</span>
      <span> - </span>
      <span>{{ tag.count }}</span>
    </ElTag>
    <ElButton
      :class="['--tag', 'select', `--tag-${tag.type}`]"
      size="small"
      @click="clickOr"
    >
      <ElIcon>
        <span>~</span>
      </ElIcon>
    </ElButton>
    <ElButton
      :class="['--tag', 'select', `--tag-${tag.type}`]"
      size="small"
      @click="clickNot"
    >
      <ElIcon>
        <span>-</span>
      </ElIcon>
    </ElButton>
  </ElSpace>
</template>
