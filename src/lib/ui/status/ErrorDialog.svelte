<script lang="ts">
    import Dialog from "./Dialog.svelte";
    import { getI18n } from "$lib/i18n"

  let p: {
    error?: string
  } = $props()

  const t = getI18n().dialog.error

  let open = $derived(!!p.error)
</script>

<Dialog title={t.title} bind:open buttons={[{
  text: t.refresh,
  onclick: () => location.reload()
}]} noClose>
  <div class="text-red-500">
    {p.error}
  </div>
</Dialog>
