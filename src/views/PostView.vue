<script lang="ts" setup>
import { useLanguage } from "@/stores/language";
import type { Website } from "@/utils/website";
import { useRouter } from "vue-router";
import { useCache } from "@/stores/cache";
import { computed, ref, shallowRef, watch } from "vue";
import { getPostsApi, getTagsApi, type Tag } from "@/utils/api";
import PostInfo from "@/components/post/PostInfo.vue";
import PostTags from "@/components/post/PostTags.vue";
import type { TagMode } from "@/utils/tags";
import PostImage from "@/components/post/PostImage.vue";
import { ElMessage } from "element-plus";
import { extname, resolve } from "path";
import {
  DownloadOption,
  checkIsDownload,
  type DownloadType,
  type ValidDownloadOption,
  download,
} from "@/utils/download";
import { useConfig } from "@/stores/config";
import { CommonTag, IdTag, ParentTag } from "@/utils/tags";
import AspectRatio from "@/components/tools/AspectRatio.vue";

const props = defineProps<{
  website: Website;
  id: number;
}>();

const router = useRouter();

const language = useLanguage();
const cache = useCache();
const config = useConfig();

const post = computed(() => cache.posts.get(props.website)?.get(props.id));
const loadPostFailed = ref(false);
const loading = ref(false);
async function loadPost() {
  if (loading.value) return;
  try {
    loading.value = true;
    const _ = await getPostsApi(props.website, { tags: [new IdTag(props.id)] });
    cache.addPosts(props.website, _);
  } catch (error) {
    loadPostFailed.value = true;
  } finally {
    loading.value = false;
  }
}

async function failedLoadPost() {
  loadPostFailed.value = false;
  loadPost();
}

if (!post.value) loadPost();

const tags = shallowRef<Array<Tag>>();
const tagsLoading = ref(false);
async function loadTag(tag: string): Promise<Tag> {
  const _ = cache.tags.get(props.website)?.get(tag);
  if (_) return _;
  return await getTagsApi(props.website, { limit: 0, name: tag }).then(
    (tags) => {
      cache.addTags(props.website, tags);
      const _ = tags.find((_) => _.name === tag);
      if (!_) throw new Error(`Not find the tag,tag is${_}`);
      return _;
    }
  );
}
async function loadTags() {
  try {
    tagsLoading.value = true;
    tags.value = (
      await Promise.allSettled(post.value!.tags.split(" ").map(loadTag))
    )
      .filter((_) => _.status === "fulfilled")
      .map((_) => (_ as { value: Tag }).value);
  } finally {
    tagsLoading.value = false;
  }
}
watch(
  post,
  (_) => {
    if (_) loadTags();
  },
  { immediate: true }
);

function openTag(tag: Tag, mode?: TagMode) {
  router.push({
    name: "search",
    query: {
      website: props.website,
      tags: [new CommonTag(tag.name, mode).tag],
    },
  });
}

function downloadImage(type: DownloadType) {
  const item = new DownloadOption({
    post: post.value!,
    downloadType: type,
    website: props.website,
  });

  if (checkIsDownload(item))
    ElMessage.warning(language.language.postImageComponent.yetDownload);
  else {
    const savePath = resolve(
      config.downloadSaveDir,
      `${props.website}-${item.post.id}-${type}${extname(
        item.downloadInfo!.url
      )}`
    );
    download({ savePath, ...item } as ValidDownloadOption);
    ElMessage.success(language.language.postImageComponent.addDownload);
  }
}

function openParent() {
  router.push({
    name: "post",
    params: {
      id: post.value!.parent_id,
    },
    query: {
      website: props.website,
    },
  });
}

function openChildren() {
  router.push({
    name: "search",
    query: {
      website: props.website,
      tags: new ParentTag(post.value!.id).tag,
    },
  });
}
</script>

<template>
  <div class="box">
    <ElButton @click="router.back()" circle class="back">
      <ElIcon>
        <i-ep-back />
      </ElIcon>
    </ElButton>
    <ElSkeleton :loading="loading" animated :rows="10">
      <template #template>
        <ElContainer>
          <ElAside class="scrollbar">
            <ElSkeletonItem
              variant="circle"
              style="width: 100px; height: 100px"
            ></ElSkeletonItem>
            <ElSkeletonItem
              variant="rect"
              style="width: calc(100% - 100px)"
            ></ElSkeletonItem>
            <ElSkeleton :rows="6"></ElSkeleton>
            <ElSkeleton></ElSkeleton>
            <ElSkeleton :rows="8"></ElSkeleton>
          </ElAside>
          <ElMain>
            <AspectRatio class="loading">
              <ElSkeletonItem variant="image"></ElSkeletonItem>
            </AspectRatio>
          </ElMain>
        </ElContainer>
      </template>
      <template #default>
        <ElContainer>
          <div v-if="loadPostFailed" class="load-failed">
            <ElAlert type="error" :closable="false" center>
              <span>{{ language.language.postPage.loadFailed }}...</span>
              <ElButton
                color="var(--el-color-error)"
                text
                plain
                @click="failedLoadPost"
              >
                <ElIcon>
                  <i-ep-refresh />
                </ElIcon>
              </ElButton>
            </ElAlert>
          </div>
          <template v-else>
            <ElAside class="scrollbar">
              <PostInfo
                :website="website"
                :post="post!"
                @download="downloadImage"
                @open-parent="openParent"
                @open-children="openChildren"
              />
              <PostTags v-if="tags" :tags="tags" @open-tag="openTag"></PostTags>
              <ElSkeleton
                v-else
                :animated="loading || tagsLoading"
                :rows="10"
              ></ElSkeleton>
            </ElAside>
            <ElMain>
              <PostImage class="image" :post="post!" />
            </ElMain>
          </template>
        </ElContainer>
      </template>
    </ElSkeleton>
  </div>
</template>

<style lang="scss" scoped>
.back {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 10;
}

aside {
  height: 100vh;
  padding: 8px;

  .el-skeleton {
    margin-top: 16px;
  }
}

main {
  height: 100vh;
  padding: 0;

  display: flex;
  justify-content: center;
  align-items: center;

  & > .loading {
    max-width: 80%;
    max-height: 80%;
    .el-skeleton__item.el-skeleton__image {
      width: 100%;
      height: 100%;
    }
  }
}

.load-failed {
  width: 100%;
  padding: 8px;
}
</style>
