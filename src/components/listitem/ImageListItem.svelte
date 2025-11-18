<script lang="ts">
  let { photoUrl, title, text }: { photoUrl: string; title: string; text: string } = $props();
</script>

<div class="hbox gap-16px">
  <img class="rounded-16px size-68px" src={photoUrl} alt={title} />
  <div class="vbox flex-1 min-w-0">
    <div class="m3-font-title-large truncate">{title}</div>
    <div class="hbox w-full">
      <div class="m3-font-body-medium m3-color-on-surface-variant truncate">{text}</div>
    </div>
  </div>
</div>