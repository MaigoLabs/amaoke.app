<script lang="ts">
  import type { PageProps } from "./$types"
  import { LinearProgress } from "m3-svelte"
  import { onMount } from "svelte"
  import { typingSettingsDefault } from "$lib/types.ts"
  import { isKana, isKanji, toHiragana } from "wanakana"
  import { composeList, fuzzyEquals, processLrcLine, dedupLines, isEnglish, type ProcLrcLine, composeMap } from "$lib/ui/player/IMEHelper.ts"
  import "$lib/ext.ts"
  import { API } from "$lib/client.ts"
  import { goto } from '$app/navigation'
  import { MusicControl } from "$lib/ui/player/MusicControl.ts"
  import Lyrics from "$lib/ui/player/Lyrics.svelte"
  import PlayerAppBar from "$lib/ui/player/PlayerAppBar.svelte"
  import { getI18n } from "$lib/i18n"
  import { UserDataSync } from "$lib/ui/player/state.svelte"

  const t = getI18n().song.play

  let { data }: PageProps = $props()

  // Current word and line index
  let wi = $state(0)
  let li = $state(0)

  let hiddenInput: HTMLInputElement
  let inp = $state("")

  // Settings stored in user data
  const ud = new UserDataSync(data)

  // Process each line into segments with swi (start word index) and kanji/kana
  const isHideRepeated = $derived(ud.settings.hideRepeated && !data.audioUrl)
  let deduplicatedLyrics = $derived(dedupLines(data.lrc, isHideRepeated))
  let processedLrc: ProcLrcLine[] = $derived(deduplicatedLyrics.map(line => processLrcLine(line.lyric)))
  // State tracking for each kana character: UNSEEN, RIGHT, WRONG
  // svelte-ignore state_referenced_locally
  let states = $state(processedLrc.map(line => new Array(line.totalLen).fill('unseen')))
  
  let musicControl: MusicControl | undefined
  $effect(() => { li; musicControl?.updateLine(li) })

  // Reset when processedLrc changes (settings changed)
  $effect(() => {
    states = processedLrc.map(line => new Array(line.totalLen).fill('unseen'))
    li = 0; wi = 0; inp = ""; startTime = 0; statsHistory = []
  })

  // For computing stats
  let startTime = $state(0)
  let now = $state(Date.now())
  let statsHistory = $state<{ t: number, cpm: number, acc: number }[]>([])

  // Computed stats
  let flat = $derived(states.flat())
  let progress = $derived(Math.min(100, Math.floor((flat.filter(s => s !== 'unseen').length / flat.length) * 100)))
  let totalTyped = $derived(flat.filter(s => s !== 'unseen').length)
  let totalRight = $derived(flat.filter(s => s === 'right' || s === 'fuzzy').length)

  onMount(() => {
    // Auto focus & refocus
    hiddenInput.focus()
    const onBlur = () => setTimeout(() => hiddenInput?.focus(), 10)
    hiddenInput.addEventListener('blur', onBlur)

    if (data.audioUrl) {
      musicControl = new MusicControl(data.audioUrl.url)
      musicControl.setLyrics(deduplicatedLyrics)
      musicControl.start()
    }

    const interval = setInterval(() => { if (startTime) now = Date.now() }, 1000)
    return () => {
      clearInterval(interval)
      hiddenInput?.removeEventListener('blur', onBlur)
      musicControl?.dispose()
    }
  })

  // On input changed: Convert to hiragana, compare with current position, update states
  function inputChanged(input: string, isComposed: boolean) {
    if (!processedLrc[li] || !states[li]) return
    if (!startTime && input) startTime = Date.now()
    console.log(`input changed: ${input}`)
    // Convert to hiragana
    inp = toHiragana(inp.replaceAll(' ', ''), { IMEMode: true })
    const imeUsed = input !== inp

    // Prevent IME stuck (If the user enters "yto" -> "yと", the "y" should be ignored)
    if (imeUsed && inp && !isKana(inp[0]) && inp.split('').some(c => isKana(c)) ) {
      while (inp && !isKana(inp[0])) inp = inp.slice(1)
    }

    function findLoc() {
      let cLine = processedLrc[li]
      let cSeg = cLine.parts.find(seg => wi >= seg.swi && wi < seg.swi + seg.kana.length)!
      let exp = cSeg.kana[wi - cSeg.swi]
      return { cLine, cSeg, exp }
    }

    function incr(cLine: ProcLrcLine) {
      wi += 1
      if (wi >= cLine.totalLen) {
        li += 1
        wi = 0
        if (li >= processedLrc.length) submitResult()
      }
      return true
    }

    // While it has kana or kanji, pop from input
    while (inp && (isKana(inp[0]) || isKanji(inp[0]))) {
      let char = inp[0]

      // Check if it matches current character
      let { cLine, cSeg, exp } = findLoc()
      let res = fuzzyEquals(char, exp)
      // Need to compose, stop here
      if (res !== 'right' && !imeUsed && !isComposed && composeList.includes(exp) && composeMap.get(exp) === char) return
      states[li][wi] = res

      // Record stats
      const elapsed = (Date.now() - startTime) / 60000
      const cpm = totalTyped / elapsed
      const acc = (totalRight / totalTyped) * 100
      statsHistory.push({ t: Date.now(), cpm, acc })

      // Move index
      incr(cLine)
      inp = inp.slice(1)
    }

    // Check next expected character, if it's neither kana nor kanji, skip it
    while (findLoc().let(({ exp, cLine, cSeg }) => {
      const isPunctuation = !isKana(exp) && !isKanji(exp)
      const isIgnoredEnglish = ud.settings.ignoreEnglish && isEnglish(cSeg.kanji)
      return (isPunctuation || isIgnoredEnglish) && incr(cLine)
    })) {}
  }
  $effect(() => inputChanged(inp, false))

  // Result is stored on the server and is fetched from a separate results page
  async function submitResult() {
    const res = await API.saveResult({
      songId: data.song.id,
      endTime: Date.now(),
      realTimeFactor: data.song.dt / (Date.now() - startTime),
      totalTyped, totalRight, startTime, statsHistory
    })

    if (ud.loc) {
      ud.loc.isFinished = true
      ud.loc.lastResultId = res.id
      await API.saveUserData({ loc: ud.loc })
    }

    goto(`/results/${res.id}`, { replaceState: true })
  }
