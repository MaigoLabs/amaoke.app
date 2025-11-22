<script>
  import AppBar from "$lib/ui/appbar/AppBar.svelte";
  import Button from "$lib/ui/Button.svelte";
  import { getI18n } from "$lib/i18n";

  const t = getI18n().errorPage;
</script>

<main> 
  <AppBar title={t.title} />
  <div class="p-content error-page__content">
    <p class="error-page__text" >{@html t.message}</p>
    <div class="error-page__button-container">
      <a href="/">
        <Button class="error-page__button">{t.return}</Button>
      </a>
    </div>
  </div>
</main>
