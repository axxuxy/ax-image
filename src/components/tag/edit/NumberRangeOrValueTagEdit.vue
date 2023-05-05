<script lang="ts" setup>
import { computed, ref } from "vue";
import type { RangeOrValue } from "@/utils/tags";
import type { RangeOrValueText } from "@/utils/i18n";

const props = defineProps<{
  value?: RangeOrValue<number> | null;
  placeholder: RangeOrValueText;
  numberMin?: number;
  numberMax?: number;
  numberStep?: number;
  numberStepStrictly?: boolean;
  small?: boolean;
}>();

const emit = defineEmits<{
  (event: "emit", value: RangeOrValue<number>): void;
}>();

enum Mode {
  value = "value",
  range = "range",
}

const modes = computed(() =>
  Object.values(Mode).map((mode) => {
    switch (mode) {
      case Mode.range:
        return {
          mode,
          text: props.placeholder.rangeMode,
        };
      case Mode.value:
        return {
          mode,
          text: props.placeholder.valueMode,
        };
      default:
        throw new Error(`Undefined the mode name, the mode is ${mode}.`);
    }
  })
);
const mode = ref(Mode.value);

const min = ref<number>();
const max = ref<number>();
const value = ref<number>();

function setValue(_: typeof props.value) {
  if (_) {
    if (typeof _ === "number") value.value = _;
    else {
      mode.value = Mode.range;
      min.value = _.min;
      max.value = _.max;
    }
  }
}
setValue(props.value);

function computedValue() {
  switch (mode.value) {
    case Mode.range:
      if (min.value || max.value)
        return { min: min.value, max: max.value } as
          | {
              min: number;
              max?: number;
            }
          | { min: undefined; max: number };
      return;
    case Mode.value:
      return value.value;
    default:
      throw new Error(`Undefined the mode, the mode is ${mode.value}.`);
  }
}

function onKeydown(event: KeyboardEvent) {
  if (event.code === "Enter") {
    const value = computedValue();
    if (value) emit("emit", value);
  }
}

const size = computed(() => (props.small ? "small" : undefined));
</script>

<template>
  <div class="range-or-value" :class="{ small }">
    <label v-if="mode === Mode.value">
      <ElInputNumber
        v-model="value"
        :size="size"
        :placeholder="placeholder.value"
        :min="numberMin"
        :max="numberMax"
        :step="numberStep"
        :step-strictly="numberStepStrictly"
        @keydown="onKeydown"
      />
    </label>
    <template v-else-if="mode === Mode.range">
      <label>
        <ElInputNumber
          v-model="min"
          :size="size"
          :max="max || numberMax || max"
          :min="numberMin"
          :placeholder="placeholder.min"
          :step="numberStep"
          :step-strictly="numberStepStrictly"
          @keydown="onKeydown"
        />
      </label>
      <div class="split">
        <span>-</span>
      </div>
      <label>
        <ElInputNumber
          class="range-max"
          v-model="max"
          :size="size"
          :min="min || numberMin || min"
          :max="numberMax"
          :placeholder="placeholder.max"
          :step="numberStep"
          :step-strictly="numberStepStrictly"
          @keydown="onKeydown"
        />
      </label>
    </template>
    <ElSelect v-model="mode" :size="size" :teleported="false">
      <ElOption
        v-for="mode in modes"
        :key="mode.mode"
        :value="mode.mode"
        :label="mode.text"
      ></ElOption>
    </ElSelect>
  </div>
</template>

<style lang="scss" scoped>
.range-or-value {
  display: inline-block;
  --size: var(--el-component-size);
  border-radius: var(--el-input-border-radius, var(--el-border-radius-base));
  box-shadow: 0 0 0 1px var(--el-input-border-color, var(--el-border-color))
    inset;
  background-color: var(--el-input-bg-color, var(--el-fill-color-blank));
  white-space: nowrap;
  vertical-align: middle;

  &.small {
    --size: var(--el-component-size-small);
  }

  .split,
  .el-select,
  label,
  :deep(.el-input-number) {
    vertical-align: inherit;
  }

  .split {
    display: inline-block;
    width: calc(var(--size) - 2px);
    height: var(--size);
    line-height: var(--size);
    color: var(--el-color-info);
    text-align-last: center;
  }

  .el-select {
    position: initial;
    /** Need set position to initial else in overflow will lead to position abnormal */
    margin-left: -1px;

    :deep(.el-input__wrapper) {
      border-top-left-radius: 0;
      border-bottom-left-radius: 0;
      background-color: transparent;
      box-shadow: none;

      input {
        text-align: center;
        width: 5em;
      }
    }
  }

  :deep(.el-input-number) {
    .el-input__wrapper {
      border-top-right-radius: 0;
      border-bottom-right-radius: 0;
    }
  }

  :deep(.el-input-number.range-max) {
    .el-input__wrapper {
      border-top-left-radius: 0;
      border-bottom-left-radius: 0;
    }
  }
}
</style>
