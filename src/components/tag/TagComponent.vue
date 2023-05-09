<script lang="ts" setup>
import {
  type Tag,
  CommonTag,
  UserTag,
  Vote3Tag,
  MD5Tag,
  RatingTag,
  SourceTag,
  IdTag,
  WidthTag,
  HeightTag,
  ScoreTag,
  MpixelsTag,
  DateTag,
  OrderTag,
  ParentTag,
  TagType,
} from "@/utils/tags";
import type { Website } from "@/utils/website";
import CommonTagVue from "@/components/tag/CommonTag.vue";
import UserTagVue from "@/components/tag/UserTag.vue";
import Vote3TagVue from "@/components/tag/Vote3Tag.vue";
import MD5TagVue from "@/components/tag/MD5Tag.vue";
import RatingTagVue from "@/components/tag/RatingTag.vue";
import SourceTagVue from "@/components/tag/SourceTag.vue";
import IdTagVue from "@/components/tag/IdTag.vue";
import WidthTagVue from "@/components/tag/WidthTag.vue";
import HeightTagVue from "@/components/tag/HeightTag.vue";
import ScoreTagVue from "@/components/tag/ScoreTag.vue";
import MpixelsTagVue from "@/components/tag/MpixelsTag.vue";
import DateTagVue from "@/components/tag/DateTag.vue";
import OrderTagVue from "@/components/tag/OrderTag.vue";
import ParentTagVue from "@/components/tag/ParentTag.vue";
import type { Tag as ApiTag, TagType as ApiTagType } from "@/utils/api";

defineProps<{
  tag: Tag;
  website: Website;
  searchTag: (text: string) => Promise<Array<ApiTag>>;
  type?: ApiTagType;
}>();

const emit = defineEmits<{
  (event: "update", tag: Tag): void;
  (event: "remove"): void;
}>();

function update(tag: Tag) {
  emit("update", tag);
}

function remove() {
  emit("remove");
}
</script>

<template>
  <UserTagVue
    v-if="tag.type === TagType.user"
    :tag="(tag as UserTag)"
    @update="update"
    @remove="remove"
  />
  <Vote3TagVue
    v-else-if="tag.type === TagType.vote3"
    :tag="(tag as Vote3Tag)"
    @update="update"
    @remove="remove"
  />
  <MD5TagVue
    v-else-if="tag.type === TagType.md5"
    :tag="(tag as MD5Tag)"
    @update="update"
    @remove="remove"
  />
  <RatingTagVue
    v-else-if="tag.type === TagType.rating"
    :tag="(tag as RatingTag)"
    @update="update"
    @remove="remove"
  />
  <SourceTagVue
    v-else-if="tag.type === TagType.source"
    :tag="(tag as SourceTag)"
    @update="update"
    @remove="remove"
  />
  <IdTagVue
    v-else-if="tag.type === TagType.id"
    :tag="(tag as IdTag)"
    @update="update"
    @remove="remove"
  />
  <WidthTagVue
    v-else-if="tag.type === TagType.width"
    :tag="(tag as WidthTag)"
    @update="update"
    @remove="remove"
  />
  <HeightTagVue
    v-else-if="tag.type === TagType.height"
    :tag="(tag as HeightTag)"
    @update="update"
    @remove="remove"
  />
  <ScoreTagVue
    v-else-if="tag.type === TagType.score"
    :tag="(tag as ScoreTag)"
    @update="update"
    @remove="remove"
  />
  <MpixelsTagVue
    v-else-if="tag.type === TagType.mpixels"
    :tag="(tag as MpixelsTag)"
    @update="update"
    @remove="remove"
  />
  <DateTagVue
    v-else-if="tag.type === TagType.date"
    :tag="(tag as DateTag)"
    @update="update"
    @remove="remove"
  />
  <OrderTagVue
    v-else-if="tag.type === TagType.order"
    :tag="(tag as OrderTag)"
    @update="update"
    @remove="remove"
  />
  <ParentTagVue
    v-else-if="tag.type === TagType.parent"
    :tag="(tag as ParentTag)"
    @update="update"
    @remove="remove"
  />
  <CommonTagVue
    v-else
    :tag="(tag as CommonTag)"
    :website="website"
    :fetch-suggestions="searchTag"
    :type="type"
    @update="update"
    @remove="remove"
  />
</template>
