import { describe, it, afterAll, beforeAll, afterEach, expect } from "vitest";
import Request from "@/utils/request";
import { setupServer } from "msw/node";
import { rest } from "msw";
import { dirname, extname, resolve } from "path";
import {
  appendFileSync,
  createReadStream,
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
} from "fs";
import { createInterface } from "readline";
import "@/utils/__tools__/request";
import { createServer } from "http";

const downloadFilePath = resolve(__dirname, "__temp__", "download.txt");
if (existsSync(downloadFilePath)) rmSync(downloadFilePath);
else {
  const downloadFileDir = dirname(downloadFilePath);
  if (!existsSync(downloadFileDir))
    mkdirSync(downloadFileDir, { recursive: true });
}
const downloadFileContextLine = "fhdanfjhadipfadfhjadlfadjhgadjfhoaphdfkjfd";
const line = 2000;
for (let index = 0; index < line; ) {
  appendFileSync(downloadFilePath, downloadFileContextLine);
  if (++index < line) appendFileSync(downloadFilePath, "\n");
}

const json = {
  name: "json",
};

const downloadUrl = "http://axxuxy.xyz/download.txt";
const requestUrl = "http://axxuxy.xyz/json";
const serve = setupServer(
  rest.all(downloadUrl, (req, res, ctx) =>
    res(ctx.status(200), ctx.body(readFileSync(downloadFilePath)))
  ),
  rest.all(requestUrl, (req, res, ctx) => res(ctx.status(200), ctx.json(json)))
);

describe.concurrent("Test request module.", () => {
  beforeAll(() => serve.listen({ onUnhandledRequest: "bypass" }));
  afterAll(() => serve.close());
  afterEach(() => serve.resetHandlers());

  it.concurrent("Test request module request function.", async () => {
    await expect(
      new Request(requestUrl).getJson<typeof json>(),
      "Request data unequal to json."
    ).resolves.toEqual(json);
  });

  it.concurrent("Test request module download function.", async () => {
    const savePath = resolve(
      __dirname,
      "__temp__",
      "save" + extname(downloadUrl)
    );
    if (existsSync(savePath)) rmSync(savePath);
    let isOnprogress = false;
    await new Request(downloadUrl).download(savePath, {
      onprogress: () => (isOnprogress = true),
    });

    expect(isOnprogress, "The onprogress is not run.").toBeTruthy();

    await expect(
      new Promise<void>((resolve, reject) => {
        setTimeout(() => {
          reject("Readline download file Timeout");
        }, 10000);

        let lineCount = 0;
        createInterface({
          input: createReadStream(savePath),
        })
          .on("line", (line) => {
            if (line !== downloadFileContextLine)
              reject(
                "Save download file context line unequal to download file line."
              );
            lineCount++;
          })
          .once("close", () => {
            if (lineCount !== line)
              reject(
                "Save download file context line count unequal to download file line count."
              );
            else resolve();
          });
      })
    ).resolves.toBeUndefined();
  });

  it.concurrent(
    "Test request module cancel download.",
    async () => {
      const server = createServer((req, res) => {
        setTimeout(() => {
          res.write("write");

          setTimeout(() => {
            res.end("end");
          }, 5000);
        }, 1000);
      }).listen(0);
      const address = server.address();
      if (!address) throw new Error("Serve address is null.");
      const url =
        typeof address === "string"
          ? address
          : `http://127.0.0.1:${address.port}`;

      /// Test cancel download on after in responese.
      const cancelPath1 = resolve(__dirname, "__temp__", "cancel1.txt");
      if (existsSync(cancelPath1)) rmSync(cancelPath1);
      await expect(
        new Promise((resolve, reject) => {
          const abortController = new AbortController();
          new Request(url)
            .download(cancelPath1, {
              abortController,
            })
            .then(resolve)
            .catch(reject);
          setTimeout(() => {
            abortController.abort();
          }, 1500);
        }),
        "Cancel download work abnormal in after in has response."
      ).resolves.toSatisfy(
        () =>
          existsSync(cancelPath1) &&
          readFileSync(cancelPath1, "utf-8") === "write"
      );

      /// Test await responese cancel download.
      const cancelPath2 = resolve(__dirname, "__temp__", "cancel2.txt");
      if (existsSync(cancelPath2)) rmSync(cancelPath2);
      await expect(
        new Promise((resolve, reject) => {
          const abortController = new AbortController();
          new Request(url)
            .download(cancelPath2, {
              abortController,
            })
            .then(resolve)
            .catch(reject);
          setTimeout(() => {
            abortController.abort();
          }, 500);
        }),
        "In not response the time to cancel download work abnormal."
      ).resolves.toSatisfy(() => !existsSync(cancelPath2));

      /// Test right away cancel download.
      const cancelPath3 = resolve(__dirname, "__temp__", "cancel3.txt");
      if (existsSync(cancelPath3)) rmSync(cancelPath3);
      await expect(
        new Promise<void>((resolve, reject) => {
          const abortController = new AbortController();
          new Request(url)
            .download(cancelPath3, {
              abortController,
            })
            .then(resolve)
            .catch(reject);
          abortController.abort();
        }),
        "At once cancel download work abnormal."
      ).resolves.toSatisfy(() => !existsSync(cancelPath3));

      server.close();
    },
    {
      timeout: 30000,
    }
  );

  /// The test request proxy need todo.
  it.todo("Test request module set proxy.");
});
