import type { Website } from "@/utils/website";
import Request from "@/utils/request";
import type { Post } from "@/utils/api";

const _downloads = new Set<Downloading>();
export const getDownalods = () => Array.from(_downloads);

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

  download
    ?.download()
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
}

export enum DownloadType {
  sample = "sample",
  jpeg = "jpeg",
  file = "file",
}

interface DownloadOption {
  post: Post;
  downloadType: DownloadType;
  savePath: string;
  website: Website;
}

export function download(option: DownloadOption) {
  _downloads.add(new Downloading(option));
  next();
}

export function cancelDownload(download: Downloading) {
  download.stop();
  for (const listen of downloadListens) listen(download, DownloadEvent.cancel);
  _downloads.delete(download);
}

export function checkIsDownload({
  website,
  downloadType,
  post: { id },
}: DownloadOption): boolean {
  for (const download of _downloads)
    if (
      download.website === website &&
      download.post.id === id &&
      download.downloadType === downloadType
    )
      return true;

  return false;
}

export type DownloadedInfo = {
  website: Website;
  download_at: Date;
  downloaded_at: Date;
  download_type: DownloadType;
  save_path: string;
} & Post;

class Downloading {
  private _post!: Post;
  private _website!: Website;
  private downloadAt = new Date();
  private _isDownloading = false;
  private _downloaded = 0;
  private _downloadType!: DownloadType;
  private _savePath!: string;
  private _downloadError?: Error;
  private downloadedAt?: Date;
  private _isStop = false;
  private abortController?: AbortController;

  get downloadType() {
    return this._downloadType;
  }
  get post() {
    return { ...this._post };
  }
  get website() {
    return this._website;
  }
  get downloaded() {
    return this._downloaded;
  }
  get isDownloading() {
    return this._isDownloading;
  }
  get savePath() {
    return this._savePath;
  }
  get downloadError() {
    return this._downloadError;
  }
  get isStop() {
    return this._isStop;
  }

  constructor({ post, website, downloadType, savePath }: DownloadOption) {
    this._post = post;
    this._website = website;
    this._downloadType = downloadType;
    this._savePath = savePath;
  }

  get downloadUrl(): string {
    switch (this._downloadType) {
      case DownloadType.file:
        return this._post.file_url;
      case DownloadType.jpeg:
        return this._post.jpeg_url;
      case DownloadType.sample:
        return this._post.sample_url;
      default:
        throw new Error(
          `Unrealize get url by the download type ${this._downloadType}.`
        );
    }
  }

  async download(): Promise<Downloading> {
    this._isDownloading = true;
    this._downloadError = undefined;
    this.downloadedAt = undefined;
    this._isStop = false;

    try {
      this.downloadAt = new Date();
      this.abortController = new AbortController();
      await new Request(this.downloadUrl).download(this._savePath, {
        onprogress: (size) => (this._downloaded = size),
        abortController: this.abortController,
      });

      this.downloadedAt = new Date();
      return this;
    } catch (error) {
      if (this.isStop) return this;
      this._downloadError = error as Error;
      throw error;
    } finally {
      this._isDownloading = false;
    }
  }

  stop() {
    this._isStop = true;
    this.abortController?.abort();
  }

  getDownloadedInfo(): DownloadedInfo {
    if (!this.downloadedAt) throw new Error("The not downloaded.");
    return {
      website: this.website,
      download_at: this.downloadAt,
      download_type: this.downloadType,
      downloaded_at: this.downloadedAt,
      save_path: this._savePath,
      ...this._post,
    };
  }
}

export interface _ extends Downloading {}

export enum DownloadEvent {
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
