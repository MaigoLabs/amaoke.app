<!-- 
 

WARNING

This page is vibe-coded. It's not a part of the regular UI intended for users anyway so I don't really want to clean it up :(
 

-->
<script lang="ts">
    import { onDestroy, onMount } from 'svelte';
    import { API } from '$lib/client';
    import { fade, scale } from 'svelte/transition';
    import AppBar from "../../../components/appbar/AppBar.svelte";
    import { Layer } from "m3-svelte";

    let status = $state<'loading' | 'waiting_scan' | 'waiting_confirm' | 'success' | 'error'>('loading');
    let qrImg = $state('');
    let errorMessage = $state('');
    let timer: any;

    async function check() {
        try {
            const res = await API.netease.checkLogin();
            if (res.code === 801) {
                if (status !== 'waiting_scan') {
                    status = 'waiting_scan';
                    qrImg = res.img;
                }
            } else if (res.code === 802) {
                status = 'waiting_confirm';
            } else if (res.code === 803) {
                status = 'success';
                clearInterval(timer);
                // Redirect or show success
                setTimeout(() => {
                    history.back();
                }, 1500);
            }
        } catch (e: any) {
            console.error(e);
            errorMessage = e.message || 'Unknown error';
        }
    }

    onMount(() => {
        check();
        timer = setInterval(check, 2000);
    });

    onDestroy(() => {
        if (timer) clearInterval(timer);
    });
</script>

<AppBar title="网易云登录" />

<div class="vbox flex-1 cbox p-content">
    <div class="vbox items-center gap-24px p-32px rounded-24px relative overflow-hidden w-full max-w-400px" in:scale={{ duration: 400, start: 0.95 }}>
        <div class="vbox items-center gap-8px z-1">
            <h1 class="m3-font-headline-medium mfg-on-surface m-0">扫码登录</h1>
            <p class="m3-font-body-medium mfg-on-surface-variant m-0">请使用网易云音乐 APP 扫码</p>
        </div>

        <div class="cbox min-h-200px w-full z-1">
            {#if status === 'loading'}
                <div class="vbox items-center gap-16px" in:fade>
                    <div class="i-material-symbols:sync animate-spin text-40px mfg-primary"></div>
                    <p class="m3-font-body-medium mfg-on-surface-variant">正在生成二维码...</p>
                </div>
            {:else if status === 'waiting_scan'}
                <div class="p-16px bg-white rounded-16px shadow-sm" in:fade>
                    <img src={qrImg} alt="QR Code" class="block size-180px rounded-8px" />
                </div>
            {:else if status === 'waiting_confirm'}
                <div class="vbox items-center gap-16px" in:fade>
                    <div class="size-80px rounded-full cbox mbg-primary-container mfg-primary">
                        <div class="i-material-symbols:check-circle-outline text-48px"></div>
                    </div>
                    <div class="vbox items-center">
                        <p class="m3-font-title-large mfg-on-surface font-bold">已扫描</p>
                        <p class="m3-font-body-medium mfg-on-surface-variant">请在手机上确认登录</p>
                    </div>
                </div>
            {:else if status === 'success'}
                <div class="vbox items-center gap-16px" in:fade>
                    <div class="size-80px rounded-full cbox mbg-tertiary-container mfg-tertiary">
                        <div class="i-material-symbols:check text-48px"></div>
                    </div>
                    <div class="vbox items-center">
                        <p class="m3-font-title-large mfg-on-surface font-bold">登录成功</p>
                    </div>
                </div>
            {:else if status === 'error'}
                <div class="vbox items-center gap-16px" in:fade>
                    <div class="size-80px rounded-full cbox mbg-error-container mfg-error">
                        <div class="i-material-symbols:error-outline text-48px"></div>
                    </div>
                    <p class="m3-font-body-medium mfg-error text-center">错误: {errorMessage}</p>
                </div>
            {/if}
        </div>
    </div>
</div>
