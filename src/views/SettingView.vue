<script setup lang="ts">
import { useLanguage } from "@/stores/language";
import { ProxyType } from "@/utils/request";
import { storeToRefs } from "pinia";
import { ref } from "vue";
import { useRouter } from "vue-router";
const { language } = storeToRefs(useLanguage());

const router = useRouter();
interface SettingContent {
  [key: string]: string | SettingContent;
}

function search(
  str: string,
  content: SettingContent
): Array<{ value: string; link: string }> {
  console.log(str, content);

  throw new Error("Need realize the function.");
}
function query(str: string, callback: Function) {
  callback(search(str, language.value.settingsPage.context));
}
const proxyTypes = (
  Object.keys(ProxyType) as Array<keyof typeof ProxyType>
).map((key) => ProxyType[key]);
const proxyType = ref();
const proxyHost = ref("");
const proxyPort = ref<number>();

function setProxy() {
  throw new Error("Setting proxy.");
}
function clearProxy() {
  throw new Error("Clear proxy.");
}

function changeDownload() {
  throw new Error("Change download path.");
}
const rating = ref(true);
</script>

<template>
  <ElContainer>
    <ElHeader>
      <ElPageHeader @back="router.back">
        <template #content>
          <h1>{{ language.settingsPage.title }}</h1>
        </template>
        <template #extra>
          <ElSpace>
            <ElAutocomplete
              :fetch-suggestions="query"
              :placeholder="language.settingsPage.search"
            ></ElAutocomplete>
          </ElSpace>
        </template>
      </ElPageHeader>
    </ElHeader>
    <ElContainer>
      <ElAside>
        <ElScrollbar>
          <ElMenu class="menu">
            <ElMenuItem index="proxy">
              <ElIcon>
                <Promotion />
              </ElIcon>
              <span>{{ language.settingsPage.context.proxy.title }}</span>
            </ElMenuItem>
            <ElMenuItem index="download">
              <ElIcon>
                <Download />
              </ElIcon>
              <span>{{ language.settingsPage.context.download.title }}</span>
            </ElMenuItem>
            <ElMenuItem index="rating">
              <ElIcon>
                <Umbrella />
              </ElIcon>
              <span>{{ language.settingsPage.context.rating.title }}</span>
            </ElMenuItem>
          </ElMenu>
        </ElScrollbar>
      </ElAside>
      <ElMain>
        <h2 id="proxy">{{ language.settingsPage.context.proxy.title }}</h2>
        <ElForm>
          <ElFormItem>
            <ElInput
              v-model="proxyHost"
              :placeholder="language.settingsPage.context.proxy.setProxyHost"
            >
              <template #prepend>
                <ElSelect
                  v-model="proxyType"
                  clearable
                  :placeholder="
                    language.settingsPage.context.proxy.setProxyType
                  "
                >
                  <ElOption
                    v-for="proxyType in proxyTypes"
                    :key="proxyType"
                    :value="proxyType"
                  ></ElOption>
                </ElSelect>
              </template>
              <template #append>
                <ElInputNumber
                  v-model="proxyPort"
                  :step="1"
                  :min="0"
                  step-strictly
                  :placeholder="
                    language.settingsPage.context.proxy.setProxyPort
                  "
                ></ElInputNumber>
              </template>
            </ElInput>
          </ElFormItem>
          <ElFormItem>
            <ElButton @click="setProxy">{{
              language.settingsPage.context.proxy.settingProxy
            }}</ElButton>
            <ElButton @click="clearProxy">{{
              language.settingsPage.context.proxy.clearProxy
            }}</ElButton>
          </ElFormItem>
        </ElForm>
        <ElDivider></ElDivider>
        <h2 id="download">
          {{ language.settingsPage.context.download.title }}
        </h2>
        <ElForm>
          <ElFormItem>
            <ElInput disabled class="download">
              <template #prepend>
                {{ language.settingsPage.context.download.downloadPath }}
              </template>
              <template #append>
                <ElButton @click="changeDownload">{{
                  language.settingsPage.context.download.changeDownload
                }}</ElButton>
              </template>
            </ElInput>
          </ElFormItem>
        </ElForm>
        <ElDivider></ElDivider>
        <h2 id="rating">
          {{ language.settingsPage.context.rating.title }}
        </h2>
        <ElForm>
          <ElSwitch
            :active-text="language.settingsPage.context.rating.active"
            inline-prompt
            :inactive-text="language.settingsPage.context.rating.inactive"
            v-model="rating"
            size="large"
          >
          </ElSwitch>
        </ElForm>
      </ElMain>
    </ElContainer>
  </ElContainer>
</template>

<style lang="scss" scoped>
header {
  display: flex;
  align-items: center;
  position: sticky;
  top: 0;
  background-color: #fff;
  border-bottom: 1px solid var(--el-border-color);
  z-index: 10;

  .el-page-header {
    width: 100%;
  }
}

aside {
  $aside-height: calc(100vh - 60px);
  position: sticky;
  top: 60px;
  height: $aside-height;

  .menu {
    min-height: $aside-height;
  }
}

main {
  h2 {
    font-size: var(--el-font-size-large);
  }

  .download {
    cursor: auto;

    :deep(.el-input__inner, .el-input__wrapper, .el-input-group__prepend) {
      cursor: auto;
    }
  }
}
</style>
