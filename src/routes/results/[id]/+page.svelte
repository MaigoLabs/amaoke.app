<script lang="ts">
  import type { PageProps } from "./$types";
  import { goto } from "$app/navigation";
  import AppBar from "../../../components/appbar/AppBar.svelte";
  import { artistAndAlbum } from "../../../shared/tools";
  import Button from "../../../components/Button.svelte";

  import Chart from "chart.js/auto";

  let { data }: PageProps = $props();
  let { result, lrc } = data;

  // Destructure result for easier access
  let { totalTyped, startTime, endTime, totalRight, statsHistory, songId } = result;

  // Calculate duration for display
  let duration = endTime - startTime;

  let fields = [
    {
      label: "速度",
      value: Math.round(totalTyped / (Math.max(1, duration) / 60000)),
    },
    {
      label: "准确率",
      value:
        totalTyped === 0
          ? 100
          : Math.round((totalRight / totalTyped) * 10000) / 100,
    },
    { label: "实时率", value: data.result.realTimeFactor.toFixed(2) + "x" },
    { label: "字数", value: totalTyped },
  ];

  let chartCanvas: HTMLCanvasElement;
  let chart: Chart;

  $effect(() => {
    if (chartCanvas && statsHistory.length > 0) {
      chart = new Chart(chartCanvas, {
        type: "line",
        data: {
          labels: statsHistory.map((_: any, i: number) => i),
          datasets: [
            {
              label: "速度 (CPM)",
              data: statsHistory.map((h: any) => h.cpm),
              tension: 0.4,
              pointRadius: 0,
              fill: true,
              borderColor: "#7b78c2",
              backgroundColor: "rgba(123, 120, 194, 0.1)",
            },
            {
              label: "准确率 (%)",
              data: statsHistory.map((h: any) => h.acc),
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
              ticks: { display: false }
            },
            y1: {
              position: "right",
              max: 100,
              grid: { display: false },
              ticks: { display: false }
            },
          },
        },
      });
    }

    return () => {
      if (chart) chart.destroy();
    };
  });
</script>

<AppBar title={data.brief.name} sub={artistAndAlbum(data.brief)} />

<div class="vbox gap-16px p-content">
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

  <div class="hbox justify-end pt-8px">
    <Button onclick={() => goto(`/song/${songId}`)}>下一首</Button>
  </div>
</div>
