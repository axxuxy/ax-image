<script lang="ts" setup>
import {
  Order,
  RatingMode,
  RatingValue,
  TagMode,
  type TagsOptions,
} from "@/utils/format_tags";
import type { Website } from "@/utils/website";
import { computed, nextTick, ref } from "vue";
import AutocompleteInputTagVue from "@/components/tools/AddTag.vue";
import type { Tag } from "@/components/tools/AddTagItem.vue";
import { storeToRefs } from "pinia";
import { useLanguage } from "@/stores/language";
import RangeOrValue, {
  type ModelValue,
} from "@/components/tools/RangeOrValue.vue";
import Clear from "@/assets/clear.svg?component";

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

const tags = ref<Array<Tag>>([]);

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

const modes = Object.values(TagMode);

function changeTagMode({ tag, mode }: { tag: Tag; mode: TagMode }) {
  tag.mode = mode;
  nextTick();
}

const user = ref<string | undefined>();
const vote3 = ref<string | undefined>();
const md5 = ref<string | undefined>();
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
const rating = ref<typeof ratings.value[number]>();
const source = ref<string | undefined>();

const id = ref<ModelValue<"number">>();
const width = ref<ModelValue<"number">>();
const height = ref<ModelValue<"number">>();
const score = ref<ModelValue<"number">>();
const mpixels = ref<ModelValue<"number">>();
const date = ref<ModelValue<"date">>();

const orders = Object.values(Order).map((order) => ({
  order,
  text: language.value.filterTagComponent.order.values[order],
}));
const order = ref<Order>();

const parent = ref<number>();
const parentNone = ref(false);

function clear() {
  setTags({});
}
function reset() {
  setTags(props.modelValue ?? {});
}

function setTags(option: TagFilterOptions) {
  tags.value = option.tags ?? [];
  user.value = option.user;
  vote3.value = option["vote:3"];
  md5.value = option.md5;
  rating.value = props.modelValue?.rating
    ? ratings.value.find(
        (rating) =>
          rating.mode === props.modelValue!.rating?.mode &&
          rating.value === props.modelValue!.rating.value
      )
    : undefined;
  source.value = option.source;
  id.value = option.id;
  width.value = option.width;
  height.value = option.height;
  score.value = option.score;
  mpixels.value = option.mpixels;
  date.value = option.date;
  order.value = option.order;
  parent.value = option.parent || undefined;
  parentNone.value = option.parent === false;
}

function search() {
  const data: TagFilterOptions = {};
  if (tags.value.length) data.tags = tags.value;
  if (user.value) data.user = user.value;
  if (vote3.value) data["vote:3"] = vote3.value;
  if (md5.value) data.md5 = md5.value;
  if (rating.value) data.rating = rating.value;
  if (source.value) data.source = source.value;
  if (id.value) data.id = id.value;
  if (width.value) data.width = width.value;
  if (height.value) data.height = height.value;
  if (score.value) data.score = score.value;
  if (mpixels.value) data.mpixels = mpixels.value;
  if (date.value) data.date = date.value;
  if (order.value) data.order = order.value;
  if (parent.value) data.parent = parent.value;
  emit("search", data);
}

setTags(props.modelValue ?? {});
</script>

<template>
  <ElSpace
    direction="vertical"
    class="tags-box"
    alignment="start"
    fill
    size="large"
  >
    <ElSpace wrap class="tag-list">
      <ElTag
        v-for="tag in tags"
        :key="tag.id"
        closable
        @close="removeTag(tag)"
        disable-transitions
        :class="['--tag', `--tag-${tag.type}`]"
        :title="language.filterTagComponent.tagTypes[tag.type]"
        size="large"
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
      <ElSelect v-model="order" clearable>
        <template #prefix>
          <div class="prefix">
            <span>{{ language.filterTagComponent.order.title }}</span>
          </div>
        </template>
        <ElOption
          v-for="order in orders"
          :key="order.order"
          :value="order.order"
          :label="order.text"
        />
      </ElSelect>
      <div class="parent">
        <div class="prepend">
          <span>{{ language.filterTagComponent.parent }}</span>
        </div>
        <ElInputNumber
          :disabled="parentNone"
          v-model="parent"
          :step="1"
          step-strictly
          :min="1"
          :placeholder="language.filterTagComponent.parentInput"
        ></ElInputNumber>
      </div>
      <ElCheckbox
        v-model="parentNone"
        :label="language.filterTagComponent.parentNone"
        :border="true"
      ></ElCheckbox>
    </ElSpace>
    <ElSpace style="justify-content: end">
      <ElButton circle @click="reset" icon="refresh"></ElButton>
      <ElButton circle @click="clear">
        <ElIcon>
          <Clear style="width: 1em; height: 1em; color: var(--color)" />
        </ElIcon>
      </ElButton>
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
    height: 32px;
  }

  .parent {
    border-radius: var(--el-input-border-radius, var(--el-border-radius-base));
    background-color: var(--el-fill-color-light);
    box-shadow: 0 0 0 1px var(--el-input-border-color, var(--el-border-color))
      inset;

    .prepend {
      display: inline-block;
      padding: 0 20px;
      border-radius: var(--el-input-border-radius);
      color: var(--el-color-info);
      box-shadow: 1px 0 0 0 var(--el-input-border-color) inset,
        0 1px 0 0 var(--el-input-border-color) inset,
        0 -1px 0 0 var(--el-input-border-color) inset;
      font-size: var(--el-font-size-base);
    }

    :deep(.el-input-number) {
      .el-input__wrapper {
        border-top-left-radius: 0;
        border-bottom-left-radius: 0;
      }
    }
  }
}
</style>
