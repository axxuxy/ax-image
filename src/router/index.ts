import { createRouter, createWebHistory } from "vue-router";
import HomeView from "@/views/HomeView.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "home",
      component: HomeView,
    },
    {
      path: "/download",
      name: "download",
      component: () => import("@/views/DownloadView.vue"),
    },
    {
      path: "/setting",
      name: "setting",
      component: () => import("@/views/SettingView.vue"),
    },
    {
      path: "/post/:id",
      name: "post",
      component: () => import("@/views/PostView.vue"),
    },
  ],
});

export default router;
