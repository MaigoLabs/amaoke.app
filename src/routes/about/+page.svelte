<script lang="ts">
  import AppBar from "$lib/ui/appbar/AppBar.svelte"
  import Button from "$lib/ui/Button.svelte"
  import { version } from '$app/environment';
  import "@fontsource/darumadrop-one"

  // Generate 20 random lines of hiragana
  const hiragana = "あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをん"
  function genRandomLines() {
    const lines = []
    for (let i = 0; i < 20; i++) {
      lines.push(hiragana.split('').sort(() => Math.random() - 0.5).join(''))
    }
    return lines
  }

  const randomLines = genRandomLines()
  const spinningMics = 10
</script>

<AppBar title="About" right={[
  {
    icon: 'i-mdi:github',
    onclick: () => window.open('https://github.com/MaigoLabs/amaoke.app', '_blank')
  }
]} gradient></AppBar>

<!-- <div class="gradient2"></div> -->

<div class="cbox vbox overflow-hidden! absolute inset-0">
  <div class="gradient1"></div>
  <div class="gradient2"></div>
  <div class="vbox justify-center items-center text-center relative z-10">
    <div class="cbox absolute inset-0 z-5">
      <div class="size-360px rounded-full opacity-70 gradient-center"></div>
    </div>
    <div class="z-10">
      <div class="app-name text-32px">アマオケ</div>
      <div class="m3-font-body-medium mfg-on-surface-variant">FOSS {version}</div>
      <div class="m3-font-body-medium mfg-on-surface">
        Made with ♥ and 🔮 by <br>
        <a href="https://maigo.dev" target="_blank" class="mfg-primary">MaigoLabs</a> 2025
      </div>
    </div>
    <div class="cbox absolute inset-0 z-5 spin-circle opacity-50 pointer-events-none">
      {#each Array(spinningMics) as _, i}
        <div class="size-300px rounded-full absolute" style:transform={`rotate(${i * 360 / spinningMics}deg)`}>
          <div class="rotate--140 text-24px">🎤</div>
        </div>
      {/each}
    </div>
  </div>
  <!-- <div class="h-64px w-full"> </div> -->
  <div class="vbox absolute overflow-hidden">
    {#each randomLines as line}
      <div class="mfg-on-surface mix-blend-color-burn opacity-07 truncate text-48px rotate--15 pointer-events-none line-height-64px tracking-8px kana-line">{line}</div>
    {/each}
  </div>
</div>

<!-- <div class="p-content py-16px">
  <Button big href="https://github.com/MaigoLabs/amaoke.app">GitHub</Button>
</div> -->

<style lang="sass">
  
// @import url('https://fonts.googleapis.com/css2?family=Caveat:wght@400..700&family=Darumadrop+One&family=Hachi+Maru+Pop&family=Kiwi+Maru&family=Livvic:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,900&family=M+PLUS+Rounded+1c&family=Quicksand:wght@300..700&family=Rampart+One&family=Stick&family=Yuji+Boku&family=Zen+Maru+Gothic&display=swap')

.app-name
  // font-family: "Yuji Boku"
  font-family: "Darumadrop One"
  font-size: 48px

.gradient1,.gradient2
  --size: calc(max(100vw, 100vh) * 1.5) 
  position: absolute
  width: 200vw
  height: 200vh
  border-radius: 50%

.gradient1
  // Radial gradient from D9C5F7 100% to FFFFFF 0%
  background: radial-gradient(50% 50%, rgba(217,197,247,1), rgba(255,255,255,0))
  bottom: 0
  left: 0

.gradient2
  // Radial gradient from F7C5C5 100% to FFFFFF 0%
  background: radial-gradient(50% 50%, rgba(247,197,197,1), rgba(255,255,255,0))
  right: 0
  top: 0

.gradient-center
  background: radial-gradient(50% 50%, rgba(255,255,255,1), rgba(255,255,255,0))

@media (prefers-color-scheme: dark)
  .gradient-center
    background: radial-gradient(50% 50%, rgba(0,0,0,1), rgba(0,0,0,0))
    opacity: 0.1

  .kana-line
    opacity: 0.2

.spin-circle
  animation: spin 30s linear infinite

@keyframes spin
  from
    transform: rotate(360deg)
  to
    transform: rotate(0deg)
</style>