<script lang="ts">
  import { tick } from "svelte"
  import { isKana, isKanji, toKatakana, toRomaji } from "wanakana"
  import type { ProcLrcLine, ProcLrcSeg } from "./IMEHelper"
  import type { TypingSettings } from "$lib/types"
  import { animateCaret } from "./animation"

  interface Props {
    lines: ProcLrcLine[]
    currentLineIndex: number
    currentWordIndex?: number
    states?: string[][] // [lineIndex][charIndex] -> state
    settings: TypingSettings
    showCaret?: boolean
    onLineClick?: () => void
  }

  let { 
    lines, 
    currentLineIndex, 
    currentWordIndex = 0, 
    states = [], 
    settings, 
    showCaret = false,
    onLineClick 
  }: Props = $props()

  let lrcWrapper: HTMLDivElement
  let caret: HTMLDivElement

  const _preprocessKana = (kana: string) => settings.allKata ? toKatakana(kana) : kana
  const preprocessKana = (kana: string, state?: string) => (settings.showRomaji || (settings.showRomajiOnError && state === 'wrong')) ? `<ruby>${_preprocessKana(kana)}<rt>${toRomaji(kana)}</rt></ruby>` : _preprocessKana(kana)

  const allStates = (l: number, seg: ProcLrcSeg) => states[l]?.slice(seg.swi, seg.swi + seg.kana.length) ?? []
  const getKanjiState = (l: number, seg: ProcLrcSeg) => {
    let sts = allStates(l, seg)
    if (sts.every(s => s === 'right')) return 'right'
    if (sts.some(s => s === 'wrong')) return 'wrong'
    if (sts.some(s => s === 'fuzzy')) return 'fuzzy'
    return 'typing'
  }

  // Auto scroll
  $effect(() => {
    currentLineIndex
    if (!lrcWrapper) return
    tick().then(() => {
      const activeEl = lrcWrapper.querySelector('.active') as HTMLElement
      if (activeEl) {
        lrcWrapper.scrollTo({
          top: activeEl.offsetTop - lrcWrapper.clientHeight / 2 + activeEl.clientHeight / 2,
          behavior: 'smooth'
        })
      }
    })
  })

  // Caret animation
  $effect(() => {
    if (showCaret && caret) {
      currentLineIndex; currentWordIndex;
      animateCaret(caret)
    }
  })
</script>

<svelte:window onresize={() => { if (showCaret && caret) animateCaret(caret) }} />

<div bind:this={lrcWrapper} class="lrc-wrapper scroll-here" lang="ja-JP">
  <div class="vbox gap-12px py-32px relative min-h-full lrc-content">
    {#if showCaret}
      <div bind:this={caret} class="absolute bg-amber w-2px h-24px transition-all duration-75 z-10"></div>
    {/if}
    {#each lines as line, l}
      <div class="lrc p-content text-center m3-font-body-large" class:active={l === currentLineIndex} role="button" tabindex="0"
        onclick={() => onLineClick?.()} 
        onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onLineClick?.() } }}>
        {#each line.parts as seg}
          {#if !seg.kanji}
            {#each seg.kana as char, c}
              <span class="{states[l]?.[seg.swi + c] ?? ''}" class:here={l === currentLineIndex && currentWordIndex === seg.swi + c}
                class:punctuation={!isKana(char) && !isKanji(char)}>
                {@html preprocessKana(char, states[l]?.[seg.swi + c])}
              </span>
            {/each}
          {:else}
            <ruby>
              <span class="{getKanjiState(l, seg)}">{seg.kanji}</span>{#if settings.isFuri}<rt>
                {#each seg.kana as char, c}
                  <span class="{states[l]?.[seg.swi + c] ?? ''}" class:here={l === currentLineIndex && currentWordIndex === seg.swi + c}>{@html preprocessKana(char, states[l]?.[seg.swi + c])}</span>
                {/each}
              </rt>{/if}
            </ruby>
          {/if}
        {/each}
      </div>
    {/each}
    <div class="h-30vh"></div>
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
