<script>
  import AppBar from "$lib/ui/appbar/AppBar.svelte" 
  import { getI18n } from "$lib/i18n";

  const t = getI18n().errorPage;
</script>

<svelte:head>
  <title>404 — Page Not Found</title>
</svelte:head>

<main> 
  
<AppBar title={t.title} >
</AppBar>
  <div class="p-content">
    <p>{@html t.message}</p>
    <a href="/">{t.return}</a>
  </div>
</main>
