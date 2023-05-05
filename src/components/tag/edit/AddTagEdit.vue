<script lang="ts" setup>
import { computed } from "vue";
import StringTagEdit from "@/components/tag/edit/StringTagEdit.vue";
import OrderTagEdit from "@/components/tag/edit/OrderTagEdit.vue";
import NumberRangeOrValueTagEdit from "@/components/tag/edit/NumberRangeOrValueTagEdit.vue";
import DateRangeOrValueTagEdit from "@/components/tag/edit/DateRangeOrValueTagEdit.vue";
import type { Order, RangeOrValue, Rating } from "@/utils/tags";
import { useLanguage } from "@/stores/language";
import RatingTagEdit from "@/components/tag/edit/RatingTagEdit.vue";
import {
  DateTag,
  HeightTag,
  IdTag,
  MD5Tag,
  MpixelsTag,
  OrderTag,
  ParentNoneTag,
  ParentTag,
  RatingTag,
  ScoreTag,
  SourceTag,
  Tag,
  UserTag,
  Vote3Tag,
  WidthTag,
  TagType,
} from "@/utils/tags";
import type { Tag as ApiTag } from "@/utils/api";
import AutocompleteTagEdit from "@/components/tag/edit/AutocompleteTagEdit.vue";
import ParentTagEdit from "@/components/tag/edit/ParentTagEdit.vue";

const props = withDefaults(
  defineProps<{
    searchTag(text: string): Promise<Array<ApiTag>>;
    mode?: TagType;
  }>(),
  {
    mode: TagType.common,
  }
);

const emit = defineEmits<{
  (event: "emit", tag: Tag): void;
}>();

const language = useLanguage();

const rangeOrValueText = computed(
  () => language.language.tagComponent.rangeOrValue
);

const stringTagType = [
  TagType.user,
  TagType.vote3,
  TagType.md5,
  TagType.source,
];

const numberRangeOrValueTagType = [
  TagType.id,
  TagType.width,
  TagType.height,
  TagType.score,
  TagType.mpixels,
];

function emitTag(tag: Tag) {
  emit("emit", tag);
}

function emitStringTag(text: string) {
  switch (props.mode) {
    case TagType.md5:
      emitTag(new MD5Tag(text));
      break;
    case TagType.source:
      emitTag(new SourceTag(text));
      break;
    case TagType.user:
      emitTag(new UserTag(text));
      break;
    case TagType.vote3:
      emitTag(new Vote3Tag(text));
      break;
    default:
      emitTag(Tag.paser(text));
  }
}

function emitNumberRangeOrValueTag(value: RangeOrValue<number>) {
  switch (props.mode) {
    case TagType.height:
      emitTag(new HeightTag(value));
      break;
    case TagType.id:
      emitTag(new IdTag(value));
      break;
    case TagType.mpixels:
      emitTag(new MpixelsTag(value));
      break;
    case TagType.score:
      emitTag(new ScoreTag(value));
      break;
    case TagType.width:
      emitTag(new WidthTag(value));
      break;
    default:
      console.warn(
        `The mode not is RangeOrValue type tag,mode is ${
          props.mode
        },value is ${JSON.stringify(value)}.`
      );
  }
}

function emitDateRangeOrValueTag(value: RangeOrValue<Date>) {
  emitTag(new DateTag(value));
}

function emitOrderTag(order: Order) {
  emitTag(new OrderTag(order));
}

function emitRatingTag(rating: Rating) {
  emitTag(new RatingTag(rating));
}

function emitParentTag(value: number) {
  emit("emit", new ParentTag(value));
}
function emitParentNoneTag() {
  emit("emit", new ParentNoneTag());
}
</script>
<template>
  <StringTagEdit
    v-if="stringTagType.includes(mode)"
    :placeholder="language.language.tagComponent.tagTypes[mode!]"
    @emit="emitStringTag"
  />
  <OrderTagEdit v-else-if="mode === TagType.order" @emit="emitOrderTag" />
  <RatingTagEdit v-else-if="mode === TagType.rating" @emit="emitRatingTag" />
  <NumberRangeOrValueTagEdit
    v-else-if="numberRangeOrValueTagType.includes(mode)"
    :placeholder="rangeOrValueText[mode as keyof typeof rangeOrValueText]"
    :number-min="0"
    :number-step="1"
    number-step-strictly
    @emit="emitNumberRangeOrValueTag"
  />
  <DateRangeOrValueTagEdit
    v-else-if="mode === TagType.date"
    :placeholder="rangeOrValueText.date"
    @emit="emitDateRangeOrValueTag"
  />
  <ParentTagEdit
    v-else-if="mode === TagType.parent"
    @emit="emitParentTag"
    @emit-none="emitParentNoneTag"
  />
  <AutocompleteTagEdit
    v-else
    :fetch-suggestions="searchTag"
    @emit="emitStringTag"
  />
</template>
