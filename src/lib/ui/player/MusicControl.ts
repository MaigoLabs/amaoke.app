import * as Tone from 'tone'
import type { LyricLine } from '$lib/types'

export class MusicControl {
  player: Tone.Player
  vocalsPlayer?: Tone.Player
  speed: number = 1
  lyrics: LyricLine[] = []
  currentLineIndex: number = 0
  checkInterval: any
  isLoaded = false

  audioUrl: string
  vocalsUrl?: string

  private _lastSpeedChangeTransportTime: number = 0
  private _accumulatedAudioTime: number = 0

  constructor(audioUrl: string, vocalsUrl?: string) {
    this.audioUrl = audioUrl
    this.vocalsUrl = vocalsUrl
    this.audioUrl = audioUrl
    this.vocalsUrl = vocalsUrl
    this.player = new Tone.Player(audioUrl).toDestination()
    if (vocalsUrl) {
      this.vocalsPlayer = new Tone.Player(vocalsUrl).toDestination()
    }
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

    const promises = []
    if (!this.player.loaded) {
      this.log('Loading audio...')
      promises.push(this.player.load(this.audioUrl))
    }
    if (this.vocalsPlayer && !this.vocalsPlayer.loaded) {
      this.log('Loading vocals...')
      promises.push(this.vocalsPlayer.load(this.vocalsUrl!))
    }
    await Promise.all(promises)
    this.log('Audio loaded')

    // Reset time tracking
    this._lastSpeedChangeTransportTime = 0
    this._accumulatedAudioTime = 0

    // Sync player to transport and schedule start at 0
    // We do this regardless of transport state to ensure it's scheduled
    this.player.sync().start(0)
    this.vocalsPlayer?.sync().start(0)

    if (Tone.getTransport().state !== 'started') {
      this.log('Starting Transport')
      Tone.getTransport().start()
    }
    this.startCheckLoop()
  }

  setSpeed(speed: number) {
    // Calculate how much audio time has passed since the last speed change
    const currentTransportTime = Tone.getTransport().seconds
    const transportDelta = currentTransportTime - this._lastSpeedChangeTransportTime
    this._accumulatedAudioTime += transportDelta * this.speed
    
    this._lastSpeedChangeTransportTime = currentTransportTime

    this.speed = speed
    this.player.playbackRate = this.speed
    if (this.vocalsPlayer) {
      this.vocalsPlayer.playbackRate = this.speed
    }
  }

  setVocalsVolume(db: number) {
    if (this.vocalsPlayer) this.vocalsPlayer.volume.value = db
  }

  getTime() {
    const currentTransportTime = Tone.getTransport().seconds
    const transportDelta = currentTransportTime - this._lastSpeedChangeTransportTime
    return this._accumulatedAudioTime + transportDelta * this.speed
  }

  startCheckLoop() {
    if (this.checkInterval) return
    this.checkInterval = setInterval(() => this.check(), 50)
  }

  check() {
    if (Tone.getTransport().state !== 'started') return
    
    // In karaoke mode (dual tracks), we don't pause for typing
    if (this.vocalsPlayer) return

    const ct = this.getTime()
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
    this.vocalsPlayer?.dispose()
    Tone.getTransport().stop()
    Tone.getTransport().cancel()
  }

  togglePlay() {
    if (Tone.getTransport().state === 'started') {
      Tone.getTransport().pause()
    } else {
      Tone.getTransport().start()
    }
  }

  get isPlaying() {
    return Tone.getTransport().state === 'started'
  }
}
