import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import {
  addDwonloadListen,
  cancelDownload,
  download,
  DownloadEvent,
  DownloadType,
  getDownalods,
  getMaxDownloadCount,
  removeDwonloadListen,
  setMaxDownloadCount,
  type _,
} from "@/utils/download";
import { getPost } from "@/utils/__tools__/posts";
import { Website } from "@/utils/website";
import { basename, resolve } from "path";
import "@/utils/__tools__/request";
import { setupServer } from "msw/node";
import { rest } from "msw";
import { readFileSync } from "fs";

function sleep(timeout: number): Promise<void> {
  return new Promise<void>((resolve) => {
    setTimeout(() => {
      resolve();
    }, timeout);
  });
}

const awaitUrl = "http://axxuxy.xyz/await";
const failedUrl = "http://axxuxy.xyz/failed";
const succeedUrl = "http://axxuxy.xyz/succeed";
function _getPost(website: Website, _ = awaitUrl) {
  const post = getPost(website);
  post.file_url = post.jpeg_url = post.sample_url = _;
  return post;
}
const serve = setupServer(
  rest.get(awaitUrl, (req, res, ctx) => res(ctx.delay("infinite"))),
  rest.get(failedUrl, (req, res, ctx) => res(ctx.status(404), ctx.delay(100))),
  rest.get(succeedUrl, (req, res, ctx) =>
    res(ctx.status(200), ctx.delay(100), ctx.text("succeed"))
  )
);

