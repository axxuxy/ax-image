<script lang="ts" setup>
import { useLanguage } from "@/stores/language";
import {
  cancelDownload,
  checkIsDownload,
  getDownloads,
} from "@/utils/download";
import { computed, onUnmounted, ref, shallowRef } from "vue";
import { storeToRefs } from "pinia";
import DownloadedItem from "@/components/download/DownloadedItem.vue";
import DownloadingItem from "@/components/download/DownloadingItem.vue";
import { Website } from "@/utils/website";
import { downloadedDB } from "@/utils/db";
import { ElMessage, ElMessageBox } from "element-plus";
import { existsSync, rmSync } from "fs";
import type { Post } from "@/utils/api";

const emit = defineEmits<{
  (event: "openPost", downloaded: Post & { website: Website }): void;
}>();

const { language } = storeToRefs(useLanguage());

function dealDownload(download: ReturnType<typeof getDownloads>[number]) {
  const key = `${download.website}-${download.post.id}-${download.downloadType}`;
  return download.downloadedAt
    ? {
        key,
        download,
        downloaded: {
          previewUrl: download.post.preview_url,
          savePath: download.savePath,
          website: download.website,
          postId: download.post.id,
          size: download.size,
          downloadType: download.downloadType,
          downloadedDate: download.downloadedAt,
        },
      }
    : {
        key,
        download,
        downloading: {
          website: download.website,
          postId: download.post.id,
          downloadType: download.downloadType,
          previewUrl: download.post.preview_url,
          downloaded: download.downloaded,
          size: download.size,
          sleep: download.sleep,
          error: !!download.downloadError,
          isStop: download.isStop || !!download.downloadError,
        },
      };
}

const downloadings = shallowRef<Array<ReturnType<typeof dealDownload>>>(
  getDownloads().map(dealDownload)
);
type DownloadItem = (typeof downloadings)["value"][number];
const showDownloadings = computed(() =>
  website.value
    ? downloadings.value.filter((_) => _.download.website === website.value)
    : downloadings.value
);

const updateTime = 1000;
const interval = setInterval(function () {
  update();
}, updateTime);
onUnmounted(() => clearInterval(interval));

function update(updateList = false) {
  downloadings.value = updateList
    ? getDownloads().map(dealDownload)
    : downloadings.value.map((_) => dealDownload(_.download));
}

const websites = computed(() =>
  Object.values(Website).map((website) => ({
    website,
    name: language.value.downloadingComponent.website.values[website],
  }))
);
const website = ref<Website>();

async function deleteDownload(download: DownloadItem) {
  await downloadedDB.deleteItem({
    website: download.download.website,
    downloadType: download.download.downloadType,
    id: download.download.post.id,
  });
  downloadings.value = downloadings.value.filter((_) => _ !== download);
}

async function deleteDownloadImage(download: DownloadItem) {
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
      if (existsSync(download.download.savePath))
        rmSync(download.download.savePath);
      return deleteDownload(download)
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

function stop(download: DownloadItem) {
  download.download.stop();
  update();
}

function play(download: DownloadItem) {
  download.download.play();
  update();
}

function cancel(download: DownloadItem) {
  cancelDownload(download.download);
  if (!checkIsDownload(download.download))
    downloadings.value = downloadings.value.filter((_) => _ !== download);
}

function openPost(download: DownloadItem) {
  emit(
    "openPost",
    Object.assign(
      { website: download.download.website },
      download.download.post
    )
  );
}
</script>

<template>
  <div class="box scrollbar">
    <div class="tools-box">
      <div class="tools">
        <ElSelect
          v-model="website"
          clearable
          :placeholder="language.downloadingComponent.website.title"
        >
          <ElOption
            v-for="website in websites"
            :key="website.website"
            :label="website.name"
            :value="website.website"
          >
          </ElOption>
        </ElSelect>
        <ElButton @click="update(true)">
          <ElIcon>
            <i-ep-refresh-left />
          </ElIcon>
        </ElButton>
      </div>
    </div>
    <ul>
      <li v-for="download in showDownloadings" :key="download.key">
        <DownloadedItem
          v-if="download.downloaded"
          v-bind="download.downloaded"
          @delete="deleteDownload(download)"
          @delete-image="deleteDownloadImage(download)"
          @open-post="openPost(download)"
        >
        </DownloadedItem>
        <DownloadingItem
          v-else
          v-bind="download.downloading"
          @stop="stop(download)"
          @play="play(download)"
          @cancel="cancel(download)"
          @open-post="openPost(download)"
        >
        </DownloadingItem>
      </li>
    </ul>
    <ElAlert
      v-if="!downloadings.length"
      :title="
        website
          ? language.downloadingComponent.noneOfUnder
          : language.downloadingComponent.none
      "
      center
      :closable="false"
    >
    </ElAlert>
  </div>
</template>

<style lang="scss" scoped>
.box {
  margin: 0 -20px -20px;
  padding: 0 20px;
  height: calc(100% + 20px);

  .tools-box {
    position: sticky;
    top: 0;
    z-index: 10;
    margin: 0 -20px 15px;
    padding: 0 20px;
    background-color: #ffffff;

    .tools {
      display: flex;
      justify-content: end;
      grid-gap: 12px;
      padding-bottom: 15px;
      border-bottom: 1px solid var(--el-border-color);

      .el-select {
        :deep(.el-input__wrapper) {
          height: 30px;
        }
      }
    }
  }

  ul {
    li {
      margin-bottom: 15px;
    }
  }
}
</style>
