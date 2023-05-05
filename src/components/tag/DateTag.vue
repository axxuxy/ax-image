<script lang="ts" setup>
import { DateTag } from "@/utils/tags";
import { ref } from "vue";
import DateRangeOrValueTagEdit from "@/components/tag/edit/DateRangeOrValueTagEdit.vue";
import { useLanguage } from "@/stores/language";
import TagValue from "@/components/tag/TagValue.vue";
import type { RangeOrValue } from "@/utils/tags";
import { ClickOutside as vClickOutside } from "element-plus";

const language = useLanguage();
defineProps<{
  tag: DateTag;
}>();

const emit = defineEmits<{
  (event: "update", value: DateTag): void;
  (event: "remove"): void;
}>();

const isEdit = ref(false);

function update(value: RangeOrValue<Date>) {
  emit("update", new DateTag(value));
}

function closeEdit() {
  isEdit.value = false;
}
</script>

<template>
  <DateRangeOrValueTagEdit
    v-if="isEdit"
    v-focus
    v-click-outside="closeEdit"
    small
    :value="tag.value"
    :placeholder="language.language.tagComponent.rangeOrValue.date"
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
