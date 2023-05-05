<script lang="ts" setup>
import type { Tag } from "@/utils/api";
import { TagMode } from "@/utils/tags";
import { computed } from "vue";

const props = defineProps<{
  tag: Tag;
}>();

const emit = defineEmits<{
  (event: "click", mode?: TagMode): void;
}>();

const type = computed(() => ["--tag", `--tag-${props.tag.type}`]);
</script>

<template>
  <ElSpace :title="tag.name">
    <ElButton :class="type" @click="emit('click', TagMode.or)" size="small"
      >~</ElButton
    >
    <ElButton :class="type" @click="emit('click', TagMode.not)" size="small"
      >-</ElButton
    >
    <ElTag :class="type" @click="emit('click')">
      <ElIcon>
        <span>+</span>
      </ElIcon>
      <span>{{ tag.name }}</span>
      <span> - </span>
      <span>{{ tag.count }}</span>
    </ElTag>
  </ElSpace>
</template>

<style lang="scss" scoped>
.el-space {
  max-width: 100%;

  :deep() {
    .el-space__item:last-child {
      flex-shrink: 1;
      overflow: hidden;
      margin-right: 0 !important;
    }
  }

  .el-tag {
    width: 100%;
    cursor: pointer;

    :deep() {
      .el-tag__content {
        overflow: hidden;
        display: flex;

        & > span:nth-child(2) {
          flex: 1;
          flex-shrink: 1;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        & > span:nth-child(3) {
          margin: 0 6px;
        }
      }
    }

    .el-icon {
      margin-right: 8px;
    }
  }
}
</style>
