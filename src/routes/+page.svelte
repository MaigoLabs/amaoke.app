<script lang="ts">
  import AppBar from "$lib/ui/appbar/AppBar.svelte"
  import TitleHeader from "$lib/ui/TitleHeader.svelte"
  import SongInfo from "$lib/ui/listitem/SongInfo.svelte"
  import type { PageProps } from "./$types"
  import Button from "$lib/ui/Button.svelte"
  import { Layer } from "m3-svelte"
  import { goto } from "$app/navigation"
  import { getI18n, setLanguage } from "$lib/i18n"

  let { data }: PageProps = $props()

  const t = getI18n().home

  console.log(data.recPlaylists)

  const loc = data.user.data.loc
  const href = loc?.isFinished && loc?.lastResultId ? `/results/${loc.lastResultId}` : `/song/${data.last?.id}`
</script>


<AppBar account={() => goto('/user')} right={[
  // {icon: "i-material-symbols:settings-rounded", onclick: () => alert('Settings clicked')}
  // Language switching button
  {icon: "i-material-symbols:translate-rounded", onclick: () => {
    setLanguage(data.lang === 'en' ? 'zh' : 'en')
  }}
]} />

<div class="vbox gap-16px overflow-y-auto flex-1">
  {#if data.last}
    <a {href}>
      <TitleHeader title={t.titles.continue}/>
      <div class="p-content">
        <SongInfo info={data.last}></SongInfo>
      </div>
    </a>
  {/if}

  <!-- <div>
    <TitleHeader title={t.titles.history}/>
    <div class="p-content">
      TODO
    </div>
  </div> -->

  <div>
    <a href="/playlists/my"><TitleHeader title={t.titles.myPlaylists}/></a>
    <div class="p-content hbox gap-8px w-auto overflow-x-auto py-8px">
      {#each data.myPlaylists as playlist}
        <a class="vbox flex-shrink-0 gap-4px w-96px relative" href="/playlist/{playlist.id}">
          <div class="relative rounded-16px overflow-hidden">
            <img src="{playlist.coverImgUrl}" alt="" class="size-96px">
            <Layer/>
          </div>
          <div class="m3-font-label-large truncate">{playlist.name}</div>
        </a>
      {/each}
    </div>
    <div class="p-content">
      <a href="/import/netease"><Button icon="i-material-symbols:cloud-download-outline">{t.btn.importFromNetease}</Button></a>
    </div>
  </div>

  <div>
    <a href="/playlists/rec"><TitleHeader title={t.titles.recPlaylists}/></a>
    <div class="p-content hbox gap-8px w-auto overflow-x-auto py-8px">
      {#each data.recPlaylists as playlist}
        <a class="vbox flex-shrink-0 p-8px gap-8px rounded-12px mbg-surface-container-high relative" href="/playlist/{playlist.id}">
          <Layer/>
          <img src="{playlist.coverImgUrl}" alt="" class="size-116px rounded-8px">
          <div>
            <div class="m3-font-title-small font-bold truncate">{playlist.name}</div>
            <div class="m3-font-body-small truncate">{t.text.playlistCreatedBy.sed({u: playlist.creator.nickname})}</div>
          </div>
        </a>
      {/each}
    </div>
  </div>
</div>