import { describe, expect, it, beforeEach, type ArgumentsType } from "vitest";
import "fake-indexeddb/auto";
import {
  downloadedDB,
  searchHistoryDB,
  type SearchHistoryInfo,
  type SearchHistoryItem,
} from "@/utils/db";
import { getDownloaded } from "@/utils/__tools__/db";
import { DownloadType, type DownloadedInfo } from "@/utils/download";
import { Website } from "@/utils/website";
import { Random } from "mockjs";
import { getTag } from "@/utils/__tools__/tag";
import { groupObject } from "@/utils/__tools__/groups";
import { getPost } from "@/utils/__tools__/posts";

function compareTimeLessPriorTime(list: Array<Date>) {
  let prior: Date | undefined;
  for (const date of list) {
    if (prior && date > prior) return false;
    prior = date;
  }
  return true;
}

type DownloadedInfoList = Array<DownloadedInfo>;
function getDownloadeds(count: number, website?: Website): DownloadedInfoList {
  const downloadeds: Array<DownloadedInfo> = [];
  do {
    const downloaded = getDownloaded();
    if (website !== undefined && downloaded.website !== website) continue;
    if (
      downloadeds.every(
        (item) =>
          item.website !== downloaded.website ||
          item.id !== downloaded.id ||
          item.download_type !== downloaded.download_type
      )
    )
      downloadeds.push(downloaded);
  } while (downloadeds.length < count);

  return downloadeds;
}

async function saveDwonloadeds(downloadeds: DownloadedInfoList) {
  for (const downloaded of downloadeds) await downloadedDB.save(downloaded);
}

const websites = Object.values(Website);

/**
 * Sort downloaded list by downloaded time, this is query order.
 */
function orderDwonloadedrs(
  downloadeds: DownloadedInfoList
): DownloadedInfoList {
  return downloadeds.sort((l, r) =>
    r.downloaded_at === l.downloaded_at
      ? `${r.website} - ${r.id} - ${r.download_type}` >
        `${l.website} - ${l.id} - ${l.download_type}`
        ? 1
        : -1
      : r.downloaded_at.getTime() - l.downloaded_at.getTime()
  );
}

/**
 * The test of the describe cannot concurrent run.
 * Because saved data in db module will affect other test of downloaded db module.
 */
