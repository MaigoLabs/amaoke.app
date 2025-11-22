<script lang="ts">
  import { TextFieldOutlined } from "m3-svelte"
  import AppBar from "$lib/ui/appbar/AppBar.svelte"
  import Button from "$lib/ui/Button.svelte"
  import type { NeteaseSong } from "$lib/types"
  import { API } from "$lib/client"
  import ErrorDialog from "$lib/ui/status/ErrorDialog.svelte"
  import ProgressList from "$lib/ui/ProgressList.svelte"

  let link = $state('')

  interface SongImportStatus {
    song: NeteaseSong
    status: 'importing' | 'success' | 'failed-not-japanese' | 'failed-unknown'
  }

  let status = $state<'idle' | 'importing' | 'success' | 'error'>('idle')
  let songs = $state<SongImportStatus[]>([])
  let error = $state('')
  let id = $state('')

  let progress = $derived({
    total: songs.length,
    done: songs.filter(song => song.status !== 'importing').length
  })

  function statusToIcon(stat: string): string {
    switch (stat) {
      case 'importing': return 'i-material-symbols:sync animate-spin'
      case 'success': return 'i-material-symbols:check text-green-500'
      case 'failed-not-japanese': return 'i-material-symbols:warning text-yellow-500'
      case 'failed-unknown': return 'i-material-symbols:error text-red-500'
    }
    return ''
  }

  let listTitle = $derived(status === 'idle' ? '' : (status === 'importing' ? '正在导入' : (status === 'success' ? '导入完成' : '导入出错')))
  let listSubtitle = $derived(`${progress.done} / ${progress.total} 首歌曲`)
  let listPercent = $derived(progress.total ? progress.done / progress.total * 100 : 0)
  let listItems = $derived(songs.map(song => ({
    title: song.song.name,
    subtitle: song.song.ar.map(a => a.name).join(', '),
    icon: statusToIcon(song.status)
  })))

  async function startImport() {
    if (!link) return
    status = 'importing'
    songs = []

    API.netease.startImport(link)
      .then(data => {
        id = data.playlistId
        songs = data.songs

        const interval = setInterval(() => {
          API.netease.checkProgress(data.id)
            .then(data => {
              songs = data.songs
              if (data.done) {
                clearInterval(interval)
                status = 'success'
              }
            })
            .catch(e => {
              error = e.message
              clearInterval(interval)
            })
        }, 1000)
      })
      .catch(e => error = e.message)
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

  <ProgressList title={listTitle} subtitle={listSubtitle} percentage={listPercent} items={listItems} />

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