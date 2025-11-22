<script lang="ts">
  import { goto } from "$app/navigation"
  import AppBar from "$lib/ui/appbar/AppBar.svelte"
  import ImageListItem from "$lib/ui/listitem/ImageListItem.svelte"
  import MenuItem from "$lib/ui/material3/MenuItem.svelte"
  import type { PageProps } from "./$types"

  let { data }: PageProps = $props()
</script>

<AppBar title={data.isMine ? '我的歌单' : '推荐歌单'}>
  <MenuItem icon="i-material-symbols:download" onclick={() => goto("/import/netease")}>从网易云导入</MenuItem>
</AppBar>

<div class="vbox p-content gap-12px scroll-here">
  {#each data.playlists as pl}
    <a href="/playlist/{pl.id}">
      <ImageListItem photoUrl={pl.coverImgUrl} title={pl.name} text={`${pl.creator.nickname} 创建`} right={`${pl.trackCount} 首歌`} />
    </a>
  {/each}
</div>

