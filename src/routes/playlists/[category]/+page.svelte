<script lang="ts">
  import { goto } from "$app/navigation"
  import AppBar from "$lib/ui/appbar/AppBar.svelte"
  import ImageListItem from "$lib/ui/listitem/ImageListItem.svelte"
  import MenuItem from "$lib/ui/material3/MenuItem.svelte"
  import type { PageProps } from "./$types"
  import { getI18n } from "$lib/i18n"

  const t = getI18n().playlist.list

  let { data }: PageProps = $props()
</script>

<AppBar title={data.isMine ? t.mine : t.rec}>
  <MenuItem icon="i-material-symbols:download" onclick={() => goto("/import/netease")}>{t.import}</MenuItem>
</AppBar>

<div class="vbox p-content gap-12px scroll-here">
  {#each data.playlists as pl}
    <a href="/playlist/{pl.id}">
      <ImageListItem photoUrl={pl.coverImgUrl} title={pl.name} text={t.created.sed({u: pl.creator.nickname})} right={t.count.sed({n: pl.trackCount})} />
    </a>
  {/each}
</div>

