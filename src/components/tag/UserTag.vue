<script lang="ts" setup>
import { UserTag } from "@/utils/tags";
import { ref } from "vue";
import TagValue from "@/components/tag/TagValue.vue";
import StringTagEdit from "@/components/tag/edit/StringTagEdit.vue";
import { useLanguage } from "@/stores/language";
import { ClickOutside as vClickOutside } from "element-plus";

defineProps<{
  tag: UserTag;
}>();

const emit = defineEmits<{
  (event: "update", value: UserTag): void;
  (event: "remove"): void;
}>();

const language = useLanguage();
const isEdit = ref(false);

function update(user: string) {
  emit("update", new UserTag(user));
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
    :value="tag.user"
    :placeholder="language.language.tagComponent.tagTypes.user"
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