describe("Test download module.", () => {
  beforeAll(() => serve.listen({ onUnhandledRequest: "error" }));
  afterEach(() => serve.resetHandlers());
  afterAll(() => serve.close());

  /// Cannot run concurrent mode, because add all download share.
  it("Test download module download, download setting, download stop function.", async () => {
    /// Start check has download item.
    expect(
      getDownalods().length,
      "Not add download item has downloads item."
    ).toBe(0);

    const website = Website.konachan;
    const post = _getPost(website);
    const downloadType = DownloadType.file;
    const savePath = resolve(__dirname, "__temp__", "save_path.txt");

    /// Check add download whether work.
    download({
      website,
      downloadType,
      post,
      savePath,
    });
    const downloads = getDownalods();
    expect(
      downloads.length,
      "Only add one item of download,but get more item of download."
    ).toBe(1);
    const addDownload = downloads[0];
    expect(
      addDownload.website,
      "Website of download item isn't input website."
    ).toBe(website);
    expect(
      addDownload.downloadType,
      "Download type of download item isn't input download type."
    ).toBe(downloadType);
    expect(addDownload.post, "Post of download item isn't input post.").toEqual(
      post
    );
    expect(
      addDownload.savePath,
      "Save path of download item isn't input save path."
    ).toBe(savePath);

    /// Check add max download count whether work.
    setMaxDownloadCount(1);
    expect(
      getMaxDownloadCount(),
      "Not abnormal work, setMaxDownloadCount or getDownloadCount function."
    ).toBe(1);
    const website2 = Website.yande;
    const post2 = _getPost(Website.yande);
    download({
      website: website2,
      post: post2,
      downloadType: DownloadType.jpeg,
      savePath: resolve(__dirname, "__temp__", "save2_path"),
    });
    expect(
      getDownalods(),
      "Not abnormal work, add the second download item."
    ).toHaveLength(2);
    await sleep(100);
    expect(
      getDownalods().filter((download) => download.isDownloading),
      "In downloading item count abnormal."
    ).toHaveLength(1);
    setMaxDownloadCount(2);
    await sleep(100);
    expect(
      getDownalods().filter((download) => download.isDownloading),
      "Increase max download count after in downloading item not run auto add."
    ).toHaveLength(2);

    /// Check stop download.
    getDownalods().forEach((download) => download.stop());
    await sleep(100);

    expect(
      getDownalods().filter(
        (download) =>
          download.isStop && !download.isDownloading && !download.downloadError
      ),
      "Stop downlad not abnormal work."
    ).toHaveLength(2);

    getDownalods().forEach(cancelDownload);
    expect(getDownalods(), "Cancel download function abnormal work.").toEqual(
      []
    );
  });
  it.only("Test download module addDwonloadListen and removeDwonloadListen function.", async () => {
    const listen: { [key: string]: any } = {};

    function _listen(download: _, event: DownloadEvent) {
      listen[event] = download;
    }
    addDwonloadListen(_listen);

    /// Listen stop download.
    const awaitSavePath = resolve(__dirname, "__temp__", "listen-await.txt");
    download({
      website: Website.konachan,
      post: _getPost(Website.konachan),
      downloadType: DownloadType.file,
      savePath: awaitSavePath,
    });
    const awaitDownloads = getDownalods();
    expect(
      awaitDownloads.length,
      "Add one await download item, download count not is one."
    ).toBe(1);
    const awaitDownload = awaitDownloads[0];
    awaitDownload.stop();
    await sleep(10);
    expect(
      listen[DownloadEvent.stop],
      "Not listen download stop event."
    ).toBeTruthy();
    expect(
      listen[DownloadEvent.stop],
      "Stop event download item not is add download item."
    ).toBe(awaitDownload);
    cancelDownload(awaitDownload);
    expect(
      listen[DownloadEvent.cancel],
      "Cancel event not listened."
    ).toBeTruthy();
    expect(
      listen[DownloadEvent.cancel],
      "Cancel event download item isn't canneled download item."
    ).toBe(awaitDownload);
    expect(
      getDownalods(),
      "Cencal download work abnormal, in await download item."
    ).toEqual([]);

    /// List failed download.
    const failedSavePath = resolve(__dirname, "__temp__", "listen-failed.txt");
    download({
      website: Website.konachan,
      post: _getPost(Website.konachan, failedUrl),
      downloadType: DownloadType.file,
      savePath: failedSavePath,
    });
    const failedDownloads = getDownalods();
    expect(
      failedDownloads.length,
      "Add one failed download item, download count not is one."
    ).toBe(1);
    const failedDownload = failedDownloads[0];
    await sleep(1000);
    expect(
      listen[DownloadEvent.failed],
      "Not listen download failed event."
    ).toBeTruthy();
    expect(
      listen[DownloadEvent.failed],
      "Failed event download item not is add download item."
    ).toBe(failedDownload);
    cancelDownload(failedDownload);
    expect(
      getDownalods(),
      "Cencal download work abnormal, in failed download item."
    ).toEqual([]);

    /// List succeed download.
    const succeedSavePath = resolve(
      __dirname,
      "__temp__",
      "listen-succeed.txt"
    );
    download({
      website: Website.konachan,
      post: _getPost(Website.konachan, succeedUrl),
      downloadType: DownloadType.file,
      savePath: succeedSavePath,
    });
    const succeedDownloads = getDownalods();
    expect(
      succeedDownloads.length,
      "Add one error download item, download count not is one."
    ).toBe(1);
    const succeedDownload = succeedDownloads[0];
    await sleep(200);
    expect(
      listen[DownloadEvent.succeed],
      "Not listen download succeed event."
    ).toBeTruthy();
    expect(
      listen[DownloadEvent.succeed],
      "Succeed event download item not is add download item."
    ).toBe(succeedDownload);
    expect(
      getDownalods(),
      "Downloaded download item not reomive in downloads."
    ).toEqual([]);
    expect(
      readFileSync(succeedSavePath, "utf-8"),
      "Download succeed item download file data unequal to serve send data."
    ).toBe("succeed");

    for (const key of Object.keys(listen)) delete listen[key];
    removeDwonloadListen(_listen);
    [awaitUrl, failedUrl, succeedUrl].forEach((url) =>
      download({
        website: Website.konachan,
        downloadType: DownloadType.file,
        post: _getPost(Website.konachan, url),
        savePath: resolve(
          __dirname,
          "__temp__",
          `remove-listen-${basename(url)}.txt`
        ),
      })
    );
    await sleep(2000);
    expect(Object.keys(listen), "Not remove listen").toHaveLength(0);
  });
});
