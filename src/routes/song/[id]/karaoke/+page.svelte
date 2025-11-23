<script lang="ts">
  import type { PageProps } from "./$types"
  import { onMount } from "svelte"
  import { typingSettingsDefault } from "$lib/types"
  import { processLrcLine, dedupLines, type ProcLrcLine } from "$lib/ui/player/IMEHelper"
  import "$lib/ext.ts"
  import { API } from "$lib/client"
  import { MusicControl } from "$lib/ui/player/MusicControl"
  import Lyrics from "$lib/ui/player/Lyrics.svelte"
  import PlayerAppBar from "$lib/ui/player/PlayerAppBar.svelte"
  import { getI18n } from "$lib/i18n"
    import { Layer } from "m3-svelte";

  const t = getI18n().song.karaoke

  let { data }: PageProps = $props()

  let li = $state(0)
  let settings = $state(data.user.data?.typingSettings ?? typingSettingsDefault)
  $effect(() => { API.saveUserData({ typingSettings: settings }) })

  let loc = $state(data.user.data.loc)
  $effect(() => { API.saveUserData({ loc }) })

  let vocalsVolume = $state(data.user.data.vocalsVolume ?? 100)
  $effect(() => { 
    API.saveUserData({ vocalsVolume })
    data.user.data.vocalsVolume = vocalsVolume
  })
  let speed = $state(1)
  let isPlaying = $state(false)

  // Process lyrics
  const isHideRepeated = $derived(settings.hideRepeated)
  let deduplicatedLyrics = $derived(dedupLines(data.lrc, isHideRepeated))
  let processedLrc: ProcLrcLine[] = $derived(deduplicatedLyrics.map(line => processLrcLine(line.lyric)))
  
  let musicControl = $state<MusicControl>()
  $effect(() => { li; musicControl?.updateLine(li) })

  // Volume, Speed control
  $effect(() => {
    if (musicControl) {
      // Tone.js volume is in decibels. 0 is full, -Infinity is silent.
      // Simple mapping: 100 -> 0, 0 -> -60 (or mute)
      const db = vocalsVolume === 0 ? -Infinity : 20 * Math.log10(vocalsVolume / 100)
      musicControl.setVocalsVolume(db)
      musicControl.setSpeed(speed)
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
        if (time >= lineTime) nextLi = i
        else break
      }
      
      if (nextLi !== -1 && nextLi !== li) li = nextLi
      isPlaying = musicControl.isPlaying
    }, 100)

    return () => {
      clearInterval(interval)
      musicControl?.dispose()
    }
  })
</script>

<svelte:window onclick={() => musicControl?.ready()} onkeydown={() => musicControl?.ready()}/>

<PlayerAppBar song={data.song} bind:settings bind:loc showRomajiOnError={false} isKaraoke={true} disableHideRepeated playlist={data.playlist} />

<div class="vbox p-content py-4 gap-2 mfg-on-surface-variant">
  {#if data.audioData.vocalsUrl}
    <div class="hbox gap-4 items-center">
      <div class="i-material-symbols:mic-rounded text-2xl"></div>
      <input type="range" min="0" max="100" bind:value={vocalsVolume} class="flex-1" />
      <div class="w-12 text-right">{vocalsVolume}%</div>
    </div>
  {:else}
    <div class="text-center text-sm opacity-70">
      {t.noVocals}
    </div>
  {/if}

  <div class="hbox gap-4 items-center">
    <div class="i-material-symbols:speed-rounded text-2xl" title="Speed"></div>
    <input type="range" min="0.5" max="1.5" step="0.05" bind:value={speed} class="flex-1" />
    <div class="w-12 text-right">{speed.toFixed(2)}x</div>
  </div>
</div>

<Lyrics lines={processedLrc} currentLineIndex={li} {settings} {states} />

<button
  class="fixed bottom-6 right-6 z-5 size-64px cbox rounded-full surface-variant mbg-surface-container mfg-on-surface-variant shadow-lg hover:shadow-xl transition-all active:scale-90"
  onclick={() => { musicControl?.togglePlay(); isPlaying = musicControl?.isPlaying ?? false }}
  aria-label="Play/Pause"
>
  <Layer />
  <div class={isPlaying ? "i-material-symbols:pause-rounded text-3xl" : "i-material-symbols:play-arrow-rounded text-3xl"}></div>
</button>
