import { fileURLToPath } from "url";
import { defineConfig, type PluginOption } from "vite";
import vue from "@vitejs/plugin-vue";
import vueJsx from "@vitejs/plugin-vue-jsx";
import { dirname, resolve } from "path";
import {
  onService,
  mainElectron,
  rendererElectron,
} from "vite-plugin-electron";
import AutoImport from "unplugin-auto-import/vite";
import Components from "unplugin-vue-components/vite";
import { ElementPlusResolver } from "unplugin-vue-components/resolvers";
import { main } from "./package.json";
import svgLoader from "vite-svg-loader";
import Icons from "unplugin-icons/vite";
import IconsResolver from "unplugin-icons/resolver";

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      DEV_URL?: string;
    }
  }
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const plugins: PluginOption = [
    vue(),
    vueJsx(),
    svgLoader(),
    onService((url) => (process.env.DEV_URL = url)),
    mainElectron({
      output: dirname(resolve(main)),
      main: {
        input: resolve(__dirname, "src/electron.ts"),
        output: resolve(main),
      },
    }),
    rendererElectron({
      output: "renderer",
      useNode: true,
    }),
  ];

  if (mode === "debug")
    plugins.push({
      name: "vite-plugin-debug",
      apply: "serve",
      enforce: "pre",
      transformIndexHtml(html) {
        return html.replace(
          /(?<=<script .*src=")\/src\/main.ts/gm,
          "/src/debug.ts"
        );
      },
    });

  plugins.push(
    AutoImport({
      imports: ["vue"],
      resolvers: [
        ElementPlusResolver(),
        IconsResolver({
          prefix: "i",
        }),
      ],
    }),
    Components({
      resolvers: [
        IconsResolver({
          enabledCollections: ["ep"],
        }),
        ElementPlusResolver(),
      ],
    }),
    Icons({
      autoInstall: true,
    })
  );

  return {
    plugins,
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
  };
});
