import { toYMD } from "@/utils/date";

export enum TagMode {
  is = "is",
  or = "or",
  not = "not",
}

/**
 * @prop {string} tag Can use `*` as a wildcard.
 */
export interface Tag {
  mode: TagMode;
  name: string;
}

function formatTag({ mode, name }: Tag) {
  name = name.replace(/ /g, "_");
  switch (mode) {
    case TagMode.is:
      return name;
    case TagMode.or:
      return `~${name}`;
    case TagMode.not:
      return `-${name}`;
    default:
      throw new Error("Ubrealize the tag mode.");
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

function formatRating(rating: Rating) {
  return [rating.mode, ["rating", rating.value].join(":")].join("");
}

export type RangeValue = number | Date;
type Range<T extends RangeValue> =
  | {
      min?: T;
      max: T;
    }
  | {
      min: T;
      max?: T;
    }
  | {
      min: T;
      max: T;
    };
export type RangeOrValue<T extends RangeValue> = T | Range<T>;

function formatRangeValue(value?: RangeValue): string {
  if (typeof value === "number") return value.toString();
  if (value instanceof Date) return toYMD(value);
  if (value === undefined) return "";
  throw new Error(
    `Range value type not has this type of value, this value is ${value}`
  );
}

function formatRangeTagValue<T extends RangeValue>(range: Range<T>): string {
  return `${formatRangeValue(range.min)}..${formatRangeValue(range.max)}`;
}

function formatRangeOrValueTagValue<T extends RangeValue>(
  range: RangeOrValue<T>
): string {
  if (typeof range === "number") return range.toString();
  if (range instanceof Date) return toYMD(range);
  return formatRangeTagValue<T>(<Range<T>>range);
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

export interface TagsOptions {
  tags?: Tag[];
  user?: string;
  "vote:3"?: string;
  md5?: string;
  rating?: Rating;
  source?: string;
  id?: RangeOrValue<number>;
  width?: RangeOrValue<number>;
  height?: RangeOrValue<number>;
  score?: RangeOrValue<number>;
  mpixels?: RangeOrValue<number>;
  date?: RangeOrValue<Date>;
  order?: Order;
  parent?: number | false;
}

export function formatTags({
  tags: _,
  user,
  ["vote:3"]: vote3,
  md5,
  rating,
  source,
  id,
  width,
  height,
  score,
  mpixels,
  date,
  order,
  parent,
}: TagsOptions = {}): string | undefined {
  const tags = _?.map((tag) => formatTag(tag)) || [];
  if (user) tags.push(`user:${user}`);
  if (vote3) tags.push(`vote:3:${vote3}`);
  if (md5) tags.push(`md5:${md5}`);
  if (rating) tags.push(formatRating(rating));
  if (source) tags.push(`source:${source}`);
  if (id !== undefined) tags.push(`id:${formatRangeOrValueTagValue(id)}`);
  if (width !== undefined)
    tags.push(`width:${formatRangeOrValueTagValue(width)}`);
  if (height !== undefined)
    tags.push(`height:${formatRangeOrValueTagValue(height)}`);
  if (score !== undefined)
    tags.push(`score:${formatRangeOrValueTagValue(score)}`);
  if (mpixels !== undefined)
    tags.push(`mpixels:${formatRangeOrValueTagValue(mpixels)}`);
  if (date) tags.push(`date:${formatRangeOrValueTagValue(date)}`);
  if (order) tags.push(`order:${order}`);
  if (parent !== undefined)
    tags.push(`parent:${parent === false ? "none" : parent}`);

  if (tags.length) return tags.join(" ");
}

function restoreNumberRangeValue(_: string): RangeOrValue<number> | undefined {
  if (!_) return undefined;
  if (_.startsWith(">")) {
    const min = parseInt(_.slice(1)) - 1;
    return isNaN(min) ? undefined : { min };
  }
  if (_.startsWith(">=")) {
    const min = parseInt(_.slice(1));
    return isNaN(min) ? undefined : { min };
  }
  if (_.startsWith("<")) {
    const max = parseInt(_.slice(1)) + 1;
    return isNaN(max) ? undefined : { max };
  }
  if (_.startsWith(">")) {
    const max = parseInt(_.slice(1));
    return isNaN(max) ? undefined : { max };
  }
  const range = _.split("..");
  if (range.length > 1) {
    let min: number | undefined = parseInt(range[0]);
    if (isNaN(min)) min = undefined;
    let max: number | undefined = parseInt(range[1]);
    if (isNaN(max)) max = undefined;
    if (min !== undefined && max !== undefined) return { min, max };
    else return undefined;
  } else {
    const value = parseInt(_);
    if (isNaN(value)) return undefined;
    else return value;
  }
}
function restoreDateRangeValue(_: string): RangeOrValue<Date> | undefined {
  if (!_) return undefined;
  if (_.startsWith(">")) {
    const min = new Date(_.slice(1));
    min.setDate(min.getDate() - 1);
    return isNaN(min.getTime()) ? undefined : { min };
  }
  if (_.startsWith(">=")) {
    const min = new Date(_.slice(1));
    return isNaN(min.getTime()) ? undefined : { min };
  }
  if (_.startsWith("<")) {
    const max = new Date(_.slice(1));
    max.setDate(max.getDate() + 1);
    return isNaN(max.getTime()) ? undefined : { max };
  }
  if (_.startsWith(">")) {
    const max = new Date(_.slice(1));
    return isNaN(max.getTime()) ? undefined : { max };
  }
  const range = _.split("..");
  if (range.length > 1) {
    let min: Date | undefined = new Date(range[0]);
    if (isNaN(min.getTime())) min = undefined;
    let max: Date | undefined = new Date(range[1]);
    if (isNaN(max.getTime())) max = undefined;
    if (min !== undefined && max !== undefined) return { min, max };
    else return undefined;
  } else {
    const date = new Date(_);
    if (isNaN(date.getTime())) return undefined;
    else return date;
  }
}

/// TODO Need test the function.
export function restoreTags(tags: string): TagsOptions {
  const option: TagsOptions = {};
  tags.split(" ").forEach((_) => {
    if (!_) return;
    if (_.startsWith("user:")) {
      const user = _.slice(5);
      if (user) return (option.user = user);
    }
    if (_.startsWith("vote:3:")) {
      const vote3 = _.slice(7);
      if (vote3) return (option["vote:3"] = _.slice(7));
    }
    if (_.startsWith("md5:")) {
      const md5 = _.slice(4);
      if (md5) return (option.md5 = md5);
    }
    const rating = _.split("rating:");
    if (rating.length > 1) {
      const _ = Object.values(RatingValue).find((_) => _ === rating[1]);
      if (_) {
        if (rating[0] === "-")
          return (option.rating = {
            mode: RatingMode.not,
            value: _,
          });
        else if (rating[0] === "")
          return (option.rating = {
            mode: RatingMode.is,
            value: _,
          });
      }
    }
    if (_.startsWith("source:")) {
      const source = _.slice(7);
      if (source) return (option.source = source);
    }
    if (_.startsWith("id:")) {
      const id = restoreNumberRangeValue(_.slice(3));
      if (id !== undefined) return (option.id = id);
    }
    if (_.startsWith("width:")) {
      const width = restoreNumberRangeValue(_.slice(6));
      if (width !== undefined) return (option.width = width);
    }
    if (_.startsWith("height:")) {
      const height = restoreNumberRangeValue(_.slice(7));
      if (height !== undefined) return (option.height = height);
    }
    if (_.startsWith("score:")) {
      const score = restoreNumberRangeValue(_.slice(6));
      if (score !== undefined) return (option.score = score);
    }
    if (_.startsWith("mpixels:")) {
      const mpixels = restoreNumberRangeValue(_.slice(8));
      if (mpixels !== undefined) return (option.mpixels = mpixels);
    }
    if (_.startsWith("date:")) {
      const date = restoreDateRangeValue(_.slice(5));
      if (date !== undefined) return (option.date = date);
    }
    if (_.startsWith("order:")) {
      const _order = _.slice(6);
      const order = Object.values(Order).find((_) => _ === _order);
      if (order) return (option.order = order);
    }
    if (_.startsWith("parent:")) {
      const parent = _.slice(7);
      if (parent === "none") return (option.parent = false);
      else {
        const _ = parseInt(parent);
        if (!isNaN(_)) return (option.parent = _);
      }
    }
    let tag: Tag;
    if (_.startsWith("-"))
      tag = {
        mode: TagMode.not,
        name: _.slice(1),
      };
    else if (_.startsWith("~"))
      tag = {
        mode: TagMode.or,
        name: _.slice(1),
      };
    else
      tag = {
        mode: TagMode.is,
        name: _,
      };
    if (option.tags) option.tags.push(tag);
    else option.tags = [tag];
  });
  return option;
  // return {
  //   tags,
  //   user,
  //   ["vote:3"]: vote3,
  //   md5,
  //   rating,
  //   source,
  //   id,
  //   width,
  //   height,
  //   score,
  //   mpixels,
  //   date,
  //   order,
  //   parent,
  // };
}
