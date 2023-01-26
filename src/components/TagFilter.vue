<script lang="ts" setup>
import {
  Order,
  RatingMode,
  RatingValue,
  TagMode,
  type Tag as FormatTag,
  type TagsOptions,
} from "@/utils/format_tags";
import type { Website } from "@/utils/website";
import { computed, ref } from "vue";
import AutocompleteInputTagVue from "@/components/tools/AddTag.vue";
import type { Tag } from "@/components/tools/AddTagItem.vue";
import { storeToRefs } from "pinia";
import { useLanguage } from "@/stores/language";
import RangeOrValue, {
  type ModelValue,
} from "@/components/tools/RangeOrValue.vue";
import Clear from "@/assets/clear.svg?component";

const props = defineProps<{
  modelValue?: TagsOptions;
  website: Website;
}>();

const emit = defineEmits({
  search: (value: TagsOptions) => value && true,
  close: () => true,
});

const { language } = storeToRefs(useLanguage());

const tags = ref<Array<FormatTag | Tag>>([]);
const tagList = computed(() =>
  tags.value.map((tag) => ({
    tag,
    class: "type" in tag ? ["--tag", `--tag-${tag.type}`] : undefined,
  }))
);

/// Add tag and remove tag function.
function addTag(tag: Tag | FormatTag) {
  const _ = tags.value.filter((_) => _.name !== tag.name);
  _.push({
    ...tag,
  });
  tags.value = _;
}
function removeTag(tag: FormatTag | { type: string }) {
  tags.value = tags.value.filter((_) => _ !== tag);
}

const modes = Object.values(TagMode);

