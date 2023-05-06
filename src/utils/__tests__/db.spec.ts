import { describe, expect, it, beforeEach } from "vitest";
import "fake-indexeddb/auto";
import { downloadedDB } from "@/utils/db";
import { getDownloaded } from "@/utils/__tools__/db";
import type { DownloadedInfo } from "@/utils/download";
import { Website } from "@/utils/website";

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
function orderDwonloadedByDownloadedAt(
  downloadeds: DownloadedInfoList
): DownloadedInfoList {
  return downloadeds.sort(
    (l, r) => r.downloaded_at.getTime() - l.downloaded_at.getTime()
  );
}

/**
 * The test of the describe cannot concurrent run.
 * Because saved data in db module will affect other test of db module.
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
    function compareTimeLessPriorTime(list: DownloadedInfoList) {
      let prior: DownloadedInfo | null = null;
      for (const data of list) {
        if (prior && data.downloaded_at > prior!.downloaded_at) return false;
        prior = data;
      }
      return true;
    }
    const data = websites.map((website) => ({
      website,
      data: getDownloadeds(10 + Math.floor(Math.random() * 5), website),
    }));
    await saveDwonloadeds(data.flatMap((website) => website.data));
    await expect(
      downloadedDB.query({ limit: data.length * 15 }),
      "Query all data prior downloaded time less to that downloaded time."
    ).resolves.toSatisfy((data) =>
      compareTimeLessPriorTime(<DownloadedInfoList>data)
    );

    const last =
      data[Math.floor(Math.random() * data.length)].data[0].downloaded_at;
    await expect(
      downloadedDB.query({ limit: data.length * 15, last }),
      "Set last argument query data prior downloaded time less to that downloaded time."
    ).resolves.toSatisfy((data) =>
      compareTimeLessPriorTime(<DownloadedInfoList>data)
    );

    for (const website of data) {
      await expect(
        downloadedDB.query({
          website: website.website,
          limit: website.data.length + 1,
        }),
        `Set website argument to ${website.website} after, in query data, prior downloaded time less to that downloaded time.`
      ).resolves.toSatisfy((data) =>
        compareTimeLessPriorTime(<DownloadedInfoList>data)
      );

      const last = website.data[5].downloaded_at;
      await expect(
        downloadedDB.query({
          website: website.website,
          limit: website.data.length + 1,
          last,
        }),
        `Set last argument and website argument to ${website.website} after, in query data, prior downloaded time less to that downloaded time.`
      ).resolves.toSatisfy((data) =>
        compareTimeLessPriorTime(<DownloadedInfoList>data)
      );
    }
  });

  it("Test that the save data and query data are consistent.", async () => {
    const data = getDownloadeds(5);
    await saveDwonloadeds(data);
    orderDwonloadedByDownloadedAt(data);
    await expect(
      downloadedDB.query({ limit: data.length + 1 }),
      "Save data is unequal to query data."
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
        data: orderDwonloadedByDownloadedAt(
          getDownloadeds(5 + Math.round(Math.random() * 5), website)
        ),
      };
    });

    await saveDwonloadeds(
      orderDwonloadedByDownloadedAt(data.flatMap((d) => d.data))
    );

    for (const website of data) {
      await expect(
        downloadedDB.query({
          limit: website.data.length + 1,
          website: website.website,
        }),
        "Query website data unequal to saved website data."
      ).resolves.toEqual(website.data);

      const limit = website.data.length - 1;
      await expect(
        downloadedDB.query({
          limit,
          website: website.website,
        }),
        "Query website data limit not limit query count."
      ).resolves.toEqual(website.data.slice(0, limit));
    }
  });

  it("Test first,last argument whethen can limit query data.", async () => {
    const data = getDownloadeds(20);
    await saveDwonloadeds(data);
    orderDwonloadedByDownloadedAt(data);
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
        data: orderDwonloadedByDownloadedAt(
          getDownloadeds(10 + Math.round(Math.random() * 5), website)
        ),
      };
    });

    await saveDwonloadeds(
      orderDwonloadedByDownloadedAt(data.flatMap((d) => d.data))
    );

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
    orderDwonloadedByDownloadedAt(data);
    await downloadedDB.save(has);
    await expect(
      downloadedDB.query({ limit: data.length + 1 }),
      "Save saved data, saved data has update."
    ).resolves.toEqual(data);
    const now = new Date();
    has.downloaded_at = now;
    has.download_at = new Date(
      now.getTime() - Math.floor(Math.random() * 60) - 60
    );
    await downloadedDB.save(has);
    orderDwonloadedByDownloadedAt(data);
    await expect(
      downloadedDB.query({ limit: data.length + 1 }),
      "Update saved data, saved data not update."
    ).resolves.toEqual(data);
  });

  it("Test query specific data.", async () => {
    const data = getDownloadeds(10);
    await saveDwonloadeds(data);

    const randomHasDwonloaded = data[Math.floor(data.length * Math.random())];
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
