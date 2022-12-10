import Dexie, { type Table } from "dexie";
import type { DownloadedInfo, DownloadType } from "@/utils/download";
import type { Website } from "@/utils/website";

class DownloadDexie extends Dexie {
  private downloaded!: Table<DownloadedInfo>;

  constructor() {
    super("downloaded Info");
    this.version(1).stores({
      downloaded: "[website+id+download_type], downloaded_at, website",
    });

    this.open();
  }

  async saveDownloadedInfo(downloaded: DownloadedInfo): Promise<void> {
    await this.downloaded.put(downloaded);
  }

  queryDownloadedInfos({
    website,
    last,
    limit = 5,
  }: {
    website?: Website;
    last?: Date;
    limit?: number;
  } = {}): Promise<DownloadedInfo[]> {
    let collection = this.downloaded.orderBy("downloaded_at").reverse();

    if (website)
      collection = collection.filter((item) => item.website === website);

    if (last)
      collection.filter((item: DownloadedInfo) => item.downloaded_at < last);

    return collection.limit(limit).toArray();
  }

  queryDownloadedInfo({
    website,
    id,
    downloadType,
  }: {
    website: Website;
    id: number;
    downloadType: DownloadType;
  }): Promise<DownloadedInfo | undefined> {
    return this.downloaded
      .where({
        website: website,
        id,
        download_type: downloadType,
      })
      .first();
  }

  async clear(): Promise<void> {
    return await this.downloaded.clear();
  }
}

export const db = new DownloadDexie();
