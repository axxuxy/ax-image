import { toYMD } from "@/utils/date";

type RangeValue = Date | number;
export type Range<T = RangeValue> =
  | {
      min?: T;
      max: T;
    }
  | {
      min: T;
      max?: T;
    };

export type RangeOrValue<T = RangeValue> = T | Range<T>;

function restoreNumberRangeValue(_: string): RangeOrValue<number> | undefined {
  if (!_) return undefined;
  if (_.startsWith(">=")) {
    const min = parseInt(_.slice(1));
    return isNaN(min) ? undefined : { min };
  }
  if (_.startsWith(">")) {
    const min = parseInt(_.slice(1)) - 1;
    return isNaN(min) ? undefined : { min };
  }
  if (_.startsWith("<=")) {
    const max = parseInt(_.slice(1));
    return isNaN(max) ? undefined : { max };
  }
  if (_.startsWith("<")) {
    const max = parseInt(_.slice(1)) + 1;
    return isNaN(max) ? undefined : { max };
  }
  const range = _.split("..");
  if (range.length > 1) {
    let min: number | undefined = parseInt(range[0]);
    if (isNaN(min)) min = undefined;
    let max: number | undefined = parseInt(range[1]);
    if (isNaN(max)) max = undefined;
    if (min === undefined && max === undefined) return undefined;
    else return { min, max } as Range<number>;
  } else {
    const value = parseInt(_);
    if (isNaN(value)) return undefined;
    else return value;
  }
}
function restoreDateRangeValue(_: string): RangeOrValue<Date> | undefined {
  if (!_) return undefined;
  if (_.startsWith(">=")) {
    const min = new Date(_.slice(1));
    return isNaN(min.getTime()) ? undefined : { min };
  }
  if (_.startsWith(">")) {
    const min = new Date(_.slice(1));
    min.setDate(min.getDate() - 1);
    return isNaN(min.getTime()) ? undefined : { min };
  }
  if (_.startsWith("<=")) {
    const max = new Date(_.slice(1));
    return isNaN(max.getTime()) ? undefined : { max };
  }
  if (_.startsWith("<")) {
    const max = new Date(_.slice(1));
    max.setDate(max.getDate() + 1);
    return isNaN(max.getTime()) ? undefined : { max };
  }
  const range = _.split("..");
  if (range.length > 1) {
    let min: Date | undefined = new Date(range[0]);
    if (isNaN(min.getTime())) min = undefined;
    let max: Date | undefined = new Date(range[1]);
    if (isNaN(max.getTime())) max = undefined;
    if (min === undefined && max === undefined) return undefined;
    else return { min, max } as Range<Date>;
  } else {
    const date = new Date(_);
    return isNaN(date.getTime()) ? undefined : date;
  }
}

export enum TagMode {
  is = "is",
  or = "or",
  not = "not",
}

export enum TagType {
  common = "common",
  user = "user",
  vote3 = "vote3",
  md5 = "md5",
  source = "source",
  id = "id",
  width = "width",
  height = "height",
  score = "score",
  mpixels = "mpixels",
  date = "date",
  rating = "rating",
  order = "order",
  parent = "parent",
}

export abstract class Tag {
  static paser(tag: string) {
    if (!tag) throw new Error(`Tag string cannot is empty.`);
    if (tag.startsWith("user:")) {
      const user = tag.slice(5);
      if (user) return new UserTag(user);
    }
    if (tag.startsWith("vote:3:")) {
      const vote3 = tag.slice(7);
      if (vote3) return new Vote3Tag(vote3);
    }
    if (tag.startsWith("md5:")) {
      const md5 = tag.slice(4);
      if (md5) return new MD5Tag(md5);
    }
    if (tag.startsWith("source:")) {
      const source = tag.slice(7);
      if (source) return new SourceTag(source);
    }
    if (tag.startsWith("id:")) {
      const id = restoreNumberRangeValue(tag.slice(3));
      if (id !== undefined) return new IdTag(id);
    }
    if (tag.startsWith("width:")) {
      const width = restoreNumberRangeValue(tag.slice(6));
      if (width !== undefined) return new WidthTag(width);
    }
    if (tag.startsWith("height:")) {
      const height = restoreNumberRangeValue(tag.slice(7));
      if (height !== undefined) return new HeightTag(height);
    }
    if (tag.startsWith("score:")) {
      const score = restoreNumberRangeValue(tag.slice(6));
      if (score !== undefined) return new ScoreTag(score);
    }
    if (tag.startsWith("mpixels:")) {
      const mpixels = restoreNumberRangeValue(tag.slice(8));
      if (mpixels !== undefined) return new MpixelsTag(mpixels);
    }
    if (tag.startsWith("date:")) {
      const date = restoreDateRangeValue(tag.slice(5));
      if (date !== undefined) return new DateTag(date);
    }
    const rating = tag.split("rating:");
    if (rating.length > 1) {
      const _ = Object.values(RatingValue).find((_) => _ === rating[1]);
      if (_) {
        if (rating[0] === "-")
          return new RatingTag({
            value: _,
            mode: RatingMode.not,
          });
        else if (rating[0] === "")
          return new RatingTag({
            value: _,
            mode: RatingMode.is,
          });
      }
    }
    if (tag.startsWith("order:")) {
      const _order = tag.slice(6);
      const order = Object.values(Order).find((_) => _ === _order);
      if (order) return new OrderTag(order);
    }
    if (tag.startsWith("parent:")) {
      const parent = tag.slice(7);
      if (parent === "none") return new ParentNoneTag();
      else {
        const _ = parseInt(parent);
        if (isNaN(_))
          console.warn(
            `Parent tag value be converted to int,the tag is ${tag}.`
          );
        else return new ParentTag(_);
      }
    }

    if (tag.startsWith("-")) return new CommonTag(tag.slice(1), TagMode.not);
    else if (tag.startsWith("~"))
      return new CommonTag(tag.slice(1), TagMode.or);
    else return new CommonTag(tag, TagMode.is);
  }
  abstract type: TagType;
  abstract tag: string;
}

