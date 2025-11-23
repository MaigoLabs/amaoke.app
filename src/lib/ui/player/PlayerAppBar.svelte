<script lang="ts">
  import AppBar from "$lib/ui/appbar/AppBar.svelte"
  import MenuItem from "$lib/ui/material3/MenuItem.svelte"
  import { artistAndAlbum } from "$lib/utils"
  import type { TypingSettings, UserData, NeteaseSong, NeteasePlaylist } from "$lib/types"
  import { goto } from "$app/navigation"
  import { API } from "$lib/client"
  import { getNextSong, getNextLoc } from "./SongSwitching"

  import { getI18n } from "$lib/i18n"

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

  const t = getI18n().player.menu

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
  <MenuItem textIcon="あ" onclick={() => settings.isFuri = !settings.isFuri}>{settings.isFuri ? t.hideFuri : t.showFuri}</MenuItem>
  <MenuItem textIcon="カ" onclick={() => settings.allKata = !settings.allKata}>{settings.allKata ? t.revertHiragana : t.convertToKatakana}</MenuItem>
  <MenuItem icon="i-material-symbols:language-japanese-kana-rounded" onclick={() => settings.showRomaji = !settings.showRomaji}>{settings.showRomaji ? t.hideRomaji : t.showRomaji}</MenuItem>
  
  {#if showRomajiOnError}
    <MenuItem icon="i-material-symbols:error-circle-rounded" onclick={() => settings.showRomajiOnError = !settings.showRomajiOnError}>{settings.showRomajiOnError ? t.hideRomajiOnError : t.showRomajiOnError}</MenuItem>
  {/if}

  <MenuItem icon="i-material-symbols:compress-rounded" 
    disabled={disableHideRepeated} 
    sub={disableHideRepeated ? t.musicModeUnavailable : ""}
    onclick={() => settings.hideRepeated = !settings.hideRepeated}>{isHideRepeated ? t.showRepeated : t.hideRepeated}</MenuItem>
  
  {#if loc}
    <MenuItem icon={loc.playMode === 'random' ? "i-material-symbols:shuffle-rounded" : "i-material-symbols:repeat-rounded"}
      onclick={() => loc!.playMode = loc!.playMode === 'random' ? 'sequential' : 'random'}>
      {loc.playMode === 'random' ? t.shuffle : t.sequential}
    </MenuItem>

    {#if nextSongId}
      <MenuItem icon="i-material-symbols:skip-next-rounded" onclick={handleNext}>{t.nextSong}</MenuItem>
    {/if}
  {/if}
</AppBar>
