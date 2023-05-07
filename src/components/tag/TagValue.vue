<script lang="ts" setup>
import type { TagType } from "@/utils/api";
import type { Tag } from "@/utils/tags";
import { computed } from "vue";

const props = defineProps<{
  tag: Tag;
  hideEdit?: boolean;
  hideRemove?: boolean;
  type?: TagType | "meta";
}>();

const emit = defineEmits<{
  (event: "edit"): void;
  (event: "remove"): void;
}>();

const type = computed(() =>
  props.type ? ["--tag", `--tag-${props.type}`] : undefined
);
</script>

<template>
  <ElTag :class="type" :closable="!hideRemove" @close="emit('remove')">
    <ElIcon class="edit" v-if="!hideEdit" @click="emit('edit')">
      <i-ep-edit />
    </ElIcon>
    <slot :tag="tag">
      {{ tag.tag }}
    </slot>
  </ElTag>
</template>

<style lang="scss" scoped>
.el-tag {
  .edit {
    margin-right: 6px;
    vertical-align: text-bottom;
  }
}
</style>
