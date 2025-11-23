<script lang="ts">
  import AppBar from "$lib/ui/appbar/AppBar.svelte"
  import MenuItem from "$lib/ui/material3/MenuItem.svelte"
  import { artistAndAlbum } from "$lib/utils"
  import type { TypingSettings, UserData, NeteaseSong, NeteasePlaylist } from "$lib/types"
  import { goto } from "$app/navigation"
  import { API } from "$lib/client"
  import { getNextSong, getNextLoc } from "./SongSwitching"

  interface Props {
    song: NeteaseSong
    settings: TypingSettings
    loc?: UserData['loc']
    playlist?: NeteasePlaylist
    showRomajiOnError?: boolean
    disableHideRepeated?: boolean
    isKaraoke?: boolean
  }

  let { 
    song, 
    settings = $bindable(), 
    loc = $bindable(), 
    playlist,
    showRomajiOnError = true,
    disableHideRepeated = false,
    isKaraoke = false
  }: Props = $props()

  let isHideRepeated = $derived(settings.hideRepeated && !disableHideRepeated)

  const nextSongId = $derived(getNextSong(playlist, loc))
  async function handleNext() {
    if (!loc || !playlist) return

    if (nextSongId) {
       const newLoc = getNextLoc(playlist, loc, nextSongId)
       loc = newLoc // Update local state
       await API.saveUserData({ loc })
       goto(`/song/${nextSongId}`, { replaceState: true })
    } else {
       // Playlist finished
       loc.isFinished = true
       await API.saveUserData({ loc })
       goto(`/playlist/${playlist.id}`)
    }
  }
</script>

<AppBar title={song.name} sub={artistAndAlbum(song)}>
  <MenuItem textIcon="あ" onclick={() => settings.isFuri = !settings.isFuri}>{settings.isFuri ? "隐藏" : "显示"}假名标注</MenuItem>
  <MenuItem textIcon="カ" onclick={() => settings.allKata = !settings.allKata}>{settings.allKata ? "恢复平假名" : "全部转换为片假名"}</MenuItem>
  <MenuItem icon="i-material-symbols:language-japanese-kana-rounded" onclick={() => settings.showRomaji = !settings.showRomaji}>{settings.showRomaji ? "隐藏罗马音" : "显示罗马音"}</MenuItem>
  
  {#if showRomajiOnError}
    <MenuItem icon="i-material-symbols:error-circle-rounded" onclick={() => settings.showRomajiOnError = !settings.showRomajiOnError}>{settings.showRomajiOnError ? "不在错误时显示罗马音" : "错误时显示罗马音"}</MenuItem>
  {/if}

  <MenuItem icon="i-material-symbols:compress-rounded" 
    disabled={disableHideRepeated} 
    sub={disableHideRepeated ? "音乐模式下不可用" : ""}
    onclick={() => settings.hideRepeated = !settings.hideRepeated}>{isHideRepeated ? "显示重复行" : "隐藏重复行"}</MenuItem>
  
  {#if loc}
    <MenuItem icon={loc.playMode === 'random' ? "i-material-symbols:shuffle-rounded" : "i-material-symbols:repeat-rounded"}
      onclick={() => loc!.playMode = loc!.playMode === 'random' ? 'sequential' : 'random'}>
      {loc.playMode === 'random' ? "当前：随机播放" : "当前：顺序播放"}
    </MenuItem>

    {#if nextSongId}
      <MenuItem icon="i-material-symbols:skip-next-rounded" onclick={handleNext}>下首</MenuItem>
    {/if}
  {/if}
</AppBar>
