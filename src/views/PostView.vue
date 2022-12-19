<script lang="ts" setup>
import { useRoute, useRouter } from "vue-router";

const router = useRouter();
const route = useRoute();
</script>

<template>
  <ElContainer>
    <ElHeader>
      <ElPageHeader @back="router.back"></ElPageHeader>
    </ElHeader>
    <ElMain>
      <p>This's post view, the post id is {{ route.params.id }}</p>
    </ElMain>
  </ElContainer>
</template>
