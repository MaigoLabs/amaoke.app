<script lang="ts">
  import { TextFieldOutlined } from "m3-svelte"
  import AppBar from "$lib/ui/appbar/AppBar.svelte"
  import Button from "$lib/ui/Button.svelte"
  import Dialog from "$lib/ui/status/Dialog.svelte"
  import { API } from "$lib/client"
  import ErrorDialog from "$lib/ui/status/ErrorDialog.svelte"

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

<Dialog title="登录成功" bind:open={loginSuccessOpen} buttons={[{
  text: '跳转', onclick: () => location.href = '/'
}]}>
  登录成功！
</Dialog>

<Dialog title="生成引继码" bind:open={showCodeOpen} buttons={[{
  text: '复制', onclick: () => navigator.clipboard.writeText(generatedCode)
}]}>
  引继码生成成功！生成的引继码是：{generatedCode}
  <br><br>
  这个引继码将会在使用之后、或者未使用的 7 天后会失效
</Dialog>

<AppBar title="账号管理"/>

<div class="m3-font-body-medium mfg-on-surface-variant py-12px p-content">
  这个 App 像日本的手机游戏一样采用引继码系统管理账号，并不需要用邮箱密码注册帐号。
  <br><br>
  如果想要在另一个设备上登录账号，请点击「生成引继码」然后在想要登录的设备上点击「登录」
  {#if loginMode}
    <br><br>您当前在「引继登录」页面，请在另一个设备上获取引继码之后输入到下面的输入框内点击「登录」
  {/if}
</div>

{#if loginMode}
  <div class="vbox px-16px py-10px">
    <TextFieldOutlined label="输入引继码" bind:value={loginCode}/>
  </div>
{/if}

<div class="vbox gap-16px flex-1 min-h-0"></div>

<div class="hbox p-16px gap-16px">
  {#if !loginMode}
    <Button big secondary icon="i-material-symbols:add" disabled={showCodeOpen} onclick={generateCode}>生成引继码</Button>
    <Button big secondary icon="i-material-symbols:login" disabled={showCodeOpen} onclick={() => loginMode = true}>用引继码登录</Button>
  {:else}
    <Button big secondary icon="i-material-symbols:login" disabled={showCodeOpen} onclick={doLogin}>登录</Button>
  {/if}
</div>
