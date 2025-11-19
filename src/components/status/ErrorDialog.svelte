<script lang="ts">
    import Dialog from "./Dialog.svelte";

  let p: {
    error?: string
  } = $props()

  let open = $derived(!!p.error)
</script>

<Dialog title="错误" bind:open buttons={[{
  text: "刷新重试",
  onclick: () => location.reload()
}]}>
  <div class="text-red-500">
    {p.error}
  </div>
</Dialog>