function changeTagMode({
  tag,
  mode,
}: {
  tag: (typeof tagList)["value"][number];
  mode: TagMode;
}) {
  tag.tag.mode = mode;
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
const rating = ref<(typeof ratings.value)[number]>();
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

function setTags(option: TagsOptions) {
  tags.value =
    option.tags?.map((tag) => {
      const _ = sessionStorage.getItem(`${props.website}-tag-${tag.name}`);
      if (!_) return tag;
      return Object.assign(JSON.parse(_), tag);
    }) ?? [];
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
  const data: TagsOptions = {};
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
  if (parentNone.value) data.parent = false;
  else if (parent.value) data.parent = parent.value;
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
      <!-- <TagItem v-for="tag in tags" :key="tag.name" :tag="tag" @changeMode=""></TagItem> -->
      <ElTag
        v-for="tag in tagList"
        :key="tag.tag.name"
        closable
        @close="removeTag(tag.tag)"
        disable-transitions
        :class="tag.class"
        size="large"
      >
        <!-- :title="language.filterTagComponent.tagTypes[tag.type]"  -->
        <ElDropdown trigger="click" @command="changeTagMode" class="--tag-mode">
          <ElIcon v-if="tag.tag.mode === TagMode.is">+</ElIcon>
          <ElIcon v-else-if="tag.tag.mode === TagMode.not">-</ElIcon>
          <ElIcon v-else-if="tag.tag.mode === TagMode.or">~</ElIcon>
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
        <span>{{ tag.tag.name }}</span>
        <!-- <template v-if="tag.count">
          <span> - </span>
          <span>{{ tag.count }}</span>
        </template> -->
      </ElTag>
      <AutocompleteInputTagVue
        :website="props.website"
        @submit="addTag"
        key="auto-input-tag"
      ></AutocompleteInputTagVue>
    </ElSpace>
    <ElRow :gutter="12" class="filter-tags">
      <ElCol :xs="24" :sm="12" :lg="5">
        <ElInput v-model="user" clearable>
          <template #prepend>
            <span>{{ language.filterTagComponent.userInput }}</span>
          </template>
        </ElInput>
      </ElCol>
      <ElCol :xs="24" :sm="12" :lg="5">
        <ElInput v-model="vote3" clearable>
          <template #prepend>
            <span>{{ language.filterTagComponent.vote3Input }}</span>
          </template>
        </ElInput>
      </ElCol>
      <ElCol :xs="24" :sm="12" :lg="5">
        <ElInput v-model="md5" clearable>
          <template #prepend>
            <span>{{ language.filterTagComponent.md5Input }}</span>
          </template>
        </ElInput>
      </ElCol>
      <ElCol :xs="24" :sm="12" :lg="4">
        <ElSelect v-model="rating" clearable value-key="key">
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
      </ElCol>
      <ElCol :xs="24" :sm="12" :lg="5">
        <ElInput v-model="source" clearable>
          <template #prepend>
            <span>{{ language.filterTagComponent.sourceInput }}</span>
          </template>
        </ElInput>
      </ElCol>
      <ElCol :xs="24" :sm="12" :lg="8" :xl="6">
        <RangeOrValue
          type="number"
          v-model="id"
          :text="language.filterTagComponent.rangeOrValue.id"
          :number-min="1"
          :number-step="1"
          number-step-strictly
        />
      </ElCol>
      <ElCol :xs="24" :sm="12" :lg="8" :xl="6">
        <RangeOrValue
          type="number"
          v-model="width"
          :text="language.filterTagComponent.rangeOrValue.width"
          :number-min="0"
          :number-step="1"
          number-step-strictly
        />
      </ElCol>
      <ElCol :xs="24" :sm="12" :lg="8" :xl="6">
        <RangeOrValue
          type="number"
          v-model="height"
          :text="language.filterTagComponent.rangeOrValue.height"
          :number-min="0"
          :number-step="1"
          number-step-strictly
        />
      </ElCol>
      <ElCol :xs="24" :sm="12" :lg="8" :xl="6">
        <RangeOrValue
          type="number"
          v-model="score"
          :text="language.filterTagComponent.rangeOrValue.score"
          :number-min="0"
          :number-step="1"
          number-step-strictly
        />
      </ElCol>
      <ElCol :xs="24" :sm="12" :lg="8" :xl="6">
        <RangeOrValue
          type="number"
          v-model="mpixels"
          :text="language.filterTagComponent.rangeOrValue.mpixels"
          :number-min="0"
        />
      </ElCol>
      <ElCol :xs="24" :sm="24" :lg="8" :xl="6">
        <RangeOrValue
          type="date"
          v-model="date"
          :text="language.filterTagComponent.rangeOrValue.date"
          date-disable-after
        />
      </ElCol>
      <ElCol :xs="24" :sm="12" :lg="8" :xl="6">
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
      </ElCol>
      <ElCol class="parent-box" :xs="24" :sm="12" :lg="8" :xl="6">
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
      </ElCol>
    </ElRow>
    <ElSpace style="justify-content: end">
      <ElButton circle @click="reset">
        <ElIcon>
          <i-ep-refresh />
        </ElIcon>
      </ElButton>
      <ElButton circle @click="clear">
        <ElIcon>
          <Clear />
        </ElIcon>
      </ElButton>
      <ElButton circle @click="search">
        <ElIcon>
          <i-ep-search />
        </ElIcon>
      </ElButton>
      <ElButton circle @click="emit('close')">
        <ElIcon>
          <i-ep-close />
        </ElIcon>
      </ElButton>
    </ElSpace>
  </ElSpace>
</template>

<style lang="scss" scoped>
.tags-box {
  width: 100%;
  min-width: 360px;

  .--tag-mode {
    margin-left: -4px;
    margin-right: 4px;
    color: var(--el-tag-text-color);
  }

  .filter-tags {
    margin-top: -8px;

    & > div {
      padding-top: 8px;
    }

    .el-select {
      width: 100%;

      .prefix {
        line-height: 30px;
      }
    }

    .parent-box {
      display: flex;

      .parent {
        display: flex;
        width: 100%;
        margin-right: 12px;
        border-radius: var(
          --el-input-border-radius,
          var(--el-border-radius-base)
        );
        background-color: var(--el-fill-color-light);
        box-shadow: 0 0 0 1px
          var(--el-input-border-color, var(--el-border-color)) inset;

        .prepend {
          padding: 0 20px;
          border-radius: var(--el-input-border-radius);
          color: var(--el-color-info);
          box-shadow: 1px 0 0 0 var(--el-input-border-color) inset,
            0 1px 0 0 var(--el-input-border-color) inset,
            0 -1px 0 0 var(--el-input-border-color) inset;
          font-size: var(--el-font-size-base);
          line-height: 32px;
          white-space: nowrap;
        }

        :deep(.el-input-number) {
          width: 100%;

          .el-input__wrapper {
            border-top-left-radius: 0;
            border-bottom-left-radius: 0;
          }
        }
      }
    }
  }
}
</style>
