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

  async queryItem(
    website: Website,
    id: number,
    type: DownloadType
  ): Promise<DownloadedInfo | undefined> {
    return await this.downloaded
      .where({
        website: website,
        id,
        download_type: type,
      })
      .first();
  }

  async deleteItem(website: Website, id: number, type: DownloadType) {
    return await this.downloaded
      .where({
        website,
        id,
        download_type: type,
      })
      .delete();
  }

  async clear(): Promise<void> {
    return await this.downloaded.clear();
  }
}

export const downloadedDB = new DownloadDexie();

export interface SearchHistoryInfo {
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
      key: `${info.website} - ${info.tags.slice().sort().join(" ")}`,
      ...info,
    });
  }

  async query({
    website,
    first,
    last,
    search,
    limit,
  }: {
    website?: Website;
    first?: Date;
    last?: Date;
    limit?: number;
    search?: Array<string>;
  } = {}) {
    let collection = this.searchHistory.orderBy("date").reverse();

    if (website)
      collection = collection.filter((item) => item.website === website);

    if (last) collection = collection.filter((item) => item.date < last);

    if (first) collection = collection.filter((item) => item.date >= first);

    if (search && search.length)
      collection = collection.filter((item) =>
        search.every((_) => item.key.includes(_))
      );

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
