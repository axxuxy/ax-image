<script lang="ts" setup>
import type { Order } from "@/utils/tags";
import { OrderTag } from "@/utils/tags";
import { ref } from "vue";
import TagValue from "@/components/tag/TagValue.vue";
import OrderTagEdit from "@/components/tag/edit/OrderTagEdit.vue";
import { ClickOutside as vClickOutside } from "element-plus";

defineProps<{
  tag: OrderTag;
}>();

const emit = defineEmits<{
  (event: "update", value: OrderTag): void;
  (event: "remove"): void;
}>();

const isEdit = ref(false);

function update(order: Order) {
  emit("update", new OrderTag(order));
}

function closeEdit() {
  isEdit.value = false;
}
</script>

<template>
  <OrderTagEdit
    v-if="isEdit"
    v-focus
    v-click-outside="closeEdit"
    small
    :value="tag.order"
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
