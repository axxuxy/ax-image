<script lang="ts" setup>
import { computed, ref, watch } from "vue";
import type { RangeOrValue } from "@/utils/format_tags";
import type { RangeOrValueText } from "@/utils/i18n";

export interface ValueType {
  date: Date;
  number: number;
}

export type ModelValue<T extends keyof ValueType = keyof ValueType> =
  RangeOrValue<ValueType[T]> | null;

export interface Props<T extends keyof ValueType = keyof ValueType> {
  type: T;
  modelValue?: ModelValue<T>;
  text: RangeOrValueText;
  dateDisableAfter?: boolean;
  numberMin?: number;
  numberMax?: number;
  numberStep?: number;
  numberStepStrictly?: boolean;
}

const props = defineProps<Props>();
const text = computed(() => props.text);

const emit = defineEmits({
  "update:modelValue": (value: Props["modelValue"]) => value ?? true,
});

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
          text: text.value.rangeMode,
        };
      case Mode.value:
        return {
          mode,
          text: text.value.valueMode,
        };
      default:
        throw new Error(`Undefined the mode name, the mode is ${mode}.`);
    }
  })
);
const mode = ref(
  (() => {
    if (
      !props.modelValue ||
      props.modelValue instanceof Date ||
      typeof props.modelValue === "number"
    )
      return Mode.value;
    else return Mode.range;
  })()
);

const min = ref();
const max = ref();
const value = ref();

const modelValue = computed(() => {
  switch (mode.value) {
    case Mode.range:
      if (min.value || max.value) return { min: min.value, max: max.value };
      else return null;
    case Mode.value:
      return value.value;
    default:
      throw new Error(`Undefined the mode, the mode is ${mode.value}.`);
  }
});
/// Listen value change and emit update.
watch(modelValue, (_) => {
  emit("update:modelValue", _);
});

/// Listen model value change and update value.
function setValue(_: typeof props.modelValue) {
  if (_ === modelValue.value) return;
  if (_ === undefined || _ instanceof Date || typeof _ === "number") {
    mode.value = Mode.value;
    value.value = _;
  } else {
    mode.value = Mode.range;
    if (_) {
      max.value = _.max;
      min.value = _.min;
    } else max.value = min.value = undefined;
  }
}
watch(
  computed(() => props.modelValue),
  setValue,
  { immediate: true }
);

function disabledNowAfter(date: Date) {
  return props.dateDisableAfter ? date > new Date() : false;
}

function disabledMinDate(date: Date) {
  return disabledNowAfter(date) || (max.value && date > max.value);
}

function disabledMaxDate(date: Date) {
  return date < min.value || disabledNowAfter(date);
}
</script>

<template>
  <div class="box">
    <div v-if="type === 'date'">
      <div v-show="mode === Mode.value">
        <ElDatePicker
          v-model="value"
          type="date"
          :disabled-date="disabledNowAfter"
          :placeholder="text.value"
        />
      </div>
      <div v-show="mode === Mode.range" class="range">
        <ElDatePicker
          v-model="min"
          type="date"
          :disabled-date="disabledMinDate"
          :placeholder="text.min"
        />
        <div class="split">
          <span>-</span>
        </div>
        <ElDatePicker
          v-model="max"
          type="date"
          :disabled-date="disabledMaxDate"
          class="range-max"
          :placeholder="text.max"
        />
      </div>
    </div>
    <div v-else-if="type === 'number'">
      <ElInputNumber
        v-show="mode === Mode.value"
        v-model="value"
        :placeholder="text.value"
        :min="numberMin"
        :max="numberMax"
        :step="numberStep"
        :step-strictly="numberStepStrictly"
      />
      <div v-show="mode === Mode.range" class="range">
        <ElInputNumber
          v-model="min"
          :max="max || numberMax || max"
          :min="numberMin"
          :placeholder="text.min"
          :step="numberStep"
          :step-strictly="numberStepStrictly"
        />
        <div class="split"><span>-</span></div>
        <ElInputNumber
          class="range-max"
          v-model="max"
          :min="min || numberMin || min"
          :max="numberMax"
          :placeholder="text.max"
          :step="numberStep"
          :step-strictly="numberStepStrictly"
        />
      </div>
    </div>
    <p v-else>
      Undefined the type, the type is <span>{{ type }}</span
      >.
    </p>
    <ElSelect v-model="mode">
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
.box {
  display: flex;
  border-radius: var(--el-input-border-radius, var(--el-border-radius-base));
  box-shadow: 0 0 0 1px var(--el-input-border-color, var(--el-border-color))
    inset;
  background-color: var(--el-input-bg-color, var(--el-fill-color-blank));

  & > div:first-child {
    width: 100%;
  }

  .range {
    display: flex;
  }

  .split {
    display: inline-block;
    width: 32px;
    min-width: 32px;
    height: 32px;
    line-height: 30px;
    color: var(--el-color-info);
    text-align-last: center;
    vertical-align: middle;
  }

  .el-select {
    margin-left: -1px;

    :deep(.el-input__wrapper) {
      border-top-left-radius: 0;
      border-bottom-left-radius: 0;
      background-color: transparent;
      box-shadow: none;

      input {
        text-align: center;
        width: 80px;
      }
    }
  }

  :deep(.el-input-number),
  :deep(.el-date-editor) {
    width: 100%;

    .el-input__wrapper {
      border-top-right-radius: 0;
      border-bottom-right-radius: 0;
    }
  }

  :deep(.el-input-number.range-max),
  :deep(.el-date-editor.range-max) {
    .el-input__wrapper {
      border-top-left-radius: 0;
      border-bottom-left-radius: 0;
    }
  }
}
</style>
