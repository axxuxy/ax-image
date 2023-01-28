import { describe, expect, it } from "vitest";
import { getPosts, getTags, TagOrder, type Post, type Tag } from "@/utils/api";
import { Website } from "@/utils/website";
import "@/utils/__tools__/request";
import { setupServer } from "msw/node";
import { rest } from "msw";
import { ProxyType, setProxy } from "@/utils/request";
import { Order, RatingMode, RatingValue, TagMode } from "@/utils/format_tags";
import { toYMD } from "@/utils/date";

const mock = false;
if (mock) {
  /// TODO Need realize mock api data.
  setupServer(
    rest.get(/post\.json/, (req, res, ctx) => {
      throw new Error("Need realize mock data.");
      return res(
        ctx.status(200)
        // ctx.json(posts),
      );
    }),
    rest.get(/tag\.json/, (req, res, ctx) => {
      throw new Error("Need realize mock data.");
      return res(
        ctx.status(200)
        // ctx.json(posts),
      );
    })
  );
} else {
  setProxy({
    host: "127.0.0.1",
    port: 10808,
    type: ProxyType.socks5,
  });
}

const websites = Object.values(Website);

function checkPost(post: Post): boolean {
  return (
    (post.tags ? typeof post.tags === "string" : true) &&
    typeof post.creator_id === "number" &&
    typeof post.author === "string" &&
    typeof post.md5 === "string" &&
    typeof post.rating === "string" &&
    ["s", "e", "q"].includes(post.rating) &&
    (post.source ? typeof post.source === "string" : true) &&
    typeof post.id === "number" &&
    post.id > 0 &&
    typeof post.width === "number" &&
    typeof post.height === "number" &&
    typeof post.score === "number" &&
    typeof post.created_at === "number" &&
    (post.parent_id ? typeof post.parent_id === "number" : true) &&
    typeof post.has_children === "boolean" &&
    typeof post.preview_url === "string" &&
    /^http(s)?:\/\//.test(post.preview_url)
  );
}

function checkOrder(posts: Array<Post>, order: Order): boolean {
  switch (order) {
    case Order.id: {
      let id = null;
      for (const post of posts) {
        if (id !== null && id >= post.id) return false;
        id = post.id;
      }
      return true;
    }
    case Order.idDesc: {
      let id = null;
      for (const post of posts) {
        if (id !== null && id <= post.id) return false;
        id = post.id;
      }
      return true;
    }
    case Order.score: {
      let score = null;
      for (const post of posts) {
        if (score !== null && score < post.score) return false;
        score = post.score;
      }
      return true;
    }
    case Order.scoreAsc: {
      let score = null;
      for (const post of posts) {
        if (score !== null && score > post.score) return false;
        score = post.score;
      }
      return true;
    }
    case Order.mpixels: {
      /// Webiste `Website.yande` has post not have width and height.
      posts = posts.filter(
        (post) => post.width !== null && post.height !== null
      );
      let mpixels = null;
      for (const post of posts) {
        const _ = post.width * post.height;
        if (mpixels !== null && mpixels < _) return false;
        mpixels = _;
      }
      return true;
    }
    case Order.mpixelsAsc: {
      /// Webiste `Website.yande` has post not have width and height.
      posts = posts.filter(
        (post) =>
          post.width !== null &&
          post.height !== null &&
          post.width > 0 &&
          post.height > 0
      );
      let mpixels = null;
      for (const post of posts) {
        const _ = post.width * post.height;
        if (mpixels !== null && mpixels > _) return false;
        mpixels = _;
      }
      return true;
    }
    case Order.landscape: {
      /// Webiste `Website.yande` has post not have width and height.
      posts = posts.filter(
        (post) =>
          post.width !== null &&
          post.height !== null &&
          post.width > 0 &&
          post.height > 0
      );

      let landscape = null;
      for (const post of posts) {
        const _ = post.width / post.height;
        if (landscape !== null && landscape < _) return false;
        landscape = _;
      }
      return true;
    }
    case Order.portrait: {
      let portrait = null;
      for (const post of posts) {
        const _ = post.height / post.width;
        if (portrait !== null && portrait < _) return false;
        portrait = _;
      }
      return true;
    }
    case Order.vote:
      throw new Error(`I don't know test the order ${Order.vote}.`);
    default:
      throw new Error(`Unrealize the order ${order} check.`);
  }
}

