<script lang="ts">
  import { artistAndAlbum } from "../../shared/tools.ts";
  import type { NeteaseSong } from "$lib/types.ts";
  import ImageListItem from "./ImageListItem.svelte";

  let { info }: { info: NeteaseSong } = $props();
</script>

<ImageListItem photoUrl={info.al.picUrl} title={info.name} text={artistAndAlbum(info)} />