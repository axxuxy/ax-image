import { toYMD } from "@/utils/date";

export enum TagMode {
  is = "is",
  or = "or",
  not = "not",
}

/**
 * @prop {string} tag Can use `*` as a wildcard.
 */
interface Tag {
  mode: TagMode;
  tag: string;
}

function formatTag({ mode, tag }: Tag) {
  tag = tag.replace(/ /g, "_");
  switch (mode) {
    case TagMode.is:
      return tag;
    case TagMode.or:
      return `~${tag}`;
    case TagMode.not:
      return `-${tag}`;
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

type RangeValue = number | Date;
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
type RangeOrValue<T extends RangeValue> = T | Range<T>;

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
  return formatRangeTagValue<T>(range as Range<T>);
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
