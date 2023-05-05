<script lang="ts" setup>
import { useLanguage } from "@/stores/language";
import { CommonTag, Tag } from "@/utils/tags";
import { TagMode } from "@/utils/tags";
import type { Website } from "@/utils/website";
import { ref } from "vue";
import TagValue from "@/components/tag/TagValue.vue";
import type { TagType, Tag as ApiTag } from "@/utils/api";
import AutocompleteTagEdit from "@/components/tag/edit/AutocompleteTagEdit.vue";
import { ClickOutside as vClickOutside } from "element-plus";

const props = defineProps<{
  tag: CommonTag;
  website: Website;
  fetchSuggestions: (text: string) => Promise<Array<ApiTag>>;
  type?: TagType;
}>();

const emit = defineEmits<{
  (event: "update", tag: Tag): void;
  (event: "remove"): void;
}>();

const isEdit = ref(false);

const language = useLanguage();

const modes = Object.values<TagMode>(TagMode);
function changeMode(mode: TagMode) {
  emit("update", new CommonTag(props.tag.value, mode));
}

function update(value: string) {
  emit("update", Tag.paser(value));
}

function closeEdit() {
  isEdit.value = false;
}
</script>

<template>
  <AutocompleteTagEdit
    v-if="isEdit"
    v-focus
    v-click-outside="closeEdit"
    small
    :value="tag.tag"
    :fetch-suggestions="fetchSuggestions"
    @emit="update"
  />
  <TagValue
    v-else
    :type="type"
    :tag="tag"
    @edit="isEdit = true"
    @remove="emit('remove')"
  >
    <template #default>
      <ElDropdown
        class="tag-mode"
        :class="{ 'has-type': type }"
        trigger="click"
        @command="changeMode"
      >
        <ElIcon v-if="tag!.mode === TagMode.is">+</ElIcon>
        <ElIcon v-else-if="tag!.mode === TagMode.not">-</ElIcon>
        <ElIcon v-else-if="tag!.mode === TagMode.or">~</ElIcon>
        <template #dropdown>
          <ElDropdownMenu>
            <ElDropdownItem v-for="mode in modes" :key="mode" :command="mode">
              <ElIcon v-if="mode === TagMode.is">+</ElIcon>
              <ElIcon v-else-if="mode === TagMode.not">-</ElIcon>
              <ElIcon v-else-if="mode === TagMode.or">~</ElIcon>
              <span>
                {{ language.language.tagComponent.tag.modes[mode] }}
              </span>
            </ElDropdownItem>
          </ElDropdownMenu>
        </template>
      </ElDropdown>
      <span>{{ tag.value }}</span>
    </template>
  </TagValue>
</template>

<style lang="scss" scoped>
.tag-mode {
  margin-right: 6px;
  color: var(--el-tag-text-color);
  vertical-align: baseline;

  &.has-type {
    color: var(--tag-text-color);
  }
}
</style>
