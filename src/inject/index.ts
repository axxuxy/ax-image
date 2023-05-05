import type { InjectionKey } from "vue";

export const downloadPageKeepAliveKey = Symbol() as InjectionKey<
  (keep: boolean) => void
>;
