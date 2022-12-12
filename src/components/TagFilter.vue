<script lang="ts" setup>
import { TagMode, type TagsOptions, type Tag } from "@/utils/format_tags";
import { ref } from "vue";
const porps = defineProps<{ modelValue: TagsOptions; update: boolean }>();
defineEmits<{
  "update:modelValue": void;
  close: void;
  "update:update": (update: boolean) => void;
}>();

const tags = ref(
  porps.modelValue.tags?.map((tag) => ({
    ...tag,
    key: `${tag.tag}-${tag.mode}`,
  })) ?? []
);

function removeTag(tag: Tag) {
  tags.value = tags.value.filter((_) => _ !== tag);
}
</script>

<template>
  <ElSpace direction="vertical" class="tags-box" alignment="start">
    <ElSpace wrap class="tag-list" v-if="tags.length">
      <p>This's tag list of tags tilter.</p>
      <ElTag
        v-for="tag in tags"
        :key="tag.key"
        closable
        @close="removeTag(tag)"
      >
        <ElIcon v-if="tag.mode === TagMode.is">+</ElIcon>
        <ElIcon v-else-if="tag.mode === TagMode.not">-</ElIcon>
        <ElIcon v-else-if="tag.mode === TagMode.or">~</ElIcon>
        {{ tag.tag }}
      </ElTag>
    </ElSpace>
    <ElSpace wrap class="tag-filter">
      <p>This's tag filter items of tags tilter.</p>
    </ElSpace>
    <p>Tag filter props is:</p>
    <code>
      {{ $props }}
    </code>
    <ElButton
      circle
      @click="$emit('update:update', true)"
      icon="refresh-left"
      :disabled="update"
    ></ElButton>
    <ElButton circle @click="$emit('close')" icon="close"> </ElButton>
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
