<script lang="ts">
  import { fade } from "svelte/transition";

  let { open } = $props();
</script>

{#if open}
  <div class="overlay loading" transition:fade>
    <span class="icon i-svg-spinners:pulse-2"></span>
    <span class="text"><span>LOADING</span></span>
  </div>
{/if}

<style lang="sass">
.overlay
  position: fixed
  inset: 0

  background-color: rgba(0, 0, 0, 0.5)

  display: flex
  justify-content: center
  align-items: center

  z-index: 1000
  backdrop-filter: blur(5px)

.loading.overlay
  font-size: 28rem

  .icon
    opacity: 0.5

  .text
    position: absolute
    inset: 0
    display: flex
    justify-content: center
    align-items: center
    background: transparent

    letter-spacing: 20px
    margin-left: 20px

    font-size: 1.5rem
</style>