</script>

<svelte:window onclick={() => musicControl?.ready()} onkeydown={() => musicControl?.ready()}/>

<PlayerAppBar song={data.song} bind:settings={ud.settings} bind:loc={ud.loc} disableHideRepeated={!!data.audioUrl} playlist={data.playlist} />

<LinearProgress percent={progress} />


<input bind:this={hiddenInput} oncompositionend={() => inputChanged(inp, true)} bind:value={inp} class="absolute opacity-0 top-[-9999px] left-[-9999px]" />

<!-- Stats -->
<div class="vbox p-content py-12px mfg-on-surface-variant m3-font-body-medium">
  <div class="hbox justify-between">
    <div>{t.speed}{startTime ? Math.round(totalTyped / (Math.max(1, (now - startTime)) / 60000)) : '-'} cpm</div>
    <div>{t.accuracy}{totalTyped === 0 ? 100 : Math.round((totalRight / totalTyped) * 100)}%</div>
  </div>
  <div class="hbox justify-between">
    <div>{t.stats.right}{flat.filter(s => s === 'right').length}</div>
    <div>{t.stats.fuzzy}{flat.filter(s => s === 'fuzzy').length}</div>
    <div>{t.stats.wrong}{flat.filter(s => s === 'wrong').length}</div>
    <div>{t.stats.remaining}{flat.filter(s => s === 'unseen').length}</div>
  </div>
</div>

<!-- Lines -->
<Lyrics lines={processedLrc} currentLineIndex={li} currentWordIndex={wi} {states} settings={ud.settings} showCaret={true} onLineClick={() => hiddenInput.focus()} />