<script lang="ts" setup>
import {
  getTags,
  TagType,
  type Post,
  type Tag as ApiTag,
  getPosts,
} from "@/utils/api";
import { getBaseURLBySite, type Website } from "@/utils/website";
import { computed, ref, toRaw } from "vue";
import { useLanguage } from "@/stores/language";
import { storeToRefs } from "pinia";
import PictureLoadingFailed from "@/assets/picture-loading-failed.svg?component";
import { toYMDHMS } from "@/utils/date";
import { RatingMode, TagMode } from "@/utils/format_tags";
import {
  DownloadOption,
  DownloadType,
  checkIsDownload,
  download,
} from "@/utils/download";
import { exec } from "child_process";
import { ElMessage } from "element-plus";
import type { Tag } from "@/components/tools/AddTagItem.vue";
import { bitText } from "@/utils/unit";
import { extname, resolve } from "path";
import { useConfig } from "@/stores/config";

const { language } = storeToRefs(useLanguage());
const { downloadSaveDir } = storeToRefs(useConfig());

const props = defineProps<{
  post: Post;
  website: Website;
}>();

const emit = defineEmits<{
  (event: "close"): void;
  (event: "openParent", parent: Post): void;
  (event: "openChildren", id: number): void;
  (event: "openTag", tag: Tag): void;
}>();

const tags = ref<Array<ApiTag>>([]);
const tagsInTypes = computed(() => {
  return Object.values(TagType)
    .map((type) => ({
      type,
      name: language.value.filterTagComponent.tagTypes[type],
      values: tags.value.filter((tag) => tag.type === type),
    }))
    .filter((_) => _.values.length);
});

props.post.tags.split(" ").forEach(async (name) => {
  const tagValue = sessionStorage.getItem(`${props.website}-tag-${name}`);
  if (tagValue) return tags.value.push(JSON.parse(tagValue));

  const _ = await getTags(props.website, { limit: 0, name: name });
  _.forEach((tag) => {
    sessionStorage.setItem(
      `${props.website}-tag-${tag.name}`,
      JSON.stringify(tag)
    );
  });
  if (!_.length)
    throw new Error(
      `Get post tag info is empty, the tag is ${name}, the post id is ${props.post.id}, in website ${props.website}.`
    );
  const tag = _.find((_) => _.name === name);

  if (tag) tags.value.push(tag);
  else
    throw new Error(
      `Get tag infos didn't find tag name is input tag name argument, the name is ${name}, in website ${props.website}.`
    );
});

const createDate = toYMDHMS(new Date(props.post.created_at * 1000));

const uploadUserAvatar = `${getBaseURLBySite(props.website)}data/avatars/${
  props.post.creator_id
}.jpg`;

const sourceIsLink = /^https?:\/\/([A-z0-9]+\.)+[A-z0-9]+\//.test(
  props.post.source
);

function openSource() {
  let url = /https:\/\/i\.pximg\.net\//.test(props.post.source)
    ? `https://www.pixiv.net/artworks/${props.post.source.match(
        /(?<=\/)\d+(?!.*\/.*)/
      )}`
    : props.post.source;
  exec(`start ${url}`);
}

const isInGetParent = ref(false);
function showParent() {
  isInGetParent.value = true;
  getPosts(props.website, {
    id: props.post.parent_id!,
    limit: 1,
  })
    .then((_) => {
      const parent = _.find((post) => post.id === props.post.parent_id);
      if (!parent) throw new Error("Not get the parent post.");
      emit("openParent", parent);
    })
    .catch((error) => {
      ElMessage.error(language.value.postImageComponent.getParentError);
      throw error;
    })
    .finally(() => (isInGetParent.value = false));
}
function showChildren() {
  emit("openChildren", props.post.id);
}

