<script lang="ts">
  import type { NeteaseSongBrief } from "../shared/types";

  let { info }: { info: NeteaseSongBrief } = $props();
</script>

<div class="hbox gap-16px">
  <img class="rounded-16px size-68px" src={info.albumPic} alt="Album Art" />
  <div class="vbox">
    <div class="m3-font-title-large">{info.name}</div>
    <div class="hbox w-full">
      <div class="m3-font-body-medium m3-color-on-surface-variant">{info.artists.map(a => a.name).join(", ")} - {info.album}</div>
    </div>
  </div>
</div>