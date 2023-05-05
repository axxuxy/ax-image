<script lang="ts" setup>
import { useLanguage } from "@/stores/language";
import { RatingValue, RatingMode, type Rating } from "@/utils/tags";

const language = useLanguage();
defineProps<{
  value?: Rating;
  small?: boolean;
}>();

const emit = defineEmits<{
  (event: "emit", value: Rating): void;
}>();

const ratings = Object.values(RatingValue).flatMap((value) =>
  Object.values(RatingMode).map((mode) => ({
    mode,
    value,
    key: `${mode}${value}`,
    label: language.language.tagComponent.ratings[value][mode],
  }))
);

function update(rating: Rating) {
  emit("emit", rating);
}
</script>

<template>
  <ElSelect
    :value="value"
    :size="small ? 'small' : 'default'"
    :placeholder="language.language.tagComponent.tagTypes.rating"
    :teleported="false"
    automatic-dropdown
    @change="update"
  >
    <ElOption
      v-for="rating in ratings"
      :key="rating.key"
      :value="rating"
      :label="rating.label"
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
