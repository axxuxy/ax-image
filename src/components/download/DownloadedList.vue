<script lang="ts" setup>
import { db } from "@/utils/db";
import type { DownloadedInfo } from "@/utils/download";
import { ElMessage, ElMessageBox } from "element-plus";
import { existsSync, rmSync } from "fs";
import { computed, nextTick, ref, shallowRef, watch } from "vue";
import { useLanguage } from "@/stores/language";
import { storeToRefs } from "pinia";
import DownloadedItem from "@/components/download/DownloadedItem.vue";
import { Website } from "@/utils/website";

const { language } = storeToRefs(useLanguage());
const emit = defineEmits<{
  (event: "openPost", downloaded: DownloadedInfo): void;
}>();

const downloadeds = shallowRef<Array<DownloadedInfo & { key: string }>>([]);
const noMore = ref(false);
const loading = ref(false);

function loadDownloaded(limit = 10) {
  loading.value = true;

  const first = date.value;
  const last =
    downloadeds.value[downloadeds.value.length - 1]?.downloaded_at ||
    (date.value ? new Date(date.value!.getTime() + 86400000) : undefined);

  return db
    .queryDownloadedInfos({
      first,
      last,
      limit,
      website: website.value,
    })
    .then((_) => {
      downloadeds.value.push(
        ..._.map((_) =>
          Object.assign(
            {
              key: `${_.website}-${_.id}-${_.download_type}`,
            },
            _
          )
        )
      );
      if (_.length < limit) noMore.value = true;
    })
    .finally(() => (loading.value = false));
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

const key = ref(Date.now().toString());
function update() {
  downloadeds.value = [];
  noMore.value = false;
  nextTick(() => (key.value = Date.now().toString()));
}

const websites = computed(() =>
  Object.values(Website).map((website) => ({
    website,
    name: language.value.downloadedComponent.website.values[website],
  }))
);
const website = ref<Website>();
const date = ref<Date>();
watch([date, website], update);
</script>

<template>
  <div class="box scrollbar">
    <div class="tools-box">
      <div class="tools">
        <ElSelect v-model="website" clearable :disabled="loading">
          <template #prefix>
            <span>{{ language.downloadedComponent.website.title }}</span>
            <span>:</span>
          </template>
          <ElOption
            v-for="website in websites"
            :key="website.website"
            :label="website.name"
            :value="website.website"
          >
          </ElOption>
        </ElSelect>
        <ElDatePicker
          v-model="date"
          type="date"
          :disabled="loading"
          :placeholder="language.downloadedComponent.date.title"
        >
        </ElDatePicker>
        <ElButton @click="update" :disabled="loading">
          <ElIcon>
            <i-ep-refresh-left />
          </ElIcon>
        </ElButton>
      </div>
    </div>
    <ul
      v-infinite-scroll="loadDownloaded"
      :infinite-scroll-disabled="loading || noMore"
      :key="key"
    >
      <li v-for="downloaded in downloadeds" :key="downloaded.key">
        <DownloadedItem
          :preview-url="downloaded.preview_url"
          :save-path="downloaded.save_path"
          :website="downloaded.website"
          :post-id="downloaded.id"
          :size="downloaded.size"
          :download-type="downloaded.download_type"
          :downloaded-date="downloaded.downloaded_at"
          @open-post="emit('openPost', downloaded)"
          @delete="deleteDownloadedInfo(downloaded)"
          @delete-image="deleteDownloaded(downloaded)"
        >
        </DownloadedItem>
      </li>
    </ul>
    <ElAlert
      v-if="!downloadeds.length && noMore"
      :title="
        website || date
          ? language.downloadedComponent.noneOfUnder
          : language.downloadedComponent.none
      "
      center
      :closable="false"
    >
    </ElAlert>
    <ElAlert v-if="loading" center :closable="false">
      <span>{{ language.downloadedComponent.loading }}</span>
      <ElIcon class="is-loading loading">
        <i-ep-loading />
      </ElIcon>
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

  .el-alert {
    margin-bottom: 8px;

    .loading {
      margin-left: 12px;
    }
  }
}
</style>