describe.skipIf(!mock)("Test get posts api.", async () => {
  it(
    "Test get posts api only input website.",
    async () => {
      for (const website of websites) {
        const posts = await getPosts(website);

        expect(Array.isArray(posts), "Get posts not's array.").toBe(true);
        expect(posts.length, "Get posts is empty.").toBeTruthy();
        expect(posts.every(checkPost), "Get posts format untrue.").toBe(true);
      }
    },
    {
      timeout: 100000,
    }
  );

  it(
    "Test get posts by tags of tags argument.",
    async () => {
      for (const website of websites) {
        /// Get two tag, them certain has post.
        const [{ name }, { name: name2 }] = await getTags(website, {
          order: TagOrder.count,
          limit: 2,
        });

        /// Test has tag.
        const tagPosts = await getPosts(website, {
          tags: [
            {
              name,
              mode: TagMode.is,
            },
          ],
        });
        expect(
          tagPosts.length,
          `Get posts use tag \`${name}\` not find post, website is ${website}.`
        ).toBeTruthy();
        expect(
          tagPosts.every(
            (post) => checkPost(post) && post.tags!.split(" ").includes(name)
          ),
          `Get posts use tag \`${name}\` has post not the tag \`${name}\`, website is ${website}.`
        ).toBe(true);

        /// Test not tag.
        await expect(
          getPosts(website, {
            tags: [
              /// Set has tag and not the tag, then not find post, else untrue.
              {
                name,
                mode: TagMode.is,
              },
              {
                name,
                mode: TagMode.not,
              },
            ],
          }),
          `Set not tag not work, in website ${website}, tag is ${name}.`
        ).resolves.toEqual([]);

        /// Test or tag.
        await expect(
          getPosts(website, {
            tags: [
              {
                name,
                mode: TagMode.or,
              },
              {
                name: name2,
                mode: TagMode.or,
              },
            ],
          }),
          `Did not find a post with only one of the set tags, in website ${website}, tags is ${name} and ${name2}`
        ).resolves.toSatisfy((posts) => {
          return (
            (<Array<Post>>posts).some((post) => {
              const tags = post.tags.split(" ");
              return tags.includes(name) && !tags.includes(name2);
            }) &&
            (<Array<Post>>posts).some((post) => {
              const tags = post.tags.split(" ");
              return tags.includes(name2) && !tags.includes(name);
            })
          );
        });

        /// Test use `*` as wildcard of tag.
        await expect(
          getPosts(website, {
            tags: [
              {
                mode: TagMode.is,
                name: "*_*",
              },
            ],
          }),
          `Use \`*\` as wildcard not work well, in website ${website}.`
        ).resolves.toSatisfy((posts) =>
          (<Array<Post>>posts).every((post) => post.tags.includes("_"))
        );
      }
    },
    {
      timeout: 100000,
    }
  );

  it(
    "Test get posts by user of tags argument.",
    async () => {
      for (const website of websites) {
        const [{ author }] = await getPosts(website, { limit: 1 });
        await expect(
          getPosts(website, { user: author }),
          `Get posts has post contain autnor is't ${author},in website ${website}.`
        ).resolves.toSatisfy(
          (posts) =>
            (<Array<Post>>posts).length > 0 &&
            (<Array<Post>>posts).every((post) => post.author === author)
        );
      }
    },
    {
      timeout: 100000,
    }
  );

  /// Emm, the test retain.
  /// I don't know has a user with vote to post is 3.
  /// Also I don't know judement was a user whether vote is 3 to the posts.
  /// Can use a account vote is 3 to a post.
  /// But in now, for time being, I do without use that.
  it.todo("Test get posts by vote:3 of tags argument.");

  it(
    "Test get posts by md5 of tags argument.",
    async () => {
      for (const website of websites) {
        const [{ md5 }] = await getPosts(website, { limit: 1 });

        await expect(
          getPosts(website, { md5 }),
          `Get post md5 is not md5 argument, in website ${website}, md5 is ${md5}.`
        ).resolves.toSatisfy(
          (posts) =>
            (<Array<Post>>posts).length > 0 &&
            (<Array<Post>>posts).every((post) => post.md5 === md5)
        );
      }
    },
    {
      timeout: 100000,
    }
  );

  it(
    "Test get posts by rating of tags argument.",
    async () => {
      const ratingModes = Object.values(RatingMode);
      const ratingValues = Object.values(RatingValue);
      for (const website of websites) {
        for (const mode of ratingModes) {
          for (const value of ratingValues) {
            await expect(
              getPosts(website, { rating: { mode, value } })
            ).resolves.toSatisfy((posts) => {
              switch (mode) {
                case RatingMode.is:
                  return (<Array<Post>>posts).every(
                    (post) => post.rating === value
                  );
                case RatingMode.not:
                  return (<Array<Post>>posts).every(
                    (post) => post.rating !== value
                  );
                default:
                  throw new Error(
                    `Rating mode not unrealize the rating mode, mode is ${mode}`
                  );
              }
            });
          }
        }
      }
    },
    {
      timeout: 100000,
    }
  );

  it(
    "Test get posts by source of tags argument.",
    async () => {
      for (const website of websites) {
        /// Test get posts by source with use `*` as wildcard of `cource` argument.
        const posts = await getPosts(website, { source: "*pixiv*" });
        expect(
          posts.length,
          `Not find source has \`pixiv\` post, in website ${website}.`
        ).toBeTruthy();
        expect(
          posts.every((post) => post.source.includes("pixiv")),
          `Has post not find string \`pixiv\`, in website ${website}.`
        ).toBeTruthy();

        /// Test get posts use specific `source` argument.
        const source = posts[0].source!;
        const sourcePosts = await getPosts(website, { source });
        expect(
          sourcePosts.length,
          `Not find post, in website ${website}, source is ${source}`
        ).toBeTruthy();
        expect(
          sourcePosts.every((post) => post.source === source),
          `Get posts source is not input source, in website ${website}, source is ${source}`
        ).toBe(true);
      }
    },
    {
      timeout: 100000,
    }
  );

  it(
    "Test get posts by id of tags argument.",
    async () => {
      for (const website of websites) {
        const [{ id }] = await getPosts(website);

        /// Test get posts use specific `id` argument.
        const posts = await getPosts(website, { id });
        expect(
          posts.length,
          `Not get posts use id argument, in website ${website}, id is ${id}.`
        ).toBe(1);
        expect(
          posts.every((post) => post.id === id),
          `Id isn't use ${id} as id argument of get post, in website ${website}.`
        ).toBe(true);

        /// Test get post use max id argument.
        const postsByOnlyMaxId = await getPosts(website, { id: { max: id } });
        expect(
          postsByOnlyMaxId.length > 0,
          `Not get posts use max id argument, in website ${website}, max id is ${id}.`
        ).toBe(true);
        expect(
          postsByOnlyMaxId.every((post) => post.id <= id),
          `Id isn't less than max id argument of get post, in website ${website}, use max id is ${id}.`
        ).toBe(true);

        /// Test get post use min id argument.
        const min = id - 20;
        const postsByOnlyMinId = await getPosts(website, { id: { min } });
        expect(
          postsByOnlyMinId.length > 0,
          `Not get posts use max id argument, in website ${website}, min id is ${min}.`
        ).toBe(true);
        expect(
          postsByOnlyMinId.every((post) => post.id >= min),
          `Id isn't greater than max id argument of get post, in website ${website}, use min id is ${min}.`
        ).toBe(true);

        /// Test get post use range id argument.
        const rangePosts = await getPosts(website, { id: { max: id, min } });
        expect(
          rangePosts.length > 0,
          `Not get posts use range of id argument, in website ${website}, min id is ${min}, max id is ${id}.`
        ).toBe(true);
        expect(
          rangePosts.every((post) => post.id <= id && post.id >= min),
          `Id isn't greater than min id and less than max id  of id argument of get post, in website ${website}, use min id is ${min}, max id is ${id}.`
        ).toBe(true);
      }
    },
    {
      timeout: 100000,
    }
  );

  it(
    "Test get posts by width of tags argument.",
    async () => {
      for (const website of websites) {
        const width = 1920;

        /// Test get posts use specific `width` argument.
        const posts = await getPosts(website, { width });
        expect(
          posts.length > 0,
          `Not get posts use width argument, in website ${website}, width is ${width}.`
        ).toBe(true);
        expect(
          posts.every((post) => post.width === width),
          `Width isn't use ${width} as width argument of get post, in website ${website}.`
        ).toBe(true);

        /// Test get post use max width argument.
        const postsByOnlyMaxWidth = await getPosts(website, {
          width: { max: width },
        });
        expect(
          postsByOnlyMaxWidth.length > 0,
          `Not get posts use max width argument, in website ${website}, max width is ${width}.`
        ).toBe(true);
        expect(
          postsByOnlyMaxWidth.every((post) => post.width <= width),
          `Width isn't less than max width argument of get post, in website ${website}, use max width is ${width}.`
        ).toBe(true);

        /// Test get post use min width argument.
        const min = 1280;
        const postsByOnlyMinWidth = await getPosts(website, { width: { min } });
        expect(
          postsByOnlyMinWidth.length > 0,
          `Not get posts use max width argument, in website ${website}, min width is ${min}.`
        ).toBe(true);
        expect(
          postsByOnlyMinWidth.every((post) => post.width >= min),
          `Width isn't greater than max width argument of get post, in website ${website}, use min width is ${min}.`
        ).toBe(true);

        /// Test get post use range width argument.
        const rangePosts = await getPosts(website, {
          width: { max: width, min },
        });
        expect(
          rangePosts.length > 0,
          `Not get posts use range of width argument, in website ${website}, min width is ${min}, max width is ${width}.`
        ).toBe(true);
        expect(
          rangePosts.every((post) => post.width <= width && post.width >= min),
          `Width isn't greater than min width and less than max width  of width argument of get post, in website ${website}, use min width is ${min}, max width is ${width}.`
        ).toBe(true);
      }
    },
    {
      timeout: 100000,
    }
  );

  it(
    "Test get posts by height of tags argument.",
    async () => {
      for (const website of websites) {
        const height = 1080;

        /// Test get posts use specific `height` argument.
        const posts = await getPosts(website, { height });
        expect(
          posts.length > 0,
          `Not get posts use height argument, in website ${website}, height is ${height}.`
        ).toBe(true);
        expect(
          posts.every((post) => post.height === height),
          `Height isn't use ${height} as height argument of get post, in website ${website}.`
        ).toBe(true);

        /// Test get post use max height argument.
        const postsByOnlyMaxHeight = await getPosts(website, {
          height: { max: height },
        });
        expect(
          postsByOnlyMaxHeight.length > 0,
          `Not get posts use max height argument, in website ${website}, max height is ${height}.`
        ).toBe(true);
        expect(
          postsByOnlyMaxHeight.every((post) => post.height <= height),
          `Height isn't less than max height argument of get post, in website ${website}, use max height is ${height}.`
        ).toBe(true);

        /// Test get post use min height argument.
        const min = 720;
        const postsByOnlyMinHeight = await getPosts(website, {
          height: { min },
        });
        expect(
          postsByOnlyMinHeight.length > 0,
          `Not get posts use max height argument, in website ${website}, min height is ${min}.`
        ).toBe(true);
        expect(
          postsByOnlyMinHeight.every((post) => post.height >= min),
          `Height isn't greater than max height argument of get post, in website ${website}, use min height is ${min}.`
        ).toBe(true);

        /// Test get post use range height argument.
        const rangePosts = await getPosts(website, {
          height: { max: height, min },
        });
        expect(
          rangePosts.length > 0,
          `Not get posts use range of height argument, in website ${website}, min height is ${min}, max height is ${height}.`
        ).toBe(true);
        expect(
          rangePosts.every(
            (post) => post.height <= height && post.height >= min
          ),
          `Height isn't greater than min height and less than max height  of height argument of get post, in website ${website}, use min height is ${min}, max height is ${height}.`
        ).toBe(true);
      }
    },
    {
      timeout: 100000,
    }
  );

  it(
    "Test get posts by score of tags argument.",
    async () => {
      for (const website of websites) {
        const score = 20;

        /// Test get posts use specific `score` argument.
        const posts = await getPosts(website, { score });
        expect(
          posts.length > 0,
          `Not get posts use score argument, in website ${website}, score is ${score}.`
        ).toBe(true);
        expect(
          posts.every((post) => post.score === score),
          `Score isn't use ${score} as score argument of get post, in website ${website}.`
        ).toBe(true);

        /// Test get post use max score argument.
        const postsByOnlyMaxScore = await getPosts(website, {
          score: { max: score },
        });
        expect(
          postsByOnlyMaxScore.length > 0,
          `Not get posts use max score argument, in website ${website}, max score is ${score}.`
        ).toBe(true);
        expect(
          postsByOnlyMaxScore.every((post) => post.score <= score),
          `Score isn't less than max score argument of get post, in website ${website}, use max score is ${score}.`
        ).toBe(true);

        /// Test get post use min score argument.
        const min = 10;
        const postsByOnlyMinScore = await getPosts(website, {
          score: { min },
        });
        expect(
          postsByOnlyMinScore.length > 0,
          `Not get posts use max score argument, in website ${website}, min score is ${min}.`
        ).toBe(true);
        expect(
          postsByOnlyMinScore.every((post) => post.score >= min),
          `Score isn't greater than max score argument of get post, in website ${website}, use min score is ${min}.`
        ).toBe(true);

        /// Test get post use range score argument.
        const rangePosts = await getPosts(website, {
          score: { max: score, min },
        });
        expect(
          rangePosts.length > 0,
          `Not get posts use range of score argument, in website ${website}, min score is ${min}, max score is ${score}.`
        ).toBe(true);
        expect(
          rangePosts.every((post) => post.score <= score && post.score >= min),
          `Score isn't greater than min score and less than max score  of score argument of get post, in website ${website}, use min score is ${min}, max score is ${score}.`
        ).toBe(true);
      }
    },
    {
      timeout: 100000,
    }
  );

  it(
    "Test get posts by mpixels of tags argument.",
    async () => {
      for (const website of websites) {
        const mpixels = (1920 * 1080) / 1000000;

        /// Test get posts use specific `mpixels` argument.
        const posts = await getPosts(website, { mpixels });
        expect(
          posts.length > 0,
          `Not get posts use mpixels argument, in website ${website}, mpixels is ${mpixels}.`
        ).toBe(true);
        expect(
          posts.every(
            (post) => (post.width * post.height) / 1000000 === mpixels
          ),
          `Mpixels isn't use ${mpixels} as mpixels argument of get post, in website ${website}.`
        ).toBe(true);

        /// Test get post use max mpixels argument.
        const postsByOnlyMaxMpixels = await getPosts(website, {
          mpixels: { max: mpixels },
        });
        expect(
          postsByOnlyMaxMpixels.length > 0,
          `Not get posts use max mpixels argument, in website ${website}, max mpixels is ${mpixels}.`
        ).toBe(true);
        expect(
          postsByOnlyMaxMpixels.every(
            (post) => (post.width * post.height) / 1000000 <= mpixels
          ),
          `Mpixels isn't less than max mpixels argument of get post, in website ${website}, use max mpixels is ${mpixels}.`
        ).toBe(true);

        /// Test get post use min mpixels argument.
        const min = (1280 * 720) / 1000000;
        const postsByOnlyMinMpixels = await getPosts(website, {
          mpixels: { min },
        });
        expect(
          postsByOnlyMinMpixels.length > 0,
          `Not get posts use max mpixels argument, in website ${website}, min mpixels is ${min}.`
        ).toBe(true);
        expect(
          postsByOnlyMinMpixels.every(
            (post) => (post.width * post.height) / 1000000 >= min
          ),
          `Mpixels isn't greater than max mpixels argument of get post, in website ${website}, use min mpixels is ${min}.`
        ).toBe(true);

        /// Test get post use range mpixels argument.
        const rangePosts = await getPosts(website, {
          mpixels: { max: mpixels, min },
        });
        expect(
          rangePosts.length > 0,
          `Not get posts use range of mpixels argument, in website ${website}, min mpixels is ${min}, max mpixels is ${mpixels}.`
        ).toBe(true);
        expect(
          rangePosts.every(
            (post) =>
              (post.width * post.height) / 1000000 <= mpixels &&
              (post.width * post.height) / 1000000 >= min
          ),
          `Mpixels isn't greater than min mpixels and less than max mpixels  of mpixels argument of get post, in website ${website}, use min mpixels is ${min}, max mpixels is ${mpixels}.`
        ).toBe(true);
      }
    },
    {
      timeout: 100000,
    }
  );

  it(
    "Test get posts by date of tags argument.",
    async () => {
      for (const website of websites) {
        const date = new Date();
        date.setDate(date.getDate() - 1);
        const dateYMD = toYMD(date);

        /// Test get posts use specific `date` argument.
        const posts = await getPosts(website, { date });
        expect(
          posts.length > 0,
          `Not get posts use date argument, in website ${website}, date is ${dateYMD}.`
        ).toBe(true);

        expect(
          posts.every(
            (post) => toYMD(new Date(post.created_at * 1000), true) === dateYMD
          ),
          `Date isn't use ${dateYMD} as date argument of get post, in website ${website}.`
        ).toBe(true);

        /// Test get post use max date argument.
        const postsByOnlyMaxDate = await getPosts(website, {
          date: { max: date },
        });
        expect(
          postsByOnlyMaxDate.length > 0,
          `Not get posts use max date argument, in website ${website}, max date is ${dateYMD}.`
        ).toBe(true);
        expect(
          postsByOnlyMaxDate.every(
            (post) => toYMD(new Date(post.created_at * 1000), true) <= dateYMD
          ),
          `Date isn't less than max date argument of get post, in website ${website}, use max date is ${dateYMD}.`
        ).toBe(true);

        /// Test get post use min date argument.
        const min = new Date(date);
        min.setDate(min.getDate() - 1);
        const minYMD = toYMD(min);
        const postsByOnlyMinDate = await getPosts(website, {
          date: { min },
        });
        expect(
          postsByOnlyMinDate.length > 0,
          `Not get posts use max date argument, in website ${website}, min date is ${minYMD}.`
        ).toBe(true);
        expect(
          postsByOnlyMinDate.every(
            (post) => toYMD(new Date(post.created_at * 1000), true) >= minYMD
          ),
          `Date isn't greater than max date argument of get post, in website ${website}, use min date is ${minYMD}.`
        ).toBe(true);

        /// Test get post use range date argument.
        const rangePosts = await getPosts(website, {
          date: { max: date, min },
        });
        expect(
          rangePosts.length > 0,
          `Not get posts use range of date argument, in website ${website}, min date is ${minYMD}, max date is ${dateYMD}.`
        ).toBe(true);
        expect(
          rangePosts.every(
            (post) =>
              toYMD(new Date(post.created_at * 1000), true) <= toYMD(date) &&
              toYMD(new Date(post.created_at * 1000), true) >= toYMD(min)
          ),
          `Date isn't greater than min date and less than max date  of date argument of get post, in website ${website}, use min date is ${minYMD}, max date is ${dateYMD}.`
        ).toBe(true);
      }
    },
    {
      timeout: 100000,
    }
  );

  it(
    "Test get posts by order of tags argument.",
    async () => {
      const orders = Object.values(Order).filter(
        (order) => order !== Order.vote
      );
      /// Order `Order.vote` not test, I don't know judge the order is it right.

      for (const website of websites) {
        for (const order of orders) {
          const posts = await getPosts(website, { order });
          expect(
            posts.length > 0,
            `Get post by order not has post, in website ${website}, order is ${order}.`
          ).toBe(true);
          expect(
            checkOrder(posts, order),
            `Get post by order not has post, in website ${website}, order is ${order}.`
          ).toBe(true);
        }
      }
    },
    {
      timeout: 100000,
    }
  );

  it(
    "Test get posts by parent of tags argument.",
    async () => {
      for (const website of websites) {
        const parent = (await (async () => {
          let page = 0;
          while (++page) {
            const parentId = ((post?: Post) => post?.parent_id || post?.id)(
              (await getPosts(website, { page })).find(
                (post) => post.parent_id || post.has_children
              )
            );
            if (parentId) return parentId;
          }
        })())!;

        const posts = await getPosts(website, { parent });
        expect(
          posts.length > 0,
          `Get posts by parent argument not post, in website ${website}, parent is ${parent}.`
        ).toBe(true);
        expect(
          posts
            .filter((post) => post.id !== parent)
            .every((post) => post.parent_id === parent),
          `Get posts has post parent id isn't input parent argument, in website ${website}, parent is ${parent}.`
        ).toBe(true);

        const notParentPosts = await getPosts(website, {
          id: {
            max: parent + 10,
            min: parent - 10,
          },
          parent: false,
        });
        expect(
          notParentPosts.length > 0,
          `Get posts by parent argument not post, in website ${website}, parent is ${parent}.`
        ).toBe(true);
        expect(
          notParentPosts.every((post) => !post.parent_id),
          `Get posts has post parent id isn't input parent argument, in website ${website}, parent is ${parent}.`
        ).toBe(true);
      }
    },
    { timeout: 100000 }
  );

  it(
    "Test get posts by page argument.",
    async () => {
      for (const website of websites) {
        const postsPage2 = await getPosts(website, { page: 2 });
        const postsPage1 = await getPosts(website, { page: 1 });
        const page1LastPostId = postsPage1[postsPage1.length - 1].id;
        const page2FirstPostId = postsPage2[0].id;
        expect(
          page2FirstPostId < page1LastPostId,
          `Page 2 first post id not less than page 1 last post id, in website ${website}, page1 last post id is ${page1LastPostId}, page first post id is ${page2FirstPostId}.`
        ).toBe(true);
      }
    },
    { timeout: 100000 }
  );

  it(
    "Test limit get posts by limit argument.",
    async () => {
      for (const website of websites) {
        await expect(
          getPosts(website, { limit: 20 }),
          `Get posts limit argument invalid, in website ${website}`
        ).resolves.toHaveLength(20);
      }
    },
    {
      timeout: 100000,
    }
  );
});

