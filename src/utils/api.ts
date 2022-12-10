import Request from "@/utils/request";
import { getBaseURLBySite, type Website } from "@/utils/website";
import { formatTags, type TagsOptions, type Rating } from "@/utils/format_tags";

export interface GetPostsOption extends TagsOptions {
  limit?: number;
  page?: number;
}

let rating: Rating | undefined;
export function setRating(_?: Rating) {
  rating = _;
}

/**
 *
 * @param {GetPostsOption} option
 * @param {Date} option.date In website use is UTC time.
 */
export function getPosts(
  website: Website,
  option: GetPostsOption = {}
): Promise<Array<Post>> {
  const url = new URL(getBaseURLBySite(website));
  url.pathname = "post.json";

  if (!option.rating) option.rating = rating;
  const tags = formatTags(option);
  if (tags) url.searchParams.set("tags", tags);

  const { limit = 100, page } = option;
  url.searchParams.set("limit", limit.toString());
  if (page) url.searchParams.set("page", page.toString());

  return new Request(url).getJson<Array<Post>>();
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

export async function getTags(
  website: Website,
  { limit, order, id, afterId, name }: GetTagsOption = {}
): Promise<Array<Tag>> {
  const url = new URL(getBaseURLBySite(website));
  url.pathname = "tag.json";
  if (limit) url.searchParams.append("limit", limit.toString());
  if (order) url.searchParams.append("order", order);
  if (id) url.searchParams.append("id", id.toString());
  if (afterId) url.searchParams.append("after_id", afterId.toString());
  if (name) url.searchParams.append("name", name);
  return await new Request(url).getJson<Array<Tag>>();
}
