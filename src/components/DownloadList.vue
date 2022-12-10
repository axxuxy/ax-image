<script lang="ts" setup>
import type { Website } from "@/utils/website";

defineProps<{
  website?: Website;
  search?: string;
  date?: Date;
  downloaded?: boolean;
}>();
</script>

<template>
  <p>This's download list.</p>
  <p>Download list props is:</p>
  <code>{{ $props }}</code>
</template>

<style lang="scss" scoped>
code {
  white-space: pre-wrap;
}
</style>
