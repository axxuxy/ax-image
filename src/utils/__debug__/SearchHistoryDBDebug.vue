<script lang="ts" setup>
import { Random } from "mockjs";
import { searchHistoryDB, type SearchHistoryItem } from "@/utils/db";
import { Website } from "@/utils/website";
import { getTag } from "@/utils/__tools__/tag";
import { computed, ref, watch } from "vue";
import {
  ElDatePicker,
  type ElButton,
  ElInputNumber,
  ElSelect,
  ElOption,
  ElIcon,
  ElMessageBox,
  ElMessage,
} from "element-plus";

const websites = Object.values(Website);

function getWebsite() {
  return websites[Random.integer(0, 1)];
}

function getTags() {
  return new Array(Random.integer(1, 7)).fill(null).map(() => getTag().tag);
}

async function save() {
  await searchHistoryDB.save({
    tags: getTags(),
    website: getWebsite(),
    date: new Date(Random.datetime()),
  });
}
async function save10() {
  for (let index = 0; index < 10; index++) await save();
}

async function saveHave() {
  const tags = getTags();
  const website = getWebsite();
  await searchHistoryDB.save({
    tags,
    website,
    date: new Date(),
  });

  const date = new Date();
  date.setDate(date.getDate() + 2);
  await searchHistoryDB.save({
    tags: [...tags],
    website,
    date,
  });
}

async function clear() {
  await searchHistoryDB.clear();
  searchHistorys.value.splice(0, searchHistorys.value.length);
  await load();
}

const searchHistorys = ref<Array<SearchHistoryItem>>([]);
const firstDate = ref<Date>();
const lastDate = ref<Date>();
const website = ref<Website>();
const limit = ref<number>();
async function load(count?: number) {
  const last = searchHistorys.value.length
    ? searchHistorys.value[searchHistorys.value.length - 1].date
    : lastDate.value;
  console.log("load", last, count);

  searchHistorys.value.push(
    ...(await searchHistoryDB.query({
      first: firstDate.value,
      last,
      website: website.value,
      limit: count ?? (limit.value || undefined),
    }))
  );
}

const list = computed(() =>
  searchHistorys.value.map((data) => ({
    key: data.key,
    data: data,
    info: {
      website: data.website,
      tags: data.tags.join(" "),
      date: data.date,
    },
  }))
);

function disableFirst(date: Date) {
  return date > new Date() || (lastDate.value && date > lastDate.value);
}
function disableLast(date: Date) {
  return date > new Date() || (firstDate.value && date < firstDate.value);
}

function clearValue() {
  firstDate.value = undefined;
  lastDate.value = undefined;
  website.value = undefined;
  limit.value = undefined;
}

async function update() {
  searchHistorys.value.splice(0, searchHistorys.value.length);
  await load();
}

let timeout: ReturnType<typeof setTimeout> | null;
function sleepUpdate() {
  if (timeout) clearTimeout(timeout);
  timeout = setTimeout(update, 200);
}
watch([firstDate, lastDate, website], sleepUpdate);

async function deleteItem(item: SearchHistoryItem) {
  await ElMessageBox.confirm("Delete the search history item?")
    .then(() => {
      searchHistoryDB
        .deleteItem(item.key)
        .then(() => {
          ElMessage.success("Delete success.");
          const count = searchHistorys.value.length;
          searchHistorys.value.splice(0, count);
          load(count);
        })
        .catch((error) => {
          ElMessage.error("Delete error.");
          throw error;
        });
    })
    .catch(() => {
      ElMessage.warning("Cannel delete.");
    });
}

async function deleteDB() {
  await searchHistoryDB.delete();
}
</script>

<template>
  <div class="control">
    <div>
      <ElButton @click="save10">save 10</ElButton>
      <ElButton @click="saveHave">save have</ElButton>
      <ElButton @click="clear">clear data</ElButton>
      <ElButton @click="load()">load data</ElButton>
      <ElButton @click="update">
        <ElIcon>
          <i-ep-refresh />
        </ElIcon>
      </ElButton>
      <ElButton @click="deleteDB">delete db</ElButton>
    </div>
    <div>
      <ElDatePicker
        type="datetime"
        v-model="firstDate"
        placeholder="first date"
        :default-value="firstDate || lastDate"
        :disabled-date="disableFirst"
      />
      <ElDatePicker
        type="datetime"
        v-model="lastDate"
        placeholder="last date"
        :default-value="lastDate || firstDate"
        :disabled-date="disableLast"
      />
      <ElSelect v-model="website" clearable placeholder="select website">
        <ElOption
          v-for="website in websites"
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
      />
      <ElButton @click="clearValue">clear value</ElButton>
    </div>
  </div>
  <ul>
    <li v-for="item in list" :key="item.key">
      <code>{{ item.info }}</code>
      <ElButton
        class="delete"
        type="danger"
        circle
        @click="deleteItem(item.data)"
      >
        <ElIcon>
          <i-ep-delete />
        </ElIcon>
      </ElButton>
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

li {
  position: relative;

  &:nth-child(2n + 1) {
    background-color: #eee;
  }
  .delete {
    position: absolute;
    top: 8px;
    right: 8px;
  }
}

code {
  white-space: pre-wrap;
}
</style>
