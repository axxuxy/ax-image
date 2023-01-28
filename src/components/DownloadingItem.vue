<script lang="ts" setup>
import { useLanguage } from "@/stores/language";
import type { DownloadType } from "@/utils/download";
import { bitText } from "@/utils/unit";
import type { Website } from "@/utils/website";
import { storeToRefs } from "pinia";
import { computed } from "vue";

export interface DownloadingItemOption {
  website: Website;
  postId: number;
  downloadType: DownloadType;
  previewUrl: string;
  downloaded: number;
  size: number;
  sleep: number;
  error: boolean;
  isStop: boolean;
}

const { language } = storeToRefs(useLanguage());

const props = defineProps<DownloadingItemOption>();

const emit = defineEmits<{
  (event: "stop"): void;
  (event: "play"): void;
  (event: "cancel"): void;
  (event: "openPost"): void;
}>();

const website = computed(() => language.value.homePage.websites[props.website]);

const type = computed(
  () => language.value.downloadListComponent.downloadTypes[props.downloadType]
);

const downloaded = computed(() => bitText(props.downloaded));

const size = computed(() => bitText(props.size));

const sleep = computed(() => bitText(props.sleep) + "/s");

const percentage = computed(() =>
  Math.round((props.downloaded / props.size) * 100)
);
</script>

<template>
  <ElCard>
    <div class="downloading">
      <ElImage :src="previewUrl" fit="cover"></ElImage>
      <div class="info">
        <ElProgress
          class="progress"
          :percentage="percentage"
          :status="error ? 'exception' : undefined"
        ></ElProgress>
        <div class="post-info">
          <div>
            <span>{{ website }}</span>
            <ElButton text link @click="emit('openPost')">
              <span>{{ postId }}</span>
            </ElButton>
            <span>{{ type }}</span>
          </div>
          <div>
            <span>{{ sleep }}</span>
            <span>{{ downloaded }}/{{ size }}</span>
          </div>
        </div>
      </div>
      <div class="action">
        <ElButton v-if="isStop" @click="emit('play')" text circle>
          <i-ep-video-play />
        </ElButton>
        <ElButton v-else @click="emit('stop')" text circle>
          <ElIcon>
            <i-ep-video-pause />
          </ElIcon>
        </ElButton>
        <ElButton @click="emit('cancel')" text circle>
          <i-ep-close />
        </ElButton>
      </div>
    </div>
  </ElCard>
</template>

<style lang="scss" scoped>
.downloading {
  display: flex;
  align-items: center;
  grid-gap: 20px;

  .el-image {
    flex-shrink: 0;
    width: 48px;
    height: 48px;
  }

  .info {
    width: 100%;
    overflow: hidden;

    .el-progress {
      :deep(.el-progress__text) {
        text-align-last: right;
      }
    }

    .post-info {
      display: flex;
      justify-content: space-between;
      grid-gap: 20px;
      margin-top: 12px;
      font-size: var(--el-font-size-base);
      white-space: nowrap;

      & > div {
        display: flex;
        justify-content: end;
        align-items: baseline;
        grid-gap: 20px;
      }

      & > div:nth-child(2) {
        justify-content: end;
      }
    }
  }

  .action {
    // padding-left: 8px;
    white-space: nowrap;
  }
}
</style>
