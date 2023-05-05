<script lang="ts" setup>
import { SourceTag } from "@/utils/tags";
import { ref } from "vue";
import TagValue from "@/components/tag/TagValue.vue";
import StringTagEdit from "@/components/tag/edit/StringTagEdit.vue";
import { useLanguage } from "@/stores/language";
import { ClickOutside as vClickOutside } from "element-plus";

defineProps<{
  tag: SourceTag;
}>();

const emit = defineEmits<{
  (event: "update", value: SourceTag): void;
  (event: "remove"): void;
}>();

const language = useLanguage();
const isEdit = ref(false);

function update(value: string) {
  emit("update", new SourceTag(value));
}

function closeEdit() {
  isEdit.value = false;
}
</script>

<template>
  <StringTagEdit
    v-if="isEdit"
    v-focus
    v-click-outside="closeEdit"
    small
    :value="tag.source"
    :placeholder="language.language.tagComponent.tagTypes.source"
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
