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
  const _proxy = localStorage.getItem("proxy");

  if (_proxy)
    try {
      setProxy(JSON.parse(_proxy));
    } catch (error) {
      window.dispatchEvent(new ErrorEvent("Error", error as Error));
    }
  return { proxy, setProxy };
});
