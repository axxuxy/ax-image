<script lang="ts" setup>
import { ParentTag } from "@/utils/tags";
import { ref } from "vue";
import TagValue from "@/components/tag/TagValue.vue";
import ParentTagEdit from "./edit/ParentTagEdit.vue";
import { ClickOutside as vClickOutside } from "element-plus";

const props = defineProps<{
  tag: ParentTag;
}>();

const emit = defineEmits<{
  (event: "update", value: ParentTag): void;
  (event: "remove"): void;
}>();

const isEdit = ref(false);

function update(id: number) {
  isEdit.value = false;
  if (id === props.tag.id) return;
  emit("update", new ParentTag(id));
}

function closeEdit() {
  isEdit.value = false;
}
</script>

<template>
  <ParentTagEdit
    v-if="isEdit"
    v-focus
    v-click-outside="closeEdit"
    small
    :value="tag.id"
    :show-none="false"
    @emit="update"
  />
  <TagValue
    v-else
    type="meta"
    :tag="tag"
    :hide-edit="isNaN(tag.id)"
    @edit="isEdit = true"
    @remove="emit('remove')"
  />
</template>
