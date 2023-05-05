<script lang="ts" setup>
import { computed, ref } from "vue";
import { useLanguage } from "@/stores/language";

const props = withDefaults(
  defineProps<{
    value?: number;
    showNone?: boolean;
    small?: boolean;
  }>(),
  { showNone: true }
);

const emit = defineEmits<{
  (event: "emit", value: number): void;
  (event: "emit-none"): void;
}>();
const language = useLanguage();

const input = ref(props.value);

function onKeydown(event: KeyboardEvent) {
  if (event.code === "Enter" && typeof input.value === "number")
    emit("emit", input.value);
}
function emitNone() {
  emit("emit-none");
}

const size = computed(() => (props.small ? "small" : undefined));
</script>

<template>
  <div class="parent" :class="{ 'show-none': showNone }">
    <label>
      <ElInputNumber
        v-model="input"
        step-strictly
        :placeholder="language.language.tagComponent.tagTypes.parent"
        :min="0"
        :step="1"
        :size="size"
        @keydown="onKeydown"
      />
    </label>
    <ElRadio
      v-if="showNone"
      :border="true"
      :label="language.language.tagComponent.tagTypes.parentNone"
      @click="emitNone"
    />
  </div>
</template>

<style lang="scss" scoped>
.parent {
  display: inline-block;
  box-shadow: 0 0 0 1px var(--el-input-border-color, var(--el-border-color))
    inset;
  border-radius: var(--el-border-radius-base);
  vertical-align: middle;

  &.show-none:deep() {
    .el-input__wrapper {
      border-top-right-radius: 0;
      border-bottom-right-radius: 0;
    }
  }

  .el-radio {
    border: none;
  }

  label {
    &,
    .el-input-number {
      vertical-align: inherit;
    }
  }
}
</style>
