<script lang="ts">
  import { artistAndAlbum } from "$lib/utils"
  import type { NeteaseSong } from "$lib/types"
  import ImageListItem from "./ImageListItem.svelte"

  let { info }: { info: NeteaseSong } = $props()
</script>

<ImageListItem photoUrl={info.al.picUrl} title={info.name} text={artistAndAlbum(info)} />