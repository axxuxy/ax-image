<script lang="ts" setup>
import { computed, ref, watch } from "vue";
import { useLanguage } from "@/stores/language";
import { TagType, type Tag } from "@/utils/tags";
import type { Tag as ApiTag } from "@/utils/api";
import { ClickOutside as vClickOutside } from "element-plus";
import AddTagEdit from "@/components/tag/edit/AddTagEdit.vue";

defineProps<{
  searchTag(text: string): Promise<Array<ApiTag>>;
}>();

const emit = defineEmits<{
  (event: "emit", tag: Tag): void;
}>();

const language = useLanguage();
const tagTypes = computed(() => language.language.tagComponent.tagTypes);
const types = Object.values(TagType);

const mode = ref<TagType>();

function changeMode(_: any) {
  mode.value = _;
}

const isAdd = ref(false);

function emitTag(tag: Tag) {
  isAdd.value = false;
  emit("emit", tag);
}

const visible = ref(false);
watch(isAdd, (_) => {
  visible.value = _;
  mode.value = undefined;
});
watch(mode, () => (visible.value = false));

function clickOutside() {
  isAdd.value = false;
}

function click2() {
  visible.value = false;
}
</script>
<template>
  <div class="add-tag" v-click-outside="clickOutside">
    <ElPopover :visible="visible" :teleported="false">
      <template #reference>
        <AddTagEdit
          v-if="isAdd"
          v-focus="!!mode"
          :mode="mode"
          :key="mode"
          :search-tag="searchTag"
          @emit="emitTag"
          @click="click2"
        />
        <ElButton v-else @click.stop="isAdd = true">
          {{ language.language.tagComponent.addTag }}
          <template #icon>
            <ElIcon>
              <i-ep-plus />
            </ElIcon>
          </template>
        </ElButton>
      </template>
      <ul>
        <li
          v-for="type in types"
          class="tag-type"
          :key="type"
          @click="changeMode(type)"
        >
          {{ tagTypes[type] }}
        </li>
      </ul>
    </ElPopover>
  </div>
</template>

<style lang="scss" scoped>
.add-tag {
  display: inline-block;

  .tag-type {
    padding: 8px 12px;
    margin: 0 -12px;
    cursor: pointer;

    &:hover {
      background-color: #eeeeeeee;
    }
  }
}
</style>
