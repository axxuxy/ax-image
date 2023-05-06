import { describe, expect, it, beforeEach } from "vitest";
import "fake-indexeddb/auto";
import {
  downloadedDB,
  searchHistoryDB,
  type SearchHistoryInfo,
  type SearchHistoryItem,
} from "@/utils/db";
import { getDownloaded } from "@/utils/__tools__/db";
import type { DownloadedInfo } from "@/utils/download";
import { Website } from "@/utils/website";
import { Random } from "mockjs";
import { getTag } from "@/utils/__tools__/tag";

function compareTimeLessPriorTime(list: Array<Date>) {
  let prior: Date | undefined;
  if (!prior) return true;
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
  return downloadeds.sort(
    (l, r) => r.downloaded_at.getTime() - l.downloaded_at.getTime()
  );
}

/**
 * The test of the describe cannot concurrent run.
 * Because saved data in db module will affect other test of downloaded db module.
 */
describe("Test downloaded info db module.", async () => {
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

  it("Test whethen can save downloaded data and clear saved downloaded data.", async () => {
    await saveDwonloadeds(getDownloadeds(10));
    await expect(downloadedDB.query()).resolves.not.toEqual([]);

    await downloadedDB.clear();
    await expect(downloadedDB.query()).resolves.toEqual([]);
  });

  it("Test query data is order whethen by downloaded time.", async () => {
    const data = websites.map((website) => ({
      website,
      data: getDownloadeds(10 + Random.integer(0, 5), website),
    }));
    await saveDwonloadeds(data.flatMap((website) => website.data));
    await expect(
      downloadedDB.query({ limit: data.length * 16 }),
      "Query all data prior downloaded time less to that downloaded time."
    ).resolves.toSatisfy((data) =>
      compareTimeLessPriorTime(
        (data as DownloadedInfoList).map((data) => data.downloaded_at)
      )
    );

    const orderDatas = orderDwonloadedrs(data.flatMap((_) => _.data));
    const first = orderDatas[3].downloaded_at;
    await expect(
      downloadedDB.query({ limit: data.length * 16, first }),
      "Set first argument query data prior downloaded time less to that downloaded time."
    ).resolves.toSatisfy((data) =>
      compareTimeLessPriorTime(
        (data as DownloadedInfoList).map((data) => data.downloaded_at)
      )
    );
    const last = orderDatas[orderDatas.length - 3].downloaded_at;
    await expect(
      downloadedDB.query({ limit: data.length * 16, last }),
      "Set last argument query data prior downloaded time less to that downloaded time."
    ).resolves.toSatisfy((data) =>
      compareTimeLessPriorTime(
        (data as DownloadedInfoList).map((data) => data.downloaded_at)
      )
    );
    await expect(
      downloadedDB.query({ limit: data.length * 16, first, last }),
      "Set first and last argument query data prior downloaded time less to that downloaded time."
    ).resolves.toSatisfy((data) =>
      compareTimeLessPriorTime(
        (data as DownloadedInfoList).map((data) => data.downloaded_at)
      )
    );

    for (const website of data) {
      await expect(
        downloadedDB.query({
          website: website.website,
          limit: website.data.length + 1,
        }),
        `Set website argument to ${website.website} after, in query data, prior downloaded time less to that downloaded time.`
      ).resolves.toSatisfy((data) =>
        compareTimeLessPriorTime(
          (data as DownloadedInfoList).map((data) => data.downloaded_at)
        )
      );
      await expect(
        downloadedDB.query({
          website: website.website,
          limit: website.data.length + 1,
          first,
        }),
        `Set first and website argument to ${website.website} after, in query data, prior downloaded time less to that downloaded time.`
      ).resolves.toSatisfy((data) =>
        compareTimeLessPriorTime(
          (data as DownloadedInfoList).map((data) => data.downloaded_at)
        )
      );
      await expect(
        downloadedDB.query({
          website: website.website,
          limit: website.data.length + 1,
          last,
        }),
        `Set last and website argument to ${website.website} after, in query data, prior downloaded time less to that downloaded time.`
      ).resolves.toSatisfy((data) =>
        compareTimeLessPriorTime(
          (data as DownloadedInfoList).map((data) => data.downloaded_at)
        )
      );
      await expect(
        downloadedDB.query({
          website: website.website,
          limit: website.data.length + 1,
          first,
          last,
        }),
        `Set first and last and website argument to ${website.website} after, in query data, prior downloaded time less to that downloaded time.`
      ).resolves.toSatisfy((data) =>
        compareTimeLessPriorTime(
          (data as DownloadedInfoList).map((data) => data.downloaded_at)
        )
      );
    }
  });

  it("Test that the save data and query data are consistent.", async () => {
    const data = getDownloadeds(5);
    await saveDwonloadeds(data);
    orderDwonloadedrs(data);
    await expect(
      downloadedDB.query({ limit: data.length + 1 }),
      "Save data is unequal to query data, in downloaded db."
    ).resolves.toEqual(data);
  });

  it("Test limit argument whethen can limit query count.", async () => {
    const data = getDownloadeds(20);
    await saveDwonloadeds(data);
    await expect(
      downloadedDB.query({
        limit: data.length - 1,
      }),
      "Query saved data count unequal to limit."
    ).resolves.toHaveLength(data.length - 1);
  });

  it("Test query data by website.", async () => {
    const data = websites.map((website) => {
      return {
        website,
        data: orderDwonloadedrs(
          getDownloadeds(5 + Random.integer(0, 5), website)
        ),
      };
    });

    await saveDwonloadeds(orderDwonloadedrs(data.flatMap((d) => d.data)));

    for (const website of data) {
      await expect(
        downloadedDB.query({
          limit: website.data.length + 1,
          website: website.website,
        }),
        "Query website data unequal to saved website data in downloaded db."
      ).resolves.toEqual(website.data);

      const limit = website.data.length - 1;
      await expect(
        downloadedDB.query({
          limit,
          website: website.website,
        }),
        "Query website data limit not limit query count, in downloaded db."
      ).resolves.toEqual(website.data.slice(0, limit));
    }
  });

  it("Test first,last argument whethen can limit query data.", async () => {
    const data = getDownloadeds(20);
    await saveDwonloadeds(data);
    orderDwonloadedrs(data);
    const first = new Date(data[7].downloaded_at);
    await expect(
      downloadedDB.query({ first }),
      "Query data have downloaded date less to first"
    ).resolves.toSatisfy((data) =>
      (data as DownloadedInfoList).every(
        (data) => data.downloaded_at.getTime() >= first.getTime()
      )
    );

    await expect(
      downloadedDB.query({ first, limit: 5 }),
      "Limit query data count unequal to set limit argument in set first date."
    ).resolves.toHaveLength(5);

    await expect(
      downloadedDB.query({ first, limit: 100 }),
      "Query data last item downloaded date unequal to first date."
    ).resolves.toSatisfy(
      (data) =>
        (data as DownloadedInfoList).reverse()[0].downloaded_at.getTime() ===
        first.getTime()
    );

    const last = new Date(data[10].downloaded_at);
    await expect(
      downloadedDB.query({ last }),
      "Query data have downloaded date of grearth to last."
    ).resolves.toSatisfy((data) =>
      (<DownloadedInfoList>data).every(
        (data) => data.downloaded_at.getTime() < last.getTime()
      )
    );

    await expect(
      downloadedDB.query({ last, limit: 5 }),
      "Limit query data count unequal to set limit argument in set last date."
    ).resolves.toHaveLength(5);

    await expect(
      downloadedDB.query({ first, last, limit: 100 }),
      "Query data have dwonloaded date less to first or greater to last."
    ).resolves.toSatisfy((data) =>
      (<DownloadedInfoList>data).every(
        (data) =>
          data.downloaded_at.getTime() >= first.getTime() &&
          data.downloaded_at.getTime() < last.getTime()
      )
    );
  });

  it("Test set website and first,last argument.", async () => {
    const data = websites.map((website) => {
      return {
        website,
        data: orderDwonloadedrs(
          getDownloadeds(10 + Random.integer(0, 5), website)
        ),
      };
    });

    await saveDwonloadeds(orderDwonloadedrs(data.flatMap((d) => d.data)));

    for (const website of data) {
      const first = website.data[8].downloaded_at;
      await expect(
        downloadedDB.query({
          website: website.website,
          first,
        }),
        "Query data have downloaded date less to first date or website unequal to query website."
      ).resolves.toSatisfy((data) =>
        (data as DownloadedInfoList).every(
          (data) =>
            data.downloaded_at.getTime() >= first.getTime() &&
            data.website === website.website
        )
      );

      await expect(
        downloadedDB.query({
          first,
          website: website.website,
          limit: 5,
        }),
        "In set first and website argument after limit query data count unequal to set limit argument."
      ).resolves.toHaveLength(5);

      await expect(
        downloadedDB.query({
          website: website.website,
          first,
          limit: 100,
        }),
        "Query data last item downloaded date unequal to first date in set website argument."
      ).resolves.toSatisfy(
        (data) =>
          (data as DownloadedInfoList).reverse()[0].downloaded_at.getTime() ===
          first.getTime()
      );

      const last = website.data[1].downloaded_at;
      await expect(
        downloadedDB.query({
          website: website.website,
          last,
        }),
        "Query data have downloaded date grearth to last or website unequal to query website."
      ).resolves.toSatisfy((data) =>
        (<DownloadedInfoList>data).every(
          (data) =>
            data.downloaded_at.getTime() < last.getTime() &&
            data.website === website.website
        )
      );

      await expect(
        downloadedDB.query({
          last,
          website: website.website,
          limit: 5,
        }),
        "In set last and website argument after limit query data count unequal to set limit argument in set last date."
      ).resolves.toHaveLength(5);

      await expect(
        downloadedDB.query({
          first,
          last,
          limit: 100,
          website: website.website,
        }),
        "Query data have downloaded date less to first date or greater to last date or website unequal to query website."
      ).resolves.toSatisfy((data) =>
        (<DownloadedInfoList>data).every(
          (data) =>
            data.downloaded_at.getTime() >= first.getTime() &&
            data.downloaded_at.getTime() < last.getTime() &&
            data.website === website.website
        )
      );
    }
  });

  it("Test save saved data, saved data whethen update.", async () => {
    const data = getDownloadeds(20);
    await saveDwonloadeds(data);
    const has = data[0];
    orderDwonloadedrs(data);
    await downloadedDB.save(has);
    await expect(
      downloadedDB.query({ limit: data.length + 1 }),
      "Save saved data, saved data has update, in downloaded db."
    ).resolves.toEqual(data);
    const now = new Date();
    has.downloaded_at = now;
    has.download_at = new Date(now.getTime() - Random.integer(0, 60) - 60);
    await downloadedDB.save(has);
    orderDwonloadedrs(data);
    await expect(
      downloadedDB.query({ limit: data.length + 1 }),
      "Update saved data, saved data not update, in downloaded db."
    ).resolves.toEqual(data);
  });

  it("Test query specific data.", async () => {
    const data = getDownloadeds(10);
    await saveDwonloadeds(data);

    const randomHasDwonloaded = data[Random.integer(0, data.length - 1)];
    await expect(
      downloadedDB.queryItem({
        website: randomHasDwonloaded.website,
        downloadType: randomHasDwonloaded.download_type,
        id: randomHasDwonloaded.id,
      }),
      "Saved data not find."
    ).resolves.toEqual(randomHasDwonloaded);
  });

  it("Test query not saved data.", async () => {
    const data = getDownloadeds(10);
    await saveDwonloadeds(data);

    const has = data[0];
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
      downloadedDB.queryItem(not),
      "Find not saved data."
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
  return list.sort((l, r) => r.date.getTime() - l.date.getTime());
}
/**
 * The test of the describe cannot concurrent run.
 * Because saved data in db module will affect other test of search history db module.
 */
describe.only("Test search history info db module.", async () => {
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

  it("Test whethen can save search history data and clear saved search history data.", async () => {
    await saveSearchHistorys(getSearchHistorys(10));
    await expect(searchHistoryDB.query()).resolves.not.toEqual([]);

    await searchHistoryDB.clear();
    await expect(searchHistoryDB.query()).resolves.toEqual([]);
  });

  it("Test query data is order whethen by search history time.", async () => {
    const data = websites.map((website) => ({
      website,
      data: getSearchHistorys(10 + Random.integer(0, 5), website),
    }));
    await saveSearchHistorys(data.flatMap((website) => website.data));
    await expect(
      searchHistoryDB.query({ limit: data.length * 16 }),
      "Query all data prior search history time less to that search history time."
    ).resolves.toSatisfy((data) =>
      compareTimeLessPriorTime(
        (data as Array<SearchHistoryItem>).map((data) => data.date)
      )
    );

    const orderDatas = orderSearchHistorys(data.flatMap((_) => _.data));

    const first = orderDatas[3].date;
    await expect(
      searchHistoryDB.query({ limit: data.length * 16, first }),
      "Set first argument query data prior search history time less to that search history time."
    ).resolves.toSatisfy((data) =>
      compareTimeLessPriorTime(
        (data as Array<SearchHistoryItem>).map((data) => data.date)
      )
    );
    const last = orderDatas[orderDatas.length - 3].date;
    await expect(
      searchHistoryDB.query({ limit: data.length * 16, last }),
      "Set last argument query data prior search history time less to that search history time."
    ).resolves.toSatisfy((data) =>
      compareTimeLessPriorTime(
        (data as Array<SearchHistoryItem>).map((data) => data.date)
      )
    );
    await expect(
      searchHistoryDB.query({ limit: data.length * 16, first, last }),
      "Set first and last argument query data prior search history time less to that search history time."
    ).resolves.toSatisfy((data) =>
      compareTimeLessPriorTime(
        (data as Array<SearchHistoryItem>).map((data) => data.date)
      )
    );

    for (const website of data) {
      await expect(
        searchHistoryDB.query({
          website: website.website,
          limit: website.data.length + 1,
        }),
        `Set website argument to ${website.website} after, in query data, prior search history time less to that search history time.`
      ).resolves.toSatisfy((data) =>
        compareTimeLessPriorTime(
          (data as Array<SearchHistoryItem>).map((data) => data.date)
        )
      );
      await expect(
        searchHistoryDB.query({
          website: website.website,
          limit: website.data.length + 1,
          first,
        }),
        `Set first and website argument to ${website.website} after, in query data, prior search history time less to that search history time.`
      ).resolves.toSatisfy((data) =>
        compareTimeLessPriorTime(
          (data as Array<SearchHistoryItem>).map((data) => data.date)
        )
      );
      await expect(
        searchHistoryDB.query({
          website: website.website,
          limit: website.data.length + 1,
          last,
        }),
        `Set last and website argument to ${website.website} after, in query data, prior search history time less to that search history time.`
      ).resolves.toSatisfy((data) =>
        compareTimeLessPriorTime(
          (data as Array<SearchHistoryItem>).map((data) => data.date)
        )
      );
      await expect(
        searchHistoryDB.query({
          website: website.website,
          limit: website.data.length + 1,
          last,
        }),
        `Set first and last and website argument to ${website.website} after, in query data, prior search history time less to that search history time.`
      ).resolves.toSatisfy((data) =>
        compareTimeLessPriorTime(
          (data as Array<SearchHistoryItem>).map((data) => data.date)
        )
      );
    }
  });

  it("Test that the save data and query data are consistent.", async () => {
    const data = getSearchHistorys(5);
    await saveSearchHistorys(data);
    orderSearchHistorys(data);
    await expect(
      searchHistoryDB.query({ limit: data.length + 1 }),
      "Save data is unequal to query data, in search history db."
    ).resolves.toMatchObject(data);
  });

  it("Test limit argument whethen can limit query count.", async () => {
    const data = getSearchHistorys(20);
    await saveSearchHistorys(data);
    await expect(
      searchHistoryDB.query({
        limit: data.length - 1,
      }),
      "Query saved data count unequal to limit."
    ).resolves.toHaveLength(data.length - 1);
  });

  it("Test query data by website.", async () => {
    const data = websites.map((website) => {
      return {
        website,
        data: orderSearchHistorys(
          getSearchHistorys(5 + Random.integer(0, 5), website)
        ),
      };
    });

    await saveSearchHistorys(orderSearchHistorys(data.flatMap((d) => d.data)));

    for (const website of data) {
      await expect(
        searchHistoryDB.query({
          limit: website.data.length + 1,
          website: website.website,
        }),
        "Query website data unequal to saved website data in search history db."
      ).resolves.toMatchObject(website.data);

      const limit = website.data.length - 1;
      await expect(
        searchHistoryDB.query({
          limit,
          website: website.website,
        }),
        "Query website data limit not limit query count, in search history db."
      ).resolves.toMatchObject(website.data.slice(0, limit));
    }
  });

  it("Test first,last argument whethen can limit query data.", async () => {
    const data = getSearchHistorys(20);
    await saveSearchHistorys(data);
    orderSearchHistorys(data);
    const first = new Date(data[7].date);
    await expect(
      searchHistoryDB.query({ first }),
      "Query data have search history date less to first"
    ).resolves.toSatisfy((data) =>
      (data as Array<SearchHistoryItem>).every(
        (data) => data.date.getTime() >= first.getTime()
      )
    );

    await expect(
      searchHistoryDB.query({ first, limit: 5 }),
      "Limit query data count unequal to set limit argument in set first date."
    ).resolves.toHaveLength(5);

    await expect(
      searchHistoryDB.query({ first, limit: 100 }),
      "Query data last item search history date unequal to first date."
    ).resolves.toSatisfy(
      (data) =>
        (data as Array<SearchHistoryItem>).reverse()[0].date.getTime() ===
        first.getTime()
    );

    const last = new Date(data[10].date);
    await expect(
      searchHistoryDB.query({ last }),
      "Query data have search history date of grearth to last."
    ).resolves.toSatisfy((data) =>
      (data as Array<SearchHistoryItem>).every(
        (data) => data.date.getTime() < last.getTime()
      )
    );

    await expect(
      searchHistoryDB.query({ last, limit: 5 }),
      "Limit query data count unequal to set limit argument in set last date."
    ).resolves.toHaveLength(5);

    await expect(
      searchHistoryDB.query({ first, last, limit: 100 }),
      "Query data have dwonloaded date less to first or greater to last."
    ).resolves.toSatisfy((data) =>
      (data as Array<SearchHistoryItem>).every(
        (data) =>
          data.date.getTime() >= first.getTime() &&
          data.date.getTime() < last.getTime()
      )
    );
  });

  it("Test set website and first,last argument.", async () => {
    const data = websites.map((website) => {
      return {
        website,
        data: orderSearchHistorys(
          getSearchHistorys(10 + Random.integer(0, 5), website)
        ),
      };
    });

    await saveSearchHistorys(orderSearchHistorys(data.flatMap((d) => d.data)));

    for (const website of data) {
      const first = website.data[8].date;
      await expect(
        searchHistoryDB.query({
          website: website.website,
          first,
        }),
        "Query data have search history date less to first date or website unequal to query website."
      ).resolves.toSatisfy((data) =>
        (data as Array<SearchHistoryItem>).every(
          (data) =>
            data.date.getTime() >= first.getTime() &&
            data.website === website.website
        )
      );

      await expect(
        searchHistoryDB.query({
          first,
          website: website.website,
          limit: 5,
        }),
        "In set first and website argument after limit query data count unequal to set limit argument."
      ).resolves.toHaveLength(5);

      await expect(
        searchHistoryDB.query({
          website: website.website,
          first,
          limit: 100,
        }),
        "Query data last item search history date unequal to first date in set website argument."
      ).resolves.toSatisfy(
        (data) =>
          (data as Array<SearchHistoryItem>).reverse()[0].date.getTime() ===
          first.getTime()
      );

      const last = website.data[1].date;
      await expect(
        searchHistoryDB.query({
          website: website.website,
          last,
        }),
        "Query data have search history date grearth to last or website unequal to query website."
      ).resolves.toSatisfy((data) =>
        (data as Array<SearchHistoryItem>).every(
          (data) =>
            data.date.getTime() < last.getTime() &&
            data.website === website.website
        )
      );

      await expect(
        searchHistoryDB.query({
          last,
          website: website.website,
          limit: 5,
        }),
        "In set last and website argument after limit query data count unequal to set limit argument in set last date."
      ).resolves.toHaveLength(5);

      await expect(
        searchHistoryDB.query({
          first,
          last,
          limit: 100,
          website: website.website,
        }),
        "Query data have search history date less to first date or greater to last date or website unequal to query website."
      ).resolves.toSatisfy((data) =>
        (data as Array<SearchHistoryItem>).every(
          (data) =>
            data.date.getTime() >= first.getTime() &&
            data.date.getTime() < last.getTime() &&
            data.website === website.website
        )
      );
    }
  });

  it("Test save saved data, saved data whethen update.", async () => {
    const data = getSearchHistorys(20);
    await saveSearchHistorys(data);
    const has = data[0];
    orderSearchHistorys(data);
    await searchHistoryDB.save(has);
    await expect(
      searchHistoryDB.query({ limit: data.length + 1 }),
      "Save saved data, saved data has update, in search history db."
    ).resolves.toMatchObject(data);
    const now = new Date();
    has.date = now;
    await searchHistoryDB.save(has);
    orderSearchHistorys(data);
    await expect(
      searchHistoryDB.query({ limit: data.length + 1 }),
      "Update saved data, saved data not update, in downloaded db."
    ).resolves.toMatchObject(data);
  });
});
