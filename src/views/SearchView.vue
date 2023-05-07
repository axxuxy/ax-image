<script lang="ts" setup>
import PostList from "@/components/posts/PostList.vue";
import TagComponent from "@/components/tag/TagComponent.vue";
import { useCache } from "@/stores/cache";
import { useLanguage } from "@/stores/language";
import { getPostsApi, getTagsApi, type Post } from "@/utils/api";
import { Tag, TagType } from "@/utils/tags";
import type { Website } from "@/utils/website";
import { computed, onActivated, ref, shallowRef } from "vue";
import { onBeforeRouteLeave, useRouter } from "vue-router";
import { IdTag } from "@/utils/tags";
import type { ElMain } from "element-plus";
import AddTag from "@/components/tag/AddTag.vue";
import SeaerchHistory from "@/components/search/SearchHistory.vue";
import { searchHistoryDB } from "@/utils/db";

const props = defineProps<{
  website: Website;
  tags?: Array<string>;
}>();

const router = useRouter();

function toSearch(website: Website, tags?: Array<Tag>) {
  router.push({
    name: "search",
    query: {
      website,
      tags: tags?.length ? tags.map((_) => _.tag) : undefined,
    },
  });
}

const language = useLanguage();
const tags = computed(() => props.tags?.map((_) => Tag.paser(_)));

const tagList = computed(() =>
  tags.value?.map((tag) => ({
    tag,
    key: tag.tag,
    type:
      tag.type === TagType.common
        ? cache.tags.get(props.website)?.get(tag.value)?.type
        : undefined,
  }))
);

function updateTag(tag: Tag, old: Tag) {
  toSearch(
    props.website,
    tags.value!.map((_) => (_ === old ? tag : _))
  );
}

function removeTag(tag: Tag) {
  toSearch(
    props.website,
    tags.value!.filter((_) => _ !== tag)
  );
}

const websiteNames = computed(() => language.language.homePage.websites);
function changeWebsite(website: Website) {
  toSearch(website, tags.value);
}

const cache = useCache();
let searchTagAbortController: AbortController | undefined;
async function searchTag(text: string) {
  if (!text) return [];
  else {
    searchTagAbortController?.abort();
    searchTagAbortController = new AbortController();
    const tags = await getTagsApi(
      props.website,
      {
        name: text,
        limit: 10,
      },
      searchTagAbortController.signal
    );
    cache.addTags(props.website, tags);
    return tags;
  }
}

const posts = shallowRef<Array<Post>>([]);
const isGettingPosts = ref(false);
const isGettingPostsFailed = ref(false);
const noMore = ref(false);
let abortController: AbortController | undefined;
async function getPosts() {
  if (isGettingPosts.value || noMore.value) return;
  isGettingPosts.value = true;
  try {
    abortController?.abort();
    abortController = new AbortController();
    const _tags = tags.value ? [...tags.value] : [];
    const lastId = posts.value.length
      ? posts.value[posts.value.length - 1]!.id - 1
      : undefined;
    if (typeof lastId === "number") {
      let needPushIdTag = true;
      for (let index = _tags.length - 1; index < _tags.length; index++) {
        const tag = _tags[index];
        if (tag.type === TagType.id) {
          if (typeof tag.value === "number") {
            console.warn(`Has tag set post id,don't need to load it anymore.`);
            return;
          }
          const min = tag.value.min;
          if (min && min > lastId) {
            console.warn(`Last id less to min id.`);
            return;
          }
          _tags[index] = new IdTag({
            min,
            max: lastId,
          });
          needPushIdTag = false;
          break;
        }
      }
      if (needPushIdTag)
        _tags.push(
          new IdTag({
            max: lastId,
          })
        );
    }

    const _ = await getPostsApi(
      props.website,
      { tags: _tags },
      abortController.signal
    );
    if (_.length < 100) noMore.value = true;
    posts.value.push(..._);
    useCache().addPosts(props.website, _);
  } finally {
    isGettingPosts.value = false;
  }
}

function update() {
  isGettingPostsFailed.value = false;
  noMore.value = false;
  isGettingPosts.value = false;
  posts.value = [];
  getPosts();
}

function failedGetPosts() {
  isGettingPostsFailed.value = false;
  getPosts();
}

function noMoreGetPosts() {
  noMore.value = false;
  getPosts();
}

function openPost(post: Post) {
  router.push({
    name: "post",
    params: {
      id: post.id,
    },
    query: {
      website: props.website,
    },
  });
}

const scrollbar = ref<InstanceType<typeof ElMain>>();
let scrollTop = 0;
onActivated(() => {
  (scrollbar.value!.$el as HTMLElement).scroll({ top: scrollTop });
});
onBeforeRouteLeave(() => {
  scrollTop = (scrollbar.value!.$el as HTMLElement).scrollTop;
});

