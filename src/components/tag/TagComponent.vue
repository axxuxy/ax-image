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
import TagValue from "@/components/tag/TagValue.vue";
import type { Tag as ApiTag, TagType } from "@/utils/api";

defineProps<{
  tag: Tag;
  website: Website;
  searchTag: (text: string) => Promise<Array<ApiTag>>;
  type?: TagType;
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
  <CommonTagVue
    v-if="tag instanceof CommonTag"
    :tag="tag"
    :website="website"
    :fetch-suggestions="searchTag"
    :type="type"
    @update="update"
    @remove="remove"
  />
  <UserTagVue
    v-else-if="tag instanceof UserTag"
    :tag="tag"
    @update="update"
    @remove="remove"
  />
  <Vote3TagVue
    v-else-if="tag instanceof Vote3Tag"
    :tag="tag"
    @update="update"
    @remove="remove"
  />
  <MD5TagVue
    v-else-if="tag instanceof MD5Tag"
    :tag="tag"
    @update="update"
    @remove="remove"
  />
  <RatingTagVue
    v-else-if="tag instanceof RatingTag"
    :tag="tag"
    @update="update"
    @remove="remove"
  />
  <SourceTagVue
    v-else-if="tag instanceof SourceTag"
    :tag="tag"
    @update="update"
    @remove="remove"
  />
  <IdTagVue
    v-else-if="tag instanceof IdTag"
    :tag="tag"
    @update="update"
    @remove="remove"
  />
  <WidthTagVue
    v-else-if="tag instanceof WidthTag"
    :tag="tag"
    @update="update"
    @remove="remove"
  />
  <HeightTagVue
    v-else-if="tag instanceof HeightTag"
    :tag="tag"
    @update="update"
    @remove="remove"
  />
  <ScoreTagVue
    v-else-if="tag instanceof ScoreTag"
    :tag="tag"
    @update="update"
    @remove="remove"
  />
  <MpixelsTagVue
    v-else-if="tag instanceof MpixelsTag"
    :tag="tag"
    @update="update"
    @remove="remove"
  />
  <DateTagVue
    v-else-if="tag instanceof DateTag"
    :tag="tag"
    @update="update"
    @remove="remove"
  />
  <OrderTagVue
    v-else-if="tag instanceof OrderTag"
    :tag="tag"
    @update="update"
    @remove="remove"
  />
  <ParentTagVue
    v-else-if="tag instanceof ParentTag"
    :tag="tag"
    @update="update"
    @remove="remove"
  />
  <TagValue v-else type="meta" hide-edit :tag="tag" @remove="remove" />
</template>
