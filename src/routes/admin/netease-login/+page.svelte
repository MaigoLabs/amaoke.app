<!-- 
 

WARNING

This page is vibe-coded. It's not a part of the regular UI intended for users anyway so I don't really want to clean it up :(
 

-->
<script lang="ts">
    import { onDestroy, onMount } from 'svelte';
    import { page } from '$app/stores';
    import { API } from '$lib/client';
    import { fade, scale } from 'svelte/transition';
    import AppBar from "$lib/ui/appbar/AppBar.svelte";
    import { getI18n } from "$lib/i18n";

    const t = getI18n().admin.neteaseLogin;

    let status = $state<'loading' | 'waiting_scan' | 'waiting_confirm' | 'success' | 'error'>('loading');
    let qrImg = $state('');
    let errorMessage = $state('');
    let timer: any;

    async function check() {
        try {
            const pwd = $page.url.searchParams.get('pwd') ?? undefined;
            const res = await API.netease.checkLogin(pwd);
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

<AppBar title={t.title} />

<div class="vbox flex-1 cbox p-content">
    <div class="vbox items-center gap-24px p-32px rounded-24px relative overflow-hidden w-full max-w-400px" in:scale={{ duration: 400, start: 0.95 }}>
        <div class="vbox items-center gap-8px z-1">
            <h1 class="m3-font-headline-medium mfg-on-surface m-0">{t.scanTitle}</h1>
            <p class="m3-font-body-medium mfg-on-surface-variant m-0">{t.scanTip}</p>
        </div>

        <div class="cbox min-h-200px w-full z-1">
            {#if status === 'loading'}
                <div class="vbox items-center gap-16px" in:fade>
                    <div class="i-material-symbols:sync animate-spin text-40px mfg-primary"></div>
                    <p class="m3-font-body-medium mfg-on-surface-variant">{t.generating}</p>
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
                        <p class="m3-font-title-large mfg-on-surface font-bold">{t.scanned}</p>
                        <p class="m3-font-body-medium mfg-on-surface-variant">{t.confirm}</p>
                    </div>
                </div>
            {:else if status === 'success'}
                <div class="vbox items-center gap-16px" in:fade>
                    <div class="size-80px rounded-full cbox mbg-tertiary-container mfg-tertiary">
                        <div class="i-material-symbols:check text-48px"></div>
                    </div>
                    <div class="vbox items-center">
                        <p class="m3-font-title-large mfg-on-surface font-bold">{t.success}</p>
                    </div>
                </div>
            {:else if status === 'error'}
                <div class="vbox items-center gap-16px" in:fade>
                    <div class="size-80px rounded-full cbox mbg-error-container mfg-error">
                        <div class="i-material-symbols:error-outline text-48px"></div>
                    </div>
                    <p class="m3-font-body-medium mfg-error text-center">{t.errorPrefix}{errorMessage}</p>
                </div>
            {/if}
        </div>
    </div>
</div>
