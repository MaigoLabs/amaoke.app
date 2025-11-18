<script lang="ts">
  import type { NeteaseSongBrief } from "../../shared/types.ts";
  import ImageListItem from "./ImageListItem.svelte";

  let { info }: { info: NeteaseSongBrief } = $props();
</script>

<ImageListItem photoUrl={info.albumPic} title={info.name} text={`${info.artists.map(a => a.name).join(", ")} - ${info.album}`} />