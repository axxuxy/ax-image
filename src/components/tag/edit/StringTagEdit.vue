<script lang="ts" setup>
import { ref } from "vue";

const props = defineProps<{
  value?: string;
  placeholder?: string;
  small?: boolean;
}>();

const emit = defineEmits<{
  (event: "emit", value: string): void;
}>();

const input = ref(props.value);

function update() {
  if (input.value) emit("emit", input.value);
}

function onKeydown(event: KeyboardEvent | Event) {
  if (event instanceof KeyboardEvent && event.key === "Enter") update();
}
</script>

<template>
  <ElInput
    v-model="input"
    :size="small ? 'small' : 'default'"
    :placeholder="placeholder"
    @keydown="onKeydown"
  />
</template>

<style lang="scss" scoped>
.el-input {
  width: auto;
}
</style>
