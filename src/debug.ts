import { createApp } from "vue";
import { createRouter, createWebHistory } from "vue-router";
import App from "@/DebugApp.vue";
import "@/assets/main.scss";
import ElementPlus from "element-plus";
import * as ElementPlusIconsVue from "@element-plus/icons-vue";

const route = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/db",
      name: "db",
      component: () => import("@/utils/__debug__/DBDebug.vue"),
    },
    {
      path: "/download",
      name: "download",
      component: () => import("@/utils/__debug__/DownloadDebug.vue"),
    },
  ],
});

const app = createApp(App);
app.use(route);
app.use(ElementPlus);

for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component);
}

app.mount("#app");
