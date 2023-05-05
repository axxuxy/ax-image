import {
  CommonTag,
  DateTag,
  HeightTag,
  IdTag,
  MD5Tag,
  MpixelsTag,
  Order,
  OrderTag,
  ParentNoneTag,
  ParentTag,
  RatingMode,
  RatingTag,
  RatingValue,
  ScoreTag,
  SourceTag,
  Tag,
  TagMode,
  UserTag,
  Vote3Tag,
  WidthTag,
} from "@/utils/tags";
import { describe, expect, vi, it } from "vitest";

describe("Test tags.", () => {
  it.concurrent("Test common tag.", () => {
    expect(new CommonTag("name").tag, "Common tag format abnormal.").toBe(
      "name"
    );
    expect(
      new CommonTag("name", TagMode.is).tag,
      "Common tag is mode format abnormal."
    ).toBe("name");
    expect(
      new CommonTag("name", TagMode.not).tag,
      "Common tag not mode format abnormal."
    ).toBe("-name");
    expect(
      new CommonTag("name", TagMode.or).tag,
      "Common tag or mode format abnormal."
    ).toBe("~name");
  });

  it.concurrent("Test user tag.", () => {
    expect(new UserTag("name").tag, "User tag format abnormal.").toBe(
      "user:name"
    );
  });

  it.concurrent("Test vote3 tag.", () => {
    expect(new Vote3Tag("name").tag, "Vote3 tag format abnormal.").toBe(
      "vote:3:name"
    );
  });

  it.concurrent("Test md5 tag.", () => {
    expect(new MD5Tag("146568673").tag, "Vote3 tag format abnormal.").toBe(
      "md5:146568673"
    );
  });

  it.concurrent("Test source tag.", () => {
    expect(new SourceTag("*pixiv*").tag, "Source tag format abnormal.").toBe(
      "source:*pixiv*"
    );
  });

  it.concurrent("Test id tag.", () => {
    expect(new IdTag(100).tag, "Id tag value format abnormal.").toBe("id:100");

    expect(
      new IdTag({ min: 100 }).tag,
      "Id tag only set min range format abnormal."
    ).toBe("id:100..");
    expect(
      new IdTag({ max: 100 }).tag,
      "Id tag only set max range format abnormal."
    ).toBe("id:..100");
    expect(
      new IdTag({ min: 100, max: 200 }).tag,
      "Id tag set min and max range format abnormal."
    ).toBe("id:100..200");
  });

  it.concurrent("Test width tag.", () => {
    expect(new WidthTag(1920).tag, "Width tag value format abnormal.").toBe(
      "width:1920"
    );

    expect(
      new WidthTag({ min: 1280 }).tag,
      "Width tag only set min range format abnormal."
    ).toBe("width:1280..");
    expect(
      new WidthTag({ max: 1920 }).tag,
      "Width tag only set max range format abnormal."
    ).toBe("width:..1920");
    expect(
      new WidthTag({ min: 1280, max: 1920 }).tag,
      "Width tag set min and max range format abnormal."
    ).toBe("width:1280..1920");
  });

  it.concurrent("Test height tag.", () => {
    expect(new HeightTag(1080).tag, "Height tag value format abnormal.").toBe(
      "height:1080"
    );

    expect(
      new HeightTag({ min: 800 }).tag,
      "Height tag only set min range format abnormal."
    ).toBe("height:800..");
    expect(
      new HeightTag({ max: 1080 }).tag,
      "Height tag only set max range format abnormal."
    ).toBe("height:..1080");
    expect(
      new HeightTag({ min: 800, max: 1080 }).tag,
      "Height tag set min and max range format abnormal."
    ).toBe("height:800..1080");
  });

  it.concurrent("Test score tag.", () => {
    expect(new ScoreTag(20).tag, "Score tag value format abnormal.").toBe(
      "score:20"
    );

    expect(
      new ScoreTag({ min: 10 }).tag,
      "Score tag only set min range format abnormal."
    ).toBe("score:10..");
    expect(
      new ScoreTag({ max: 20 }).tag,
      "Score tag only set max range format abnormal."
    ).toBe("score:..20");
    expect(
      new ScoreTag({ min: 10, max: 20 }).tag,
      "Score tag set min and max range format abnormal."
    ).toBe("score:10..20");
  });

  it.concurrent("Test mpixels tag.", () => {
    expect(new MpixelsTag(100).tag, "Mpixels tag value format abnormal.").toBe(
      "mpixels:100"
    );

    expect(
      new MpixelsTag({ min: 100 }).tag,
      "Mpixels tag only set min range format abnormal."
    ).toBe("mpixels:100..");
    expect(
      new MpixelsTag({ max: 1000 }).tag,
      "Mpixels tag only set max range format abnormal."
    ).toBe("mpixels:..1000");
    expect(
      new MpixelsTag({ min: 100, max: 1000 }).tag,
      "Mpixels tag set min and max range format abnormal."
    ).toBe("mpixels:100..1000");
  });

  it("Test date tag.", () => {
    vi.useFakeTimers();
    const date = new Date(2022, 2, 10);
    vi.setSystemTime(date);
    expect(new DateTag(new Date()).tag, "Date tag value format abnormal.").toBe(
      `date:2022-03-10`
    );

    expect(
      new DateTag({ min: new Date() }).tag,
      "Date tag only set min range format abnormal."
    ).toBe("date:2022-03-10..");
    expect(
      new DateTag({ max: new Date() }).tag,
      "Date tag only set max range format abnormal."
    ).toBe("date:..2022-03-10");
    const min = new Date();
    const max = new Date();
    max.setDate(min.getDate() + 5);
    expect(
      new DateTag({ min, max }).tag,
      "Date tag set min and max range format abnormal."
    ).toBe("date:2022-03-10..2022-03-15");
    vi.useRealTimers();
  });

  it.concurrent("Test rating tag.", () => {
    expect(
      new RatingTag({
        value: RatingValue.explicit,
        mode: RatingMode.is,
      }).tag,
      "Rating tag in is mode explicit value format abnormal."
    ).toBe("rating:e");
    expect(
      new RatingTag({
        value: RatingValue.explicit,
        mode: RatingMode.not,
      }).tag,
      "Rating tag in not mode explicit value format abnormal."
    ).toBe("-rating:e");
    expect(
      new RatingTag({
        value: RatingValue.questionable,
        mode: RatingMode.is,
      }).tag,
      "Rating tag in is mode questionable value format abnormal."
    ).toBe("rating:q");
    expect(
      new RatingTag({
        value: RatingValue.questionable,
        mode: RatingMode.not,
      }).tag,
      "Rating tag in not mode questionable value format abnormal."
    ).toBe("-rating:q");
    expect(
      new RatingTag({
        value: RatingValue.safe,
        mode: RatingMode.is,
      }).tag,
      "Rating tag in is mode safe value format abnormal."
    ).toBe("rating:s");
    expect(
      new RatingTag({
        value: RatingValue.safe,
        mode: RatingMode.not,
      }).tag,
      "Rating tag in not mode safe value format abnormal."
    ).toBe("-rating:s");
  });

  it.concurrent("Test order tag.", () => {
    expect(
      new OrderTag(Order.id).tag,
      "Order tag in order is id format abnormal."
    ).toBe("order:id");
    expect(
      new OrderTag(Order.idDesc).tag,
      "Order tag in order is idDesc format abnormal."
    ).toBe("order:id_desc");
    expect(
      new OrderTag(Order.score).tag,
      "Order tag in order is score format abnormal."
    ).toBe("order:score");
    expect(
      new OrderTag(Order.scoreAsc).tag,
      "Order tag in order is scoreAsc format abnormal."
    ).toBe("order:score_asc");
    expect(
      new OrderTag(Order.mpixels).tag,
      "Order tag in order is mpixels format abnormal."
    ).toBe("order:mpixels");
    expect(
      new OrderTag(Order.mpixelsAsc).tag,
      "Order tag in order is mpixelsAsc format abnormal."
    ).toBe("order:mpixels_asc");
    expect(
      new OrderTag(Order.landscape).tag,
      "Order tag in order is landscape format abnormal."
    ).toBe("order:landscape");
    expect(
      new OrderTag(Order.portrait).tag,
      "Order tag in order is portrait format abnormal."
    ).toBe("order:portrait");
    expect(
      new OrderTag(Order.vote).tag,
      "Order tag in order is vote format abnormal."
    ).toBe("order:vote");
  });

  it.concurrent("Test parent tag.", () => {
    expect(new ParentTag(10000).tag, "Parent tag format abnormal.").toBe(
      "parent:10000"
    );
  });

  it.concurrent("Test parent none tag.", () => {
    expect(new ParentNoneTag().tag, "Parent none tag format abnormal.").toBe(
      "parent:none"
    );
  });

  it.concurrent("Test tag list", () => {
    const tags = [
      new CommonTag("common"),
      new CommonTag("common1", TagMode.is),
      new CommonTag("common2", TagMode.not),
      new CommonTag("common3", TagMode.or),
      new UserTag("name"),
      new Vote3Tag("vote"),
      new MD5Tag("md55555555555"),
      new SourceTag("*pixiv*"),
      new IdTag(10000),
      new IdTag({ min: 10000 }),
      new IdTag({ max: 20000 }),
      new IdTag({ min: 10000, max: 20000 }),
      new WidthTag(1920),
      new WidthTag({ min: 1280 }),
      new WidthTag({ max: 1920 }),
      new WidthTag({ min: 1280, max: 1920 }),
      new HeightTag(1080),
      new HeightTag({ min: 800 }),
      new HeightTag({ max: 1080 }),
      new HeightTag({ min: 800, max: 1080 }),
      new ScoreTag(20),
      new ScoreTag({ min: 10 }),
      new ScoreTag({ max: 20 }),
      new ScoreTag({ min: 10, max: 20 }),
      new MpixelsTag(100),
      new MpixelsTag({ min: 100 }),
      new MpixelsTag({ max: 1000 }),
      new MpixelsTag({ min: 100, max: 1000 }),
      new DateTag(new Date()),
      new DateTag({ min: new Date() }),
      new DateTag({ max: new Date() }),
      new DateTag({ min: new Date(2023, 4, 1), max: new Date(2023, 4, 3) }),
      ...Object.values(RatingValue)
        .map((value) =>
          Object.values(RatingMode).map(
            (mode) => new RatingTag({ mode, value })
          )
        )
        .flatMap((_) => _),
      ...Object.values(Order).map((order) => new OrderTag(order)),
      new ParentTag(10000),
      new ParentNoneTag(),
    ];
    const _ = tags
      .map((tag) => tag.tag)
      .join(" ")
      .split(" ")
      .map((_) => Tag.paser(_));
    tags.forEach((tag) => {
      expect(
        _.some((_) => _.tag === tag.tag),
        `The tag didn't find after in format tag list, the tag is ${tag.tag}`
      ).toBeTruthy();
    });
  });
});
