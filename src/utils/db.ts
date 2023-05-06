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

  async save(downloaded: DownloadedInfo) {
    return await this.downloaded.put(downloaded);
  }

  async query({
    website,
    first,
    last,
    limit = 5,
  }: {
    website?: Website;
    first?: Date;
    last?: Date;
    limit?: number;
  } = {}) {
    let collection = this.downloaded.orderBy("downloaded_at").reverse();

    if (website)
      collection = collection.filter((item) => item.website === website);

    if (last)
      collection = collection.filter(
        (item: DownloadedInfo) => item.downloaded_at < last
      );

    if (first)
      collection = collection.filter(
        (item: DownloadedInfo) => item.downloaded_at >= first
      );

    return await collection.limit(limit).toArray();
  }

  async queryItem({
    website,
    id,
    downloadType,
  }: {
    website: Website;
    id: number;
    downloadType: DownloadType;
  }): Promise<DownloadedInfo | undefined> {
    return await this.downloaded
      .where({
        website: website,
        id,
        download_type: downloadType,
      })
      .first();
  }

  async deleteItem({
    website,
    downloadType,
    id,
  }: {
    website: Website;
    downloadType: DownloadType;
    id: number;
  }) {
    return await this.downloaded
      .where({
        website,
        download_type: downloadType,
        id,
      })
      .delete();
  }

  async clear(): Promise<void> {
    return await this.downloaded.clear();
  }
}

export const downloadedDB = new DownloadDexie();

interface SearchHistoryInfo {
  website: Website;
  tags: Array<string>;
  date: Date;
}

export interface SearchHistoryItem extends SearchHistoryInfo {
  key: string;
}

class SearchHistoryDexie extends Dexie {
  private searchHistory!: Table<SearchHistoryItem>;
  constructor() {
    super("search history");
    this.version(1).stores({
      searchHistory: "key,date",
    });
  }

  async save(info: SearchHistoryInfo) {
    return await this.searchHistory.put({
      key: `${info.website} - ${info.tags.sort().join(" ")}`,
      ...info,
    });
  }

  async query({
    website,
    first,
    last,
    limit,
  }: { website?: Website; first?: Date; last?: Date; limit?: number } = {}) {
    let collection = this.searchHistory.orderBy("date").reverse();

    if (website)
      collection = collection.filter((item) => item.website === website);

    if (last) collection = collection.filter((item) => item.date < last);

    if (first) collection = collection.filter((item) => item.date >= first);

    return collection.limit(limit ?? 5).toArray();
  }

  async deleteItem(key: string) {
    return this.searchHistory.where({ key }).delete();
  }

  async clear() {
    return await this.searchHistory.clear();
  }
}

export const searchHistoryDB = new SearchHistoryDexie();