interface DownloadItem extends DownloadOption {
  downloadInfo: Exclude<DownloadOption["downloadInfo"], undefined>;
}
const downloadItems = computed(() =>
  Object.values(DownloadType)
    .map(
      (type) =>
        new DownloadOption({
          post: toRaw(props.post),
          downloadType: type,
          website: props.website,
        })
    )
    .filter((item) => item.downloadInfo)
    .map((item) => ({
      name: language.value.postImageComponent.downloadType[item.downloadType],
      sizeText: bitText(item.downloadInfo!.size),
      ...(item as DownloadItem),
    }))
);

function downloadImage(_: (typeof downloadItems.value)[number]) {
  if (checkIsDownload(_))
    ElMessage.warning(language.value.postImageComponent.yetDownload);
  else {
    const savePath = resolve(
      downloadSaveDir.value,
      `${props.website}-${props.post.id}-${_.downloadType}${extname(
        _.downloadInfo.url
      )}`
    );
    download(Object.assign({ savePath, ..._ }));
    ElMessage.success(language.value.postImageComponent.addDownload);
  }
}

function openTag(tag: ApiTag, mode = TagMode.is) {
  emit("openTag", { ...tag, mode });
}

const allImage = [
  props.post.preview_url,
  props.post.sample_url,
  props.post.jpeg_url,
  props.post.file_url,
].filter((url) => url);
</script>

<template>
  <ElButton @click="emit('close')" circle class="close">
    <ElIcon>
      <i-ep-close />
    </ElIcon>
  </ElButton>
  <ElContainer class="box" v-loading="isInGetParent">
    <ElAside>
      <ElScrollbar>
        <div class="aside">
          <ElDescriptions class="post-info" :column="1" :border="true">
            <ElDescriptionsItem>
              <template #label>
                <span>{{ language.postImageComponent.uploadUser }}</span>
              </template>
              <div class="author">
                <ElImage :src="uploadUserAvatar"></ElImage>
                <p>
                  <span>{{ post.author }}</span>
                </p>
              </div>
            </ElDescriptionsItem>
            <ElDescriptionsItem>
              <template #label>
                <span>{{ language.postImageComponent.uploadDate }}</span>
              </template>
              <span>{{ createDate }}</span>
            </ElDescriptionsItem>
            <ElDescriptionsItem>
              <template #label>
                <span>{{ language.postImageComponent.size }}</span>
              </template>
              <span>{{ post.width }} * {{ post.height }}</span>
            </ElDescriptionsItem>
            <ElDescriptionsItem v-if="post.source">
              <template #label>
                <span>{{ language.postImageComponent.source }}</span>
              </template>
              <ElButton
                v-if="sourceIsLink"
                link
                class="source"
                :title="post.source"
                @click="openSource"
              >
                <span>{{ post.source }}</span>
              </ElButton>
              <span v-else>{{ post.source }}</span>
            </ElDescriptionsItem>
            <ElDescriptionsItem>
              <template #label>
                <span>{{ language.postImageComponent.rating }}</span>
              </template>
              <span>{{
                language.filterTagComponent.rating.values[post.rating][
                  RatingMode.is
                ]
              }}</span>
            </ElDescriptionsItem>
            <ElDescriptionsItem>
              <template #label>
                <span>{{ language.postImageComponent.score }}</span>
              </template>
              <span>{{ post.score }}</span>
            </ElDescriptionsItem>
          </ElDescriptions>
          <ul class="downloads">
            <li v-if="typeof props.post.parent_id === 'number'">
              <ElButton @click="showParent">
                <span>{{ language.postImageComponent.showParent }}</span>
              </ElButton>
            </li>
            <li v-if="post.has_children">
              <ElButton @click="showChildren">
                <span>{{ language.postImageComponent.showChildren }}</span>
              </ElButton>
            </li>
            <li v-for="download in downloadItems" :key="download.downloadType">
              <ElButton
                class="download-button"
                text
                bg
                plain
                @click="downloadImage(download)"
              >
                <span>{{ download.name }}</span>
                <span> - </span>
                <span>{{ download.downloadInfo.width }}</span>
                <span> * </span>
                <span>{{ download.downloadInfo.height }}</span>
                <span> - </span>
                <span>{{ download.sizeText }}</span>
              </ElButton>
            </li>
          </ul>
          <ul class="tag-types">
            <li v-for="tagType in tagsInTypes" :key="tagType.type">
              <p>{{ tagType.name }}</p>
              <ul class="tags">
                <li v-for="tag in tagType.values" :key="tag.id">
                  <ElButton
                    class="--tag"
                    :class="`--tag-${tag.type}`"
                    size="small"
                    @click.stop="openTag(tag, TagMode.or)"
                  >
                    <ElIcon>
                      <span>~</span>
                    </ElIcon>
                  </ElButton>
                  <ElButton
                    class="--tag"
                    :class="`--tag-${tag.type}`"
                    size="small"
                    @click.stop="openTag(tag, TagMode.not)"
                  >
                    <ElIcon>
                      <span>-</span>
                    </ElIcon>
                  </ElButton>
                  <ElTag
                    class="--tag"
                    :class="`--tag-${tag.type}`"
                    @click="openTag(tag)"
                    :title="tag.name"
                  >
                    <ElIcon>
                      <span>+</span>
                    </ElIcon>
                    <span class="tag-name">{{ tag.name }}</span>
                    <span> - </span>
                    <span>{{ tag.count }}</span>
                  </ElTag>
                </li>
              </ul>
            </li>
          </ul>
        </div>
      </ElScrollbar>
    </ElAside>
    <ElMain class="img-box">
      <ElImage
        :src="post.sample_url"
        :preview-src-list="allImage"
        :initial-index="1"
        :z-index="100"
        class="img"
        fit="scale-down"
      >
        <template #error>
          <ElIcon :size="100">
            <PictureLoadingFailed />
          </ElIcon>
        </template>
      </ElImage>
    </ElMain>
  </ElContainer>
