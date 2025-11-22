<script lang="ts">
  import { TextFieldOutlined } from "m3-svelte"
  import AppBar from "$lib/ui/appbar/AppBar.svelte"
  import Button from "$lib/ui/Button.svelte"
  import Dialog from "$lib/ui/status/Dialog.svelte"
  import { API } from "$lib/client"
  import ErrorDialog from "$lib/ui/status/ErrorDialog.svelte"
  import { getI18n } from "$lib/i18n"

  const t = getI18n().user

  let showCodeOpen = $state(false)
  let loginSuccessOpen = $state(false)
  let loginMode = $state(false)
  let loginCode = $state('')
  let generatedCode = $state('')
  let error = $state('')

  const generateCode = async () => await API.user.createSyncCode()
    .then(res => {
      generatedCode = res.code
      showCodeOpen = true
    }).catch(e => error = e.message)

  const doLogin = async () => await API.user.loginWithSyncCode(loginCode)
    .then(() => loginSuccessOpen = true).catch(e => error = e.message)
</script>

<ErrorDialog error={error}/>

<Dialog title={t.loginSuccess.title} bind:open={loginSuccessOpen} buttons={[{
  text: t.loginSuccess.jump, onclick: () => location.href = '/'
}]}>
  {t.loginSuccess.content}
</Dialog>

<Dialog title={t.generateCode.title} bind:open={showCodeOpen} buttons={[{
  text: t.generateCode.copy, onclick: () => navigator.clipboard.writeText(generatedCode)
}]}>
  {t.generateCode.success.sed({code: generatedCode})}
  <br><br>
  {t.generateCode.expiry}
</Dialog>

<AppBar title={t.title}/>

<div class="m3-font-body-medium mfg-on-surface-variant py-12px p-content">
  {t.desc.intro}
  <br><br>
  {t.desc.instruction}
  {#if loginMode}
    <br><br>{t.desc.loginMode}
  {/if}
</div>

{#if loginMode}
  <div class="vbox px-16px py-10px">
    <TextFieldOutlined label={t.input} bind:value={loginCode}/>
  </div>
{/if}

<div class="vbox gap-16px flex-1 min-h-0"></div>

<div class="hbox p-16px gap-16px">
  {#if !loginMode}
    <Button big secondary icon="i-material-symbols:add" disabled={showCodeOpen} onclick={generateCode}>{t.btn.generate}</Button>
    <Button big secondary icon="i-material-symbols:login" disabled={showCodeOpen} onclick={() => loginMode = true}>{t.btn.loginWithCode}</Button>
  {:else}
    <Button big secondary icon="i-material-symbols:login" disabled={showCodeOpen} onclick={doLogin}>{t.btn.login}</Button>
  {/if}
</div>
