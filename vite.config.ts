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
import { readFileSync } from "fs";
import { main } from "./package.json";
import { createServer } from "http";
import type { AddressInfo } from "net";
import { spawn } from "child_process";
import svgLoader from "vite-svg-loader";

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      DEV_URL?: string;
    }
  }
}

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
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

  if (command === "serve") {
    plugins.push({
      name: "auto-import-element-plus-serve",
      apply: "serve",
      enforce: "pre",
      transformIndexHtml(html) {
        const htmlLine = html.split("\n");
        const index = htmlLine.findIndex((line) => /<meta /.test(line));
        const css = readFileSync(
          resolve(
            dirname(require.resolve("element-plus/package.json")),
            "dist/index.css"
          ),
          "utf-8"
        );
        htmlLine.splice(
          index,
          0,
          htmlLine[index].replace(/<.+/, `<style>${css}</style>`)
        );
        return {
          html: htmlLine.join("\n"),
          tags: [],
        };
      },
    });
    if (mode === "devtools")
      plugins.push(
        (() => {
          const serve = createServer().listen(0);
          process.env.PORT = (serve.address() as AddressInfo).port.toString();
          serve.close();
          const _ = spawn(
            "node",
            [
              resolve(
                dirname(require.resolve("@vue/devtools/package.json")),
                "bin.js"
              ),
            ],
            { stdio: "inherit" }
          );
          return {
            name: "load-vue-devtools",
            configureServer(serve) {
              serve.httpServer?.once("close", () => _.kill());
            },
            transformIndexHtml: (html) => {
              const htmlLine = html.split("\n");
              const index = htmlLine.findIndex((line) => /<title/.test(line));
              htmlLine.splice(
                index,
                0,
                `<script>window.__VUE_DEVTOOLS_HOST__ = 'localhost';window.__VUE_DEVTOOLS_PORT__ = ${process.env.PORT}</script>`,
                htmlLine[index].replace(
                  /<.+/,
                  `<script src="http://localhost:${process.env.PORT}"></script>`
                )
              );

              return {
                html: htmlLine.join("\n"),
                tags: [],
              };
            },
          };
        })()
      );
  } else
    plugins.push(
      AutoImport({
        resolvers: [ElementPlusResolver()],
      }),
      Components({
        resolvers: [ElementPlusResolver()],
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
