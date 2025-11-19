<script lang="ts">
    import { TextFieldOutlined } from "m3-svelte";
  import AppBar from "../../components/appbar/AppBar.svelte";
  import Button from "../../components/Button.svelte";
  import Dialog from "../../components/status/Dialog.svelte";

  let open = $state(false)
  let loginMode = $state(false)
  let loginCode = $state('')
</script>

<Dialog title="生成引继码" bind:open>引继码生成成功！生成的引继码是：01234-56789-ABCDE-F0123
  <br><br>
这个引继码将会在使用之后、或者未使用的 7 天后会失效</Dialog>

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

<div class="vbox gap-16px flex-1 min-h-0">
    
</div>

<div class="hbox p-16px gap-16px">
  {#if !loginMode}
    <Button big secondary icon="i-material-symbols:add" disabled={open} onclick={() => open = true}>生成引继码</Button>
    <Button big secondary icon="i-material-symbols:login" disabled={open} onclick={() => loginMode = true}>用引继码登录</Button>
  {:else}
    <Button big secondary icon="i-material-symbols:login" disabled={open} onclick={() => alert("TODO")}>登录</Button>
  {/if}
</div>