</template>

<style lang="scss" scoped>
.box {
  position: absolute;
  top: 0;
  left: 0;
  padding: 0;
  width: 100%;
  height: 100%;

  .el-aside {
    border-right: solid 1px var(--el-menu-border-color);

    .aside {
      padding: 12px;

      .post-info {
        padding-bottom: 8px;

        :deep() {
          table {
            table-layout: fixed;

            tbody {
              tr {
                td {
                  word-wrap: break-word;

                  &:nth-child(1) {
                    box-sizing: content-box;
                    width: 4em;
                  }
                }
              }
            }
          }
        }

        .author {
          p {
            margin: 0;
          }
        }

        .source {
          display: block;
          max-width: 100%;
          text-overflow: ellipsis;
          overflow: hidden;

          :deep(span) {
            display: inline;
          }
        }
      }

      .downloads {
        li {
          padding-bottom: 8px;

          &:last-child {
            padding-bottom: 0;
            vertical-align: baseline;
          }

          .download-button {
            white-space: break-spaces;
          }
        }
      }

      .tag-types {
        .tags {
          li {
            white-space: nowrap;

            &:last-child {
              padding-bottom: 0;
              vertical-align: baseline;
            }

            padding-bottom: 8px;

            .--tag.el-button {
              margin-left: 0;
              margin-right: 8px;
            }

            .el-tag {
              max-width: calc(100% - 88px);
              cursor: pointer;

              :deep(.el-tag__content) {
                display: flex;
                width: 100%;

                .el-icon {
                  padding-right: 8px;
                }

                .tag-name {
                  flex: 1;
                  overflow: hidden;
                  text-overflow: ellipsis;
                }
              }
            }
          }
        }
      }
    }
  }

  .img-box {
    display: flex;
    padding: 0;

    .img {
      margin: auto;

      & > :deep(img) {
        display: block;
        /// XXX Can use other method let the image not exceeding it's box?
        max-height: 100vh;
        cursor: zoom-in;
      }

      :deep(.el-image__wrapper) {
        position: static;
      }
    }
  }
}

.close {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 10;
}
</style>
