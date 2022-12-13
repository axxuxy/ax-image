import { ref, computed, watch } from "vue";
import { defineStore } from "pinia";

import { i18n } from "@/utils/i18n";

export const useLanguage = defineStore("language", () => {
  const languages = Object.keys(i18n).map((key) => ({
    key,
    name: i18n[key].name,
    language: i18n[key],
  }));

  const local = ref(languages[0]);
  watch(local, (value, old) => {
    if (!languages.includes(value)) {
      local.value = old;
      throw new Error("Set local language not have in languages.");
    }
  });
  const language = computed(() => local.value.language);

  return {
    languages,
    language,
    local,
  };
});
