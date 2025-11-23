<script>
  import AppBar from "$lib/ui/appbar/AppBar.svelte";
  import Button from "$lib/ui/Button.svelte";
  import { getI18n } from "$lib/i18n";

  const t = getI18n().errorPage;
</script>
 
<AppBar title={t.title} />
<div class="p-content">
  <p class="mt-12px">{@html t.message}</p>
  <div class="absolute bottom-16px inset-x-16px">
    <a href="/">
      <Button big>{t.return}</Button>
    </a>
  </div>
</div>