export class CommonTag extends Tag {
  readonly type = TagType.common;
  readonly value: string;
  readonly mode: TagMode;
  get tag(): string {
    switch (this.mode) {
      case TagMode.is:
        return this.value;
      case TagMode.not:
        return `-${this.value}`;
      case TagMode.or:
        return `~${this.value}`;
    }
  }
  constructor(tag: string, mode = TagMode.is) {
    super();
    this.value = tag;
    this.mode = mode;
  }
}

export class UserTag extends Tag {
  readonly type = TagType.user;
  readonly user: string;
  get tag() {
    return `user:${this.user}`;
  }
  constructor(user: string) {
    super();
    this.user = user;
  }
}

export class Vote3Tag extends Tag {
  readonly type = TagType.vote3;
  readonly vote: string;
  get tag() {
    return `vote:3:${this.vote}`;
  }
  constructor(vote: string) {
    super();
    this.vote = vote;
  }
}

export class MD5Tag extends Tag {
  readonly type = TagType.md5;
  readonly md5: string;
  get tag() {
    return `md5:${this.md5}`;
  }
  constructor(md5: string) {
    super();
    this.md5 = md5;
  }
}

export class SourceTag extends Tag {
  readonly type = TagType.source;
  readonly source: string;
  get tag() {
    return `source:${this.source}`;
  }
  constructor(source: string) {
    super();
    this.source = source;
  }
}

export abstract class RangeTagOrValueTag<T = RangeValue> extends Tag {
  readonly value: RangeOrValue<T>;
  constructor(value: RangeOrValue<T>) {
    super();
    this.value = value;
  }
}

abstract class RangeTagOrValueTagNumber extends RangeTagOrValueTag<number> {
  get tag() {
    return `${this.type}:${
      typeof this.value === "number"
        ? this.value
        : [this.value.min, this.value.max].join("..")
    }`;
  }
  constructor(value: RangeOrValue<number>) {
    super(value);
  }
}

export class IdTag extends RangeTagOrValueTagNumber {
  readonly type = TagType.id;
  constructor(value: RangeOrValue<number>) {
    super(value);
  }
}

export class WidthTag extends RangeTagOrValueTagNumber {
  readonly type = TagType.width;
  constructor(value: RangeOrValue<number>) {
    super(value);
  }
}

export class HeightTag extends RangeTagOrValueTagNumber {
  readonly type = TagType.height;
  constructor(value: RangeOrValue<number>) {
    super(value);
  }
}

export class ScoreTag extends RangeTagOrValueTagNumber {
  readonly type = TagType.score;
  constructor(value: RangeOrValue<number>) {
    super(value);
  }
}

export class MpixelsTag extends RangeTagOrValueTagNumber {
  readonly type = TagType.mpixels;
  constructor(value: RangeOrValue<number>) {
    super(value);
  }
}

function dateValue(date?: Date) {
  return date ? toYMD(date) : undefined;
}

export class DateTag extends RangeTagOrValueTag<Date> {
  readonly type = TagType.date;
  get tag() {
    return `${this.type}:${
      this.value instanceof Date
        ? dateValue(this.value)
        : [this.value.min, this.value.max].map(dateValue).join("..")
    }`;
  }
  constructor(value: RangeOrValue<Date>) {
    super(value);
  }
}

export enum RatingValue {
  safe = "s",
  questionable = "q",
  explicit = "e",
}

export enum RatingMode {
  is = "",
  not = "-",
}

export interface Rating {
  value: RatingValue;
  mode: RatingMode;
}

export class RatingTag extends Tag {
  readonly type = TagType.rating;
  readonly rating: Rating;
  get tag() {
    return `${this.rating.mode}rating:${this.rating.value}`;
  }
  constructor(rating: Rating) {
    super();
    this.rating = rating;
  }
}

export enum Order {
  id = "id",
  idDesc = "id_desc",
  score = "score",
  scoreAsc = "score_asc",
  mpixels = "mpixels",
  mpixelsAsc = "mpixels_asc",
  landscape = "landscape",
  portrait = "portrait",
  vote = "vote",
}

export class OrderTag extends Tag {
  readonly type = TagType.order;
  readonly order: Order;
  get tag() {
    return `order:${this.order}`;
  }
  constructor(order: Order) {
    super();
    this.order = order;
  }
}

export class ParentTag extends Tag {
  readonly type = TagType.parent;
  readonly id: number;
  get tag() {
    return `parent:${this.id}`;
  }
  constructor(id: number) {
    super();
    this.id = id;
  }
}

export class ParentNoneTag extends Tag {
  readonly type = TagType.parent;
  readonly tag = "parent:none";
}
