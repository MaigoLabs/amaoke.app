import { getContext, setContext } from 'svelte'
import EN from "./en"
import ZH from "./zh"
import JA from "./ja"


// i18n related files:
// src\hooks.server.ts
// src\routes\+layout.server.ts

type Lang = 'en' | 'zh' | 'ja'

const msgs: Record<Lang, typeof ZH> = {
  en: EN,
  zh: ZH,
  ja: JA
}

const I18N_KEY = Symbol('i18n')

export const initI18n = (lang: Lang) => {
  setContext(I18N_KEY, msgs[lang])
}

export const getI18n = () => {
  return getContext<typeof ZH>(I18N_KEY) || msgs['en']
}

export const setLanguage = (lang: Lang) => {
  document.cookie = `lang=${lang}; path=/; max-age=31536000`
  location.reload()
}

export const useMsg = () => {
  const i18n = getI18n()
  return (key: string) => key.split('.').reduce((o, i) => (o as any)?.[i], i18n) as unknown as string
}

export {}

declare global {
  interface String {
    sed(variables: { [index: string]: any }): string
  }
}

String.prototype.sed = function (variables: { [index: string]: any }) {
  return this.replace(/{(.*?)}/g, (_: string, v: string | number) => variables[v] + "")
}

Object.defineProperty(String.prototype, 'sed', { enumerable: false })
