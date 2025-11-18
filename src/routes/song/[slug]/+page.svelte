<script lang="ts">
  import AppBar from "../../../components/appbar/AppBar.svelte";
  import type { PageProps } from "./$types"

  let { data }: PageProps = $props()
</script>

<AppBar title={data.brief.name} sub={data.brief.artists.map(a => a.name).join(", ") + " - " + data.brief.album} right={[
  // TODO
  {icon: "i-material-symbols:more-vert", onclick: () => alert('More clicked')}
]} />

