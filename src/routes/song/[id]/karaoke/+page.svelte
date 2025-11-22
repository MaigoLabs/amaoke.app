<script lang="ts">
  import type { PageProps } from "./$types"
  import { LinearProgress } from "m3-svelte"
  import { onMount } from "svelte"
  import { typingSettingsDefault } from "$lib/types"
  import { processLrcLine, dedupLines, type ProcLrcLine } from "$lib/ui/player/IMEHelper"
  import "$lib/ext.ts"
  import { API } from "$lib/client"
  import { MusicControl } from "$lib/ui/player/MusicControl"
  import Lyrics from "$lib/ui/player/Lyrics.svelte"
  import PlayerAppBar from "$lib/ui/player/PlayerAppBar.svelte"

  let { data }: PageProps = $props()

  let li = $state(0)
  let settings = $state(data.user.data?.typingSettings ?? typingSettingsDefault)
  $effect(() => { API.saveUserData({ typingSettings: settings }) })

  let vocalsVolume = $state(100) // 0-100

  // Process lyrics
  const isHideRepeated = $derived(settings.hideRepeated)
  let deduplicatedLyrics = $derived(dedupLines(data.lrc, isHideRepeated))
  let processedLrc: ProcLrcLine[] = $derived(deduplicatedLyrics.map(line => processLrcLine(line.lyric)))
  
  let musicControl = $state<MusicControl>()
  $effect(() => { li; musicControl?.updateLine(li) })

  // Volume control
  $effect(() => {
    if (musicControl) {
      // Tone.js volume is in decibels. 0 is full, -Infinity is silent.
      // Simple mapping: 100 -> 0, 0 -> -60 (or mute)
      const db = vocalsVolume === 0 ? -Infinity : 20 * Math.log10(vocalsVolume / 100)
      musicControl.setVocalsVolume(db)
    }
  })

  // State tracking for each kana character: UNSEEN, RIGHT, WRONG
  // In karaoke mode, we initialize everything to 'unseen' so kanjis are not colored as 'right'
  let states = $derived(processedLrc.map(line => new Array(line.totalLen).fill('unseen')))

  onMount(() => {
    if (data.audioData) {
      // If separated, use instrumental as main, vocals as second
      // If not separated, use url as main (full song)
      const mainUrl = data.audioData.instrumentalUrl ?? data.audioData.url
      const vocalsUrl = data.audioData.vocalsUrl
      
      musicControl = new MusicControl(mainUrl, vocalsUrl)
      musicControl.setLyrics(deduplicatedLyrics)
      musicControl.start()
    }

    const interval = setInterval(() => {
      if (!musicControl) return
      const time = musicControl.getTime()
      
      // Find the current line based on time
      // We look for the last line that has a time <= current time
      let nextLi = -1
      for (let i = 0; i < deduplicatedLyrics.length; i++) {
        const lineTime = musicControl.parseTime(deduplicatedLyrics[i].time)
        if (time >= lineTime) {
          nextLi = i
        } else {
          break
        }
      }
      
      if (nextLi !== -1 && nextLi !== li) {
        li = nextLi
      }
    }, 100)

    return () => {
      clearInterval(interval)
      musicControl?.dispose()
    }
  })
</script>

<svelte:window onclick={() => musicControl?.ready()} onkeydown={() => musicControl?.ready()}/>

<PlayerAppBar song={data.song} bind:settings showRomajiOnError={false} isKaraoke={true} />

<div class="vbox p-content py-4 gap-2 mfg-on-surface-variant">
  {#if data.audioData.vocalsUrl}
    <div class="hbox gap-4 items-center">
      <div class="i-material-symbols:mic-rounded text-2xl"></div>
      <input type="range" min="0" max="100" bind:value={vocalsVolume} class="flex-1" />
      <div class="w-12 text-right">{vocalsVolume}%</div>
    </div>
  {:else}
    <div class="text-center text-sm opacity-70">
      未检测到人声分离音轨，无法调节人声音量。请先在歌曲详情页进行处理。
    </div>
  {/if}
</div>

<Lyrics lines={processedLrc} currentLineIndex={li} {settings} {states} />
