import _zhCn from "element-plus/dist/locale/zh-cn.mjs";
import { Website } from "@/utils/website";
import { TagType } from "@/utils/api";

function addAllValues<T extends { [key: string]: string }>(
  values: T & { all?: never },
  all: string
): { [key in keyof T | "all"]: string } {
  return Object.assign({ all }, values);
}

const websites = (() => {
  const websites: { [key: string]: string } = {};
  Object.values(Website).forEach((value) => {
    switch (value) {
      case Website.konachan:
        return (websites[value] = "K站");
      case Website.yande:
        return (websites[value] = "Y站");
      default:
        throw new Error(`Need add the website ${value} alias.`);
    }
  });
  return websites as { [key in Website]: string };
})();

enum DownloadStates {
  downloading = "下载中",
  downloaded = "已下载",
}

const downloadPage = {
  title: "下载页面",
  filter: {
    search: "搜索",
  },
  downloadStates: {
    title: "下载状态",
    values: addAllValues<typeof DownloadStates>(DownloadStates, "全部状态"),
  },
  showWebsite: {
    title: "显示站点",
    values: addAllValues<typeof websites>(websites, "全部站点"),
  },
  lastDate: {
    title: "下载时间",
  },
};

function settingItem<T extends { title: string }>(item: T): T {
  return item;
}
const settingsPage = {
  title: "设置页面",
  search: "搜索",
  context: {
    proxy: settingItem({
      title: "代理设置",
      setProxyType: "代理类型",
      setProxyHost: "代理地址IP",
      setProxyPort: "代理端口",
      settingProxy: "设置代理",
      clearProxy: "清除设置",
      pleaseSelectProxyType: "请选择代理类型",
      pleaseSetProxyHost: "请设置代理地址",
      proxyHostAbnormal: "请输入正确的host地址格式",
      pleaseSetProxyPort: "请设置代理端口",
      setProxySucceed: "设置代理成功",
      setProxyFailed: "设置代理失败",
      clearProxySucceed: "清除代理成功",
      clearProxyFailed: "清除代理失败",
    }),
    download: settingItem({
      title: "下载设置",
      downloadPath: "下载地址",
      changeDownload: "更改",
    }),
    rating: settingItem({
      title: "安全模式",
      active: "安全模式已开启",
      inactive: "安全模式已关闭",
    }),
  },
};

const homePage = {
  websites: websites,
  search: "搜索",
};

const postListComponent = {
  loadingFailed: "加载失败...",
  loading: "加载中...",
  noMore: "没有更多帖子了...",
  none: "没有符合条件的帖子...",
};

const tagTypes = (() => {
  const tagTypes: { [key: string]: string } = {};
  Object.values(TagType).forEach((type) => {
    switch (type) {
      case TagType.artist:
        tagTypes[type] = "艺术家标签";
        break;
      case TagType.character:
        tagTypes[type] = "角色标签";
        break;
      case TagType.circle:
        tagTypes[type] = "社团标签";
        break;
      case TagType.copyright:
        tagTypes[type] = "版权标签";
        break;
      case TagType.faults:
        tagTypes[type] = "瑕疵标签";
        break;
      case TagType.general:
        tagTypes[type] = "普通标签";
        break;
      case TagType.style:
        tagTypes[type] = "风格标签";
        break;
      default:
        throw new Error(
          `Undefinde the tag type name, the tag type is ${type}.`
        );
    }
  });
  return tagTypes as { [key in TagType]: string };
})();
const filterTagComponent = {
  none: "没有符合条件的标签...",
  tagTypes,
  addTag: "添加标签",
};

const zhCn = {
  name: "中文",
  elementPlus: _zhCn,
  downloadPage,
  settingsPage,
  homePage,
  postListComponent,
  filterTagComponent,
};

export const i18n: {
  [key: string]: typeof zhCn;
} = {
  zhCn,
};
