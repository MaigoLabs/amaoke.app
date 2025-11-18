<script lang="ts">
  let { photoUrl, title, text, right }: { 
    photoUrl: string; 
    title: string;
    text: string;
    right?: string
  } = $props();
</script>

<div class="hbox gap-16px">
  <img class="rounded-16px size-60px" src={photoUrl} alt={title} />
  <div class="vbox flex-1 min-w-0">
    <div class="m3-font-title-large truncate">{title}</div>
    <div class="m3-font-body-medium m3-color-on-surface-variant hbox w-full justify-between gap-8px">
      <div class="truncate">{text}</div>
      {#if right}
        <div>{right}</div>
      {/if}
    </div>
  </div>
</div>