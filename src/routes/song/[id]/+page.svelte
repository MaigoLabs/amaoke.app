<script lang="ts">
  import { API } from "$lib/client"
  import { onMount } from "svelte"
  import Button from "$lib/ui/Button.svelte"
  import AppBar from "$lib/ui/appbar/AppBar.svelte"
  import ProgressList from "$lib/ui/ProgressList.svelte"
  import { goto } from "$app/navigation"
  import { artistAndAlbum } from "$lib/utils"
  import { getI18n } from "$lib/i18n"

  const t = getI18n().song.mode

  let { data } = $props()
  let taskStatus = $state({
    lyrics: false,
    ai: false,
    music: false,
    separation: false
  })

  let modes = $derived([
    { icon: "i-material-symbols:keyboard-rounded", label: t.typing, url: `/song/${data.song.id}/play`, disabled: !taskStatus.lyrics || !taskStatus.ai },
    { icon: "i-material-symbols:music-note-rounded", label: t.music, url: `/song/${data.song.id}/play?music=true`, disabled: !taskStatus.music },
    { icon: "i-material-symbols:mic-rounded", label: t.karaoke, url: `/song/${data.song.id}/karaoke`, disabled: !taskStatus.separation },
  ])

  let loadStatus = $state<"idle" | "loading" | "done">("idle")
  let progressItems = $state<any[]>([])
  let progressPercentage = $state(0)

  onMount(() => {
    startLoading()
  })

  async function startLoading() {
    loadStatus = "loading"
    await API.song.prepare(data.song.id)
    const interval = setInterval(async () => {
      const res = await API.song.status(data.song.id)
      const state = res.status
      
      if (state && state.items) {
          // Update task status
          for (const item of state.items) {
            if (item.progress !== 1) continue
            if (item.id === 'lyrics') taskStatus.lyrics = true
            if (item.id === 'ai') taskStatus.ai = true
            if (item.id === 'music') taskStatus.music = true
            if (item.id === 'separation') taskStatus.separation = true
          }

          progressItems = state.items.map((item: any) => ({
              title: item.task + (item.progress > 0 && item.progress < 1 ? ` (${Math.round(item.progress * 100)}%)` : ''),
              icon: item.progress === 1 ? 'i-material-symbols:check text-green-500' : 
                    item.progress === -1 ? 'i-material-symbols:error text-red-500' : 
                    'i-material-symbols:sync animate-spin'
          }))
          
          const totalProgress = state.items.reduce((acc: number, cur: any) => acc + Math.max(0, cur.progress), 0)
          progressPercentage = Math.min(100, Math.round((totalProgress / 4) * 100))
      }

      if (state.status === "done") {
        clearInterval(interval)
        loadStatus = "done"
        progressPercentage = 100
      } else if (state.status === "error") {
          clearInterval(interval)
      }
    }, 1000)
  }
</script>

<AppBar title={data.song.name} sub={artistAndAlbum(data.song)} />

<ProgressList percentage={progressPercentage} items={progressItems} />

<div class="hbox gap-4 p-16px flex-wrap">
  {#each modes as mode}
    <Button big icon={mode.icon} onclick={() => goto(mode.url)} disabled={mode.disabled} class="!w-auto !min-w-[calc(50%-8px)] grow disabled:opacity-50 disabled:cursor-not-allowed">{mode.label}</Button>
  {/each}
</div>
