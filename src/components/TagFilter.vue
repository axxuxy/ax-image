<script lang="ts" setup>
import {
  RatingMode,
  RatingValue,
  TagMode,
  type RangeOrValue as RangeOrValueType,
  type TagsOptions,
} from "@/utils/format_tags";
import type { Website } from "@/utils/website";
import { computed, nextTick, ref } from "vue";
import AutocompleteInputTagVue from "@/components/tools/AddTag.vue";
import type { Tag } from "@/components/tools/AddTagItem.vue";
import { storeToRefs } from "pinia";
import { useLanguage } from "@/stores/language";
import RangeOrValue from "@/components/tools/RangeOrValue.vue";

export interface TagFilterOptions extends TagsOptions {
  tags?: Array<Tag>;
}

const props = defineProps<{
  modelValue?: TagFilterOptions;
  website: Website;
}>();

const emit = defineEmits({
  search: (value: TagFilterOptions) => value && true,
  close: () => true,
});

const { language } = storeToRefs(useLanguage());

const tags = ref(props.modelValue?.tags ?? []);

/// Add tag and remove tag function.
function selectTag(tag: Tag) {
  const _ = tags.value.filter((_) => _.name !== tag.name);
  _.push({
    ...tag,
  });
  tags.value = _;
}
function removeTag(tag: Tag | { type: string }) {
  tags.value = tags.value.filter((_) => _ !== tag);
}

const modes = computed(() => Object.values(TagMode));

function changeTagMode({ tag, mode }: { tag: Tag; mode: TagMode }) {
  tag.mode = mode;
  nextTick();
}

const user = ref<string | undefined>(props.modelValue?.user);
const vote3 = ref<string | undefined>(props.modelValue?.["vote:3"]);
const md5 = ref<string | undefined>(props.modelValue?.md5);
const ratings = computed(() => {
  const modes = Object.values(RatingMode);
  return Object.values(RatingValue)
    .map((value) =>
      modes.map((mode) => ({
        mode,
        value,
        key: mode + value,
        text: language.value.filterTagComponent.rating.values[value][mode],
      }))
    )
    .flatMap((ratings) => ratings);
});
const rating = ref(
  props.modelValue?.rating
    ? ratings.value.find(
        (rating) =>
          rating.mode === props.modelValue!.rating?.mode &&
          rating.value === props.modelValue!.rating.value
      )
    : undefined
);
const source = ref<string | undefined>(props.modelValue?.source);

const id = ref<RangeOrValueType<number>>();
const width = ref<RangeOrValueType<number>>();
const height = ref<RangeOrValueType<number>>();
const score = ref<RangeOrValueType<number>>();
const mpixels = ref<RangeOrValueType<number>>();
const date = ref<RangeOrValueType<Date>>();

function search() {
  emit("search", {
    tags: tags.value,
    user: user.value,
    "vote:3": vote3.value,
    md5: md5.value,
    rating: rating.value,
    source: source.value,
    id: id.value,
    width: width.value,
    height: height.value,
    score: score.value,
    mpixels: mpixels.value,
    date: date.value,
  });
}
</script>

<template>
  <ElSpace direction="vertical" class="tags-box" alignment="start" fill>
    <ElSpace wrap class="tag-list">
      <ElTag
        v-for="tag in tags"
        :key="tag.id"
        closable
        @close="removeTag(tag)"
        disable-transitions
        :class="['--tag', `--tag-${tag.type}`]"
        :title="language.filterTagComponent.tagTypes[tag.type]"
      >
        <ElDropdown trigger="click" @command="changeTagMode" class="--tag-mode">
          <ElIcon v-if="tag.mode === TagMode.is">+</ElIcon>
          <ElIcon v-else-if="tag.mode === TagMode.not">-</ElIcon>
          <ElIcon v-else-if="tag.mode === TagMode.or">~</ElIcon>
          <template #dropdown>
            <ElDropdownMenu>
              <ElDropdownItem
                v-for="mode in modes"
                :key="mode"
                :command="{ tag, mode }"
              >
                <ElIcon v-if="mode === TagMode.is">+</ElIcon>
                <ElIcon v-else-if="mode === TagMode.not">-</ElIcon>
                <ElIcon v-else-if="mode === TagMode.or">~</ElIcon>
                <span>
                  {{ language.filterTagComponent.tagModes[mode] }}
                </span>
              </ElDropdownItem>
            </ElDropdownMenu>
          </template>
        </ElDropdown>
        <span>{{ tag.name }}</span>
        <span> - </span>
        <span>{{ tag.count }}</span>
      </ElTag>
      <AutocompleteInputTagVue
        :website="props.website"
        @select="selectTag"
      ></AutocompleteInputTagVue>
    </ElSpace>
    <ElSpace wrap>
      <ElInput v-model="user" clearable>
        <template #prepend>
          <span>{{ language.filterTagComponent.userInput }}</span>
        </template>
      </ElInput>
      <ElInput v-model="vote3" clearable>
        <template #prepend>
          <span>{{ language.filterTagComponent.vote3Input }}</span>
        </template>
      </ElInput>
      <ElInput v-model="md5" clearable>
        <template #prepend>
          <span>{{ language.filterTagComponent.md5Input }}</span>
        </template>
      </ElInput>
      <ElSelect v-model="rating" clearable value-key="key" class="rating">
        <template #prefix>
          <div class="prefix">
            <span>{{ language.filterTagComponent.rating.title }}</span>
            <span> :</span>
          </div>
        </template>
        <ElOption
          v-for="rating in ratings"
          :key="rating.key"
          :value="rating"
          :label="rating.text"
        />
      </ElSelect>
      <ElInput v-model="source" clearable>
        <template #prepend>
          <span>{{ language.filterTagComponent.sourceInput }}</span>
        </template>
      </ElInput>
      <RangeOrValue
        type="number"
        v-model="id"
        :text="language.filterTagComponent.rangeOrValue.id"
        :number-min="1"
        :number-step="1"
        number-step-strictly
      />
      <RangeOrValue
        type="number"
        v-model="width"
        :text="language.filterTagComponent.rangeOrValue.width"
        :number-min="0"
        :number-step="1"
        number-step-strictly
      />
      <RangeOrValue
        type="number"
        v-model="height"
        :text="language.filterTagComponent.rangeOrValue.height"
        :number-min="0"
        :number-step="1"
        number-step-strictly
      />
      <RangeOrValue
        type="number"
        v-model="score"
        :text="language.filterTagComponent.rangeOrValue.score"
        :number-min="0"
        :number-step="1"
        number-step-strictly
      />
      <RangeOrValue
        type="number"
        v-model="mpixels"
        :text="language.filterTagComponent.rangeOrValue.mpixels"
        :number-min="0"
      />
      <RangeOrValue
        type="date"
        v-model="date"
        :text="language.filterTagComponent.rangeOrValue.date"
        date-disable-after
      />
    </ElSpace>
    <ElSpace style="justify-content: end">
      <ElButton circle @click="search" icon="search"></ElButton>
      <ElButton circle @click="emit('close')" icon="close"> </ElButton>
    </ElSpace>
  </ElSpace>
</template>

<style lang="scss" scoped>
.tags-box {
  width: 100%;

  .--tag-mode {
    margin-left: -4px;
    margin-right: 4px;
  }

  .prefix {
    height: 30px;
  }
}
</style>
