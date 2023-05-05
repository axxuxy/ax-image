<script lang="ts" setup>
import { ScoreTag } from "@/utils/tags";
import { ref } from "vue";
import NumberRangeOrValueTagEdit from "@/components/tag/edit/NumberRangeOrValueTagEdit.vue";
import { useLanguage } from "@/stores/language";
import type { RangeOrValue } from "@/utils/tags";
import TagValue from "@/components/tag/TagValue.vue";
import { ClickOutside as vClickOutside } from "element-plus";

const language = useLanguage();
defineProps<{
  tag: ScoreTag;
}>();

const emit = defineEmits<{
  (event: "update", value: ScoreTag): void;
  (event: "remove"): void;
}>();

const isEdit = ref(false);

function update(height: RangeOrValue<number>) {
  emit("update", new ScoreTag(height));
}

function closeEdit() {
  isEdit.value = false;
}
</script>

<template>
  <NumberRangeOrValueTagEdit
    v-if="isEdit"
    v-focus
    v-click-outside="closeEdit"
    small
    :value="tag.value"
    :placeholder="language.language.tagComponent.rangeOrValue.score"
    @emit="update"
  />
  <TagValue
    v-else
    type="meta"
    :tag="tag"
    @edit="isEdit = true"
    @remove="emit('remove')"
  />
</template>
