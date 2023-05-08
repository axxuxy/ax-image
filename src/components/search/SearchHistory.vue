<script lang="ts" setup>
import { useLanguage } from "@/stores/language";
import { toYMDHMS } from "@/utils/date";
import { searchHistoryDB } from "@/utils/db";
import { CommonTag, Tag, TagType } from "@/utils/tags";
import { Website } from "@/utils/website";
import { computed, onActivated, ref, shallowRef, triggerRef, watch } from "vue";
import TagValue from "@/components/tag/TagValue.vue";
import { useCache } from "@/stores/cache";
import type { TagType as ApiTagType } from "@/utils/api";

const emit = defineEmits<{
  (event: "to", website: Website, tags: Array<Tag>): void;
}>();

const language = useLanguage();
const cache = useCache();
const text = computed(() => language.language.searchComponent);

type SearchHistory = {
  key: string;
  website: Website;
  tags: Array<Tag>;
  date: Date;
  dateText: string;
};
const searchHistorys = shallowRef<Array<SearchHistory>>([]);
const list = computed(() =>
  searchHistorys.value.map((_) => ({
    ..._,
    tagList: _.tags.map((tag) => ({
      tag,
      type:
        tag.type === TagType.common
          ? cache.tags.get(_.website)?.get((tag as CommonTag).value)?.type
          : ("meta" as ApiTagType | "meta"),
    })),
  }))
);
const date = ref<Date>();
const website = ref<Website>();
const websites = computed(() =>
  Object.values(Website).map((website) => ({
    website,
    name: language.language.searchComponent.websites[website],
  }))
);
const search = ref<string>();

const loading = ref(false);
const loadFailed = ref(false);
const noMore = ref(false);
async function load(limit?: number) {
  if (loading.value || noMore.value) return;
  console.log("load", limit);
  loading.value = true;

  const first = date.value;
  const last = searchHistorys.value.length
    ? searchHistorys.value[searchHistorys.value.length - 1].date
    : first
    ? new Date(first.getFullYear(), first.getMonth(), first.getDate() + 1)
    : undefined;
  try {
    const _ = (
      await searchHistoryDB.query({
        website: website.value,
        first,
        last,
        limit,
        search: search.value?.split(" ").filter((_) => _),
      })
    ).map((_) => ({
      key: _.key,
      website: _.website,
      tags: _.tags.map((_) => Tag.paser(_)),
      date: _.date,
      dateText: toYMDHMS(_.date),
    }));
    if (_.length === 0) noMore.value = true;
    searchHistorys.value.push(..._);
    triggerRef(searchHistorys);
  } catch (error) {
    loadFailed.value = true;
  } finally {
    loading.value = false;
  }
}
async function update() {
  searchHistorys.value = [];
  loading.value = false;
  noMore.value = false;
  loadFailed.value = false;
  await load(20);
}
watch([date, website], update);
let timeout: ReturnType<typeof setTimeout> | undefined;
function sleepUpdate() {
  clearTimeout(timeout);
  timeout = setTimeout(() => {
    update();
  }, 500);
}
watch([search], sleepUpdate);

function disableDate(date: Date) {
  return date > new Date();
}

onActivated(() => {
  update();
});

function to(website: Website, tags: Array<Tag>) {
  emit("to", website, tags);
}
</script>

<template>
  <div class="control">
    <ElInput
      class="search"
      v-model="search"
      :placeholder="text.search"
    ></ElInput>
    <ElDatePicker
      v-model="date"
      :disabled-date="disableDate"
      :placeholder="text.date"
    />
    <ElSelect v-model="website" clearable :placeholder="text.website">
      <ElOption
        v-for="item in websites"
        :key="item.website"
        :label="item.name"
        :value="item.website"
      ></ElOption>
    </ElSelect>
    <ElButton @click="update" :disabled="loading">
      <ElIcon>
        <i-ep-refresh />
      </ElIcon>
    </ElButton>
  </div>
  <ul class="list" v-infinite-scroll="load">
    <li v-for="item in list" :key="item.key">
      <p>
        <ElText size="large">{{ item.website }}</ElText>
        <span @click="to(item.website, item.tags)">
          <TagValue
            v-for="_ in item.tagList"
            :key="_.tag.tag"
            :tag="_.tag"
            :type="_.type"
            :hide-edit="true"
            :hide-remove="true"
          />
        </span>
        <ElText>{{ item.dateText }}</ElText>
      </p>
    </li>
  </ul>
  <ElAlert v-if="loading" center :closable="false">
    <span>{{ text.loading }}</span>
    <ElIcon class="is-loading"> <i-ep-loading /> </ElIcon
  ></ElAlert>
  <ElAlert v-else-if="noMore" center :closable="false">
    <span>{{
      searchHistorys.length
        ? text.noMore
        : website || date || search
        ? text.notMatchSearchHistory
        : text.none
    }}</span></ElAlert
  >
  <ElAlert v-else-if="loadFailed" center :closable="false">
    <ElSpace alignment="center">
      <span>{{ text.loadFailed }}</span>
    </ElSpace>
  </ElAlert>
</template>

<style lang="scss" scoped>
.control {
  display: flex;
  justify-content: end;
  width: 100%;
  margin-bottom: 8px;
  & > :deep(div) {
    margin-right: 8px;
    &:last-child {
      margin-right: 0;
    }
  }

  .search {
    width: auto;
  }
}
.list {
  max-width: 960px;
  margin: auto;
  li {
    margin-bottom: 8px;
    &:hover {
      box-shadow: var(--el-box-shadow-lighter);
    }
    p {
      display: flex;
      margin: 0;
      padding: 0 16px;
      & > span {
        display: inline-block;
        flex-shrink: 0;
        padding: 12px 0;
        &:nth-child(1) {
          width: 6em;
        }
        &:nth-child(2) {
          display: inline-flex;
          flex-wrap: wrap;
          gap: 8px;
          flex: 1;
          margin: 0 12px;
          cursor: pointer;
        }
        &:last-child() {
          flex: 1;
        }
      }
    }
  }
}
</style>
