<script lang="ts">
    import type { PageProps } from './$types';
    import { goto } from '$app/navigation';
    import AppBar from '../../../components/appbar/AppBar.svelte';
    import { artistAndAlbum } from '../../../shared/tools';
    import Button from '../../../components/Button.svelte';

    let { data }: PageProps = $props();
    let { result, lrc } = data;

    // Destructure result for easier access
    let { totalTyped, startTime, endTime, totalRight, statsHistory, songId } = result;
    
    // Calculate duration for display
    let duration = endTime - startTime;

    let fields = [
        { label: '速度', value: Math.round(totalTyped / (Math.max(1, duration) / 60000)) },
        { label: '准确率', value: totalTyped === 0 ? 100 : (Math.round((totalRight / totalTyped) * 10000) / 100) },
        { label: '实时率', value: data.result.realTimeFactor.toFixed(2) + 'x' },
        { label: '字数', value: totalTyped }
    ]
</script>

<AppBar title={data.brief.name} sub={artistAndAlbum(data.brief)}/>

<div class="vbox gap-16px p-content">
  <div class="hbox gap-12px items-end! h-48px">
    <div class="m3-font-headline-small">练习结果</div>
  </div>

  <div class="grid grid-cols-2 gap-16px">
    {#each fields as field}
    <div class="vbox flex-1">
      <div class="m3-font-title-medium mfg-on-surface-variant">{field.label}</div>
      <div class="m3-font-headline-large font-medium mfg-on-surface">{field.value}</div>
    </div>
    {/each}
  </div>

  <!-- Chart -->
  <div class="h-120px w-full bg-surface-container rounded-12px relative overflow-hidden">
      <svg class="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        <!-- Grid lines -->
        {#each [0, 25, 50, 75, 100] as y}
          <line x1="0" y1={y} x2="100" y2={y} stroke="rgba(0,0,0,0.05)" stroke-width="1" />
        {/each}
        
        <!-- Speed Line -->
        {#if statsHistory.length > 1}
        <polyline
          points={statsHistory.map((h: any, i: number) => `${(i / (statsHistory.length - 1)) * 100},${100 - (h.cpm / 300) * 100}`).join(' ')}
          fill="none"
          stroke="#7b78c2"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        
          <!-- Accuracy Line (dashed) -->
          <polyline
          points={statsHistory.map((h: any, i: number) => `${(i / (statsHistory.length - 1)) * 100},${100 - (h.acc / 100) * 100}`).join(' ')}
          fill="none"
          stroke="#e5a657"
          stroke-width="2"
          stroke-dasharray="4"
          stroke-opacity="0.5"
        />
        {/if}
      </svg>
  </div>

  <div class="flex-1"></div>
  
  <div class="hbox justify-end pt-8px">
      <Button onclick={() => goto(`/song/${songId}`)}>下一首</Button>
  </div>
</div>
