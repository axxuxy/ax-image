import Request from "@/utils/request";
import { getBaseURLBySite, Website } from "@/utils/website";
import {
  RatingTag,
  Tag as FormatTag,
  RatingValue,
  type Rating,
  TagType as TagClass,
} from "@/utils/tags";

let rating: Rating | undefined;
export function setRating(_?: Rating) {
  rating = _;
}

export interface Post {
  id: number;
  tags: string;
  created_at: number;
  creator_id: number;
  author: string;
  change: number;
  source: string;
  score: number;
  md5: string;
  file_size: number;
  file_url: string;
  is_shown_in_index: boolean;
  preview_url: string;
  preview_width: number;
  preview_height: number;
  actual_preview_width: number;
  actual_preview_height: number;
  sample_url: string;
  sample_width: number;
  sample_height: number;
  sample_file_size: number;
  jpeg_url: string;
  jpeg_width: number;
  jpeg_height: number;
  jpeg_file_size: number;
  rating: RatingValue;
  has_children: boolean;
  parent_id: number | null;
  status: string;
  width: number;
  height: number;
  is_held: boolean;
  frames_pending_string: string;
  frames_pending: string[];
  frames_string: string;
  frames: string[];

  /// Nexts is only in yande site.
  updated_at?: number;
  approver_id?: null;
  file_ext?: string;
  is_rating_locked?: boolean;
  is_pending?: boolean;
  is_note_locked?: boolean;
  last_noted_at?: number;
  last_commented_at?: number;
}

interface GetPostsOption {
  tags?: Array<FormatTag>;
  limit?: number;
  page?: number;
}

/**
 * Get posts.
 * @param {Website} website - Webiste
 * @param {GetPostsOption} option - Option.
 * @param {AbortSignal} signal - Request signal.
 * @returns {Array<Post>} - Post list.
 */
export function getPostsApi(
  website: Website,
  option: GetPostsOption = {},
  signal?: AbortSignal
): Promise<Array<Post>> {
  const url = new URL(getBaseURLBySite(website));
  url.pathname = "post.json";

  const tags = option.tags ?? [];
  if (rating && tags.every((_) => _.type !== TagClass.rating))
    tags.push(new RatingTag(rating));
  if (tags.length)
    url.searchParams.set("tags", tags.map((_) => _.tag).join(" "));

  const { limit = 100, page } = option;
  url.searchParams.set("limit", limit.toString());
  if (page) url.searchParams.set("page", page.toString());

  return new Request(url).getJson<Array<Post>>(signal);
}

export enum TagOrder {
  date = "date",
  count = "count",
  name = "name",
}

interface GetTagsFullOption {
  limit?: number;
  page?: number;
  order?: TagOrder;
  id?: number;
  afterId?: number;
  name?: string;
  namePattern?: string;
}

/**
 * @prop {never} page - The argument do not work in website `Website.konachan`.
 * @prop {never} namePattern - The argument do not work in all website.
 */
type GetTagsOption = Pick<
  GetTagsFullOption,
  Exclude<keyof GetTagsFullOption, "page" | "namePattern">
>;

export enum TagType {
  general = "general",
  artist = "artist",
  copyright = "copyright",
  character = "character",
  circle = "circle",
  faults = "faults",
}

function getTagType(website: Website, type: number): TagType {
  switch (type) {
    case 0:
      return TagType.general;
    case 1:
      return TagType.artist;
    case 3:
      return TagType.copyright;
    case 4:
      return TagType.character;
    case 5:
      switch (website) {
        case Website.konachan:
          return TagType.faults;
        case Website.yande:
          return TagType.circle;
        default:
          throw new Error(
            `In tag type value is 5, not set the site ${website} tag type, site is ${website}.`
          );
      }
    case 6:
      switch (website) {
        case Website.konachan:
          return TagType.circle;
        case Website.yande:
          return TagType.faults;
        default:
          throw new Error(
            `In tag type value is 6, not set the site ${website} tag type, site is ${website}.`
          );
      }
    default:
      throw new Error(`Don't know the tag type, tag type value is ${type}.`);
  }
}

interface ApiTag {
  id: number;
  name: string;
  count: number;
  type: number;
  ambiguous: boolean;
}

export interface Tag {
  id: number;
  name: string;
  count: number;
  type: TagType;
  ambiguous: boolean;
}

export async function getTagsApi(
  website: Website,
  { limit, order, id, afterId, name }: GetTagsOption = {},
  signal?: AbortSignal
): Promise<Array<Tag>> {
  const url = new URL(getBaseURLBySite(website));
  url.pathname = "tag.json";
  if (typeof limit === "number")
    url.searchParams.append("limit", limit.toString());
  if (order) url.searchParams.append("order", order);
  if (typeof id === "number") url.searchParams.append("id", id.toString());
  if (typeof afterId === "number")
    url.searchParams.append("after_id", afterId.toString());
  if (name) url.searchParams.append("name", name);
  return (await new Request(url).getJson<Array<ApiTag>>(signal)).map((tag) => ({
    ...tag,
    type: getTagType(website, tag.type),
  }));
}
