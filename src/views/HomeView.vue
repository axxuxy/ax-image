<script setup lang="ts">
import { configs as _configs, type Config } from "@/utils/website";
import {
  computed,
  inject,
  onActivated,
  onUnmounted,
  ref,
  shallowRef,
  watch,
} from "vue";
import { useLanguage } from "@/stores/language";
import { storeToRefs } from "pinia";
import PostList from "@/components/posts/PostList.vue";
import { onBeforeRouteLeave, useRouter } from "vue-router";
import {
  addDwonloadListen,
  getDownloads,
  removeDwonloadListen,
} from "@/utils/download";
import { type Post, getPostsApi } from "@/utils/api";
import { useCache } from "@/stores/cache";
import { downloadPageKeepAliveKey } from "@/inject";
import type { ElMain } from "element-plus";
import { IdTag } from "@/utils/tags";

const { language } = storeToRefs(useLanguage());
const configs = computed(() =>
  _configs.map((config) => ({
    ...config,
    name: language.value.homePage.websites[config.website],
  }))
);
const config = ref(
  (() => {
    const website = localStorage.getItem("website");
    return (
      configs.value.find((config) => config.website === website) ||
      configs.value[0]
    );
  })()
);
watch(config, (_) => {
  localStorage.setItem("website", _.website);
  update();
});
function websiteCommand(_: Config & { name: string }) {
  config.value = _;
}

const router = useRouter();

const downloadCount = ref(0);
function updateDownloadingCount() {
  downloadCount.value = getDownloads().filter(
    (download) => !download.isStop
  ).length;
}
addDwonloadListen(updateDownloadingCount);
onUnmounted(() => removeDwonloadListen(updateDownloadingCount));
updateDownloadingCount();

const posts = shallowRef<Array<Post>>([]);

const isGettingPosts = ref(false);
const isGettingPostsFailed = ref(false);
const noMore = ref(false);
let abortController: AbortController | undefined;
async function getPosts() {
  if (isGettingPosts.value || noMore.value || isGettingPostsFailed.value) return;
  isGettingPosts.value = true;
  try {
    abortController?.abort();
    abortController = new AbortController();
    const _ = await getPostsApi(
      config.value.website,
      posts.value.length
        ? {
            tags: [
              new IdTag({
                max: posts.value[posts.value.length - 1]!.id - 1,
              }),
            ],
          }
        : undefined,
      abortController.signal
    );
    if (_.length < 100) noMore.value = true;
    posts.value.push(..._);
    useCache().addPosts(config.value.website, _);
  } 
  catch(error){
    isGettingPostsFailed.value = true;
    throw error;
  }
  finally {
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
      website: config.value.website,
    },
  });
}

function toSearch() {
  router.push({
    name: "search",
    query: {
      website: config.value.website,
    },
  });
}

const keep = inject(downloadPageKeepAliveKey)!;
onBeforeRouteLeave((to, form, next) => {
  if (to.name === "download") keep(false);
  next();
});

const scrollbar = ref<InstanceType<typeof ElMain>>();
let scrollTop = 0;
onActivated(() => {
  (scrollbar.value!.$el as HTMLElement).scroll({ top: scrollTop });
});
onBeforeRouteLeave(() => {
  scrollTop = (scrollbar.value!.$el as HTMLElement).scrollTop;
});
</script>

<template>
  <ElContainer class="container">
    <ElHeader height="auto">
      <ElPageHeader>
        <template #title>
          <h1>AX-image</h1>
        </template>
        <template #extra>
          <ElButton circle @click="toSearch">
            <ElIcon>
              <i-ep-search />
            </ElIcon>
          </ElButton>
          <ElDropdown split-button @command="websiteCommand">
            <span>{{ config.name }}</span>
            <template #dropdown>
              <ElDropdownMenu>
                <ElDropdownItem
                  v-for="config in configs"
                  :key="config.website"
                  :command="config"
                  >{{ config.name }}
                </ElDropdownItem>
              </ElDropdownMenu>
            </template>
          </ElDropdown>
          <ElButton @click="update" :disabled="isGettingPosts" circle>
            <ElIcon>
              <i-ep-refresh-left />
            </ElIcon>
          </ElButton>

          <ElBadge :value="downloadCount" :hidden="!downloadCount">
            <ElButton
              @click="
                router.push({
                  name: 'download',
                })
              "
              circle
              link
            >
              <ElIcon>
                <i-ep-download />
              </ElIcon>
            </ElButton>
          </ElBadge>
          <ElButton
            @click="
              router.push({
                name: 'setting',
              })
            "
            circle
            link
          >
            <i-ep-setting />
          </ElButton>
        </template>
      </ElPageHeader>
    </ElHeader>
    <ElMain class="scrollbar" ref="scrollbar">
      <PostList
        :class="{
          'has-post': posts.length,
        }"
        :posts="posts"
        v-infinite-scroll="getPosts"
        :infinite-scroll-disabled="isGettingPosts || noMore"
        @click-post="openPost"
      >
      </PostList>
      <ElAlert v-if="isGettingPosts" class="loading" :closable="false" center>
        <span>{{ language.postListComponent.loading }}</span>
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
          <span>{{ language.postListComponent.loadingFailed }}</span>
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
            ? language.postListComponent.noMore
            : language.postListComponent.none
        }}</span>
        <ElButton @click="noMoreGetPosts" text plain>
          <ElIcon>
            <i-ep-refresh />
          </ElIcon>
        </ElButton>
      </ElAlert>
    </ElMain>
  </ElContainer>
</template>

<style lang="scss" scoped>
.container {
  height: 100vh;

  header {
    position: sticky;
    top: 0;
    min-height: 60px;
    border-bottom: 1px solid var(--el-border-color);
    background-color: #fff;
    z-index: 10;

    .el-page-header {
      width: 100%;
      height: 100%;

      :deep(.el-page-header__header) {
        height: 100%;

        .el-page-header__left {
          flex-shrink: 0;
        }

        .el-page-header__icon {
          display: none;
        }

        .el-divider {
          display: none;
        }

        .el-page-header__extra {
          height: 100%;
          flex: 1;
          flex-shrink: 1;
          display: flex;
          justify-content: end;
          align-items: center;
          overflow: hidden;

          & > div,
          & > button {
            margin-left: 12px;
            flex-shrink: 0;
          }

          .tags-box {
            overflow: auto;
            flex: 1;
            display: flex;
            justify-content: end;
            overflow: hidden;

            .tags {
              display: flex;
              grid-gap: 12px;
              padding: 8px 0;
            }
          }
        }
      }

      h1 {
        display: inline-flex;
        align-items: center;
        height: 100%;
        color: #445;
        margin: 0;
        font-family: "freescpt";
        font-size: 36px;
        white-space: nowrap;
      }
    }
  }

  main {
    height: 100%;
    padding: 8px;
    display: block;

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
