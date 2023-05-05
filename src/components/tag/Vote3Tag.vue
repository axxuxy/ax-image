<script lang="ts" setup>
import { Vote3Tag } from "@/utils/tags";
import { ref } from "vue";
import TagValue from "@/components/tag/TagValue.vue";
import StringTagEdit from "@/components/tag/edit/StringTagEdit.vue";
import { useLanguage } from "@/stores/language";
import { ClickOutside as vClickOutside } from "element-plus";

defineProps<{
  tag: Vote3Tag;
}>();

const emit = defineEmits<{
  (event: "update", value: Vote3Tag): void;
  (event: "remove"): void;
}>();

const language = useLanguage();
const isEdit = ref(false);

function update(vote3: string) {
  emit("update", new Vote3Tag(vote3));
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
    :value="tag.vote"
    :placeholder="language.language.tagComponent.tagTypes.vote3"
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