function addTag(tag: Tag) {
  const _: Array<Tag> = tags.value
    ? tag.type === TagType.common
      ? tags.value.filter((_) => _.type !== TagType.common || _.tag !== tag.tag)
      : tags.value.filter((_) => _.type !== tag.type)
    : [];
  _.push(tag);
  toSearch(props.website, _);
}

function saveSearchHistory() {
  if (!props.tags) return;
  searchHistoryDB.save({
    website: props.website,
    tags: props.tags,
    date: new Date(),
  });
}
saveSearchHistory();
onActivated(() => saveSearchHistory());
</script>

<template>
  <ElContainer class="container">
    <ElHeader>
      <ElPageHeader @back="router.back()">
        <template #breadcrumb>
          <ElBreadcrumb>
            <ElBreadcrumbItem to="/">{{
              language.language.searchPage.index
            }}</ElBreadcrumbItem>
            <ElBreadcrumbItem>{{
              language.language.searchPage.search
            }}</ElBreadcrumbItem>
          </ElBreadcrumb>
        </template>
        <template #content>
          <ul class="tags scrollbar">
            <li v-for="item in tagList" :key="item.key">
              <TagComponent
                class="tag"
                :website="website"
                :tag="item.tag"
                :search-tag="searchTag"
                :type="item.type"
                @update="updateTag($event, item.tag)"
                @remove="removeTag(item.tag)"
              />
            </li>
          </ul>
        </template>
        <template #extra>
          <AddTag :search-tag="searchTag" @emit="addTag" />
          <ElDropdown split-button @command="changeWebsite">
            <span>{{ websiteNames[website] }}</span>
            <template #dropdown>
              <ElDropdownMenu>
                <ElDropdownItem
                  v-for="(name, key) in websiteNames"
                  :key="key"
                  :command="key"
                  >{{ name }}
                </ElDropdownItem>
              </ElDropdownMenu>
            </template>
          </ElDropdown>
          <ElButton v-if="tags" circle @click="update">
            <ElIcon>
              <i-ep-refresh-left />
            </ElIcon>
          </ElButton>
        </template>
      </ElPageHeader>
    </ElHeader>
    <ElMain class="scrollbar" ref="scrollbar">
      <template v-if="tags">
        <PostList
          :class="{
            'has-post': posts.length,
          }"
          v-infinite-scroll="getPosts"
          :posts="posts"
          @click-post="openPost"
        />
        <ElAlert v-if="isGettingPosts" class="loading" :closable="false" center>
          <span>{{ language.language.postListComponent.loading }}</span>
          <ElIcon class="is-loading">
            <i-ep-loading />
          </ElIcon>
        </ElAlert>
        <ElAlert
          v-else-if="isGettingPostsFailed"
          type="error"
          center
          :closable="false"
        >
          <ElSpace alignment="center">
            <span>{{ language.language.postListComponent.loadingFailed }}</span>
            <ElButton
              @click="failedGetPosts"
              color="var(--el-color-error)"
              text
              plain
            >
              <ElIcon>
                <i-ep-refresh />
              </ElIcon>
            </ElButton>
          </ElSpace>
        </ElAlert>
        <ElAlert v-else-if="noMore" center type="info" :closable="false">
          <span>{{
            posts.length
              ? language.language.postListComponent.noMore
              : language.language.postListComponent.none
          }}</span>
          <ElButton @click="noMoreGetPosts" text plain>
            <ElIcon>
              <i-ep-refresh />
            </ElIcon>
          </ElButton>
        </ElAlert>
      </template>
      <SeaerchHistory v-else @to="toSearch" />
    </ElMain>
  </ElContainer>
</template>

<style lang="scss" scoped>
.container {
  height: 100vh;

  header {
    padding: 12px 20px 8px;
    height: auto;
    border-bottom: 1px solid var(--el-border-color);

    :deep(.el-page-header__breadcrumb) {
      margin-bottom: 8px;
    }

    :deep(.el-page-header__left) {
      flex: 1;
      width: 0;
      margin-right: 20px;

      .el-page-header__back {
        flex-shrink: 0;
      }

      .el-page-header__content {
        flex: 1;
        width: 0;
      }
    }

    .tags {
      height: 24px;
      padding: 6px 0;
      line-height: 24px;
      white-space: nowrap;

      li {
        display: inline;
        margin-right: 8px;

        &:last-child {
          margin-right: 0;
        }

        .tag {
          vertical-align: top;
        }
      }
    }

    :deep(.el-page-header__extra) {
      flex-shrink: 0;

      & > div,
      & > button {
        margin-right: 8px;
        &:last-child {
          margin-right: 0;
        }
      }
    }
  }

  main {
    padding: 8px;
    height: calc(100%);

    .has-post + .el-alert {
      margin-top: 8px;
    }

    .loading {
      .is-loading {
        margin-left: 8px;
      }
    }
  }
}
</style>
