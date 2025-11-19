<script lang="ts">
  import { LinearProgress, TextField, TextFieldOutlined } from "m3-svelte";
  import AppBar from "../../../components/appbar/AppBar.svelte";
  import Button from "../../../components/Button.svelte";
    import type { NeteaseSongBrief } from "../../../shared/types";
    import type { PageProps } from "./$types";

  let link = $state('')

  interface SongImportStatus {
    song: NeteaseSongBrief
    status: 'importing' | 'success' | 'failed-not-japanese' | 'failed-unknown'
  }

  let { data }: PageProps = $props()

  let status = $state<'idle' | 'importing' | 'success' | 'error'>('importing')
  let songs = $state(data.playlist.songs.map(song => ({ song, status: 'importing' })))
  let progress = $derived({
    total: songs.length,
    done: songs.filter(song => song.status === 'success').length
  })

  function statusToIcon(stat: string): string {
    switch (stat) {
      case 'importing': return 'i-material-symbols:sync'
      case 'success': return 'i-material-symbols:check'
      case 'failed-not-japanese': return 'i-material-symbols:warning'
      case 'failed-unknown': return 'i-material-symbols:error'
    }
    return ''
  }
</script>

<AppBar title="从网易云导入"/>

<div class="vbox gap-16px flex-1 min-h-0">
  <div class="m3-font-body-medium mfg-on-surface-variant py-12px p-content">
    去网易云 APP 找一个你喜欢的日本语歌单，点击分享，再点击复制链接，然后把链接粘贴到这里就可以开始导入了！
  </div>
  <div class="vbox p-content">
    <TextFieldOutlined label="网易云歌单链接 / ID" bind:value={link} />
  </div>

  {#if status === 'importing'}
    <div class="hbox gap-12px items-end! h-48px p-content">
      <div class="m3-font-headline-small">正在导入</div>
      <div class="m3-font-label-small pb-3px">{progress.done} / {progress.total} 首歌曲</div>
    </div>
    <LinearProgress percent={progress.done / progress.total * 100}/>
  {/if}

  <div class="vbox self-stretch flex-1 overflow-y-auto p-content min-h-0 gap-8px">
    {#if status !== 'idle'}
      {#each songs as song}
        <div class="hbox gap-12px">
          <span class={statusToIcon(song.status)}></span>
          <span class="m3-font-title-large">{song.song.name}</span>
        </div>
      {/each}
    {/if}
  </div>

  <div class="py-16px p-content">
    <Button big icon="i-material-symbols:download">开始导入</Button>
  </div>
</div>