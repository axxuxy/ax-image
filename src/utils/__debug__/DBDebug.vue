<script setup lang="ts">
import { db } from "@/utils/db";
import type { DownloadedInfo } from "@/utils/download";
import { getDownloaded } from "@/utils/__tools__/db";
import { Website } from "@/utils/website";
import { computed, ref, watch } from "vue";

const downloadeds = ref<DownloadedInfo[]>([]);

const downloadedsCompute = computed(() =>
  (downloadeds.value ?? []).map((item) => ({
    key: `${item.website}-${item.id}-${item.download_type}`,
    website: item.website,
    id: item.id,
    download_type: item.download_type,
    downloaded_at: item.downloaded_at.toLocaleString(),
  }))
);

async function save() {
  await db.saveDownloadedInfo(getDownloaded());
}

async function save20() {
  for (let index = 0; index < 20; index++) {
    await save();
  }
}

async function clearData() {
  await db.clear();
  loadData();
}

const laseDate = ref("");

const website = ref<Website | undefined>();
const websites = Object.values(Website);

const limit = ref(5);

async function loadData() {
  let last =
    downloadeds.value && downloadeds.value.length
      ? downloadeds.value[downloadeds.value.length - 1].downloaded_at
      : laseDate.value
      ? new Date(laseDate.value)
      : undefined;

  downloadeds.value.push(
    ...(await db.queryDownloadedInfos({
      website: website.value || undefined,
      last,
      limit: limit.value,
    }))
  );
}

async function update() {
  downloadeds.value = [];
  await loadData();
}

let timeout: ReturnType<typeof setTimeout> | null;
function sleepUpdate() {
  if (timeout) clearTimeout(timeout);
  timeout = setTimeout(update, 200);
}

watch(laseDate, sleepUpdate);
watch(website, sleepUpdate);
watch(limit, (value) => {
  if (!value) limit.value = 1;
});

async function clear() {
  website.value = undefined;
  laseDate.value = "";
}

function disabledDate(date: Date) {
  return Date.now() - date.getTime() < 0;
}
</script>

<template>
  <div class="control">
    <div>
      <ElButton @click="save">save</ElButton>
      <ElButton @click="save20">save20</ElButton>
      <ElButton @click="clearData">clearData</ElButton>
      <ElButton @click="loadData">loadData</ElButton>
      <ElButton @click="update">
        <ElIcon>
          <i-ep-refresh />
        </ElIcon>
      </ElButton>
    </div>
    <div>
      <ElDatePicker
        v-model="laseDate"
        type="datetime"
        :disabled-date="disabledDate"
      ></ElDatePicker>
      <ElSelect v-model="website" clearable>
        <ElOption
          v-for="website in websites"
          :key="website"
          :value="website"
          :label="website"
        ></ElOption>
      </ElSelect>
      <ElInputNumber
        v-model="limit"
        :min="1"
        :step="1"
        step-strictly
      ></ElInputNumber>
      <ElButton @click="clear">clear</ElButton>
    </div>
  </div>
  <ul>
    <li v-for="item in downloadedsCompute" :key="item.id">
      <code>{{ item }}</code>
    </li>
  </ul>
</template>

<style lang="scss" scoped>
.control {
  position: sticky;
  top: 0;
  background-color: white;
}

code {
  white-space: pre-wrap;
}
</style>
