<script lang="ts">
  import type { PageProps } from "./$types"
  import { goto } from "$app/navigation"
  import AppBar from "../../../components/appbar/AppBar.svelte"
  import { artistAndAlbum } from "../../../shared/tools"
  import Button from "../../../components/Button.svelte"

  import Chart from "chart.js/auto"
  import { API } from "$lib/client"

  import type { NeteaseSong, UserData } from "../../../shared/types"

  let { data }: PageProps = $props()

  // Destructure result for easier access
  let { totalTyped, startTime, endTime, totalRight, statsHistory, songId } = data.result

  // Calculate duration for display
  let duration = endTime - startTime

  let fields = [
    { label: "速度", value: Math.round(totalTyped / (Math.max(1, duration) / 60000)) },
    { label: "准确率", value: totalTyped === 0 ? 100 : Math.round((totalRight / totalTyped) * 10000) / 100 },
    { label: "实时率", value: data.result.realTimeFactor.toFixed(2) + "x" },
    { label: "字数", value: totalTyped },
    { label: "用时", value: new Date(duration).toISOString().slice(14, 19) },
    { label: "歌曲时长", value: new Date(data.song.dt).toISOString().slice(14, 19) }
  ]

  let chartCanvas: HTMLCanvasElement
  let chart: Chart

  $effect(() => {
    if (chartCanvas && statsHistory.length > 0) {
      chart = new Chart(chartCanvas, {
        type: "line",
        data: {
          labels: statsHistory.map((_: any, i: number) => i),
          datasets: [
            {
              label: "速度 (CPM)",
              data: statsHistory.map((h: { cpm: number }) => h.cpm),
              tension: 0.4,
              pointRadius: 0,
              fill: true,
              borderColor: "#7b78c2",
              backgroundColor: "rgba(123, 120, 194, 0.1)",
            },
            {
              label: "准确率 (%)",
              data: statsHistory.map((h: { acc: number }) => h.acc),
              tension: 0.4,
              yAxisID: "y1",
              pointRadius: 0,
              borderColor: "#e5a657",
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: {
            mode: "index",
            intersect: false,
          },
          plugins: {
            legend: { display: false },
            tooltip: { enabled: true },
          },
          scales: {
            x: { display: false },
            y: {
              position: "left",
              max: 300,
              ticks: { display: false },
              grid: { drawTicks: false }
            },
            y1: {
              position: "right",
              max: 100,
              grid: { drawTicks: false, display: false },
              ticks: { display: false }
            },
          },
        },
      })
    }

    return () => {
      if (chart) chart.destroy()
    }
  })

  // Playlist Navigation Logic
  let nextSongId = $state<number | null>(null)
  let isPlaylistFinished = $state(false)

  const loc = data.user.data.loc
  const playlist = data.playlist
  // Check if this is the latest result for the current playlist session
  const isCurrentResult = loc?.lastResultId === data.result._id

  // Compute next state immediately
  if (playlist && loc && isCurrentResult) {
    if (loc.playMode === 'random') {
      const unplayed = playlist.tracks.filter((t: NeteaseSong) => !loc.playedSongIds.includes(t.id))
      if (unplayed.length > 0) {
        const nextSong = unplayed[Math.floor(Math.random() * unplayed.length)]
        nextSongId = nextSong.id
      } else isPlaylistFinished = true
    } else {
      const nextIndex = loc.currentSongIndex + 1
      if (nextIndex < playlist.tracks.length) {
        nextSongId = playlist.tracks[nextIndex].id
      } else isPlaylistFinished = true
    }
  }

  async function handleNext() {
    if (nextSongId !== null) {
      if (!data.user.data.loc || !data.playlist) return

      const nextIndex = data.playlist.tracks.findIndex((t: NeteaseSong) => t.id === nextSongId)
      
      const newLoc = {
        ...data.user.data.loc,
        currentSongIndex: nextIndex,
        isFinished: false
      }
      
      if (!newLoc.playedSongIds.includes(nextSongId)) {
        newLoc.playedSongIds = [...newLoc.playedSongIds, nextSongId]
      }

      data.user.data.loc = newLoc
      await API.saveUserData({ loc: newLoc })
      goto(`/song/${nextSongId}`, { replaceState: true })
    } else if (isPlaylistFinished) {
      // Clear playlist state
      await API.saveUserData({ loc: null as any })
      goto(`/playlist/${data.playlist!.id}`)
    } else {
      // Restart
      goto(`/song/${songId}`, { replaceState: true })
    }
  }

  let buttonText = $derived(
    nextSongId !== null ? "下一首" :
    isPlaylistFinished ? "返回歌单" :
    "再来一次"
  )
</script>

<AppBar title={data.song.name} sub={artistAndAlbum(data.song)} />

<div class="vbox gap-16px p-content flex-1 overflow-y-auto">
  <div class="hbox gap-12px items-end! h-48px">
    <div class="m3-font-headline-small">练习结果</div>
  </div>

  <div class="grid grid-cols-2 gap-16px">
    {#each fields as field}
      <div class="vbox flex-1">
        <div class="m3-font-title-medium mfg-on-surface-variant">
          {field.label}
        </div>
        <div class="m3-font-headline-large font-medium mfg-on-surface">
          {field.value}
        </div>
      </div>
    {/each}
  </div>

  <!-- Chart -->
  <div class="h-200px w-full bg-surface-container rounded-12px relative overflow-hidden">
    <canvas bind:this={chartCanvas}></canvas>
  </div>

  <div class="flex-1"></div>

  <div class="hbox justify-end pt-8px pb-16px w-full">
    <Button big w-full onclick={handleNext}>{buttonText}</Button>
  </div>
</div>
