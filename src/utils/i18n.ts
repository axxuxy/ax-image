import _zhCn from "element-plus/dist/locale/zh-cn.mjs";
import { Website } from "@/utils/website";
import { TagType } from "@/utils/api";
import { DownloadType } from "@/utils/download";
import {
  Order,
  RatingMode,
  RatingValue,
  TagMode,
  type TagType as TagClass,
} from "@/utils/tags";

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
  return <{ [key in Website]: string }>websites;
})();

enum DownloadStates {
  downloading = "下载中",
  downloaded = "已下载",
}

const downloadPage = {
  title: "下载页面",
  downloadStates: DownloadStates,
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
      downloadConcurrentCount: "并行下载数",
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

const downloadType = (() => {
  const types: { [key: string]: string } = {};
  Object.values(DownloadType).forEach((_) => {
    switch (_) {
      case DownloadType.sample:
        types[_] = "下载样图";
        return;
      case DownloadType.jpeg:
        types[_] = "下载jpeg";
        return;
      case DownloadType.file:
        types[_] = "下载原图";
        return;
      default:
        throw new Error(`Not have the download type, the type is ${_}.`);
    }
  });
  return <{ [key in DownloadType]: string }>types;
})();

const postImageComponent = {
  uploadUser: "上传用户",
  uploadDate: "上传时间",
  size: "文件大小",
  source: "来源地址",
  rating: "安全等级",
  score: "评分",
  downloadType,
  showParent: "查看父帖子",
  showChildren: "查看子帖子",
  getParentError: "获取父帖子异常",
  addDownload: "添加下载",
  yetDownload: "已添加下载",
};

const downloadTypes = (() => {
  const types: { [key: string]: string } = {};
  Object.values(DownloadType).forEach((type) => {
    switch (type) {
      case DownloadType.sample:
        types[type] = "样图";
        return;
      case DownloadType.jpeg:
        types[type] = "jpeg";
        return;
      case DownloadType.file:
        types[type] = "原图";
        return;
      default:
        throw new Error(`Undefined the type name, the type is ${type}`);
    }
  });
  return <{ [key in DownloadType]: string }>types;
})();
const downloadListComponent = {
  downloadTypes,
  deleteAlert: "确定要删除图片吗？",
  deleteAlertTitle: "删除图片",
  deleteAlertConfirm: "确定",
  deletedMessage: "删除成功",
  deletedDownloadedInofFailed: "删除下载信息失败",
  deleteAlertCancel: "取消",
  deleteCancelMessage: "已取消",
  noDownloading: "这里空空如也...",
};

const downloadedComponent = {
  website: {
    title: "指定站点",
    values: websites,
  },
  date: {
    title: "下载日期",
  },
  none: "这里空空如也...",
  noneOfUnder: "没有符合条件的帖子图片",
  loading: "加载中...",
};

const downloadingComponent = {
  website: {
    title: "指定站点",
    values: websites,
  },
  none: "这里空空如也...",
  noneOfUnder: "没有符合条件的下载项",
};

const postPage = {
  loadFailed: "加载失败",
};

const tagClass: {
  [key in TagClass | "parentNone"]: string;
} = {
  common: "通用标签",
  user: "上传用户",
  vote3: "用户收藏",
  md5: "图片MD5",
  source: "来源出处",
  id: "ID",
  width: "宽度",
  height: "高度",
  score: "点赞数",
  mpixels: "像素级别",
  date: "时间",
  rating: "安全级别",
  order: "帖子排序",
  parent: "父帖子",
  parentNone: "排除子帖子",
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
  return <{ [key in TagType]: string }>tagTypes;
})();

const tagModes = (() => {
  const modes: { [key: string]: string } = {};
  Object.values(TagMode).forEach((mode) => {
    switch (mode) {
      case TagMode.is:
        modes[mode] = "必须包含标签";
        break;
      case TagMode.not:
        modes[mode] = "排除标签";
        break;
      case TagMode.or:
        modes[mode] = "或者包含标签";
        break;
      default:
        throw new Error(`Undefinded the mode, the mode is ${mode}.`);
    }
  });
  return <{ [key in TagMode]: string }>modes;
})();

