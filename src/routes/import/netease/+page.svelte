<script lang="ts">
  import { TextFieldOutlined } from "m3-svelte"
  import AppBar from "$lib/ui/appbar/AppBar.svelte"
  import Button from "$lib/ui/Button.svelte"
  import type { NeteaseSong } from "$lib/types"
  import { API } from "$lib/client"
  import ErrorDialog from "$lib/ui/status/ErrorDialog.svelte"
  import ProgressList from "$lib/ui/ProgressList.svelte"
  import { getI18n } from "$lib/i18n"
  import { page } from '$app/state'

  const t = getI18n().import.netease

  let link = $state(page.url.searchParams.get('id') ?? '')
  let isUpdate = $derived(!!page.url.searchParams.get('id'))

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

  let listTitle = $derived(status === 'idle' ? '' : (status === 'importing' ? t.status.importing : (status === 'success' ? t.status.success : t.status.error)))
  let listSubtitle = $derived(`${progress.done} / ${progress.total} ${t.songs}`)
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

<AppBar title={t.title}/>

<ErrorDialog error={error} />

<div class="vbox gap-16px flex-1 min-h-0">
  <div class="m3-font-body-medium mfg-on-surface-variant py-12px p-content">
    {t.tip}
  </div>
  <div class="vbox p-content">
    <TextFieldOutlined label={t.inputLabel} bind:value={link} />
  </div>

  <ProgressList title={listTitle} subtitle={listSubtitle} percentage={listPercent} items={listItems} />

  <div class="py-16px p-content">
    {#if status === 'idle'}
      <Button big icon={isUpdate ? "i-material-symbols:sync" : "i-material-symbols:download"} onclick={startImport}>{isUpdate ? t.btnUpdate : t.btnStart}</Button>
    {:else if status === 'success'}
      <a href="/playlist/{id}">
        <Button big icon="i-material-symbols:right-arrow">{t.btnView}</Button>
      </a>
    {/if}
  </div>
</div>