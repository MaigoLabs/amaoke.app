<script lang="ts">
import type { PageProps } from "./$types"
import AppBar from "../../../components/appbar/AppBar.svelte";
import Button from "../../../components/Button.svelte";

let { data }: PageProps = $props()

let {meta, songs} = data.playlist
</script>

<AppBar title="歌单详情" right={[
  {icon: "i-material-symbols:bookmark-add-outline-rounded", onclick: () => alert('Bookmark clicked')},
  {icon: "i-material-symbols:more-vert", onclick: () => alert('More clicked')}
]} />

<div class="hbox px-16px py-8px gap-24px">
  <img src="{meta.coverImgUrl}" alt="" class="size-128px rounded-16px">
  <div class="vbox flex-1 py-8px self-stretch min-h-full">
    <div class="m3-font-headline-small font-bold">{meta.name}</div>
    <div class="flex-1">
      <div class="m3-font-body-small text-surface-variant">创建者: {meta.creator.nickname}</div>
      <div class="m3-font-body-small text-surface-variant">歌曲数: {meta.trackCount}</div>
    </div>
    <div>
      <Button>开始练习</Button>
    </div>
  </div>
</div>