import { describe, expect, it } from "vitest";
import {
  formatTags,
  Order,
  RatingMode,
  RatingValue,
  TagMode,
} from "@/utils/format_tags";
import { toYMD } from "@/utils/date";

const tagModes = (Object.keys(TagMode) as Array<keyof typeof TagMode>).map(
  (key) => TagMode[key]
);

function randomChart() {
  const charts = "abcdefghijklmnopqustuvwxyz0123456789";
  return charts[Math.floor(charts.length * Math.random())];
}

function randomStr({
  min = 5,
  max = 10,
}: { min?: number; max?: number } = {}): string {
  if (min > max) min = max;
  const charts = [];
  do {
    charts.push(randomChart());
  } while (charts.length < min || (charts.length < max && Math.random() > 0.5));
  return charts.join("");
}

describe.concurrent("Test format tag module.", async () => {
  it.concurrent("Test format tags use empty argument.", async () => {
    expect(
      formatTags(),
      "Input empty argument result unequal to undefind."
    ).toBeUndefined();
  });

  it.concurrent("Test tags argument of format tags.", async () => {
    expect(
      formatTags({ tags: [] }),
      "Input empty array to tags argument result not's undefind."
    ).toBeUndefined();
    const tags = tagModes
      .map((tagMode) => [
        {
          mode: tagMode,
          tag: randomStr(),
        },
        {
          mode: tagMode,
          tag: new Array(2 + Math.round(Math.random() * 3))
            .fill(null)
            .map(() => randomStr())
            .join(" "),
        },
      ])
      .flatMap((tags) => tags);

    const formatTagStr = formatTags({ tags });

    expect(formatTagStr, "Not has result format tag.").toBeTruthy();

    expect(
      formatTagStr!.split(" ").length,
      `Count of format tag result \`${formatTagStr}\` unequal to length of input tags argument.`
    ).toBe(tags.length);

    tags.forEach((_) => {
      let tag = _.tag.replace(/ /g, "_");
      switch (_.mode) {
        case TagMode.is:
          break;
        case TagMode.or:
          tag = `~${tag}`;
          break;
        case TagMode.not:
          tag = `-${tag}`;
          break;
        default:
          throw new Error(`Unrelizal test in the tag mode ${_.mode}.`);
      }

      expect(
        formatTagStr!.split(" "),
        `Format tag result \`${formatTagStr}\` not contain the tag \`${tag}\`.`
      ).toContain(tag);
    });
  });

  it.concurrent("Test user argument of format tags.", async () => {
    const user = randomStr();
    expect(formatTags({ user }), "Test format tags unequal to user tag").toBe(
      `user:${user}`
    );
  });

  it.concurrent("Test vote:3 argument of format tags.", async () => {
    const vote3 = randomStr();
    expect(
      formatTags({ "vote:3": vote3 }),
      "Test format tags unequal to vote:3 tag"
    ).toBe(`vote:3:${vote3}`);
  });

  it.concurrent("Test md5 argument of format tags.", async () => {
    const md5 = randomStr();
    expect(formatTags({ md5 }), "Test format tags unequal to md5 tag").toBe(
      `md5:${md5}`
    );
  });

  it.concurrent("Test rating argument of format tags.", async () => {
    const ratingModes = (
      Object.keys(RatingMode) as Array<keyof typeof RatingMode>
    ).map((key) => RatingMode[key]);
    const ratingValues = (
      Object.keys(RatingValue) as Array<keyof typeof RatingValue>
    ).map((key) => RatingValue[key]);
    const ratings = ratingModes
      .map((mode) =>
        ratingValues.map((value) => ({
          mode,
          value,
        }))
      )
      .flatMap((ratings) => ratings);

    ratings.forEach((rating) => {
      expect(
        formatTags({ rating }),
        `Format rating tag untrue, the rating mode is ${rating.mode} value is ${rating.value}`
      ).toBe(`${[rating.mode, ["rating", rating.value].join(":")].join("")}`);
    });
  });

  it.concurrent("Test source argument of format tags.", async () => {
    const source = `https://axxuxy.xyz/${randomStr()}`;
    expect(
      formatTags({ source }),
      "Test format tags unequal to source tag"
    ).toBe(`source:${source}`);
  });

  it.concurrent("Test id argument of format tags.", async () => {
    const id = Math.round(Math.random() * 2000) + 100;
    expect(
      formatTags({ id }),
      `Set id argument to value ${id}, format tag untrue.`
    ).toBe(`id:${id}`);

    const range = {
      min: id,
      max: id + Math.round(Math.random() * 20) + 20,
    };

    expect(
      formatTags({ id: range }),
      `Set id argument to range min ${range.min} and max ${range.max} format tag untrue.`
    ).toBe(`id:${range.min}..${range.max}`);

    const onlyMin = { min: range.min };
    expect(
      formatTags({ id: onlyMin }),
      `Set id argument to range only min ${onlyMin.min} format tag untrue.`
    ).toBe(`id:${range.min}..`);

    const onlyMax = { max: range.max };
    expect(
      formatTags({ id: onlyMax }),
      `Set id argument to range only max ${onlyMax.max} format tag untrue.`
    ).toBe(`id:..${onlyMax.max}`);
  });

  it.concurrent("Test width argument of format tags.", async () => {
    const width = Math.round(Math.random() * 2000) + 100;
    expect(
      formatTags({ width }),
      `Set width argument to value ${width}, format tag untrue.`
    ).toBe(`width:${width}`);

    const range = {
      min: width,
      max: width + Math.round(Math.random() * 20) + 20,
    };

    expect(
      formatTags({ width: range }),
      `Set width argument to range min ${range.min} and max ${range.max} format tag untrue.`
    ).toBe(`width:${range.min}..${range.max}`);

    const onlyMin = { min: range.min };
    expect(
      formatTags({ width: onlyMin }),
      `Set width argument to range only min ${onlyMin.min} format tag untrue.`
    ).toBe(`width:${range.min}..`);

    const onlyMax = { max: range.max };
    expect(
      formatTags({ width: onlyMax }),
      `Set width argument to range only max ${onlyMax.max} format tag untrue.`
    ).toBe(`width:..${onlyMax.max}`);
  });

  it.concurrent("Test height argument of format tags.", async () => {
    const height = Math.round(Math.random() * 2000) + 100;
    expect(
      formatTags({ height }),
      `Set height argument to value ${height}, format tag untrue.`
    ).toBe(`height:${height}`);

    const range = {
      min: height,
      max: height + Math.round(Math.random() * 20) + 20,
    };

    expect(
      formatTags({ height: range }),
      `Set height argument to range min ${range.min} and max ${range.max} format tag untrue.`
    ).toBe(`height:${range.min}..${range.max}`);

    const onlyMin = { min: range.min };
    expect(
      formatTags({ height: onlyMin }),
      `Set height argument to range only min ${onlyMin.min} format tag untrue.`
    ).toBe(`height:${range.min}..`);

    const onlyMax = { max: range.max };
    expect(
      formatTags({ height: onlyMax }),
      `Set height argument to range only max ${onlyMax.max} format tag untrue.`
    ).toBe(`height:..${onlyMax.max}`);
  });

  it.concurrent("Test score argument of format tags.", async () => {
    const score = Math.round(Math.random() * 2000) + 100;
    expect(
      formatTags({ score }),
      `Set score argument to value ${score}, format tag untrue.`
    ).toBe(`score:${score}`);

    const range = {
      min: score,
      max: score + Math.round(Math.random() * 20) + 20,
    };

    expect(
      formatTags({ score: range }),
      `Set score argument to range min ${range.min} and max ${range.max} format tag untrue.`
    ).toBe(`score:${range.min}..${range.max}`);

    const onlyMin = { min: range.min };
    expect(
      formatTags({ score: onlyMin }),
      `Set score argument to range only min ${onlyMin.min} format tag untrue.`
    ).toBe(`score:${range.min}..`);

    const onlyMax = { max: range.max };
    expect(
      formatTags({ score: onlyMax }),
      `Set score argument to range only max ${onlyMax.max} format tag untrue.`
    ).toBe(`score:..${onlyMax.max}`);
  });

  it.concurrent("Test mpixels argument of format tags.", async () => {
    const mpixels = Math.round(Math.random() * 2000) + 100;
    expect(
      formatTags({ mpixels }),
      `Set mpixels argument to value ${mpixels}, format tag untrue.`
    ).toBe(`mpixels:${mpixels}`);

    const range = {
      min: mpixels,
      max: mpixels + Math.round(Math.random() * 20) + 20,
    };

    expect(
      formatTags({ mpixels: range }),
      `Set mpixels argument to range min ${range.min} and max ${range.max} format tag untrue.`
    ).toBe(`mpixels:${range.min}..${range.max}`);

    const onlyMin = { min: range.min };
    expect(
      formatTags({ mpixels: onlyMin }),
      `Set mpixels argument to range only min ${onlyMin.min} format tag untrue.`
    ).toBe(`mpixels:${range.min}..`);

    const onlyMax = { max: range.max };
    expect(
      formatTags({ mpixels: onlyMax }),
      `Set mpixels argument to range only max ${onlyMax.max} format tag untrue.`
    ).toBe(`mpixels:..${onlyMax.max}`);
  });

  it.concurrent("Test date argument of format tags.", async () => {
    const date = new Date();
    expect(
      formatTags({ date }),
      `Set date argument to value ${date}, format tag untrue.`
    ).toBe(`date:${toYMD(date)}`);

    const range = {
      min: new Date(date.getTime() - 86400000),
      max: date,
    };

    expect(
      formatTags({ date: range }),
      `Set date argument to range min ${range.min} and max ${range.max} format tag untrue.`
    ).toBe(`date:${toYMD(range.min)}..${toYMD(range.max)}`);

    const onlyMin = { min: range.min };
    expect(
      formatTags({ date: onlyMin }),
      `Set date argument to range only min ${onlyMin.min} format tag untrue.`
    ).toBe(`date:${toYMD(range.min)}..`);

    const onlyMax = { max: range.max };
    expect(
      formatTags({ date: onlyMax }),
      `Set date argument to range only max ${onlyMax.max} format tag untrue.`
    ).toBe(`date:..${toYMD(onlyMax.max)}`);
  });

  it.concurrent("Test order argument of format tags", async () => {
    const orders = (Object.keys(Order) as Array<keyof typeof Order>).map(
      (key) => Order[key]
    );

    orders.forEach((order) => {
      expect(
        formatTags({ order }),
        `Test format tags unequal to order tag.`
      ).toBe(`order:${order}`);
    });
  });

  it.concurrent("Test parent argument of format tags.", async () => {
    const parent = Math.round(Math.random() * 100) + 100;
    expect(formatTags({ parent }), "Test format tags unequal to user tag").toBe(
      `parent:${parent}`
    );
    expect(
      formatTags({ parent: false }),
      "Test format tags unequal to user tag"
    ).toBe("parent:none");
  });
});
