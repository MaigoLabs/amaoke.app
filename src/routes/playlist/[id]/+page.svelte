<script lang="ts">
  import type { PageProps } from "./$types"
  import { goto } from "$app/navigation";
  import AppBar from "$lib/ui/appbar/AppBar.svelte";
  import Button from "$lib/ui/button/Button.svelte";
  import SongInfo from "$lib/ui/listitem/SongInfo.svelte";
  import { API } from "$lib/client";

  let { data }: PageProps = $props()

  let meta = $derived(data.playlist)
  let songs = $derived(data.playlist.tracks)
  let isFavorite = $derived(data.user.data.myPlaylists?.includes(meta.id) ?? false)

  async function toggleFavorite() {
    if (isFavorite) {
      data.user.data.myPlaylists = data.user.data.myPlaylists?.filter(pl => pl !== meta.id)
    } else {
      data.user.data.myPlaylists = [...(data.user.data.myPlaylists || []), meta.id]
    }
    await API.saveUserData(data.user.data)
    isFavorite = !isFavorite
  }

  async function startPractice() {
    if (songs.length === 0) return;
    
    const firstIndex = 0;
    const firstSong = songs[firstIndex];
    
    data.user.data.loc = {
      currentPlaylistId: meta.id,
      currentSongIndex: firstIndex,
      playedSongIds: [firstSong.id],
      playMode: 'sequential',
      isFinished: false,
      lastResultId: null
    };
    
    await API.saveUserData({ loc: data.user.data.loc });
    goto(`/song/${firstSong.id}`);
  }
</script>

<AppBar title="歌单详情" right={[
  {
    icon: isFavorite ? "i-material-symbols:bookmark-rounded" : "i-material-symbols:bookmark-add-outline-rounded", 
    onclick: toggleFavorite
  },
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
      <Button onclick={startPractice}>开始练习</Button>
    </div>
  </div>
</div>

<div class="hbox gap-12px items-end! h-48px p-content">
  <div class="m3-font-headline-small">歌曲列表</div>
  <div class="m3-font-label-small pb-3px">{songs.length} 首歌曲</div>
</div>
<div class="vbox gap-12px mt-12px pb-12px scroll-here">
  {#each songs as song, index}
    <a href="/song/{song.id}" class="p-content">
      <SongInfo info={song} />
    </a>
  {/each}
</div>