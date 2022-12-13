<script lang="ts" setup>
import { storeToRefs } from "pinia";
import { ref, watch } from "vue";
import { getTags as _getTags, type Tag as ApiTag } from "@/utils/api";
import { useLanguage } from "@/stores/language";
import type { Website } from "@/utils/website";
import AutocompleteInputTagItem, {
  type Tag,
} from "@/components/tools/AddTagItem.vue";

const props = defineProps<{
  website: Website;
}>();

const emit = defineEmits({
  select: (tag: Tag) => tag || false,
});

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
  }, 1000);
});

/// Contaller add tag input show and hidden.
const showInputTag = ref(false);
function tagInputBlur() {
  showInputTag.value = false;
  tagInput.value = undefined;
}

/// Add tag input auto get focus.
const input = ref();
watch(showInputTag, (value) => {
  if (value) setTimeout(() => input.value?.focus(), 0);
});

function select(tag: Tag) {
  emit("select", tag);
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
        size="small"
        v-model="tagInput"
        @blur="tagInputBlur"
        ref="input"
      />
      <ElButton
        v-else
        class="show-input"
        size="small"
        @click="showInputTag = true"
      >
        <ElIcon>
          <Plus />
        </ElIcon>
      </ElButton>
    </template>
    <div class="loading" v-if="loadingTags">
      <ElIcon class="is-loading">
        <Loading />
      </ElIcon>
    </div>
    <ElScrollbar
      v-else-if="autoCompleteTags"
      max-height="320px"
      class="auto-complete-tags"
    >
      <ul v-if="autoCompleteTags.length">
        <li v-for="tag in autoCompleteTags" :key="tag.id">
          <AutocompleteInputTagItem :tag="tag" @select="select" />
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
  width: 80px;
}
</style>
