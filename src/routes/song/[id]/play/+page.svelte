<script lang="ts">
  import AppBar from "$lib/ui/appbar/AppBar.svelte"
  import type { PageProps } from "./$types"
  import { LinearProgress } from "m3-svelte"
  import { onMount, tick } from "svelte"
  import { typingSettingsDefault, type LyricSegment } from "$lib/types.ts"
  import { isKana, isKanji, toHiragana, toKatakana, toRomaji } from "wanakana"
  import { composeList, fuzzyEquals, processLrcLine, dedupLines, type ProcLrcLine, type ProcLrcSeg } from "./IMEHelper.ts"
  import MenuItem from "$lib/ui/material3/MenuItem.svelte"
  import "$lib/ext.ts"
  import { API } from "$lib/client.ts"
  import { animateCaret } from "./animation.ts"
  import { goto } from '$app/navigation'
  import { artistAndAlbum } from "$lib/utils.ts"
  import { MusicControl } from "./MusicControl.ts"

  let { data }: PageProps = $props()

  // Current word and line index
  let wi = $state(0)
  let li = $state(0)

  let hiddenInput: HTMLInputElement
  let inp = $state("")

  // Settings stored in user data
  let settings = $state(data.user.data?.typingSettings ?? typingSettingsDefault)
  $effect(() => { API.saveUserData({ typingSettings: settings }) })

  // Playlist location state
  let loc = $state(data.user.data.loc)
  $effect(() => { API.saveUserData({ loc }) })

  const _preprocessKana = (kana: string) => settings.allKata ? toKatakana(kana) : kana
  const preprocessKana = (kana: string, state?: string) => (settings.showRomaji || (settings.showRomajiOnError && state === 'wrong')) ? `<ruby>${_preprocessKana(kana)}<rt>${toRomaji(kana)}</rt></ruby>` : _preprocessKana(kana)

  // Process each line into segments with swi (start word index) and kanji/kana
  const isHideRepeated = $derived(settings.hideRepeated && !data.audioUrl)
  let deduplicatedLyrics = $derived(dedupLines(data.lrc, isHideRepeated))
  let processedLrc: ProcLrcLine[] = $derived(deduplicatedLyrics.map(line => processLrcLine(line.lyric)))
  // State tracking for each kana character: UNSEEN, RIGHT, WRONG
  let states = $state(processedLrc.map(line => new Array(line.totalLen).fill('unseen')))
  
  let musicControl: MusicControl | undefined
  $effect(() => { li; musicControl?.updateLine(li) })

  // Reset when processedLrc changes (settings changed)
  $effect(() => {
    states = processedLrc.map(line => new Array(line.totalLen).fill('unseen'))
    li = 0
    wi = 0
    inp = ""
    startTime = 0
    statsHistory = []
  })

  const allStates = (l: number, seg: ProcLrcSeg) => states[l]?.slice(seg.swi, seg.swi + seg.kana.length) ?? []
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
    while (findLoc().let(({ exp, cLine }) => !isKana(exp) && !isKanji(exp) && incr(cLine))) {}
  }
  $effect(() => inputChanged(inp, false))

  // Caret: Typing indicator
  let caret: HTMLDivElement
  $effect(() => { li; wi; animateCaret(caret) })

  // Auto scroll to active line
  let lrcWrapper: HTMLDivElement
  $effect(() => {
    li
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

  // Result is stored on the server and is fetched from a separate results page
  async function submitResult() {
    const res = await API.saveResult({
      songId: data.song.id,
      endTime: Date.now(),
      realTimeFactor: data.song.dt / (Date.now() - startTime),
      totalTyped, totalRight, startTime, statsHistory
    })

    if (loc?.currentPlaylistId) {
      loc.isFinished = true
      loc.lastResultId = res.id
      await API.saveUserData({ loc })
    }

    goto(`/results/${res.id}`, { replaceState: true })
  }
</script>

<!-- Window events -->
<svelte:window onresize={() => caret && animateCaret(caret)} onclick={() => musicControl?.ready()} onkeydown={() => musicControl?.ready()}/>


<AppBar title={data.song.name} sub={artistAndAlbum(data.song)}>
  <MenuItem textIcon="あ" onclick={() => settings.isFuri = !settings.isFuri}>{settings.isFuri ? "隐藏" : "显示"}假名标注</MenuItem>
  <MenuItem textIcon="カ" onclick={() => settings.allKata = !settings.allKata}>{settings.allKata ? "恢复平假名" : "全部转换为片假名"}</MenuItem>
  <MenuItem icon="i-material-symbols:language-japanese-kana-rounded" onclick={() => settings.showRomaji = !settings.showRomaji}>{settings.showRomaji ? "隐藏罗马音" : "显示罗马音"}</MenuItem>
  <MenuItem icon="i-material-symbols:error-circle-rounded" onclick={() => settings.showRomajiOnError = !settings.showRomajiOnError}>{settings.showRomajiOnError ? "不在错误时显示罗马音" : "错误时显示罗马音"}</MenuItem>
  <MenuItem icon="i-material-symbols:compress-rounded" 
    disabled={!!data.audioUrl}
    sub={data.audioUrl ? "音乐模式下不可用" : ""}
    onclick={() => settings.hideRepeated = !settings.hideRepeated}>{isHideRepeated ? "显示重复行" : "隐藏重复行"}</MenuItem>
  {#if loc}
  <MenuItem icon={loc.playMode === 'random' ? "i-material-symbols:shuffle-rounded" : "i-material-symbols:repeat-rounded"} onclick={() =>
    loc.playMode = loc.playMode === 'random' ? 'sequential' : 'random'}>{loc.playMode === 'random' ? "当前：随机播放" : "当前：顺序播放"}</MenuItem>
  {/if}
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
<div bind:this={lrcWrapper} class="lrc-wrapper scroll-here" lang="ja-JP">
  <div class="vbox gap-12px py-32px relative min-h-full lrc-content">
    <div bind:this={caret} class="absolute bg-amber w-2px h-24px transition-all duration-75 z-10"></div>
    {#each processedLrc as line, l}
      <div class="lrc p-content text-center m3-font-body-large" class:active={l === li} role="button" tabindex="0"
        onclick={() => hiddenInput.focus()} 
        onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); hiddenInput.focus() } }}>
        {#each line.parts as seg}
          {#if !seg.kanji}
            {#each seg.kana as char, c}
              <span class="{states[l]?.[seg.swi + c] ?? ''}" class:here={l === li && wi === seg.swi + c}
                class:punctuation={!isKana(char) && !isKanji(char)}>
                {@html preprocessKana(char, states[l]?.[seg.swi + c])}
              </span>
            {/each}
          {:else}
            <ruby>
              <span class="{getKanjiState(l, seg)}">{seg.kanji}</span>{#if settings.isFuri}<rt>
                {#each seg.kana as char, c}
                  <span class="{states[l]?.[seg.swi + c] ?? ''}" class:here={l === li && wi === seg.swi + c}>{@html preprocessKana(char, states[l]?.[seg.swi + c])}</span>
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