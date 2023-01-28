<script lang="ts" setup>
import {
  getDownloads,
  cancelDownload as _cancelDownload,
  addDwonloadListen,
  removeDwonloadListen,
  type DownloadedInfo,
  DownloadEvent,
} from "@/utils/download";
import type { Website } from "@/utils/website";
import { onUnmounted, ref, toRaw, type Ref } from "vue";
import { bitText } from "@/utils/unit";
import { useLanguage } from "@/stores/language";
import { storeToRefs } from "pinia";
import { db } from "@/utils/db";
import { exec } from "child_process";
import { existsSync, rmSync } from "fs";
import { ElMessage, ElMessageBox } from "element-plus";
import PostImage from "./PostImage.vue";
import { toYMDHMS } from "@/utils/date";

const { language } = storeToRefs(useLanguage());

const props = defineProps<{
  website?: Website;
  search?: string;
  date?: Date;
  downloaded?: boolean;
}>();

const downloadings: Ref<ReturnType<typeof dealDownload>> = ref([]);
const downloadeds = ref<Array<ReturnType<typeof dealDownloaded>>>([]);
const downloadedTimeDotMap = new Map<string, Array<number>>();
const updateTime = 1000;
function dealDownload(
  _: ReturnType<typeof getDownloads>,
  isUpdateInTime: boolean
) {
  return (props.website ? _.filter((_) => _.website === props.website) : _)
    .reverse()
    .map((_) => {
      let sleep: number;
      const key = `${_.website}-${_.post.id}-${_.downloadType}`;
      if (_.isDownloading) {
        const dots = downloadedTimeDotMap.get(key) ?? [];
        if (isUpdateInTime)
          downloadedTimeDotMap.set(key, [_.downloaded, ...dots.slice(0, 4)]);
        sleep = (_.downloaded - (dots[0] ?? 0)) / (dots.length || 1);
      } else {
        sleep = 0;
      }
      const websiteName = language.value.homePage.websites[_.website];
      const typeName =
        language.value.downloadListComponent.downloadTypes[_.downloadType];
      const downloadedText = bitText(_.downloaded);
      const sizeText = bitText(_.size);
      const percentage = Math.round((_.downloaded / _.size) * 100);
      return {
        key,
        downloading: _,
        sleep: `${bitText(sleep)}/s`,
        websiteName,
        typeName,
        downloadedText,
        sizeText,
        percentage,
      };
    });
}
function updateDwonloading(isUpdateInTime = true) {
  downloadings.value = dealDownload(getDownloads(), isUpdateInTime);
}
function downloadListen(
  download: ReturnType<typeof getDownloads>[number],
  event: DownloadEvent
) {
  if (event === DownloadEvent.succeed)
    loadDownloaded(downloadeds.value.length + 1);
  downloadedTimeDotMap.delete(
    `${download.website}-${download.post.id}-${download.downloadType}`
  );
  updateDwonloading(false);
}
addDwonloadListen(downloadListen);
const timeInterval = setInterval(updateDwonloading, updateTime);
onUnmounted(() => {
  clearInterval(timeInterval);
  removeDwonloadListen(downloadListen);
});
updateDwonloading();

function cancelDownload(_: ReturnType<typeof getDownloads>[number]) {
  _cancelDownload(toRaw(_));
}

const noMore = ref(false);
const loading = ref(false);

function dealDownloaded(downloadedInfo: DownloadedInfo) {
  return Object.assign(
    {
      key: `${downloadedInfo.website}-${downloadedInfo.id}-${downloadedInfo.download_type}`,
      exists: existsSync(downloadedInfo.save_path),
      url: `path://${downloadedInfo.save_path}`,
      sizeText: bitText(downloadedInfo.size),
      websiteName: language.value.homePage.websites[downloadedInfo.website],
      type: language.value.downloadListComponent.downloadTypes[
        downloadedInfo.download_type
      ],
      downloadedAt: toYMDHMS(downloadedInfo.downloaded_at),
    },
    downloadedInfo
  );
}
function loadDownloaded(limit = 10) {
  loading.value = true;
  return db
    .queryDownloadedInfos({
      last: downloadeds.value[downloadeds.value.length - 1]?.downloaded_at,
      limit,
    })
    .then((_) => {
      downloadeds.value.push(..._.map(dealDownloaded));
      if (_.length < limit) noMore.value = true;
    })
    .finally(() => (loading.value = false));
}

function openImageInFolder(savePath: string) {
  exec(`explorer /select,${savePath}`);
}

async function deleteDownloadedInfo(downloaded: DownloadedInfo) {
  await db.deleteDownloaded({
    website: downloaded.website,
    downloadType: downloaded.download_type,
    id: downloaded.id,
  });
  downloadeds.value = downloadeds.value.filter((_) => _ !== downloaded);
}
async function deleteDownloaded(downloaded: DownloadedInfo) {
  ElMessageBox.confirm(
    language.value.downloadListComponent.deleteAlert,
    language.value.downloadListComponent.deleteAlertTitle,
    {
      confirmButtonText:
        language.value.downloadListComponent.deleteAlertConfirm,
      distinguishCancelAndClose: true,
      cancelButtonText: language.value.downloadListComponent.deleteAlertCancel,
    }
  )
    .then(() => {
      if (existsSync(downloaded.save_path)) rmSync(downloaded.save_path);
      return deleteDownloadedInfo(downloaded)
        .then(() => {
          ElMessage.success(
            language.value.downloadListComponent.deletedMessage
          );
        })
        .catch(() => {
          ElMessage.error(
            language.value.downloadListComponent.deletedDownloadedInofFailed
          );
        });
    })
    .catch(() => {
      ElMessage.info(language.value.downloadListComponent.deleteCancelMessage);
    });
}

