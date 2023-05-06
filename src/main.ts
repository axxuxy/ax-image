import { createApp } from "vue";
import { createPinia } from "pinia";

import App from "@/App.vue";
import router from "@/router";

import "@/assets/main.scss";

import {
  vueCaptureErrorPlugin,
  addErrorEventListener,
} from "@/utils/capture_error";

import { ipcRenderer } from "electron";
import { useConfig } from "@/stores/config";

import {
  DownloadEvent,
  DownloadOption,
  DownloadType,
  addDwonloadListen,
  download,
  getDownloads,
} from "@/utils/download";
import type { Post } from "@/utils/api";
import type { Website } from "@/utils/website";
import { downloadedDB } from "@/utils/db";

addErrorEventListener((errorInfo) => {
  console.error(errorInfo);
});

const app = createApp(App);

app.use(vueCaptureErrorPlugin);

app.use(createPinia());
app.use(router);

app.directive("focus", {
  mounted(element: HTMLElement, binding) {
    if (binding.value ?? true) element.querySelector("input")?.focus();
  },
});

const proxy = localStorage.getItem("proxy");
if (proxy)
  useConfig()
    .setProxy(JSON.parse(proxy))
    .catch((error) =>
      window.dispatchEvent(new ErrorEvent("Error", <Error>error))
    )
    .finally(() => app.mount("#app"));
else app.mount("#app");

window.addEventListener("keydown", (event) => {
  if (event.shiftKey && event.ctrlKey && event.key === "I")
    ipcRenderer.send("devtool");
});

window.addEventListener("unload", () => {
  localStorage.setItem(
    "downloading-list",
    JSON.stringify(
      getDownloads().map((_) => ({
        post: _.post,
        website: _.website,
        downloadType: _.downloadType,
        savePath: _.savePath,
      }))
    )
  );
});
((downloadingListText: string | null) => {
  localStorage.removeItem("downloading-list");
  if (downloadingListText)
    (<
      Array<{
        post: Post;
        downloadType: DownloadType;
        website: Website;
        savePath: string;
      }>
    >JSON.parse(downloadingListText)).forEach((_) => {
      download(
        Object.assign(
          { savePath: _.savePath },
          <
            DownloadOption & {
              downloadInfo: Exclude<DownloadOption["downloadInfo"], undefined>;
            }
          >new DownloadOption(_)
        )
      );
    });
})(localStorage.getItem("downloading-list"));

addDwonloadListen((download, event) => {
  if (event === DownloadEvent.succeed)
    downloadedDB.save(download.getDownloadedInfo());
});
