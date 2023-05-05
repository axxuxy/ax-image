<script lang="ts" setup>
withDefaults(
  defineProps<{
    aspectRatio?: number;
  }>(),
  {
    aspectRatio: 1,
  }
);
</script>

<template>
  <div class="box">
    <div :style="{ aspectRatio }">
      <div :style="{ aspectRatio }">
        <slot></slot>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.box {
  width: 100%;

  &,
  & > div {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
  }
  & > div {
    width: auto;
    max-width: 100%;

    & > div {
      width: 100%;
      height: auto;
      max-height: 100%;
    }
  }
}
</style>
