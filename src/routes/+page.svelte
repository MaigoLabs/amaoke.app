<script>
  import { Button } from "m3-svelte"
  import AppBar from "../components/appbar/AppBar.svelte";
</script>


<AppBar account={() => alert('Account clicked')} settings={() => alert('Settings clicked')} />