describe("Test downloaded info db.", async () => {
  beforeEach(async () => {
    await downloadedDB.clear();
    const data = await downloadedDB.query();
    if (data.length)
      throw new Error("Test db module has data is not clear downloaded info.");
  });

  it("Test has save data.", async () => {
    await expect(
      downloadedDB.query(),
      "Saved data count not's 0."
    ).resolves.toEqual([]);
  });

  it("Test save and clear data.", async () => {
    const data = orderDwonloadedrs(getDownloadeds(20));
    await saveDwonloadeds(data);

    /// Test saved data equal to save data.
    await expect(
      downloadedDB.query({ limit: data.length + 10 }),
      "Saved data unequal to save data."
    ).resolves.toMatchObject(data);

    /// Test save saved data has update.
    const has = data[0];
    await downloadedDB.save(has);
    await expect(
      downloadedDB.query({ limit: data.length + 1 }),
      "Save saved data, saved data has update."
    ).resolves.toEqual(data);

    /// Test save updated date data has update data.
    const now = new Date();
    has.downloaded_at = now;
    has.download_at = new Date(now.getTime() - Random.integer(0, 60) - 60);
    await downloadedDB.save(has);
    orderDwonloadedrs(data);
    await expect(
      downloadedDB.query({ limit: data.length + 1 }),
      "Update saved data, saved data not update, in downloaded db."
    ).resolves.toEqual(data);

    /// Test clear data.
    await downloadedDB.clear();
    await expect(downloadedDB.query()).resolves.toEqual([]);
  });

  it("Test query.", async () => {
    const date = new Date(2020);
    const first = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate() - 1
      ),
      _first = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate() - 2
      ),
      last = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1),
      _last = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 2),
      befater = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate() - 3
      ),
      after = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 3);
    const post = getPost();
    const downloadTypes = Object.values(DownloadType);
    const data = orderDwonloadedrs(
      [date, first, _first, last, _last]
        .map((date) => ({
          downloaded_at: date,
          download_at: new Date(
            date.getFullYear(),
            date.getMonth(),
            date.getDate(),
            date.getHours(),
            date.getMinutes(),
            date.getSeconds() - 60 - Random.integer(0, 60)
          ),
        }))
        .flatMap((_, index) =>
          downloadTypes.flatMap((download_type, typeIndex) =>
            websites.map((website, websiteIndex) => ({
              ...post,
              ..._,
              download_type,
              id:
                post.id +
                index * downloadTypes.length * websites.length +
                typeIndex * websites.length +
                websiteIndex,
              website,
              size: 9000,
              save_path: "download_path",
            }))
          )
        )
    );

    await saveDwonloadeds(data);

    await expect(
      downloadedDB.query({
        limit: data.length + 10,
      }),
      "Downloaded db query data unequal to save data."
    ).resolves.toEqual(data);

    function vaildExpect(
      data: DownloadedInfoList,
      arg: Partial<
        Exclude<ArgumentsType<typeof downloadedDB.query>[0], undefined>
      >
    ) {
      return (
        !!data.length &&
        compareTimeLessPriorTime(data.map((data) => data.downloaded_at)) &&
        (arg.limit ? data.length === arg.limit : true) &&
        data.every(
          (item) =>
            (arg.first ? item.downloaded_at >= arg.first : true) &&
            (arg.last ? item.downloaded_at < arg.last : true) &&
            (arg.website ? item.website === arg.website : true)
        )
      );
    }

    const invailds = groupObject({
      first: after,
      last: befater,
    }).filter((_) => _.first || _.last);
    const vailds = groupObject({
      limit: downloadTypes.length * 2, /// The limit is can query min count.
      first,
      last,
    }).flatMap((_) =>
      [undefined, ...websites].map((website) => Object.assign({ website }, _))
    );
    for (const vaild of vailds) {
      await expect(
        downloadedDB.query(vaild),
        `The vaild argument query date chech failed, the argument website:${vaild.website} first:${vaild.first} last:${vaild.last} limit:${vaild.limit}`
      ).resolves.toSatisfy((data) =>
        vaildExpect(data as DownloadedInfoList, vaild)
      );

      if (vaild.first || vaild.last) {
        for (const invaild of invailds) {
          const arg = {
            ...vaild,
            ...invaild,
          };
          await expect(
            downloadedDB.query(arg),
            `The vaild argument query date chech failed, the argument website:${arg.website} first:${arg.first} last:${arg.last} limit:${arg.limit}`
          ).resolves.toEqual([]);
        }
      }
    }
  });

  it("Test query item.", async () => {
    const data = getDownloadeds(10);
    await saveDwonloadeds(data);

    const has = data[Random.integer(0, data.length - 1)];
    await expect(
      downloadedDB.queryItem(has.website, has.id, has.download_type),
      "Saved data not find."
    ).resolves.toEqual(has);

    const not = {
      website: has.website,
      id: has.id + 100,
      downloadType: has.download_type,
    };
    while (
      data.some(
        (item) =>
          item.id === not.id &&
          item.download_type === not.downloadType &&
          item.website === item.website
      )
    ) {
      not.id++;
    }
    await expect(
      downloadedDB.queryItem(not.website, not.id, not.downloadType),
      "Find not saved data."
    ).resolves.toBeUndefined();
  });

  it("Test delete item", async () => {
    const data = getDownloadeds(1);
    await saveDwonloadeds(data);
    const [_] = await downloadedDB.query();
    await downloadedDB.deleteItem(_.website, _.id, _.download_type);
    await expect(
      downloadedDB.query(),
      "Delete after still can query data."
    ).resolves.toEqual([]);
    await expect(
      downloadedDB.queryItem(_.website, _.id, _.download_type),
      "Delete after query the data unequal to undefined."
    ).resolves.toBeUndefined();
  });
});

function getWebsite() {
  return websites[Random.integer(0, websites.length - 1)];
}
function getTags() {
  return new Array(Random.integer(1, 7)).fill(null).map(() => getTag().tag);
}
function getSearchHistory(website?: Website) {
  return {
    website: website ?? getWebsite(),
    tags: getTags(),
    date: new Date(Random.date()),
  };
}
function getSearchHistorys(count: number, website?: Website) {
  if (count < 1) throw new Error("Not get search history count less 1.");
  const map = new Map<string, SearchHistoryInfo>();
  do {
    const info: SearchHistoryInfo = getSearchHistory(website);
    map.set(`${info.website} - ${info.tags.sort().join(" ")}`, info);
  } while (map.size < count);
  return Array.from(map.values());
}
async function saveSearchHistorys(list: Array<SearchHistoryInfo>) {
  for (const item of list) {
    await searchHistoryDB.save(item);
  }
}
function orderSearchHistorys(list: Array<SearchHistoryInfo>) {
  return list.sort((l, r) =>
    r.date === l.date
      ? `${r.website} - ${r.tags.slice().sort().join(" ")}` >
        `${l.website} - ${l.tags.slice().sort().join(" ")}`
        ? 1
        : -1
      : r.date.getTime() - l.date.getTime()
  );
}
/**
 * The test of the describe cannot concurrent run.
 * Because saved data in db module will affect other test of search history db module.
 */
