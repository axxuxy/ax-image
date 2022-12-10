import { describe, it, expect } from "vitest";
import {
  configs,
  Website,
  getBaseURLBySite,
  type Config,
} from "@/utils/website";

describe.concurrent("Test website module.", () => {
  it.concurrent("Test website all in configs.", () => {
    const websites = (Object.keys(Website) as Array<keyof typeof Website>).map(
      (key) => Website[key]
    );

    const configMap: Map<Website, Config> = new Map();
    configs.forEach((config) => configMap.set(config.website, config));
    expect(configMap.size, "Configs website has repetition.").toBe(
      configs.length
    );

    expect(
      configMap.size,
      "Websites count unequal to website config count."
    ).toBe(websites.length);

    websites.forEach((website) => {
      expect(
        configMap.has(website),
        `Website ${website} not's in configs.`
      ).toBeTruthy();
    });
  });

  it.concurrent("Test get website baseURL", () => {
    configs.forEach((config) => {
      expect(
        getBaseURLBySite(config.website),
        `Get website ${config.website} baseURL unequal to baseURL of config.`
      ).toBe(config.baseURL);
    });
  });
});
