<!-- 
 

WARNING

This page is vibe-coded. It's not a part of the regular UI intended for users anyway so I don't really want to clean it up :(
 

-->
<script lang="ts">
    import { TextFieldOutlined } from 'm3-svelte';
    import { onDestroy, onMount } from 'svelte';
    import { page } from '$app/stores';
    import { API } from '$lib/client';
    import { fade, scale } from 'svelte/transition';
    import AppBar from "$lib/ui/appbar/AppBar.svelte";
    import { getI18n } from "$lib/i18n";
    import Button from "$lib/ui/Button.svelte";

    const t = getI18n().admin.neteaseLogin;

    type LoginMode = 'qr' | 'sms';
    type QrStatus = 'loading' | 'waiting_scan' | 'waiting_confirm' | 'success' | 'error';
    type SmsStatus = 'idle' | 'sending' | 'sent' | 'logging_in' | 'success';

    let mode = $state<LoginMode>('qr');
    let status = $state<QrStatus>('loading');
    let smsStatus = $state<SmsStatus>('idle');
    let qrImg = $state('');
    let ctcode = $state('86');
    let phone = $state('');
    let captcha = $state('');
    let errorMessage = $state('');
    let timer: any;

    const pwd = () => $page.url.searchParams.get('pwd') ?? undefined;

    function finishLogin() {
        clearInterval(timer);
        setTimeout(() => {
            history.back();
        }, 1500);
    }

    function setMode(next: LoginMode) {
        mode = next;
        errorMessage = '';
        if (next === 'qr' && status !== 'success') check();
    }

    async function check() {
        if (mode !== 'qr' || status === 'success') return;
        try {
            const res = await API.netease.checkLogin(pwd());
            if (res.code === 801) {
                if (status !== 'waiting_scan') {
                    status = 'waiting_scan';
                    qrImg = res.img;
                }
            } else if (res.code === 802) {
                status = 'waiting_confirm';
            } else if (res.code === 803) {
                status = 'success';
                finishLogin();
            }
        } catch (e: any) {
            console.error(e);
            errorMessage = e.message || 'Unknown error';
            status = 'error';
        }
    }

    async function sendCaptcha() {
        if (!phone.trim()) return;
        try {
            errorMessage = '';
            smsStatus = 'sending';
            await API.netease.sendLoginCaptcha(phone.trim(), ctcode.trim() || '86', pwd());
            captcha = '';
            smsStatus = 'sent';
        } catch (e: any) {
            console.error(e);
            errorMessage = e.message || 'Unknown error';
            smsStatus = 'idle';
        }
    }

    async function loginWithSms() {
        if (!phone.trim() || !captcha.trim()) return;
        try {
            errorMessage = '';
            smsStatus = 'logging_in';
            await API.netease.loginWithSms(phone.trim(), captcha.trim(), ctcode.trim() || '86', pwd());
            smsStatus = 'success';
            finishLogin();
        } catch (e: any) {
            console.error(e);
            errorMessage = e.message || 'Unknown error';
            smsStatus = 'sent';
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
    <div class="vbox items-center gap-24px p-32px rounded-24px relative overflow-hidden w-full max-w-440px" in:scale={{ duration: 400, start: 0.95 }}>
        <div class="grid grid-cols-2 gap-8px w-full z-1">
            <button
                class="hbox cbox gap-8px h-40px rounded-12px m3-font-label-large {mode === 'qr' ? 'mbg-primary-container mfg-on-primary-container' : 'mbg-surface-container-high mfg-on-surface'}"
                onclick={() => setMode('qr')}
            >
                <span class="size-20px i-material-symbols:qr-code-scanner"></span>
                {t.qrMode}
            </button>
            <button
                class="hbox cbox gap-8px h-40px rounded-12px m3-font-label-large {mode === 'sms' ? 'mbg-primary-container mfg-on-primary-container' : 'mbg-surface-container-high mfg-on-surface'}"
                onclick={() => setMode('sms')}
            >
                <span class="size-20px i-material-symbols:sms-outline"></span>
                {t.smsMode}
            </button>
        </div>

        {#if mode === 'qr'}
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
        {:else}
            <div class="vbox items-center gap-8px z-1">
                <h1 class="m3-font-headline-medium mfg-on-surface m-0">{t.smsTitle}</h1>
                <p class="m3-font-body-medium mfg-on-surface-variant text-center m-0">
                    {smsStatus === 'sent' ? t.captchaSent : t.smsTip}
                </p>
            </div>

            <div class="vbox gap-16px w-full z-1">
                <div class="grid grid-cols-[96px_minmax(0,1fr)] gap-12px w-full">
                    <TextFieldOutlined label={t.countryCode} bind:value={ctcode} />
                    <TextFieldOutlined label={t.phone} bind:value={phone} />
                </div>
                <TextFieldOutlined label={t.captcha} bind:value={captcha} />

                {#if smsStatus === 'success'}
                    <div class="vbox items-center gap-16px" in:fade>
                        <div class="size-80px rounded-full cbox mbg-tertiary-container mfg-tertiary">
                            <div class="i-material-symbols:check text-48px"></div>
                        </div>
                        <p class="m3-font-title-large mfg-on-surface font-bold">{t.success}</p>
                    </div>
                {:else}
                    <div class="hbox gap-12px w-full">
                        <Button
                            class="!w-auto grow"
                            icon={smsStatus === 'sending' ? 'i-material-symbols:sync animate-spin' : 'i-material-symbols:send-to-mobile-outline'}
                            disabled={smsStatus === 'sending' || smsStatus === 'logging_in' || !phone.trim()}
                            onclick={sendCaptcha}
                        >
                            {smsStatus === 'sending' ? t.sendingCaptcha : t.sendCaptcha}
                        </Button>
                        <Button
                            class="!w-auto grow"
                            icon={smsStatus === 'logging_in' ? 'i-material-symbols:sync animate-spin' : 'i-material-symbols:login'}
                            disabled={smsStatus === 'logging_in' || !phone.trim() || !captcha.trim()}
                            onclick={loginWithSms}
                        >
                            {smsStatus === 'logging_in' ? t.loggingIn : t.loginBySms}
                        </Button>
                    </div>
                {/if}

                {#if errorMessage}
                    <p class="m3-font-body-medium mfg-error text-center m-0" in:fade>{t.errorPrefix}{errorMessage}</p>
                {/if}
            </div>
        {/if}
    </div>
</div>