function ratingText(value: RatingValue, mode: RatingMode) {
  switch (value) {
    case RatingValue.explicit:
      switch (mode) {
        case RatingMode.is:
          return "危险帖子";
        case RatingMode.not:
          return "排除危险帖子";
        default:
          throw new Error(`Not have the rating mode, the mode is ${mode}.`);
      }
    case RatingValue.questionable:
      switch (mode) {
        case RatingMode.is:
          return "可疑帖子";
        case RatingMode.not:
          return "排除可疑帖子";
        default:
          throw new Error(`Not have the rating mode, the mode is ${mode}.`);
      }
    case RatingValue.safe:
      switch (mode) {
        case RatingMode.is:
          return "安全帖子";
        case RatingMode.not:
          return "排除安全帖子";
        default:
          throw new Error(
            `Undefinded the rating mode text, the mode is ${mode}.`
          );
      }
    default:
      throw new Error(`Undefinded the rating value, the value is ${value}.`);
  }
}

const ratings = (() => {
  type RatingModeText = {
    [key in RatingMode]: string;
  };
  const ratings: {
    [key: string]: RatingModeText;
  } = {};
  const modes = Object.values(RatingMode);
  Object.values(RatingValue).forEach((value) => {
    const values: { [key: string]: string } = {};
    modes.forEach((mode) => (values[mode] = ratingText(value, mode)));
    ratings[value] = <RatingModeText>values;
  });
  return <{ [key in RatingValue]: RatingModeText }>ratings;
})();

const orders = (() => {
  const orders: { [key: string]: string } = {};
  Object.values(Order).forEach((order) => {
    switch (order) {
      case Order.id:
        orders[order] = "ID顺序";
        break;
      case Order.idDesc:
        orders[order] = "ID降序";
        break;
      case Order.mpixels:
        orders[order] = "像素倒序";
        break;
      case Order.mpixelsAsc:
        orders[order] = "像素升序";
        break;
      case Order.score:
        orders[order] = "评分倒序";
        break;
      case Order.scoreAsc:
        orders[order] = "评分升序";
        break;
      case Order.landscape:
        orders[order] = "宽比高";
        break;
      case Order.portrait:
        orders[order] = "高比宽";
        break;
      case Order.vote:
        orders[order] = "收藏者排序";
        break;
      default:
        throw new Error(`Undefined the order text, the order is ${order}.`);
    }
  });
  return <{ [key in Order]: string }>orders;
})();

export interface RangeOrValueText {
  rangeMode: string;
  valueMode: string;
  min: string;
  max: string;
  value: string;
}

const rangeOrValue: {
  [key in
    | "id"
    | "width"
    | "height"
    | "score"
    | "mpixels"
    | "date"]: RangeOrValueText;
} = {
  id: {
    rangeMode: "ID范围",
    valueMode: "指定ID",
    min: "最小ID",
    max: "最大ID",
    value: "输入ID",
  },
  width: {
    rangeMode: "宽度范围",
    valueMode: "指定宽度",
    min: "最小宽度",
    max: "最大宽度",
    value: "输入宽度",
  },
  height: {
    rangeMode: "高度范围",
    valueMode: "指定高度",
    min: "最小高度",
    max: "最大高度",
    value: "输入高度",
  },
  score: {
    rangeMode: "点赞数范围",
    valueMode: "指定点赞数",
    min: "最小点赞数",
    max: "最大点赞数",
    value: "输入点赞数",
  },
  mpixels: {
    rangeMode: "像素范围",
    valueMode: "指定像素",
    min: "最小像素",
    max: "最大像素",
    value: "输入像素",
  },
  date: {
    rangeMode: "日期范围",
    valueMode: "指定日期",
    min: "起始时间",
    max: "终止时间",
    value: "选择日期",
  },
};

const tagComponent = {
  addTag: "添加标签",
  tagTypes: tagClass,
  tag: {
    types: tagTypes,
    modes: tagModes,
  },
  ratings,
  orders,
  rangeOrValue,
};

const searchPage = {
  index: "首页",
  search: "搜索",
};

const searchComponent = {
  search: "搜索字段",
  date: "指定日期",
  website: "指定站点",
  loading: "加载中...",
  noMore: "没有更多记录了...",
  none: "搜索记录为空",
  notMatchSearchHistory: "没有符合条件的记录",
  loadFailed: "加载失败",
  websites,
};

const zhCn = {
  name: "中文",
  elementPlus: _zhCn,
  downloadPage,
  settingsPage,
  homePage,
  postPage,
  searchPage,
  postListComponent,
  postImageComponent,
  downloadListComponent,
  downloadedComponent,
  downloadingComponent,
  tagComponent,
  searchComponent,
};

export const i18n: {
  [key: string]: typeof zhCn;
} = {
  zhCn,
};
