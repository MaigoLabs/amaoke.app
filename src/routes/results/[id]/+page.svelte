<script lang="ts">
  import type { PageProps } from "./$types"
  import { goto } from "$app/navigation"
  import AppBar from "$lib/ui/appbar/AppBar.svelte"
  import { artistAndAlbum } from "$lib/utils"
  import Button from "$lib/ui/Button.svelte"

  import Chart from "chart.js/auto"
  import { API } from "$lib/client"
  import { getI18n } from "$lib/i18n"
  import { getNextSong, getNextLoc } from "$lib/ui/player/SongSwitching"

  const t = getI18n().results

  import type { NeteaseSong, UserData } from "../../../lib/types"

  let { data }: PageProps = $props()

  // Destructure result for easier access
  let { totalTyped, startTime, endTime, totalRight, statsHistory, songId } = data.result

  // Calculate duration for display
  let duration = endTime - startTime

  let fields = [
    { label: t.fields.speed, value: Math.round(totalTyped / (Math.max(1, duration) / 60000)), unit: t.units.cpm },
    { label: t.fields.accuracy, value: totalTyped === 0 ? 100 : Math.round((totalRight / totalTyped) * 10000) / 100, unit: t.units.percent },
    { label: t.fields.realtime, value: data.result.realTimeFactor.toFixed(2), unit: t.units.x },
    { label: t.fields.count, value: totalTyped, unit: t.units.char },
    { label: t.fields.time, value: new Date(duration).toISOString().slice(14, 19), unit: "" },
    { label: t.fields.duration, value: new Date(data.song.dt).toISOString().slice(14, 19), unit: "" }
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
              label: t.chart.speed,
              data: statsHistory.map((h: { cpm: number }) => h.cpm),
              tension: 0.4,
              pointRadius: 0,
              fill: true,
              borderColor: "#7b78c2",
              backgroundColor: "rgba(123, 120, 194, 0.1)",
            },
            {
              label: t.chart.accuracy,
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
  const loc = data.user.data.loc
  const playlist = data.playlist
  let nextSongId = $state<number | null>(getNextSong(playlist, loc))
  let isPlaylistFinished = $state(false)

  // Check if this is the latest result for the current playlist session
  const isCurrentResult = loc?.lastResultId === data.resultId

  // Compute next state immediately
  if (playlist && loc && isCurrentResult) {
    if (nextSongId === null) isPlaylistFinished = true
  }

  async function handleNext() {
    if (nextSongId !== null) {
      if (!data.user.data.loc || !data.playlist) return

      const newLoc = getNextLoc(data.playlist, data.user.data.loc, nextSongId)

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
    nextSongId !== null ? t.btn.next :
    isPlaylistFinished ? t.btn.back :
    t.btn.retry
  )
</script>

<AppBar title={data.song.name} sub={artistAndAlbum(data.song)} />

<div class="vbox gap-16px p-content scroll-here">
  <div class="hbox gap-12px items-end! h-48px">
    <div class="m3-font-headline-small">{t.title}</div>
  </div>

  <div class="grid grid-cols-2 gap-16px">
    {#each fields as field}
      <div class="vbox flex-1">
        <div class="m3-font-title-medium mfg-on-surface-variant">
          {field.label}
        </div>
        <div class="hbox items-baseline! gap-4px m3-font-headline-large font-medium mfg-on-surface">
          {field.value}
          {#if field.unit}
            <span class="m3-font-title-medium mfg-on-surface-variant">{field.unit}</span>
          {/if}
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
