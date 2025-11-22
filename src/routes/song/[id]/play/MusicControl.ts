import * as Tone from 'tone'
import type { LyricLine } from '$lib/types'

export class MusicControl {
  player: Tone.Player
  lyrics: LyricLine[] = []
  currentLineIndex: number = 0
  checkInterval: any
  isLoaded = false

  audioUrl: string

  constructor(audioUrl: string) {
    this.audioUrl = audioUrl
    this.player = new Tone.Player(audioUrl).toDestination()
  }

  log(msg: string) {
    console.log(`%c[MusicControl] ${msg}`, 'color: red')
  }

  setLyrics(lyrics: LyricLine[]) {
    this.lyrics = lyrics
  }

  updateLine(index: number) {
    this.log(`updateLine: ${index}`)
    this.currentLineIndex = index
    if (Tone.getTransport().state === 'paused') {
      Tone.getTransport().start()
    }
  }

  async ready() {
    if (Tone.getContext().state !== 'running') {
      await Tone.start()
      this.log(`Tone started! Context state: ${Tone.getContext().state}`)
    }
  }

  async start() {
    this.log('start() called')
    await this.ready().catch(e => this.log(`Tone.start() failed: ${e}`))

    if (!this.player.loaded) {
      this.log('Loading audio...')
      await this.player.load(this.audioUrl)
      this.log('Audio loaded')
    }

    // Sync player to transport and schedule start at 0
    // We do this regardless of transport state to ensure it's scheduled
    this.player.sync().start(0)

    if (Tone.getTransport().state !== 'started') {
      this.log('Starting Transport')
      Tone.getTransport().start()
    }
    this.startCheckLoop()
  }

  startCheckLoop() {
    if (this.checkInterval) return
    this.checkInterval = setInterval(() => this.check(), 50)
  }

  check() {
    if (Tone.getTransport().state !== 'started') return
    const ct = Tone.getTransport().seconds
    const ni = this.currentLineIndex + 1
    if (ni >= this.lyrics.length) return
    const nt = this.parseTime(this.lyrics[ni].time)
    if (ct >= nt) {
      this.log(`Current time: ${ct.toFixed(2)}, Next line time: ${nt.toFixed(2)}, Pausing!`)
      Tone.getTransport().pause()
    }
  }

  parseTime(timeStr: string): number {
    // mm:ss.xx or mm:ss.xxx
    // Example: 00:12.34
    const match = timeStr.match(/(\d+):(\d+(\.\d+)?)/)
    if (match) {
      const min = parseFloat(match[1])
      const sec = parseFloat(match[2])
      return min * 60 + sec
    }
    this.log(`Invalid time string: ${timeStr}`)
    return 0
  }

  dispose() {
    if (this.checkInterval) clearInterval(this.checkInterval)
    this.player.dispose()
    Tone.getTransport().stop()
    Tone.getTransport().cancel()
  }
}
