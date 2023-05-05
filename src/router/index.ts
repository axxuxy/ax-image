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
      props: (to) => ({
        website: to.query.website,
        id: parseInt(to.params.id as string),
      }),
    },
    {
      path: "/search",
      name: "search",
      component: () => import("@/views/SearchView.vue"),
      props: (to) => ({
        website: to.query.website,
        tags:
          typeof to.query.tags === "string"
            ? to.query.tags.split(",")
            : to.query.tags,
      }),
    },
  ],
});

export default router;
