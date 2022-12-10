<script setup lang="ts">
import { RouterView, useRoute } from "vue-router";
import { useRouter } from "vue-router";
import { computed } from "vue";

const routes = computed(() => useRouter().getRoutes());
const route = useRoute();
</script>

<template>
  <ElContainer>
    <ElAside class="aside" width="180px">
      <ElMenu class="routes" router>
        <ElMenuItem
          v-for="route in routes"
          :index="route.path"
          :key="route.path"
        >
          <span>{{ route.name }}</span>
        </ElMenuItem>
      </ElMenu>
    </ElAside>
    <ElMain>
      <p>path is {{ route.fullPath }}</p>
      <RouterView></RouterView>
    </ElMain>
  </ElContainer>
</template>

<style lang="scss">
.routes {
  height: 100vh;
}
</style>
