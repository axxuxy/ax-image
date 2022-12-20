import _zhCn from "element-plus/dist/locale/zh-cn.mjs";
import { Website } from "@/utils/website";
import { TagType } from "@/utils/api";
import { Order, RatingMode, RatingValue, TagMode } from "@/utils/format_tags";

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
  return modes as { [key in TagMode]: string };
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
    ratings[value] = values as RatingModeText;
  });
  return ratings as { [key in RatingValue]: RatingModeText };
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
    rangeMode: "评分范围",
    valueMode: "指定评分",
    min: "最小评分",
    max: "最大评分",
    value: "输入评分",
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
  return orders as { [key in Order]: string };
})();

const filterTagComponent = {
  none: "没有符合条件的标签...",
  tagTypes,
  addTag: "添加标签",
  tagModes,
  rating: {
    title: "安全级别",
    values: ratings,
  },
  userInput: "上传者",
  vote3Input: "收藏者",
  md5Input: "帖子md5",
  sourceInput: "来源出处",
  rangeOrValue,
  order: {
    title: "帖子排序",
    values: orders,
  },
  parent: "指定父帖子",
  parentInput: "输入ID",
  parentNone: "过滤子节点",
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
