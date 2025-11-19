<script lang="ts">
  import AppBar from "../../../components/appbar/AppBar.svelte";
  import type { PageProps } from "./$types"
  import { LinearProgress } from "m3-svelte";
  import { onMount } from "svelte";
  import type { LyricSegment } from "../../../shared/types.ts";
  import { isKana, isKanji, toHiragana } from "wanakana";
  import { composeList, fuzzyEquals } from "./IMEHelper.ts";

  let { data }: PageProps = $props()

  // Current word and line index
  let wi = $state(0)
  let li = $state(0)

  let hiddenInput: HTMLInputElement
  let inp = $state("")

  // Process each line into segments with swi (start word index) and kanji/kana
  type ProcLrcSeg = { swi: number, kanji?: string, kana: string }
  type ProcLrcLine = { parts: ProcLrcSeg[], totalLen: number }
  function processLrcLine(line: LyricSegment[]): ProcLrcLine {
    let result: any[] = line.map(part => (typeof part === "string" ? { kana: part } : { kanji: part[0], kana: part[1] }))
    let swi = 0
    for (let item of result) {
      item['swi'] = swi
      swi += item.kana.length
    }
    return { parts: result, totalLen: swi }
  }
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

  onMount(() => {
    hiddenInput.focus()
  })

  // On input changed: Convert to hiragana, compare with current position, update states
  function inputChanged(input: string, isComposed: boolean) {
    console.log(`input changed: ${input}`)
    // Convert to hiragana
    inp = toHiragana(inp, { IMEMode: true })
    const imeUsed = input !== inp

    // While it has kana or kanji, pop from input
    while (inp && (isKana(inp[0]) || isKanji(inp[0]))) {
      let char = inp[0]

      // Check if it matches current character
      let cLine = processedLrc[li]
      let cSeg = cLine.parts.find(seg => wi >= seg.swi && wi < seg.swi + seg.kana.length)!
      let exp = cSeg.kana[wi - cSeg.swi]
      let res = fuzzyEquals(char, exp)
      if (res === 'wrong' && !imeUsed && !isComposed && composeList.includes(exp)) return // Need to compose, stop here
      states[li][wi] = res

      // Move index
      wi += 1
      if (wi >= cLine.totalLen) { li += 1; wi = 0 }
      inp = inp.slice(1)
    }

    // Prevent IME stuck
    if (imeUsed && inp && !isKana(inp[0]) && inp.split('').some(c => isKana(c)) ) {
      console.log("Clearing input to prevent IME stuck")
      inp = ""
    }
  }

  $effect(() => inputChanged(inp, false))

</script>

<AppBar title={data.brief.name} sub={data.brief.artists.map(a => a.name).join(", ") + " - " + data.brief.album} right={[
  // TODO
  {icon: "i-material-symbols:more-vert", onclick: () => alert('More clicked')}
]} />

<LinearProgress percent={30} />

<input bind:this={hiddenInput} oncompositionend={() => {
  inputChanged(inp, true)
  console.log("Event: input")
}} bind:value={inp} class="absolute opacity-0 top-[-9999px] left-[-9999px]" />

<div class="vbox gap-12px py-32px lrc-wrapper" lang="ja-JP">
  {#each processedLrc as line, l}
    <div class="lrc p-content text-center m3-font-body-large" class:active={l === li} role="button" tabindex="0"
      onclick={() => hiddenInput.focus()} 
      onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); hiddenInput.focus(); } }}>
      {#each line.parts as seg}
        {#if !seg.kanji}
          {#each seg.kana as char, c}
            <span class="{states[l][seg.swi + c]}">{char}</span>
          {/each}
        {:else}
          <ruby>
            <span class="{getKanjiState(l, seg)}">{seg.kanji}</span><rt>
              {#each seg.kana as char, c}
                <span class="{states[l][seg.swi + c]}">{char}</span>
              {/each}
            </rt>
          </ruby>
        {/if}
      {/each}
    </div>
  {/each}
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
</style>