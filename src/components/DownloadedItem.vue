<script lang="ts" setup>
import { useLanguage } from "@/stores/language";
import { toYMDHMS } from "@/utils/date";
import type { DownloadType } from "@/utils/download";
import { bitText } from "@/utils/unit";
import type { Website } from "@/utils/website";
import { exec } from "child_process";
import { existsSync } from "fs";
import { storeToRefs } from "pinia";
import { computed } from "vue";

export interface DownloadedItemOption {
  previewUrl?: string;
  savePath: string;
  website: Website;
  postId: number;
  size: number;
  downloadType: DownloadType;
  downloadedDate: Date;
}

const emit = defineEmits<{
  (event: "openPost"): void;
  (event: "delete"): void;
  (event: "deleteImage"): void;
}>();

const { language } = storeToRefs(useLanguage());

const props = defineProps<DownloadedItemOption>();

const exists = computed(() => existsSync(props.savePath));

const url = computed(() => `path://${props.savePath}`);

const websiteName = computed(
  () => language.value.homePage.websites[props.website]
);

const sizeText = computed(() => bitText(props.size));

const typeName = computed(
  () => language.value.downloadListComponent.downloadTypes[props.downloadType]
);

const downloadedAt = computed(() => toYMDHMS(props.downloadedDate));

function openImageInFolder() {
  exec(`explorer /select,${props.savePath}`);
}
</script>

<template>
  <ElCard>
    <div class="downloaded" :class="{ exists }">
      <ElImage
        :src="previewUrl || url"
        fit="cover"
        :preview-src-list="exists ? [url] : undefined"
      ></ElImage>
      <div class="image-info">
        <p class="post-info">
          <span>{{ websiteName }}</span>
          <ElButton link @click="emit('openPost')">
            {{ postId }}
          </ElButton>
          <span>{{ typeName }}</span>
          <span>{{ downloadedAt }}</span>
        </p>
        <p class="file" :title="savePath">
          <ElButton
            class="path"
            text
            link
            @click="openImageInFolder"
            :disabled="!exists"
          >
            {{ savePath }}
          </ElButton>
          <span class="size">{{ sizeText }}</span>
        </p>
      </div>
      <div class="tools">
        <ElButton
          circle
          text
          plain
          @click="emit('deleteImage')"
          :disabled="!exists"
        >
          <ElIcon>
            <i-ep-delete />
          </ElIcon>
        </ElButton>
        <ElButton circle text plain @click="emit('delete')">
          <ElIcon>
            <i-ep-close />
          </ElIcon>
        </ElButton>
      </div>
    </div>
  </ElCard>
</template>

<style lang="scss" scoped>
.downloaded {
  max-width: 100%;
  display: flex;
  align-items: center;
  grid-gap: 20px;

  .el-image {
    flex-shrink: 0;
    width: 48px;
    height: 48px;
  }

  &:not(.exists) {
    & > .el-image {
      opacity: 0.5;
    }

    & > .image-info {
      .file {
        opacity: 0.5;
        text-decoration: line-through;
      }
    }
  }

  .image-info {
    flex-grow: 1;
    flex-shrink: 1;
    overflow: hidden;

    p {
      display: flex;
      align-items: center;
      justify-content: space-between;
      grid-gap: 20px;
      width: 100%;
      margin: 0;
      white-space: nowrap;
    }

    .post-info {
      flex-shrink: 0;
      margin-bottom: 8px;
      font-size: var(--el-font-size-small);
    }

    .file {
      display: flex;
      justify-content: space-between;
      flex-shrink: 1;
      font-size: var(--el-font-size-base);

      .path {
        display: block;
        flex: 1;
        flex-shrink: 1;
        text-align-last: left;
        overflow: hidden;
        text-overflow: ellipsis;

        :deep(span) {
          display: inline;
        }
      }

      .size {
        flex-shrink: 0;
      }
    }
  }

  .tools {
    // padding-left: 8px;
    flex-shrink: 0;
  }
}
</style>
