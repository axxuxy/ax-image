<script lang="ts" setup>
import { storeToRefs } from "pinia";
import { nextTick, ref, watch } from "vue";
import { getTags as _getTags, type Tag as ApiTag } from "@/utils/api";
import { useLanguage } from "@/stores/language";
import type { Website } from "@/utils/website";
import AutocompleteInputTagItem, {
  type Tag,
} from "@/components/tools/AddTagItem.vue";
import { TagMode } from "@/utils/format_tags";
import type { Tag as FormatTag } from "@/utils/format_tags";

const props = defineProps<{
  website: Website;
}>();

const emit = defineEmits<{
  (event: "submit", tag: Tag | FormatTag): void;
}>();

const { language } = storeToRefs(useLanguage());

/// Search tags.
const loadingTags = ref(false);
const autoCompleteTags = ref<Array<ApiTag>>();
let getTagsTime: number | undefined;
function getTags(search: string) {
  if (!search) {
    loadingTags.value = false;
    autoCompleteTags.value = undefined;
  } else {
    loadingTags.value = true;
    let time = (getTagsTime = Date.now());
    return _getTags(props.website, { name: search, limit: 10 })
      .then((_) => {
        _.forEach((_) => {
          sessionStorage.setItem(
            `${props.website}-tag-${_.name}`,
            JSON.stringify(_)
          );
        });
        if (time === getTagsTime) autoCompleteTags.value = _;
      })
      .finally(() => (loadingTags.value = false));
  }
}

/// Listen add tag input and search it.
const tagInput = ref<string>();
let searchTagTimeout: ReturnType<typeof setTimeout> | undefined;
watch(tagInput, (value) => {
  if (searchTagTimeout) clearTimeout(searchTagTimeout);
  searchTagTimeout = setTimeout(() => {
    getTags(value ?? "");
  }, 500);
});

/// Contaller add tag input show and hidden.
const showInputTag = ref(false);
function tagInputBlur() {
  setTimeout(() => {
    showInputTag.value = false;
    tagInput.value = undefined;
    autoCompleteTags.value = undefined;
  }, 200);
}

/// Add tag input auto get focus.
const input = ref();
watch(showInputTag, (value) => {
  if (value) nextTick(() => input.value?.focus());
});

function submit(tag: Tag) {
  emit("submit", tag);
}

function onKeyDown(event: KeyboardEvent | Event) {
  if (
    event instanceof KeyboardEvent &&
    event.key === "Enter" &&
    tagInput.value
  ) {
    const tag = tagInput.value.replace(/ /g, "_");
    if (tagInput.value[0] === "-")
      emit("submit", {
        mode: TagMode.not,
        name: tag.slice(1),
      });
    else if (tagInput.value[0] === "~")
      emit("submit", {
        mode: TagMode.or,
        name: tag.slice(1),
      });
    else
      emit("submit", {
        mode: TagMode.is,
        name: tag,
      });

    input.value?.blur();
  }
}
</script>

<template>
  <ElPopover
    :visible="showInputTag && (loadingTags || !!autoCompleteTags)"
    width="auto"
    popper-style="padding: 6px 0;"
  >
    <template #reference>
      <ElInput
        v-if="showInputTag"
        class="input"
        v-model="tagInput"
        @keydown="onKeyDown"
        @blur="tagInputBlur"
        ref="input"
      />
      <ElButton v-else class="show-input" @click="showInputTag = true">
        <ElIcon>
          <i-ep-plus />
        </ElIcon>
        <span>{{ language.filterTagComponent.addTag }}</span>
      </ElButton>
    </template>
    <div class="loading" v-if="loadingTags">
      <ElIcon class="is-loading">
        <i-ep-loading />
      </ElIcon>
    </div>
    <ElScrollbar
      v-else-if="autoCompleteTags"
      max-height="320px"
      class="auto-complete-tags"
    >
      <ul v-if="autoCompleteTags.length">
        <li v-for="tag in autoCompleteTags" :key="tag.id">
          <AutocompleteInputTagItem :tag="tag" @submit="submit" />
        </li>
      </ul>
      <p v-else>
        <span>{{ language.filterTagComponent.none }}</span>
      </p>
    </ElScrollbar>
  </ElPopover>
</template>

<style lang="scss" scoped>
.loading {
  height: 120px;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.auto-complete-tags {
  ul {
    padding: 6px 12px;

    & > :nth-child(n) {
      margin-bottom: 8px;
    }

    & > :last-child {
      margin-bottom: 0;
    }
  }

  p {
    margin: 0;
    padding: 12px 18px;
  }
}

.show-input,
.input {
  width: 120px;
}
</style>