function checkTag(tag: Tag): boolean {
  return (
    typeof tag.ambiguous === "boolean" &&
    typeof tag.count === "number" &&
    typeof tag.id === "number" &&
    typeof tag.name === "string" &&
    typeof tag.type === "number"
  );
}

function checkTagOrder(tags: Array<Tag>, order: TagOrder): boolean {
  switch (order) {
    case TagOrder.count: {
      let count = null;
      for (const tag of tags) {
        if (count && count < tag.count) return false;
        count = tag.count;
      }
      return true;
    }
    case TagOrder.date:
      throw new Error(
        `I don't know check the tag order, the order is ${TagOrder.date}.`
      );
    case TagOrder.name: {
      let name = null;
      for (const tag of tags) {
        if (name && name > tag.name) return false;
        name = tag.name;
      }
      return true;
    }
    default:
      throw new Error(`Unrealize the tag order check, tag order is ${order}.`);
  }
}

describe.skipIf(!mock)("Test get tag api.", async () => {
  it(
    "Test get tags only input website.",
    async () => {
      for (const website of websites) {
        const tags = await getTags(website);

        expect(Array.isArray(tags), "Get tags not's array.").toBe(true);
        expect(tags.length, "Get tags is empty.").toBeTruthy();
        expect(tags.every(checkTag), "Get tags format untrue.").toBe(true);
      }
    },
    { timeout: 100000 }
  );

  it(
    "Test get tags by limit argument.",
    async () => {
      for (const website of websites) {
        const limit = 5 + Math.floor(Math.random() * 5);
        await expect(
          getTags(website, { limit }),
          `Test get tags use limit argument not work, website is ${website}, limit is ${limit}`
        ).resolves.toHaveLength(limit);
      }
    },
    { timeout: 100000 }
  );

  it(
    "Test get tags by order argument.",
    async () => {
      const tagOrders = Object.values(TagOrder).filter(
        (order) => order !== TagOrder.date
      );

      for (const website of websites) {
        for (const order of tagOrders) {
          const tags = await getTags(website, { order });
          expect(
            tags.length > 0,
            `Not get tags in use order argument, in website ${website}, order is ${order}.`
          ).toBe(true);

          /// In website konachan name tag order abnormal.
          if (!mock && website !== Website.konachan)
            expect(
              checkTagOrder(tags, order),
              `The input order argument not work, in website ${website}, order is ${order}`
            ).toBe(true);
        }
      }
    },
    { timeout: 100000 }
  );

  it(
    "Test get tags by id argument.",
    async () => {
      for (const website of websites) {
        const [{ id }] = await getTags(website, { limit: 1 });
        const tags = await getTags(website, { id });
        expect(tags.length > 0, `Not get tags, in website ${website}.`).toBe(
          true
        );
        expect(
          tags.every((tag) => tag.id === id),
          `Has get tag id isn't input id argument, in website ${website}, id is ${id}.`
        ).toBe(true);
      }
    },
    { timeout: 100000 }
  );

  it(
    "Test get tags by afterId argument.",
    async () => {
      for (const website of websites) {
        const [{ id: afterId }] = await getTags(website);
        const tags = await getTags(website, { afterId });
        expect(
          tags.length > 0,
          `Not get tags use after id argument, in website ${website}, after id is ${afterId}`
        ).toBe(true);
        expect(
          tags.every((tag) => tag.id >= afterId),
          `Get tags has tag id less than after id, in website ${website}, after id is ${afterId}.`
        ).toBe(true);
      }
    },
    {
      timeout: 100000,
    }
  );

  it(
    "Test get tags by name argument.",
    async () => {
      for (const website of websites) {
        const [{ name }] = await getTags(website, { limit: 1 });
        const tags = await getTags(website, { name });
        expect(
          tags.length > 0,
          `Not get tags use name argument, in website ${website}, name is ${name}`
        ).toBe(true);
        expect(
          tags.every((tag) => tag.name.includes(name)),
          `Get tags has tag not includes input name argument, in website ${website}, name argument is ${name}.`
        ).toBe(true);
      }
    },
    {
      timeout: 100000,
    }
  );
});
