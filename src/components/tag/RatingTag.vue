<script lang="ts" setup>
import type { Rating } from "@/utils/tags";
import { ref } from "vue";
import TagValue from "@/components/tag/TagValue.vue";
import RatingTagEdit from "@/components/tag/edit/RatingTagEdit.vue";
import { RatingTag } from "@/utils/tags";
import { ClickOutside as vClickOutside } from "element-plus";

defineProps<{
  tag: RatingTag;
}>();

const emit = defineEmits<{
  (event: "update", value: RatingTag): void;
  (event: "remove"): void;
}>();

const isEdit = ref(false);

function update(value: Rating) {
  emit("update", new RatingTag(value));
}

function closeEdit() {
  isEdit.value = false;
}
</script>

<template>
  <RatingTagEdit
    v-if="isEdit"
    v-focus
    v-click-outside="closeEdit"
    small
    :value="tag.rating"
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
