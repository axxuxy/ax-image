import type { Website } from "@/utils/website";
import Request from "@/utils/request";
import type { Post } from "@/utils/api";

const _downloads = new Set<Downloading>();
export const getDownloads = () => Array.from(_downloads);

let maxDownloadCount = 5;

export const getMaxDownloadCount = () => maxDownloadCount;

export function setMaxDownloadCount(count: number) {
  let _ = count - maxDownloadCount;
  maxDownloadCount = count;
  while (_-- > 0) next();
}

function next() {
  const _ = [..._downloads];
  if (_.filter((download) => download.isDownloading).length >= maxDownloadCount)
    return;

  const download = _.find(
    (download) =>
      !download.isStop && !download.isDownloading && !download.downloadError
  );

  if (download) {
    download
      .download()
      .then((download) => {
        if (download.isStop) {
          for (const listen of downloadListens)
            listen(download, DownloadEvent.stop);
        } else {
          _downloads.delete(download!);
          for (const listen of downloadListens)
            listen(download, DownloadEvent.succeed);
        }
      })
      .catch(() => {
        for (const listen of downloadListens)
          listen(download, DownloadEvent.failed);
      })
      .finally(() => next());
    for (const listen of downloadListens) listen(download, DownloadEvent.start);
  }
}

export enum DownloadType {
  sample = "sample",
  jpeg = "jpeg",
  file = "file",
}

export class DownloadOption {
  constructor({
    post,
    downloadType,
    website,
  }: {
    post: Post;
    downloadType: DownloadType;
    website: Website;
  }) {
    this.post = post;
    this.downloadType = downloadType;
    this.website = website;
    this.downloadInfo = this.getDownloadInfo();
  }
  post: Post;
  downloadType: DownloadType;
  website: Website;
  downloadInfo: ReturnType<typeof this.getDownloadInfo>;

  private getDownloadInfo() {
    switch (this.downloadType) {
      case DownloadType.file:
        return this.post.file_url &&
          this.post.file_size &&
          this.post.width &&
          this.post.height
          ? {
              url: this.post.file_url,
              size: this.post.file_size,
              width: this.post.width,
              height: this.post.height,
            }
          : undefined;
      case DownloadType.jpeg:
        return this.post.jpeg_url &&
          this.post.jpeg_file_size &&
          this.post.jpeg_width &&
          this.post.jpeg_height
          ? {
              url: this.post.jpeg_url,
              size: this.post.jpeg_file_size,
              width: this.post.jpeg_width,
              height: this.post.jpeg_height,
            }
          : undefined;
      case DownloadType.sample:
        return {
          url: this.post.sample_url,
          size: this.post.sample_file_size,
          width: this.post.sample_width,
          height: this.post.sample_height,
        };
      default:
        throw new Error(
          `Undefined the download type url, the download type is ${this.downloadType}`
        );
    }
  }
}

export interface ValidDownloadOption extends DownloadOption {
  downloadInfo: Exclude<DownloadOption["downloadInfo"], undefined>;
  savePath: string;
}

export function download(option: ValidDownloadOption) {
  _downloads.add(new Downloading(option));
  next();
}

export function cancelDownload(download: Downloading) {
  download.stop();
  _downloads.delete(download);
  for (const listen of downloadListens) listen(download, DownloadEvent.cancel);
}

export function checkIsDownload({
  website,
  downloadType,
  post: { id },
}: {
  website: Website;
  downloadType: DownloadType;
  post: Post;
}): boolean {
  for (const download of _downloads)
    if (
      download.website === website &&
      download.post.id === id &&
      download.downloadType === downloadType
    )
      return true;

  return false;
}

export interface DownloadedInfo extends Post {
  website: Website;
  download_at: Date;
  downloaded_at: Date;
  download_type: DownloadType;
  save_path: string;
  size: number;
}

class Downloading {
  private downloadAt?: Date;
  private _isDownloading = false;
  private _downloaded = 0;
  private _downloadError?: Error;
  private _downloadedAt?: Date;
  private _isStop = false;
  private abortController?: AbortController;
  private option: ValidDownloadOption;
  private _sleep = 0;

  get downloadType() {
    return this.option.downloadType;
  }
  get post() {
    return this.option.post;
  }
  get website() {
    return this.option.website;
  }
  get downloaded() {
    return this._downloaded;
  }
  get isDownloading() {
    return this._isDownloading;
  }
  get savePath() {
    return this.option.savePath;
  }
  get downloadError() {
    return this._downloadError;
  }
  get isStop() {
    return this._isStop;
  }
  get size() {
    return this.option.downloadInfo.size;
  }

  get downloadedAt() {
    return this._downloadedAt;
  }

  get sleep() {
    return this._sleep;
  }

  constructor(option: ValidDownloadOption) {
    this.option = option;
  }

  async download(): Promise<Downloading> {
    this._isDownloading = true;
    this._downloadError = undefined;
    this._downloadedAt = undefined;
    this._isStop = false;
    this.downloadAt = new Date();
    let downloaded = (this._downloaded = 0);
    const interval = setInterval(() => {
      this._sleep = this._downloaded - downloaded;
      downloaded = this._downloaded;
    }, 1000);

    try {
      this.downloadAt = new Date();
      this.abortController = new AbortController();
      await new Request(this.option.downloadInfo.url).download(this.savePath, {
        onprogress: (size) => {
          this._downloaded = size;
        },
        abortController: this.abortController,
      });

      if (!this.isStop) this._downloadedAt = new Date();
      return this;
    } catch (error) {
      if (this.isStop) return this;
      this._downloadError = <Error>error;
      throw error;
    } finally {
      this._isDownloading = false;
      this._sleep = 0;
      clearInterval(interval);
    }
  }

  stop() {
    this._isStop = true;
    this.abortController?.abort();
  }

  play() {
    this._isStop = false;
    next();
  }

  getDownloadedInfo(): DownloadedInfo {
    if (!this.downloadAt) throw new Error("The not download date.");
    if (!this._downloadedAt) throw new Error("The not downloaded date.");
    return {
      ...this.option.post,
      website: this.website,
      download_at: this.downloadAt,
      download_type: this.downloadType,
      downloaded_at: this._downloadedAt,
      save_path: this.option.savePath,
      size: this.option.downloadInfo.size,
    };
  }
}

export interface _ extends Downloading {}

export enum DownloadEvent {
  start = "start",
  succeed = "succeed",
  failed = "failed",
  stop = "stop",
  cancel = "cancel",
}

export type DownloadListen = (
  download: Downloading,
  event: DownloadEvent
) => void;

const downloadListens = new Set<DownloadListen>();

export const addDwonloadListen = (listen: DownloadListen) =>
  downloadListens.add(listen);

export const removeDwonloadListen = (listen: DownloadListen) =>
  downloadListens.delete(listen);
