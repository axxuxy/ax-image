<script lang="ts" setup>
import { computed, ref } from "vue";
import type { RangeOrValue } from "@/utils/tags";
import type { RangeOrValueText } from "@/utils/i18n";

const props = defineProps<{
  value?: RangeOrValue<Date>;
  placeholder: RangeOrValueText;
  small?: boolean;
}>();

const emit = defineEmits<{
  (event: "emit", value: RangeOrValue<Date>): void;
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
    }
  })
);
const mode = ref(Mode.value);

const min = ref<Date>();
const max = ref<Date>();
const value = ref<Date>();

function setValue(_?: RangeOrValue<Date>) {
  if (_) {
    if (_ instanceof Date) value.value = _;
    else {
      mode.value = Mode.range;
      max.value = _.max;
      min.value = _.min;
    }
  }
}
setValue(props.value);

function disabledNowAfter(date: Date) {
  return date > new Date();
}

function disabledMinDate(date: Date) {
  return disabledNowAfter(date) || (max.value && date > max.value);
}

function disabledMaxDate(date: Date) {
  return disabledNowAfter(date) || (min.value && date < min.value);
}

function computedValue() {
  switch (mode.value) {
    case Mode.range:
      if (min.value || max.value)
        return { min: min.value, max: max.value } as
          | {
              min: Date;
              max?: Date;
            }
          | { min: undefined; max: Date };
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
    <ElDatePicker
      v-if="mode === Mode.value"
      v-model="value"
      type="date"
      :size="size"
      :disabled-date="disabledNowAfter"
      :placeholder="placeholder.value"
      :teleported="false"
      @keydown="onKeydown"
    />
    <template v-else-if="mode === Mode.range">
      <ElDatePicker
        v-model="min"
        type="date"
        :size="size"
        :disabled-date="disabledMinDate"
        :placeholder="placeholder.min"
        :teleported="false"
        @keydown="onKeydown"
      />
      <div class="split">
        <span>-</span>
      </div>
      <ElDatePicker
        v-model="max"
        type="date"
        class="range-max"
        :size="size"
        :disabled-date="disabledMaxDate"
        :placeholder="placeholder.max"
        :teleported="false"
        @keydown="onKeydown"
      />
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
  :deep(.el-date-editor) {
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
    /** Need set position to initial else in overflow will lead to position abnormal */
    position: initial;
    margin-left: -1px;

    :deep(.el-input__wrapper) {
      border-top-left-radius: 0;
      border-bottom-left-radius: 0;
      background-color: transparent;
      box-shadow: none;

      input {
        text-align: center;
        width: 4em;
      }
    }
  }

  :deep(.el-date-editor) {
    .el-input__wrapper {
      border-top-right-radius: 0;
      border-bottom-right-radius: 0;
    }
  }

  :deep(.el-date-editor.range-max) {
    .el-input__wrapper {
      border-top-left-radius: 0;
      border-bottom-left-radius: 0;
    }
  }
}
</style>
