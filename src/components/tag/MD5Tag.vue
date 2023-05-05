<script lang="ts" setup>
import { MD5Tag } from "@/utils/tags";
import { ref } from "vue";
import TagValue from "@/components/tag/TagValue.vue";
import StringTagEdit from "@/components/tag/edit/StringTagEdit.vue";
import { useLanguage } from "@/stores/language";
import { ClickOutside as vClickOutside } from "element-plus";

defineProps<{
  tag: MD5Tag;
}>();

const emit = defineEmits<{
  (event: "update", value: MD5Tag): void;
  (event: "remove"): void;
}>();

const language = useLanguage();

const isEdit = ref(false);

function update(md5: string) {
  emit("update", new MD5Tag(md5));
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
    :value="tag.md5"
    :placeholder="language.language.tagComponent.tagTypes.md5"
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
