<script>
  import AppBar from "$lib/ui/appbar/AppBar.svelte";
  import Button from "$lib/ui/Button.svelte";
  import { getI18n } from "$lib/i18n";

  const t = getI18n().errorPage;
</script>
 
<AppBar title={t.title} />
<div class="vbox p-content flex-1">
  <p class="mt-12px scroll-here">{@html t.message}</p>
  <div class="py-16px">
    <a href="/">
      <Button big>{t.return}</Button>
    </a>
  </div>
</div>
