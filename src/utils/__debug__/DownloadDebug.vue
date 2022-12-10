<script setup lang="ts">
import { ref } from "vue";
import request, { ProxyType } from "@/utils/request";
import { ipcRenderer } from "electron";

const proxyTypes = (
  Object.keys(ProxyType) as Array<keyof typeof ProxyType>
).map((key) => ProxyType[key]);
const proxyType = ref(ProxyType.http);
const proxyHost = ref("127.0.0.1");
const proxyPort = ref(10809);

function setProxy() {
  if (!proxyType.value) return console.error("Proxy type is not set.");
  if (!proxyHost.value) return console.error("Proxy host is not set.");
  if (!proxyPort.value) return console.error("Proxy port is not set.");

  const proxy = `${proxyType.value}://${proxyHost.value}:${proxyPort.value}`;

  console.log("set proxy", proxy);

  ipcRenderer
    .invoke("set proxy", proxy)
    .then(() => {
      console.log("set proxy succeed");
    })
    .catch((error) => {
      console.error("set proxy failed", error);
    });
}

function clearProxy() {
  ipcRenderer
    .invoke("clear proxy")
    .then(() => {
      console.log("clear proxy succeed");
    })
    .catch((error) => {
      console.error("clear proxy failed", error);
    });
}

const requestGetJsonUrl = ref("https://konachan.com/post.json");
function requestGetJson() {
  new request(
    requestGetJsonUrl.value,
    proxyType.value
      ? {
          host: proxyHost.value,
          port: proxyPort.value,
          type: proxyType.value,
        }
      : undefined
  )
    .getJson<Array<any>>()
    .then((res) => {
      console.log("request get json", res);
    });
}

const requestDownloadUrl = ref(
  "https://konachan.com/image/9b952704364fd0e12f1dcee787045e36/Konachan.com%20-%20350203%20changerduo%20eula_lawrence%20genshin_impact.png"
);
const requestDownloadSave = ref(
  "C:/Users/ax/Desktop/ax-image/src/utils/__debug__/__temp__/image.png"
);
function requestDownload() {
  new request(
    requestDownloadUrl.value,
    proxyType.value
      ? {
          host: proxyHost.value,
          port: proxyPort.value,
          type: proxyType.value,
        }
      : undefined
  )
    .download(requestDownloadSave.value, {
      onprogress(size) {
        console.log("request download", size);
      },
    })
    .then(() => console.log("download succeed"));
}
</script>

<template>
  <p>proxy</p>
  <ElForm>
    <ElFormItem>
      <ElInput v-model="proxyHost" placeholder="proxy host">
        <template #prepend>
          <ElSelect v-model="proxyType" clearable>
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
            step-strictly
            :min="0"
            placeholder="proxy port"
          >
          </ElInputNumber>
        </template>
      </ElInput>
    </ElFormItem>
    <ElFormItem>
      <ElButton @click="setProxy">set proxy</ElButton>
      <ElButton @click="clearProxy">clear proxy</ElButton>
    </ElFormItem>
  </ElForm>
  <ElForm>
    <p>request json</p>
    <ElFormItem>
      <ElInput
        v-model="requestGetJsonUrl"
        placeholder="request get json url"
        autosize
        type="textarea"
        style="width: 100%"
      ></ElInput>
    </ElFormItem>
    <ElFormItem>
      <ElButton @click="requestGetJson">request get json</ElButton>
    </ElFormItem>
  </ElForm>
  <ElForm>
    <p>request download</p>
    <ElFormItem>
      <ElInput
        v-model="requestDownloadUrl"
        placeholder="request download url"
        autosize
        type="textarea"
      ></ElInput>
    </ElFormItem>
    <ElFormItem>
      <ElInput
        v-model="requestDownloadSave"
        placeholder="request download save"
        autosize
        type="textarea"
      ></ElInput>
    </ElFormItem>
    <ElFormItem>
      <ElButton @click="requestDownload">request download</ElButton>
    </ElFormItem>
  </ElForm>
</template>