describe("Test search history info db.", async () => {
  beforeEach(async () => {
    await searchHistoryDB.clear();
    const data = await searchHistoryDB.query();
    if (data.length)
      throw new Error(
        "Test db module has data is not clear search history info."
      );
  });

  it("Test has save data.", async () => {
    await expect(
      searchHistoryDB.query(),
      "Saved data count not's 0."
    ).resolves.toEqual([]);
  });

  it("Test save and clear data.", async () => {
    const data = orderSearchHistorys(getSearchHistorys(20));
    await saveSearchHistorys(data);

    /// Test saved data equal to save data.
    await expect(
      searchHistoryDB.query({ limit: data.length + 10 }),
      "Saved data unequal to save data."
    ).resolves.toMatchObject(data);

    /// Test save saved data has update.
    const has = data[0];
    await searchHistoryDB.save(has);
    await expect(
      searchHistoryDB.query({ limit: data.length + 1 }),
      "Save saved data, saved data has update, in search history db."
    ).resolves.toMatchObject(data);

    /// Test save updated date data has update data.
    const now = new Date();
    has.date = now;
    await searchHistoryDB.save(has);
    orderSearchHistorys(data);
    await expect(
      searchHistoryDB.query({ limit: data.length + 1 }),
      "Update saved data, saved data not update, in downloaded db."
    ).resolves.toMatchObject(data);

    /// Test clear data.
    await searchHistoryDB.clear();
    await expect(searchHistoryDB.query()).resolves.toEqual([]);
  });

  it("Test query.", async () => {
    const date = new Date(2020);
    const first = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate() - 1
      ),
      _first = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate() - 2
      ),
      last = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1),
      _last = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 2),
      befater = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate() - 3
      ),
      after = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 3);

    const data = orderSearchHistorys(
      [...websites].flatMap((website, index) =>
        [date, first, _first, last, _last].flatMap((date, i) => [
          {
            website,
            date,
            tags: ["abcdefg", `123456789-${index}-${i}`],
          },
          {
            website,
            date,
            tags: ["abcdefg", `987456123-${index}-${i}`],
          },
          {
            website,
            date,
            tags: [`abcdefg-${index}-${i}`],
          },
        ])
      )
    );
    await saveSearchHistorys(data);
    await expect(
      searchHistoryDB.query({
        limit: data.length + 10,
      }),
      "Search history db query data unequal to save data."
    ).resolves.toMatchObject(data);

    function vaildExpect(
      data: Array<SearchHistoryItem>,
      arg: Partial<
        Exclude<ArgumentsType<typeof searchHistoryDB.query>[0], undefined>
      >
    ) {
      return (
        !!data.length &&
        compareTimeLessPriorTime(data.map((data) => data.date)) &&
        (arg.limit ? data.length === arg.limit : true) &&
        data.every(
          (item) =>
            (arg.first ? item.date >= arg.first : true) &&
            (arg.last ? item.date < arg.last : true) &&
            (arg.search
              ? arg.search.every((search) =>
                  item.tags.some((tag) => tag.includes(search))
                )
              : true) &&
            (arg.website ? item.website === arg.website : true)
        )
      );
    }

    const invailds = groupObject({
      first: after,
      last: befater,
      search: ["abc", "321"],
    }).filter((_) => _.first || _.last || _.search);
    const vailds = groupObject({
      limit: 4, /// 2 date and 2 search match, min 4 limt.
      first,
      last,
      search: ["abc", "123"],
    }).flatMap((_) =>
      [undefined, ...websites].map((website) => Object.assign({ website }, _))
    );
    for (const vaild of vailds) {
      await expect(
        searchHistoryDB.query(vaild),
        `The vaild argument query date chech failed, the argument website:${vaild.website} first:${vaild.first} last:${vaild.last} search:${vaild.search} limit:${vaild.limit}`
      ).resolves.toSatisfy((data) =>
        vaildExpect(data as Array<SearchHistoryItem>, vaild)
      );

      if (vaild.first || vaild.last || vaild.search) {
        for (const invaild of invailds) {
          const arg = {
            ...vaild,
            ...invaild,
          };
          await expect(
            searchHistoryDB.query(arg),
            `The vaild argument query date chech failed, the argument website:${arg.website} first:${arg.first} last:${arg.last} search:${arg.search} limit:${arg.limit}`
          ).resolves.toEqual([]);
        }
      }
    }
  });

  it("Test delete item.", async () => {
    const date = {
      website: Website.konachan,
      date: new Date(2020),
      tags: ["name"],
    };
    await saveSearchHistorys([date]);
    const [_] = await searchHistoryDB.query();
    await searchHistoryDB.deleteItem(_.key);
    await expect(
      searchHistoryDB.query(),
      "Delete item failed."
    ).resolves.toEqual([]);
  });
});
