import type { Post, Tag } from "@/utils/api";
import type { Website } from "@/utils/website";
import { defineStore } from "pinia";
import { shallowRef, triggerRef } from "vue";

export const useCache = defineStore("cache", () => {
  const cacheTags = shallowRef(new Map<Website, Map<string, Tag>>());
  const cachePosts = shallowRef(new Map<Website, Map<number, Post>>());

  function addTags(website: Website, tags: Array<Tag>) {
    const _ = cacheTags.value.get(website);
    if (_) tags.forEach((tag) => _.set(tag.name, tag));
    else cacheTags.value.set(website, new Map(tags.map((_) => [_.name, _])));
    triggerRef(cacheTags);
  }

  function addPosts(website: Website, posts: Array<Post>) {
    const _ = cachePosts.value.get(website);
    if (_) posts.forEach((post) => _.set(post.id, post));
    else cachePosts.value.set(website, new Map(posts.map((_) => [_.id, _])));
    triggerRef(cachePosts);
  }

  return { tags: cacheTags, posts: cachePosts, addTags, addPosts };
});
