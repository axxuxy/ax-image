import { Random } from "mockjs";
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
  TagType,
  UserTag,
  Vote3Tag,
  WidthTag,
} from "@/utils/tags";

const tagTypes = Object.values(TagType);
const tagModes = Object.values(TagMode);
function getTagMode() {
  return tagModes[Math.round(tagModes.length * Math.random())];
}
const ratingTags = Object.values(RatingValue).flatMap((value) =>
  Object.values(RatingMode).map((mode) => new RatingTag({ mode, value }))
);
function getRatingTag() {
  return ratingTags[Random.integer(0, ratingTags.length - 1)];
}
const orders = Object.values(Order).map((order) => new OrderTag(order));
function getOrderTag() {
  return orders[Random.integer(0, orders.length - 1)];
}
export function getTag(type?: TagType): Tag {
  if (!type) type = tagTypes[Random.integer(0, tagTypes.length - 1)];

  switch (type) {
    case TagType.common:
      return new CommonTag(Random.word(), getTagMode());
    case TagType.user:
      return new UserTag(Random.word());
    case TagType.vote3:
      return new Vote3Tag(Random.word());
    case TagType.md5:
      return new MD5Tag(Random.string("0123456789abcdef", 32));
    case TagType.source:
      return new SourceTag(
        `https://www.pixiv.net/artworks/${Random.integer(80000000, 90000000)}`
      );
    case TagType.id: {
      const random = Math.random();
      return random < 0.25
        ? new IdTag(Random.integer(1000, 2000))
        : random < 0.5
        ? new IdTag({
            min: Random.integer(1000, 2000),
          })
        : random < 0.75
        ? new IdTag({
            max: Random.integer(1000, 2000),
          })
        : new IdTag({
            min: Random.integer(1000, 2000),
            max: Random.integer(2001, 3000),
          });
    }
    case TagType.width: {
      const random = Math.random();
      return random < 0.25
        ? new WidthTag(Random.integer(1000, 2000))
        : random < 0.5
        ? new WidthTag({
            min: Random.integer(1000, 2000),
          })
        : random < 0.75
        ? new WidthTag({
            max: Random.integer(1000, 2000),
          })
        : new WidthTag({
            min: Random.integer(1000, 2000),
            max: Random.integer(2001, 3000),
          });
    }
    case TagType.height: {
      const random = Math.random();
      return random < 0.25
        ? new HeightTag(Random.integer(1000, 2000))
        : random < 0.5
        ? new HeightTag({
            min: Random.integer(1000, 2000),
          })
        : random < 0.75
        ? new HeightTag({
            max: Random.integer(1000, 2000),
          })
        : new HeightTag({
            min: Random.integer(1000, 2000),
            max: Random.integer(2001, 3000),
          });
    }
    case TagType.score: {
      const random = Math.random();
      return random < 0.25
        ? new ScoreTag(Random.integer(10, 20))
        : random < 0.5
        ? new ScoreTag({
            min: Random.integer(10, 20),
          })
        : random < 0.75
        ? new ScoreTag({
            max: Random.integer(10, 20),
          })
        : new ScoreTag({
            min: Random.integer(10, 20),
            max: Random.integer(21, 30),
          });
    }
    case TagType.mpixels: {
      const random = Math.random();
      return random < 0.25
        ? new MpixelsTag(Random.integer(1000, 2000))
        : random < 0.5
        ? new MpixelsTag({
            min: Random.integer(1000, 2000),
          })
        : random < 0.75
        ? new MpixelsTag({
            max: Random.integer(1000, 2000),
          })
        : new MpixelsTag({
            min: Random.integer(1000, 2000),
            max: Random.integer(2001, 3000),
          });
    }
    case TagType.date: {
      const random = Math.random();
      return random < 0.25
        ? new DateTag(new Date(Random.date()))
        : random < 0.5
        ? new DateTag({
            min: new Date(Random.date()),
          })
        : random < 0.75
        ? new DateTag({
            max: new Date(Random.date()),
          })
        : (() => {
            const min = new Date(Random.date());
            const max = new Date(min);
            max.setDate(max.getDate() + Random.integer(2, 10));
            return new DateTag({ min, max });
          })();
    }
    case TagType.rating:
      return getRatingTag();
    case TagType.order:
      return getOrderTag();
    case TagType.parent:
      return Math.random() > 0.5
        ? new ParentTag(Random.integer(10000, 20000))
        : new ParentNoneTag();
  }
}
