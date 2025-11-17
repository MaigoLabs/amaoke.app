<script lang="ts">
    let { icon, ...rest } = $props();
</script>

<button class="cbox size-48px" {...rest}>
    <span class="size-24px {icon}"></span>
</button>