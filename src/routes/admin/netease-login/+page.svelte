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
    const yidunCaptchaId = '73a18dc827b24b18ad0783701a75277d';

    type LoginMode = 'qr' | 'sms';
    type QrStatus = 'loading' | 'waiting_scan' | 'waiting_confirm' | 'secondary_verification' | 'success' | 'error';
    type SmsStatus = 'idle' | 'sending' | 'sent' | 'logging_in' | 'success';
    type YidunCaptchaInstance = {
        popUp: () => void;
        refresh: () => void;
        destroy: () => void;
    };
    type YidunCaptchaConfig = {
        captchaId: string;
        element?: HTMLElement;
        mode: 'popup';
        width: string;
        onVerify: (error: unknown, data?: { validate?: string }) => void;
        onClose: () => void;
    };
    type NeteaseWindow = Window & typeof globalThis & {
        initNECaptcha?: (
            config: YidunCaptchaConfig,
            onload: (instance: YidunCaptchaInstance) => void,
            onerror: (error: unknown) => void
        ) => void;
    };

    let mode = $state<LoginMode>('qr');
    let status = $state<QrStatus>('loading');
    let smsStatus = $state<SmsStatus>('idle');
    let qrImg = $state('');
    let ctcode = $state('86');
    let phone = $state('');
    let captcha = $state('');
    let errorMessage = $state('');
    let timer: any;
    let yidunElement: HTMLDivElement | undefined;
    let yidunCaptcha: YidunCaptchaInstance | undefined;
    let yidunScriptPromise: Promise<void> | undefined;
    let captchaOpen = $state(false);
    let captchaLoading = $state(false);

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

    function loadYidunScript() {
        const neteaseWindow = window as NeteaseWindow;
        if (neteaseWindow.initNECaptcha) return Promise.resolve();
        if (yidunScriptPromise) return yidunScriptPromise;

        yidunScriptPromise = new Promise<void>((resolve, reject) => {
            const existing = document.querySelector<HTMLScriptElement>('script[data-netease-yidun]');
            if (existing) {
                existing.addEventListener('load', () => resolve(), { once: true });
                existing.addEventListener('error', () => reject(new Error('Failed to load NetEase security verification')), { once: true });
                return;
            }

            const script = document.createElement('script');
            script.src = 'https://cstaticdun.126.net/load.min.js';
            script.async = true;
            script.dataset.neteaseYidun = 'true';
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('Failed to load NetEase security verification'));
            document.body.appendChild(script);
        }).then(() => {
            if (!neteaseWindow.initNECaptcha) throw new Error('NetEase security verification unavailable');
        });

        return yidunScriptPromise;
    }

    async function ensureYidunCaptcha() {
        if (yidunCaptcha) return yidunCaptcha;
        if (!yidunElement) throw new Error('NetEase security verification is not ready');

        captchaLoading = true;
        try {
            await loadYidunScript();
            const neteaseWindow = window as NeteaseWindow;
            if (!neteaseWindow.initNECaptcha) throw new Error('NetEase security verification unavailable');

            yidunCaptcha = await new Promise<YidunCaptchaInstance>((resolve, reject) => {
                neteaseWindow.initNECaptcha?.({
                    captchaId: yidunCaptchaId,
                    element: yidunElement,
                    mode: 'popup',
                    width: '320px',
                    onVerify: (verifyError, data) => {
                        if (!verifyError && data?.validate) void handleSecureCaptcha(data.validate);
                    },
                    onClose: () => {
                        captchaOpen = false;
                    }
                }, resolve, reject);
            });
            return yidunCaptcha;
        } finally {
            captchaLoading = false;
        }
    }

    async function requestSecureCaptcha() {
        if (captchaOpen) return;
        status = 'secondary_verification';
        try {
            const captcha = await ensureYidunCaptcha();
            captchaOpen = true;
            captcha.popUp();
        } catch (e: any) {
            console.error(e);
            errorMessage = e.message || 'Unknown error';
            status = 'error';
            captchaOpen = false;
        }
    }

    async function handleSecureCaptcha(secureCaptcha: string) {
        captchaOpen = false;
        status = 'waiting_confirm';
        setTimeout(() => yidunCaptcha?.refresh(), 1000);
        await check(secureCaptcha);
    }

    async function check(secureCaptcha?: string) {
        if (mode !== 'qr' || status === 'success') return;
        if (status === 'secondary_verification' && !secureCaptcha) return;
        try {
            const res = await API.netease.checkLogin(pwd(), secureCaptcha);
            if (res.code === 801) {
                if (status !== 'waiting_scan') {
                    status = 'waiting_scan';
                    qrImg = res.img;
                }
            } else if (res.code === 802) {
                status = 'waiting_confirm';
            } else if (res.code === 8821) {
                await requestSecureCaptcha();
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
        yidunCaptcha?.destroy();
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
                {:else if status === 'secondary_verification'}
                    <div class="vbox items-center gap-16px" in:fade>
                        <div class="size-80px rounded-full cbox mbg-secondary-container mfg-secondary">
                            <div class="i-material-symbols:shield-outline text-48px"></div>
                        </div>
                        <div class="vbox items-center">
                            <p class="m3-font-title-large mfg-on-surface font-bold">{t.securityVerification}</p>
                            <p class="m3-font-body-medium mfg-on-surface-variant text-center">{t.securityTip}</p>
                        </div>
                        <Button
                            class="!w-auto"
                            icon={captchaLoading ? 'i-material-symbols:sync animate-spin' : 'i-material-symbols:verified-user-outline'}
                            disabled={captchaLoading}
                            onclick={requestSecureCaptcha}
                        >
                            {captchaLoading ? t.verifying : t.openSecurityVerification}
                        </Button>
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
    <div bind:this={yidunElement} class="absolute left-0 top-0 size-0 overflow-hidden"></div>
</div>
