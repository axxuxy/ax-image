import type { Proxy } from "@/utils/request";
import { defineStore } from "pinia";
import { ref, watch } from "vue";
import { setProxy as setRequestProxy } from "@/utils/request";
import { ipcRenderer } from "electron";
import { resolve } from "path";
import { setMaxDownloadCount } from "@/utils/download";
import { RatingMode, RatingValue } from "@/utils/format_tags";
import { setRating } from "@/utils/api";

export const useConfig = defineStore("config", () => {
  const proxy = ref<Proxy | undefined>();
  async function setProxy(_: Proxy | undefined) {
    setRequestProxy(_);
    if (_) {
      await ipcRenderer.invoke("set proxy", `${_.type}://${_.host}:${_.port}`);
      localStorage.setItem("proxy", JSON.stringify(_));
    } else {
      await ipcRenderer.invoke("clear proxy");
      localStorage.removeItem("proxy");
    }
    proxy.value = _;
  }

  const downloadSaveDir = ref(
    localStorage.getItem("download-save-dir") || resolve("./")
  );
  watch(downloadSaveDir, (_) => localStorage.setItem("download-save-dir", _));

  const downloadMaxCount = ref(
    (() => {
      // return 0;
      const _ = localStorage.getItem("download-max-count");
      if (!_) return 5;
      try {
        const value = parseInt(_);
        return value > 0 ? value : 5;
      } catch (error) {
        return 5;
      }
    })()
  );
  watch(
    downloadMaxCount,
    (value) => {
      setMaxDownloadCount(value);
      localStorage.setItem("download-max-count", value.toString());
    },
    {
      immediate: true,
    }
  );

  const rating = ref(localStorage.getItem("rating") ? true : false);
  watch(
    rating,
    (value) => {
      if (value) {
        localStorage.setItem("rating", "true");
        setRating({
          mode: RatingMode.is,
          value: RatingValue.safe,
        });
      } else {
        localStorage.removeItem("rating");
        setRating();
      }
    },
    {
      immediate: true,
    }
  );
  return { proxy, setProxy, downloadSaveDir, downloadMaxCount, rating };
});
