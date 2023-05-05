<script lang="ts" setup>
import type { Tag } from "@/utils/api";
import type { TagMode } from "@/utils/tags";
import { CommonTag } from "@/utils/tags";
import { ref } from "vue";
import TagItem from "@/components/tag/TagItem.vue";

const props = defineProps<{
  value?: string;
  small?: boolean;
  fetchSuggestions(text: string): Promise<Array<Tag>>;
}>();

const emit = defineEmits<{
  (event: "emit", tag: string): void;
}>();

const input = ref(props.value);

function onKeydown(event: KeyboardEvent) {
  if (event.key === "Enter" && input.value) emit("emit", input.value);
}

function onClick(tag: Tag, mode?: TagMode) {
  emit("emit", new CommonTag(tag.name, mode).tag);
}
</script>

<template>
  <div class="autocomplete-tag-edit">
    <ElAutocomplete
      :class="{
        small,
      }"
      :fetch-suggestions="fetchSuggestions"
      :teleported="false"
      v-model="input"
      value-key="name"
      popper-class="autocomplete-tag-edit-list"
      @keydown="onKeydown"
    >
      <template #default="{ item }">
        <TagItem class="tag-item" :tag="item" @click="onClick(item, $event)" />
      </template>
    </ElAutocomplete>
  </div>
</template>

<style lang="scss" scoped>
.autocomplete-tag-edit {
  display: inline-block;
  vertical-align: middle;

  :deep(.el-autocomplete) {
    vertical-align: inherit;
    .el-input {
      vertical-align: inherit;
    }
    &.small {
      .el-input {
        --el-input-height: var(--el-component-size-small);
      }
    }
  }

  :deep(.autocomplete-tag-edit-list) {
    max-width: 150%;
    .tag-item {
      vertical-align: middle;
    }
  }
}
</style>
