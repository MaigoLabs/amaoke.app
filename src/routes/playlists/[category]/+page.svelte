<script lang="ts">
  import AppBar from "../../../components/appbar/AppBar.svelte";
import ImageListItem from "../../../components/listitem/ImageListItem.svelte";
  import type { PageProps } from "./$types"

  let { data }: PageProps = $props()
</script>

<AppBar title={data.isMine ? '我的歌单' : '推荐歌单'} right={[
  // TODO
  {icon: "i-material-symbols:more-vert", onclick: () => alert('More clicked')}
]} />

<div class="vbox p-content gap-12px">
  {#each data.playlists as pl}
    <a href="/playlist/{pl.id}">
      <ImageListItem photoUrl={pl.coverImgUrl} title={pl.name} text={`${pl.creator.nickname} 创建`} right={`${pl.trackCount} 首歌`} />
    </a>
  {/each}
</div>

