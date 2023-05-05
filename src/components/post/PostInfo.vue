<script lang="ts" setup>
import { useLanguage } from "@/stores/language";
import type { Post } from "@/utils/api";
import { toYMDHMS } from "@/utils/date";
import { getBaseURLBySite, type Website } from "@/utils/website";
import { exec } from "child_process";
import { storeToRefs } from "pinia";
import { RatingMode } from "@/utils/tags";
import { DownloadOption, DownloadType } from "@/utils/download";
import { computed } from "vue";
import { bitText } from "@/utils/unit";

const { language } = storeToRefs(useLanguage());
const props = defineProps<{
  post: Post;
  website: Website;
}>();

let avatarTime = sessionStorage.getItem("avatar-time");
if (!avatarTime) {
  avatarTime = Date.now().toString();
  sessionStorage.setItem("avatar-time", avatarTime);
}
const uploadUserAvatar = `${getBaseURLBySite(props.website)}data/avatars/${
  props.post.creator_id
}.jpg?${avatarTime}`;

const createDate = toYMDHMS(new Date(props.post.created_at * 1000));

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

const emit = defineEmits<{
  (event: "openParent"): void;
  (event: "openChildren"): void;
  (event: "download", type: DownloadType): void;
}>();

interface DownloadItem extends DownloadOption {
  downloadInfo: Exclude<DownloadOption["downloadInfo"], undefined>;
}

const downloadItems = computed(() =>
  Object.values(DownloadType)
    .map(
      (type) =>
        new DownloadOption({
          post: props.post,
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
</script>

<template>
  <ElDescriptions class="post-info" :column="1" :border="true">
    <ElDescriptionsItem>
      <template #label>
        <span>{{ language.postImageComponent.uploadUser }}</span>
      </template>
      <div class="author">
        <ElImage :src="uploadUserAvatar">
          <template #placeholder>
            <ElSkeleton :loading="true" animated>
              <template #template>
                <ElSkeletonItem
                  variant="image"
                  :style="{
                    width: '125px',
                    height: '125px',
                  }"
                ></ElSkeletonItem>
              </template>
            </ElSkeleton>
          </template>
          <template #error>
            <img
              width="125"
              height="125"
              src="@/assets/picture-loading-failed.svg"
            />
          </template>
        </ElImage>
        <p>
          <span>{{ post.author }}</span>
        </p>
      </div>
    </ElDescriptionsItem>
    <ElDescriptionsItem>
      <template #label>
        <span>ID</span>
      </template>
      <span>{{ post.id }}</span>
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
        language.tagComponent.ratings[post.rating][RatingMode.is]
      }}</span>
    </ElDescriptionsItem>
    <ElDescriptionsItem>
      <template #label>
        <span>{{ language.postImageComponent.score }}</span>
      </template>
      <span>{{ post.score }}</span>
    </ElDescriptionsItem>
  </ElDescriptions>
  <ul class="related-post">
    <li v-if="typeof props.post.parent_id === 'number'">
      <ElButton @click="emit('openParent')">
        <span>{{ language.postImageComponent.showParent }}</span>
      </ElButton>
    </li>
    <li v-if="post.has_children">
      <ElButton @click="emit('openChildren')">
        <span>{{ language.postImageComponent.showChildren }}</span>
      </ElButton>
    </li>
  </ul>
  <ul class="downloads">
    <li v-for="download in downloadItems" :key="download.downloadType">
      <ElButton
        class="download-button"
        text
        bg
        plain
        @click="emit('download', download.downloadType)"
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
</template>

<style lang="scss" scoped>
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
    .el-image {
      min-width: 125px;
      min-height: 125px;
    }

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

.related-post {
  li {
    padding-bottom: 8px;
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
</style>