const openDownloaded = ref<DownloadedInfo>();
function setOpenDownloadedPost(downloaded?: DownloadedInfo) {
  openDownloaded.value = downloaded;
}
</script>

<template>
  <ElDrawer
    :model-value="!!openDownloaded"
    direction="btt"
    destroy-on-close
    @closed="setOpenDownloadedPost(undefined)"
    size="100%"
    :with-header="false"
  >
    <PostImage
      v-if="openDownloaded"
      :website="openDownloaded!.website"
      :post="openDownloaded!"
      @close="setOpenDownloadedPost(undefined)"
    ></PostImage>
  </ElDrawer>
  <ElScrollbar height="100%" style="margin: -20px">
    <div
      style="padding: 0 20px"
      v-infinite-scroll="loadDownloaded"
      :infinite-scroll-disabled="loading || noMore"
    >
      <ul>
        <li v-for="download in downloadings" :key="download.key">
          <ElCard>
            <ElProgress
              :percentage="download.percentage"
              :status="
                download.downloading.downloadError ? 'exception' : undefined
              "
            ></ElProgress>
            <ElRow>
              <ElCol :span="14" :md="18">
                <span>{{ download.websiteName }}</span>
                <span>{{ download.downloading.post.id }}</span>
                <span>{{ download.typeName }}</span>
              </ElCol>
              <ElCol :span="3" :md="2">
                <span
                  >{{ download.downloadedText }}/{{ download.sizeText }}</span
                >
              </ElCol>
              <ElCol :span="3" :md="2">
                <span>{{ download.sleep }}</span>
              </ElCol>
              <ElCol :span="2" :md="1">
                <ElButton
                  v-if="download.downloading.isStop"
                  @click="download.downloading.play()"
                  text
                  circle
                >
                  <ElIcon>
                    <i-ep-video-play />
                  </ElIcon>
                </ElButton>
                <ElButton
                  v-else
                  @click="download.downloading.stop()"
                  text
                  circle
                >
                  <ElIcon>
                    <i-ep-video-pause />
                  </ElIcon>
                </ElButton>
              </ElCol>
              <ElCol :span="2" :md="1">
                <ElButton
                  @click="cancelDownload(download.downloading)"
                  text
                  circle
                >
                  <ElIcon>
                    <i-ep-close />
                  </ElIcon>
                </ElButton>
              </ElCol>
            </ElRow>
          </ElCard>
        </li>
      </ul>
      <ul>
        <li v-for="downloaded in downloadeds" :key="downloaded.key">
          <ElCard>
            <div class="downloaded" :class="{ exists: downloaded.exists }">
              <ElImage
                :src="downloaded.preview_url"
                fit="cover"
                :preview-src-list="
                  downloaded.exists ? [downloaded.url] : undefined
                "
              ></ElImage>
              <div class="image-info">
                <p class="post-info">
                  <span>{{ downloaded.websiteName }}</span>
                  <ElButton link @click="setOpenDownloadedPost(downloaded)">
                    {{ downloaded.id }}
                  </ElButton>
                  <span>{{ downloaded.type }}</span>
                  <span>{{ downloaded.downloadedAt }}</span>
                </p>
                <p class="path" :title="downloaded.save_path">
                  <ElButton
                    text
                    link
                    @click="openImageInFolder(downloaded.save_path)"
                  >
                    {{ downloaded.save_path }}
                  </ElButton>
                  <span>{{ downloaded.sizeText }}</span>
                </p>
              </div>
              <div class="tools">
                <ElButton
                  circle
                  text
                  plain
                  @click="deleteDownloaded(downloaded)"
                  :disabled="!downloaded.exists"
                >
                  <ElIcon>
                    <i-ep-delete />
                  </ElIcon>
                </ElButton>
                <ElButton
                  circle
                  text
                  plain
                  @click="deleteDownloadedInfo(downloaded)"
                >
                  <ElIcon>
                    <i-ep-close />
                  </ElIcon>
                </ElButton>
              </div>
            </div>
          </ElCard>
        </li>
      </ul>
      <ElAlert
        v-if="!downloadings.length && !downloadeds.length && noMore"
        :title="language.downloadListComponent.noDownloading"
        :closable="false"
        center
      ></ElAlert>
    </div>
  </ElScrollbar>
</template>

<style lang="scss" scoped>
h2 {
  font-size: var(--el-font-size-large);
}

li {
  margin-bottom: 20px;
}

.el-row {
  margin-top: 4px;
  margin-bottom: -8px;

  .el-col {
    display: flex;
    justify-content: end;
    align-items: center;
  }

  .el-col:nth-child(1) {
    justify-content: left;
    grid-gap: 20px;
  }
}

.downloaded {
  max-width: 100%;
  display: flex;
  align-items: center;
  grid-gap: 20px;
  // flex-grow: 48px max-content 114px;

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
      p {
        opacity: 0.5;
        text-decoration: line-through;
      }
    }
  }

  .image-info {
    // display: flex;
    // align-items: center;
    // justify-content: space-between;
    // grid-gap: 20px;
    flex-grow: 1;
    flex-shrink: 1;
    overflow: hidden;

    p {
      margin: 2px 0;
    }

    .path {
      display: flex;
      justify-content: space-between;
      flex-shrink: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-size: var(--el-font-size-base);
    }

    .post-info {
      display: flex;
      align-items: center;
      justify-content: space-between;
      grid-gap: 12px;
      flex-shrink: 0;
      font-size: var(--el-font-size-small);
    }
  }

  .tools {
    // white-space: nowrap;
    // display: flex;
    flex-shrink: 0;
    .el-button {
      display: block;
      margin: 0;
    }
  }
}
</style>
