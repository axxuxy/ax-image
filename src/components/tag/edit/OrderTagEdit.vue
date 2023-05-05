<script lang="ts" setup>
import { useLanguage } from "@/stores/language";
import { Order } from "@/utils/tags";
import { computed } from "vue";

const language = useLanguage();
defineProps<{
  value?: Order;
  small?: boolean;
}>();

const emit = defineEmits<{
  (event: "emit", value: Order): void;
}>();

const orders = computed(() =>
  Object.values(Order).map((order) => ({
    order,
    label: language.language.tagComponent.orders[order],
  }))
);

function update(order: Order) {
  emit("emit", order);
}
</script>

<template>
  <ElSelect
    automatic-dropdown
    :value="value"
    :size="small ? 'small' : 'default'"
    :placeholder="language.language.tagComponent.tagTypes.order"
    :teleported="false"
    @change="update"
  >
    <ElOption
      v-for="item in orders"
      :key="item.order"
      :value="item.order"
      :label="item.label"
    ></ElOption>
  </ElSelect>
</template>

<style lang="scss" scoped>
.el-select {
  position: initial;
  /** Need set position to initial else in overflow will lead to position abnormal */
  :deep(.el-input__wrapper) {
    input {
      width: 7em;
    }
  }
}
</style>
