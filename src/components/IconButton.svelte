<script lang="ts">
    let { icon, ...rest } = $props();
</script>

<button class="cbox w-48px h-48px" {...rest}>
    <span class="h-24px w-24px {icon}"></span>
</button>