import type { Proxy } from "@/utils/request";
import { defineStore } from "pinia";
import { ref } from "vue";
import { setProxy as setRequestProxy } from "@/utils/request";
import { ipcRenderer } from "electron";

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
  return { proxy, setProxy };
});
