<script setup lang="ts">
import DownloadList from "@/components/DownloadList.vue";
import { useLanguage } from "@/stores/language";
import { storeToRefs } from "pinia";
import { computed, ref } from "vue";
import { useRouter } from "vue-router";
const { language } = storeToRefs(useLanguage());
const downloadStates = computed(
  () => language.value.downloadPage.downloadStates.values
);
const downloadState = ref(Object.keys(downloadStates.value)[0]);

const websites = computed(() => language.value.downloadPage.showWebsite.values);
const showWebsite = ref(Object.keys(websites.value)[0]);

const lastDate = ref<Date | undefined>();

const router = useRouter();

const showFilter = ref(false);
</script>

<template>
  <ElContainer>
    <ElHeader>
      <ElPageHeader @back="router.back" class="header">
        <template #content>
          <h1>{{ language.downloadPage.title }}</h1>
        </template>
        <template #extra>
          <ElInput
            suffix-icon="search"
            :placeholder="language.downloadPage.filter.search"
          >
            <template #prefix>
              <ElIcon @click.stop="showFilter = true" class="show-filter">
                <Filter />
              </ElIcon>
            </template>
          </ElInput>
        </template>
      </ElPageHeader>
    </ElHeader>
    <ElSpace class="filter" v-show="showFilter">
      <ElSpace>
        <ElDatePicker
          v-model="lastDate"
          :placeholder="language.downloadPage.lastDate.title"
        >
        </ElDatePicker>

        <ElSelect v-model="downloadState">
          <template #prefix>
            <span>{{ language.downloadPage.downloadStates.title }}:</span>
          </template>
          <ElOption
            v-for="(state, key) in downloadStates"
            :key="key"
            :value="key"
            :label="state"
          ></ElOption>
        </ElSelect>

        <ElSelect v-model="showWebsite">
          <template #prefix>
            <span>{{ language.downloadPage.showWebsite.title }}:</span>
          </template>
          <ElOption
            v-for="(website, key) in websites"
            :key="key"
            :value="key"
            :label="website"
          ></ElOption>
        </ElSelect>
      </ElSpace>
      <ElButton @click="showFilter = false" circle>
        <ElIcon>
          <CircleClose />
        </ElIcon>
      </ElButton>
    </ElSpace>
    <ElMain>
      <DownloadList></DownloadList>
    </ElMain>
  </ElContainer>
</template>

<style lang="scss" scoped>
header {
  position: sticky;
  top: 0;
  display: flex;
  align-items: center;
  background-color: #fff;
  border-bottom: 1px solid var(--el-border-color);
  z-index: 10;

  .el-page-header {
    width: 100%;

    .show-filter {
      cursor: pointer;
    }
  }
}

.filter {
  position: sticky;
  top: 60px;
  width: 100%;
  padding: 20px 20px 0;
  box-sizing: border-box;
  background-color: #fff;
  justify-content: space-between;

  :deep() {
    &:last-child {
      margin-right: 0 !important;
    }
  }
}
</style>
