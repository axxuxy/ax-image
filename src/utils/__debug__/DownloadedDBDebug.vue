<script setup lang="ts">
import { downloadedDB } from "@/utils/db";
import type { DownloadedInfo } from "@/utils/download";
import { getDownloaded } from "@/utils/__tools__/db";
import { Website } from "@/utils/website";
import { computed, ref, watch } from "vue";
import { ElButton, ElMessage, ElMessageBox } from "element-plus";
import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";

const downloadeds = ref<DownloadedInfo[]>([]);

const list = computed(() =>
  (downloadeds.value ?? []).map((item) => ({
    key: `${item.website}-${item.id}-${item.download_type}`,
    website: item.website,
    id: item.id,
    download_type: item.download_type,
    downloaded_at: item.downloaded_at.toLocaleString(),
  }))
);

async function save() {
  await downloadedDB.save(getDownloaded());
}

async function save20() {
  for (let index = 0; index < 20; index++) {
    await save();
  }
}

async function clear() {
  await downloadedDB.clear();
  load();
}

const lastDate = ref<Date>();
const websites = Object.values(Website);
const website = ref<Website | undefined>();
const limit = ref<number>();

async function load() {
  const last =
    downloadeds.value && downloadeds.value.length
      ? downloadeds.value[downloadeds.value.length - 1].downloaded_at
      : lastDate.value;

  downloadeds.value.push(
    ...(await downloadedDB.query({
      last,
      website: website.value,
      limit: limit.value || undefined,
    }))
  );
}

async function update() {
  downloadeds.value = [];
  await load();
}

let timeout: ReturnType<typeof setTimeout> | null;
function sleepUpdate() {
  if (timeout) clearTimeout(timeout);
  timeout = setTimeout(update, 200);
}

watch([lastDate, website], sleepUpdate);

function clearValue() {
  website.value = undefined;
  lastDate.value = undefined;
  limit.value = undefined;
}

function disabledDate(date: Date) {
  return Date.now() - date.getTime() < 0;
}

const filePath = resolve("./download_info.json");
function writeAllDataToFile() {
  downloadedDB
    .query({
      limit: 1000000,
    })
    .then((_) => {
      writeFileSync(filePath, JSON.stringify(_));
    });
}
function deleteDB() {
  ElMessageBox.confirm("Delete downloaded info db?")
    .then(() => {
      downloadedDB
        .delete()
        .then(() => {
          ElMessage.success("Delete downloaded inof success.");
        })
        .catch(() => {
          ElMessage.error("Delete downloaded inof db error.");
        });
    })
    .catch(() => {
      ElMessage.warning("Canneled.");
    });
}

type ChangeValue<T, K extends { [key in keyof T]?: any }> = {
  [key in keyof T]: key extends keyof K ? K[key] : T[key];
};

type DownloadedInfoOfFile = ChangeValue<
  DownloadedInfo,
  { download_at: string; downloaded_at: string }
>;

function readFileSaveData() {
  (JSON.parse(readFileSync(filePath, "utf-8")) as Array<DownloadedInfoOfFile>)
    .map((_) => ({
      ..._,
      download_at: new Date(_.download_at),
      downloaded_at: new Date(_.downloaded_at),
    }))
    .forEach((_) => {
      downloadedDB.save(_);
    });
}
</script>

<template>
  <div class="control">
    <div>
      <ElButton @click="save">save</ElButton>
      <ElButton @click="save20">save20</ElButton>
      <ElButton @click="clear">clear data</ElButton>
      <ElButton @click="load">load data</ElButton>
      <ElButton @click="update">
        <ElIcon>
          <i-ep-refresh />
        </ElIcon>
      </ElButton>
      <ElButton @click="deleteDB">delete db</ElButton>
      <ElButton @click="writeAllDataToFile">write file</ElButton>
      <ElButton @click="readFileSaveData">read file to save</ElButton>
    </div>
    <div>
      <ElDatePicker
        type="datetime"
        v-model="lastDate"
        placeholder="last date"
        :disabled-date="disabledDate"
      ></ElDatePicker>
      <ElSelect v-model="website" clearable placeholder="select website">
        <ElOption
          v-for="website in websites"
          placeholder="select website"
          :key="website"
          :value="website"
          :label="website"
        ></ElOption>
      </ElSelect>
      <ElInputNumber
        v-model="limit"
        step-strictly
        placeholder="query limit"
        :min="1"
        :step="1"
      ></ElInputNumber>
      <ElButton @click="clearValue">clear value</ElButton>
    </div>
  </div>
  <ul>
    <li v-for="item in list" :key="item.id">
      <code>{{ item }}</code>
    </li>
  </ul>
</template>

<style lang="scss" scoped>
.control {
  & > div {
    margin-bottom: 8px;

    & > :deep(div) {
      margin-right: 8px;
    }
  }
}

li:nth-child(2n + 1) {
  background-color: #eee;
}

code {
  white-space: pre-wrap;
}
</style>
