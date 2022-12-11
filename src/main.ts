import { createApp } from "vue";
import { createPinia } from "pinia";

import App from "@/App.vue";
import router from "@/router";

import "@/assets/main.scss";

import ElementPlus from "element-plus";
import {
  vueCaptureErrorPlugin,
  addErrorEventListener,
} from "@/utils/capture_error";

import * as ElementPlusIconsVue from "@element-plus/icons-vue";
import { ipcRenderer } from "electron";
import { useConfig } from "@/stores/config";

addErrorEventListener((errorInfo) => {
  console.error(errorInfo);
});

const app = createApp(App);

app.use(ElementPlus);
app.use(vueCaptureErrorPlugin);

for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component);
}

app.use(createPinia());
app.use(router);

const proxy = localStorage.getItem("proxy");
if (proxy)
  useConfig()
    .setProxy(JSON.parse(proxy))
    .catch((error) =>
      window.dispatchEvent(new ErrorEvent("Error", error as Error))
    )
    .finally(() => app.mount("#app"));
else app.mount("#app");

window.addEventListener("keydown", (event) => {
  if (event.shiftKey && event.ctrlKey && event.key === "I")
    ipcRenderer.send("devtool");
});
