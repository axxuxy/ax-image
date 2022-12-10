import { defineConfig } from "vitest/config";
import { mergeConfig, type UserConfigFn } from "vite";
import viteConfig from "./vite.config";

export default defineConfig((option) => {
  return mergeConfig((viteConfig as UserConfigFn)(option), {
    test: {
      include: ["src/**/__tests__/*"],
      environment: "jsdom",
      watch: false,
    },
  });
});
