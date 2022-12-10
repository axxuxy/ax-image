export enum Website {
  konachan = "konachan",
  yande = "yande",
}

export interface Config {
  website: Website;
  baseURL: string;
}

export const configs: Config[] = [
  {
    website: Website.konachan,
    baseURL: "https://konachan.com/",
  },
  {
    website: Website.yande,
    baseURL: "https://yande.re/",
  },
];

export function getBaseURLBySite(site: Website) {
  return configs.find((config) => config.website === site)!.baseURL;
}
