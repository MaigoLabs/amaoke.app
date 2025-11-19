<script lang="ts">
  import { LinearProgress, TextFieldOutlined } from "m3-svelte"
  import AppBar from "../../../components/appbar/AppBar.svelte"
  import Button from "../../../components/Button.svelte"
  import type { NeteaseSong } from "../../../shared/types"
  import { API } from "../../../lib/client"
    import ErrorDialog from "../../../components/status/ErrorDialog.svelte";

  let link = $state('')

  interface SongImportStatus {
    song: NeteaseSong
    status: 'importing' | 'success' | 'failed-not-japanese' | 'failed-unknown'
  }

  let status = $state<'idle' | 'importing' | 'success' | 'error'>('idle')
  let songs = $state<SongImportStatus[]>([])
  let progress = $derived({
    total: songs.length,
    done: songs.filter(song => song.status !== 'importing').length
  })
  let error = $state('')
  let id = $state('')

  function statusToIcon(stat: string): string {
    switch (stat) {
      case 'importing': return 'i-material-symbols:sync animate-spin'
      case 'success': return 'i-material-symbols:check text-green-500'
      case 'failed-not-japanese': return 'i-material-symbols:warning text-yellow-500'
      case 'failed-unknown': return 'i-material-symbols:error text-red-500'
    }
    return ''
  }

  async function startImport() {
    if (!link) return
    status = 'importing'
    songs = []

    API.netease.startImport(link)
      .catch(e => error = e.message)
      .then(data => {
        id = data.playlistId
        songs = data.songs

        const interval = setInterval(() => {
          API.netease.checkProgress(data.id)
            .catch(e => {
              error = e.message
              clearInterval(interval)
            })
            .then(data => {
              songs = data.songs
              if (data.done) {
                clearInterval(interval)
                status = 'success'
              }
            })
        }, 1000)
      })
  }
</script>

<AppBar title="从网易云导入"/>

<ErrorDialog error={error} />

<div class="vbox gap-16px flex-1 min-h-0">
  <div class="m3-font-body-medium mfg-on-surface-variant py-12px p-content">
    去网易云 APP 找一个你喜欢的日本语歌单，点击分享，再点击复制链接，然后把链接粘贴到这里就可以开始导入了！
  </div>
  <div class="vbox p-content">
    <TextFieldOutlined label="网易云歌单链接 / ID" bind:value={link} />
  </div>

  {#if status !== 'idle'}
    <div class="hbox gap-12px items-end! h-48px p-content">
      <div class="m3-font-headline-small">
        {#if status === 'importing'}正在导入{:else if status === 'success'}导入完成{:else}导入出错{/if}
      </div>
      <div class="m3-font-label-small pb-3px">{progress.done} / {progress.total} 首歌曲</div>
    </div>
    <LinearProgress percent={progress.total ? progress.done / progress.total * 100 : 0}/>
  {/if}

  <div class="vbox self-stretch flex-1 overflow-y-auto p-content min-h-0 gap-8px">
    {#if status !== 'idle'}
      {#each songs as song}
        <div class="hbox gap-12px items-center">
          <span class="{statusToIcon(song.status)} text-xl"></span>
          <div class="vbox">
            <span class="m3-font-title-medium">{song.song.name}</span>
            <span class="m3-font-body-small mfg-on-surface-variant">{song.song.ar.map(a => a.name).join(', ')}</span>
          </div>
        </div>
      {/each}
    {/if}
  </div>

  <div class="py-16px p-content">
    {#if status === 'idle'}
      <Button big icon="i-material-symbols:download" onclick={startImport}>开始导入</Button>
    {:else if status === 'success'}
      <a href="/playlist/{id}">
        <Button big icon="i-material-symbols:right-arrow">查看歌单</Button>
      </a>
    {/if}
  </div>
</div>