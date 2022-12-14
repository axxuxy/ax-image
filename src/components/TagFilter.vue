<script lang="ts" setup>
import { TagMode, type TagsOptions } from "@/utils/format_tags";
import type { Website } from "@/utils/website";
import { computed, nextTick, ref } from "vue";
import AutocompleteInputTagVue from "@/components/tools/AddTag.vue";
import type { Tag } from "@/components/tools/AddTagItem.vue";
import { storeToRefs } from "pinia";
import { useLanguage } from "@/stores/language";

export interface TagFilterOptions extends TagsOptions {
  tags?: Array<Tag>;
}

const props = defineProps<{
  modelValue?: TagFilterOptions;
  website: Website;
}>();

const emit = defineEmits({
  search: (value: TagFilterOptions) => value && true,
  close: () => true,
});

const { language } = storeToRefs(useLanguage());

const tags = ref(props.modelValue?.tags ?? []);

/// Add tag and remove tag function.
function selectTag(tag: Tag) {
  const _ = tags.value.filter((_) => _.name !== tag.name);
  _.push({
    ...tag,
  });
  tags.value = _;
}
function removeTag(tag: Tag | { type: string }) {
  tags.value = tags.value.filter((_) => _ !== tag);
}

function search() {
  emit("search", {
    tags: tags.value,
  });
}

const modes = computed(() => Object.values(TagMode));

function changeTagMode({ tag, mode }: { tag: Tag; mode: TagMode }) {
  tag.mode = mode;
  nextTick();
}
</script>

<template>
  <ElSpace direction="vertical" class="tags-box" alignment="start" fill>
    <ElSpace wrap class="tag-list">
      <ElTag
        v-for="tag in tags"
        :key="tag.id"
        closable
        @close="removeTag(tag)"
        disable-transitions
        :class="['--tag', `--tag-${tag.type}`]"
        :title="language.filterTagComponent.tagTypes[tag.type]"
      >
        <ElDropdown trigger="click" @command="changeTagMode" class="--tag-mode">
          <ElIcon v-if="tag.mode === TagMode.is">+</ElIcon>
          <ElIcon v-else-if="tag.mode === TagMode.not">-</ElIcon>
          <ElIcon v-else-if="tag.mode === TagMode.or">~</ElIcon>
          <template #dropdown>
            <ElDropdownMenu>
              <ElDropdownItem
                v-for="mode in modes"
                :key="mode"
                :command="{ tag, mode }"
              >
                <ElIcon v-if="mode === TagMode.is">+</ElIcon>
                <ElIcon v-else-if="mode === TagMode.not">-</ElIcon>
                <ElIcon v-else-if="mode === TagMode.or">~</ElIcon>
                <span>
                  {{ language.filterTagComponent.tagModes[mode] }}
                </span>
              </ElDropdownItem>
            </ElDropdownMenu>
          </template>
        </ElDropdown>
        <span>{{ tag.name }}</span>
        <span> - </span>
        <span>{{ tag.count }}</span>
      </ElTag>
      <AutocompleteInputTagVue
        :website="props.website"
        @select="selectTag"
      ></AutocompleteInputTagVue>
    </ElSpace>
    <ElSpace style="justify-content: end">
      <ElButton circle @click="search" icon="search"></ElButton>
      <ElButton circle @click="emit('close')" icon="close"> </ElButton>
    </ElSpace>
  </ElSpace>
</template>

<style lang="scss" scoped>
.tags-box {
  width: 100%;
  .--tag-mode {
    margin-left: -4px;
    margin-right: 4px;
  }
}
</style>
