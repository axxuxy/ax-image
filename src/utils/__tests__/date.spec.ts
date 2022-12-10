import { describe, it, expect } from "vitest";
import { toYMD } from "@/utils/date";

describe.concurrent("Test date module.", () => {
  it.concurrent("Test date module toYMD function.", () => {
    const date = new Date();
    const ymd = toYMD(date)
      .split("-")
      .map((n) => parseInt(n));

    expect(
      date.getFullYear(),
      "The year of toYMD function unequal to year of date."
    ).toBe(ymd[0]);
    expect(
      date.getMonth() + 1,
      "The month of toYMD function unequal to month of date."
    ).toBe(ymd[1]);
    expect(
      date.getDate(),
      "The day of toYMD function unequal to day of date."
    ).toBe(ymd[2]);
  });

  it.concurrent("Test UTC time", () => {
    const date = new Date("Sat Jan 01 2022 00:00:00 GMT+0800");
    expect(toYMD(date, true), "The time is UTC argument set not work.").toBe(
      "2021-12-31"
    );
  });
});
