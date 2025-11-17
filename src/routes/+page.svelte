<script lang="ts">
  import AppBar from "../components/appbar/AppBar.svelte";
  import TitleHeader from "../components/TitleHeader.svelte";
  import SongInfo from "../components/SongInfo.svelte";
  import type { PageProps } from "./$types";

  let { data }: PageProps = $props()
</script>


<AppBar account={() => alert('Account clicked')} settings={() => alert('Settings clicked')} />

<div class="vbox gap-16px">
  {#if data.last}
    <div>
      <TitleHeader title="从暂停的位置继续"/>
      <div class="p-content">
        <SongInfo info={data.last}></SongInfo>
      </div>
    </div>
  {/if}

  <div>
    <TitleHeader title="我的歌单"/>
    <div class="p-content">
      TODO
    </div>
  </div>
</div>