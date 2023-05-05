<script setup lang="ts">
import { useLanguage } from "@/stores/language";
import { TagType, type Tag } from "@/utils/api";
import type { TagMode } from "@/utils/tags";
import { computed } from "vue";
import TagItem from "@/components/tag/TagItem.vue";

const props = defineProps<{ tags: Array<Tag> }>();

const lang = useLanguage();

const tagsInTypes = computed(() => {
  return Object.values(TagType)
    .map((type) => ({
      type,
      name: lang.language.tagComponent.tag.types[type],
      values: props.tags.filter((tag) => tag.type === type),
    }))
    .filter((_) => _.values.length);
});

const emit = defineEmits<{
  (event: "open-tag", tag: Tag, mode?: TagMode): void;
}>();

function click(tag: Tag, mode?: TagMode) {
  emit("open-tag", tag, mode);
}
</script>

<template>
  <ul class="tag-types">
    <li v-for="tagType in tagsInTypes" :key="tagType.type">
      <p>{{ tagType.name }}</p>
      <ul class="tags">
        <li v-for="tag in tagType.values" :key="tag.id">
          <TagItem :tag="tag" @click="click(tag, $event)" />
        </li>
      </ul>
    </li>
  </ul>
</template>

<style lang="scss" scoped>
.tag-types {
  .tags {
    li {
      padding-bottom: 8px;

      &:last-child {
        padding-bottom: 0;
      }
    }
  }
}
</style>
