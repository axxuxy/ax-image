<script setup lang="ts">
import { useLanguage } from "@/stores/language";
import { useConfig } from "@/stores/config";
import { ProxyType } from "@/utils/request";
import { storeToRefs } from "pinia";
import { ref } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { ipcRenderer } from "electron";
const { language } = storeToRefs(useLanguage());
const config = useConfig();
const { downloadMaxCount, downloadSaveDir, rating } = storeToRefs(config);

const router = useRouter();
// interface SettingContent {
//   [key: string]: string | SettingContent;
// }

// function search(
//   str: string,
//   content: SettingContent
// ): Array<{ value: string; link: string }> {
//   console.log(str, content);

//   throw new Error("Need realize the function.");
// }
// function query(str: string, callback: Function) {
//   callback(search(str, language.value.settingsPage.context));
// }
const proxyTypes = (
  Object.keys(ProxyType) as Array<keyof typeof ProxyType>
).map((key) => ProxyType[key]);
const proxyType = ref(config.proxy?.type);
const proxyHost = ref(config.proxy?.host);
const proxyPort = ref(config.proxy?.port);
const settingProxy = ref(false);
async function setProxy() {
  if (!proxyType.value)
    return ElMessage.warning(
      language.value.settingsPage.context.proxy.pleaseSelectProxyType
    );
  if (!proxyHost.value)
    return ElMessage.warning(
      language.value.settingsPage.context.proxy.pleaseSetProxyHost
    );
  if (!/^[^.]+(.[^.]+){1,}$/.test(proxyHost.value))
    return ElMessage.warning(
      language.value.settingsPage.context.proxy.proxyHostAbnormal
    );
  if (!proxyPort.value)
    return ElMessage.warning(
      language.value.settingsPage.context.proxy.pleaseSetProxyPort
    );
  try {
    settingProxy.value = true;

    await config.setProxy({
      type: proxyType.value,
      host: proxyHost.value,
      port: proxyPort.value,
    });

    ElMessage.success(
      language.value.settingsPage.context.proxy.setProxySucceed
    );
  } catch (error) {
    ElMessage.error(language.value.settingsPage.context.proxy.setProxyFailed);
    throw error;
  } finally {
    settingProxy.value = false;
  }
}

async function clearProxy() {
  try {
    await config.setProxy(undefined);
    ElMessage.success(
      language.value.settingsPage.context.proxy.clearProxySucceed
    );
  } catch (error) {
    ElMessage.error(language.value.settingsPage.context.proxy.clearProxyFailed);
    throw error;
  } finally {
    settingProxy.value = false;
  }
}

async function changeDownload() {
  const _ = await ipcRenderer.invoke("select directory");
  if (_) downloadSaveDir.value = _;
}

function to(id: string) {
  const box = document.querySelector("#setting-page>.el-scrollbar__wrap");
  const item = box?.querySelector(`#${id}`);
  if (!item) throw new Error(`Not find the element, the element is ${id}.`);

  box!.scrollTo({
    top: box!.scrollTop + item.getBoundingClientRect().top - 70,
    behavior: "smooth",
  });
}
</script>

<template>
  <ElScrollbar id="setting-page" height="100vh">
    <ElContainer>
      <ElHeader>
        <ElPageHeader @back="router.back">
          <template #content>
            <h1>{{ language.settingsPage.title }}</h1>
          </template>
          <!-- <template #extra>
          <ElSpace>
            <ElAutocomplete
              :fetch-suggestions="query"
              :placeholder="language.settingsPage.search"
            ></ElAutocomplete>
          </ElSpace>
        </template> -->
        </ElPageHeader>
      </ElHeader>
      <ElContainer>
        <ElAside>
          <ElScrollbar>
            <ElMenu class="menu" @select="to">
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
                class="proxy"
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
                    class="port"
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
              <ElButton @click="setProxy" :disabled="settingProxy">{{
                language.settingsPage.context.proxy.settingProxy
              }}</ElButton>
              <ElButton @click="clearProxy" :disabled="settingProxy">{{
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
              <ElInput class="download" v-model="downloadSaveDir" readonly>
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
          <ElForm>
            <ElFormItem>
              <div class="download-count">
                <div class="download-prepend">
                  <span>{{
                    language.settingsPage.context.download.downloadMaxCount
                  }}</span>
                </div>
                <ElInputNumber
                  v-model="downloadMaxCount"
                  :min="0"
                  step-strictly
                  :step="1"
                />
              </div>
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
  </ElScrollbar>
</template>

<style lang="scss" scoped>
#setting-page > :deep(.el-scrollbar__bar) {
  z-index: 100;
}

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

  .proxy {
    :deep(.el-input-group__append) {
      background-color: white;

      .port {
        box-sizing: border-box;
        margin: 0 -20px 0 -21px;
        background-color: transparent;

        :deep(.el-input__wrapper) {
          border-top-left-radius: 0;
          border-bottom-left-radius: 0;
          background-color: transparent;

          &:not(.is-focus) {
            box-shadow: none;
          }
        }
      }
    }
  }

  .download-count {
    display: flex;
    width: 100%;

    .download-prepend {
      padding: 0 20px;
      background-color: var(--el-fill-color-light);
      border-top-left-radius: 4px;
      border-bottom-left-radius: 4px;
      color: var(--el-color-info);
      box-shadow: inset 1px 0
          var(--el-input-border-color, var(--el-border-color)),
        inset 0 1px var(--el-input-border-color, var(--el-border-color)),
        inset 0 -1px var(--el-input-border-color, var(--el-border-color));
    }

    .el-input-number {
      flex: 1;

      :deep(.el-input__wrapper) {
        border-top-left-radius: 0;
        border-bottom-left-radius: 0;
      }
    }
  }
}
</style>
