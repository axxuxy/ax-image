import { describe, expect, it, beforeEach } from "vitest";
import "fake-indexeddb/auto";
import { db } from "@/utils/db";
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
  for (const downloaded of downloadeds) await db.saveDownloadedInfo(downloaded);
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

/// The test of the describe cannot concurrent run.
/// Because saved data in db module will affect other test of db module.
describe("Test db module.", async () => {
  beforeEach(async () => {
    await db.clear();
    const data = await db.queryDownloadedInfos();
    if (data.length) throw new Error("Test db module has data is not clear.");
  });

  it("Test has save data.", async () => {
    await expect(
      db.queryDownloadedInfos(),
      "Saved data count not's 0."
    ).resolves.toEqual([]);
  });

  it("Test whethen can save data and clear save data.", async () => {
    await saveDwonloadeds(getDownloadeds(10));
    await expect(db.queryDownloadedInfos()).resolves.not.toEqual([]);

    await db.clear();
    await expect(db.queryDownloadedInfos()).resolves.toEqual([]);
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
      db.queryDownloadedInfos({ limit: data.length * 15 }),
      "Query all data prior downloaded time less to that downloaded time."
    ).resolves.toSatisfy((data) =>
      compareTimeLessPriorTime(<DownloadedInfoList>data)
    );

    const last =
      data[Math.floor(Math.random() * data.length)].data[0].downloaded_at;
    await expect(
      db.queryDownloadedInfos({ limit: data.length * 15, last }),
      "Set last argument query data prior downloaded time less to that downloaded time."
    ).resolves.toSatisfy((data) =>
      compareTimeLessPriorTime(<DownloadedInfoList>data)
    );

    for (const website of data) {
      await expect(
        db.queryDownloadedInfos({
          website: website.website,
          limit: website.data.length + 1,
        }),
        `Set website argument to ${website.website} after, in query data, prior downloaded time less to that downloaded time.`
      ).resolves.toSatisfy((data) =>
        compareTimeLessPriorTime(<DownloadedInfoList>data)
      );

      const last = website.data[5].downloaded_at;
      await expect(
        db.queryDownloadedInfos({
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
      db.queryDownloadedInfos({ limit: data.length + 1 }),
      "Save data is unequal to query data."
    ).resolves.toEqual(data);
  });

  it("Test limit argument whethen can limit query count.", async () => {
    const data = getDownloadeds(20);
    await saveDwonloadeds(data);
    await expect(
      db.queryDownloadedInfos({
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
        db.queryDownloadedInfos({
          limit: website.data.length + 1,
          website: website.website,
        }),
        "Query website data unequal to saved website data."
      ).resolves.toEqual(website.data);

      const limit = website.data.length - 1;
      await expect(
        db.queryDownloadedInfos({
          limit,
          website: website.website,
        }),
        "Query website data limit not limit query count."
      ).resolves.toEqual(website.data.slice(0, limit));
    }
  });

  it("Test last argument whethen cna limit query data.", async () => {
    const data = getDownloadeds(20);
    await saveDwonloadeds(data);
    orderDwonloadedByDownloadedAt(data);
    const last = new Date(data[10].downloaded_at);
    await expect(
      db.queryDownloadedInfos({ last }),
      "Query data have downloaded date of less to last."
    ).resolves.toSatisfy((data) =>
      (<DownloadedInfoList>data).every(
        (data) => data.downloaded_at.getTime() < last.getTime()
      )
    );
    await expect(
      db.queryDownloadedInfos({ last, limit: 5 }),
      "Limit query data count unequal to set limit argument."
    ).resolves.toHaveLength(5);
  });

  it("Test set website and last argument.", async () => {
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
      const last = website.data[1].downloaded_at;
      await expect(
        db.queryDownloadedInfos({
          website: website.website,
          last,
        }),
        "Have to downloaded date less to last or website of query data unequal to query website in query data."
      ).resolves.toSatisfy((data) =>
        (<DownloadedInfoList>data).every(
          (data) =>
            data.downloaded_at.getTime() < last.getTime() &&
            data.website === website.website
        )
      );

      await expect(
        db.queryDownloadedInfos({ last, website: website.website, limit: 5 }),
        "In set last and website argument after limit query data count unequal to set limit argument."
      ).resolves.toHaveLength(5);
    }
  });

  it("Test save saved data, saved data whethen update.", async () => {
    const data = getDownloadeds(20);
    await saveDwonloadeds(data);
    const has = data[0];
    orderDwonloadedByDownloadedAt(data);
    await db.saveDownloadedInfo(has);
    await expect(
      db.queryDownloadedInfos({ limit: data.length + 1 }),
      "Save saved data, saved data has update."
    ).resolves.toEqual(data);
    const now = new Date();
    has.downloaded_at = now;
    has.download_at = new Date(
      now.getTime() - Math.floor(Math.random() * 60) - 60
    );
    await db.saveDownloadedInfo(has);
    orderDwonloadedByDownloadedAt(data);
    await expect(
      db.queryDownloadedInfos({ limit: data.length + 1 }),
      "Update saved data, saved data not update."
    ).resolves.toEqual(data);
  });

  it("Test query specific data.", async () => {
    const data = getDownloadeds(10);
    await saveDwonloadeds(data);

    const randomHasDwonloaded = data[Math.floor(data.length * Math.random())];
    await expect(
      db.queryDownloadedInfo({
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
      db.queryDownloadedInfo(not),
      "Find not saved data."
    ).resolves.toBeUndefined();
  });
});
