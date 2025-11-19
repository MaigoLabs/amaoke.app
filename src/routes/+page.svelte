<script lang="ts">
  import AppBar from "../components/appbar/AppBar.svelte";
  import TitleHeader from "../components/TitleHeader.svelte";
  import SongInfo from "../components/listitem/SongInfo.svelte";
  import type { PageProps } from "./$types";
  import Button from "../components/Button.svelte";
    import { Layer } from "m3-svelte";

  let { data }: PageProps = $props()

  console.log(data.myPlaylists)
</script>


<AppBar account={() => alert('Account clicked')} right={[
  {icon: "i-material-symbols:settings-rounded", onclick: () => alert('Settings clicked')}
]} />

<div class="vbox gap-16px">
  {#if data.last}
    <div>
      <TitleHeader title="从暂停的位置继续"/>
      <div class="p-content">
        <SongInfo info={data.last}></SongInfo>
      </div>
    </div>
  {/if}

  <div>
    <TitleHeader title="历史数据"/>
    <div class="p-content">
      TODO
    </div>
  </div>

  <div>
    <TitleHeader title="我的歌单"/>
    <div class="p-content hbox gap-8px w-auto overflow-x-auto py-8px">
      {#each data.myPlaylists as playlist}
        <a class="vbox flex-shrink-0 gap-4px w-96px relative" href="/playlist/{playlist.id}">
          <div class="relative rounded-16px overflow-hidden">
            <img src="{playlist.coverImgUrl}" alt="" class="size-96px">
            <Layer/>
          </div>
          <div class="m3-font-label-large truncate">{playlist.name}</div>
        </a>
      {/each}
    </div>
    <div class="p-content">
      <Button icon="i-material-symbols:cloud-download-outline">从网易云导入</Button>
    </div>
  </div>

  <div>
    <TitleHeader title="推荐歌单"/>
    <div class="p-content hbox gap-8px w-auto overflow-x-auto py-8px">
      {#each data.recPlaylists as playlist}
        <a class="vbox flex-shrink-0 p-8px gap-8px rounded-12px mbg-surface-container-high relative" href="/playlist/{playlist.id}">
          <Layer/>
          <img src="{playlist.coverImgUrl}" alt="" class="size-116px rounded-8px">
          <div>
            <div class="m3-font-title-small font-bold truncate">{playlist.name}</div>
            <div class="m3-font-body-small truncate">{playlist.creator.nickname} 创建</div>
          </div>
        </a>
      {/each}
    </div>
  </div>
</div>