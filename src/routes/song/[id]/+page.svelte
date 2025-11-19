<script lang="ts">
  import AppBar from "../../../components/appbar/AppBar.svelte";
  import type { PageProps } from "./$types"
  import { LinearProgress } from "m3-svelte";
  import { onMount, tick } from "svelte";
  import { typingSettingsDefault, type LyricSegment } from "../../../shared/types.ts";
  import { isKana, isKanji, toHiragana, toKatakana, toRomaji } from "wanakana";
  import { composeList, fuzzyEquals, processLrcLine, type ProcLrcLine, type ProcLrcSeg } from "./IMEHelper.ts";
  import MenuItem from "../../../components/material3/MenuItem.svelte";
  import "../../../shared/ext.ts"
  import { API } from "$lib/client.ts";
  import { animateCaret } from "./animation.ts";
  import { goto } from '$app/navigation';
    import { artistAndAlbum } from "../../../shared/tools.ts";

  let { data }: PageProps = $props()

  // Current word and line index
  let wi = $state(0)
  let li = $state(0)

  let hiddenInput: HTMLInputElement
  let inp = $state("")

  // Settings stored in user data
  let settings = $state(data.user.data?.typingSettings ?? typingSettingsDefault)
  $effect(() => { API.saveUserData({ typingSettings: settings }) })
  const _preprocessKana = (kana: string) => settings.allKata ? toKatakana(kana) : kana
  const preprocessKana = (kana: string, state?: string) => (settings.showRomaji || (settings.showRomajiOnError && state === 'wrong')) ? `<ruby>${_preprocessKana(kana)}<rt>${toRomaji(kana)}</rt></ruby>` : _preprocessKana(kana)

  // Process each line into segments with swi (start word index) and kanji/kana
  let processedLrc: ProcLrcLine[] = data.lrc.map(line => processLrcLine(line.lyric))

  // State tracking for each kana character: UNSEEN, RIGHT, WRONG
  let states = $state(processedLrc.map(line => new Array(line.totalLen).fill('unseen')))
  const allStates = (l: number, seg: ProcLrcSeg) => states[l].slice(seg.swi, seg.swi + seg.kana.length)
  const getKanjiState = (l: number, seg: ProcLrcSeg) => {
    let sts = allStates(l, seg)
    if (sts.every(s => s === 'right')) return 'right'
    if (sts.some(s => s === 'wrong')) return 'wrong'
    return 'typing'
  }

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

    const interval = setInterval(() => { if (startTime) now = Date.now() }, 1000)
    return () => {
      clearInterval(interval)
      hiddenInput?.removeEventListener('blur', onBlur)
    }
  })

  // On input changed: Convert to hiragana, compare with current position, update states
  function inputChanged(input: string, isComposed: boolean) {
    if (!startTime && input) startTime = Date.now()
    console.log(`input changed: ${input}`)
    // Convert to hiragana
    inp = toHiragana(inp, { IMEMode: true })
    const imeUsed = input !== inp

    function findLoc() {
      let cLine = processedLrc[li]
      let cSeg = cLine.parts.find(seg => wi >= seg.swi && wi < seg.swi + seg.kana.length)!
      let exp = cSeg.kana[wi - cSeg.swi]
      return { cLine, cSeg, exp }
    }

    function incr(cLine: ProcLrcLine) {
      wi += 1
      if (wi >= cLine.totalLen) {
        li += 1;
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
      if (res === 'wrong' && !imeUsed && !isComposed && composeList.includes(exp)) return // Need to compose, stop here
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
    while (findLoc().let(({ exp, cLine }) => !isKana(exp) && !isKanji(exp) && incr(cLine)));

    // Prevent IME stuck
    if (imeUsed && inp && !isKana(inp[0]) && inp.split('').some(c => isKana(c)) ) {
      console.log("Clearing input to prevent IME stuck")
      inp = ""
    }
  }

  $effect(() => inputChanged(inp, false))

  // Caret: Typing indicator
  let caret: HTMLDivElement
  $effect(() => { li; wi; animateCaret(caret) })

  // Result is stored on the server and is fetched from a separate results page
  async function submitResult() {
    const res = await API.saveResult({
      songId: data.raw.id,
      endTime: Date.now(),
      realTimeFactor: (Date.now() - startTime) / (data.raw.dt / 1000),
      totalTyped, totalRight, startTime, statsHistory
    })
    goto(`/results/${res.id}`)
  }
</script>

<AppBar title={data.brief.name} sub={artistAndAlbum(data.brief)}>
  <MenuItem textIcon="あ" onclick={() => settings.isFuri = !settings.isFuri}>{settings.isFuri ? "隐藏" : "显示"}假名标注</MenuItem>
  <MenuItem textIcon="カ" onclick={() => settings.allKata = !settings.allKata}>{settings.allKata ? "恢复平假名" : "全部转换为片假名"}</MenuItem>
  <MenuItem icon="i-material-symbols:language-japanese-kana-rounded" onclick={() => settings.showRomaji = !settings.showRomaji}>{settings.showRomaji ? "隐藏罗马音" : "显示罗马音"}</MenuItem>
  <MenuItem icon="i-material-symbols:error-circle-rounded" onclick={() => settings.showRomajiOnError = !settings.showRomajiOnError}>{settings.showRomajiOnError ? "不在错误时显示罗马音" : "错误时显示罗马音"}</MenuItem>
</AppBar>

<LinearProgress percent={progress} />


<input bind:this={hiddenInput} oncompositionend={() => inputChanged(inp, true)} bind:value={inp} class="absolute opacity-0 top-[-9999px] left-[-9999px]" />

<!-- Stats -->
<div class="vbox p-content py-12px mfg-on-surface-variant m3-font-body-medium">
  <div class="hbox justify-between">
    <div>速度: {startTime ? Math.round(totalTyped / (Math.max(1, (now - startTime)) / 60000)) : '-'} cpm</div>
    <div>正確率: {totalTyped === 0 ? 100 : Math.round((totalRight / totalTyped) * 100)}%</div>
  </div>
  <div class="hbox justify-between">
    <div>正确：{flat.filter(s => s === 'right').length}</div>
    <div>模糊：{flat.filter(s => s === 'fuzzy').length}</div>
    <div>错误：{flat.filter(s => s === 'wrong').length}</div>
    <div>剩余：{flat.filter(s => s === 'unseen').length}</div>
  </div>
</div>

<!-- Lines -->
<div class="lrc-wrapper flex-1 overflow-y-auto" lang="ja-JP">
  <div class="vbox gap-12px py-32px relative min-h-full lrc-content">
    <div bind:this={caret} class="absolute bg-amber w-2px h-24px transition-all duration-75 z-10"></div>
    {#each processedLrc as line, l}
      <div class="lrc p-content text-center m3-font-body-large" class:active={l === li} role="button" tabindex="0"
        onclick={() => hiddenInput.focus()} 
        onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); hiddenInput.focus(); } }}>
        {#each line.parts as seg}
          {#if !seg.kanji}
            {#each seg.kana as char, c}
              <span class="{states[l][seg.swi + c]}" class:here={l === li && wi === seg.swi + c}
                class:punctuation={!isKana(char) && !isKanji(char)}>
                {@html preprocessKana(char, states[l][seg.swi + c])}
              </span>
            {/each}
          {:else}
            <ruby>
              <span class="{getKanjiState(l, seg)}">{seg.kanji}</span>{#if settings.isFuri}<rt>
                {#each seg.kana as char, c}
                  <span class="{states[l][seg.swi + c]}" class:here={l === li && wi === seg.swi + c}>{@html preprocessKana(char, states[l][seg.swi + c])}</span>
                {/each}
              </rt>{/if}
            </ruby>
          {/if}
        {/each}
      </div>
    {/each}
  </div>
</div>

<style lang="sass">
  .lrc-wrapper
    *
      transition: font-size 0.2s ease-in-out

  .lrc
    color: #8b8b8b
    font-weight: 500
    font-size: 20px
    opacity: 0.6
    transition: all 0.2s ease-in-out

    &.active
      opacity: 1
      font-size: 24px
      color: rgb(var(--m3-scheme-on-surface))
      //background-color: rgba(var(--m3-scheme-secondary-container) / 0.5)

  .wrong
    color: #e55757
    background-color: rgba(229, 87, 87, 0.1)
  .fuzzy
    color: #e5a657
    background-color: rgba(229, 166, 87, 0.1)
  .right
    color: #7b78c2
  .punctuation
    opacity: 0.5
</style>