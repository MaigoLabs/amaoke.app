import EN from "./en"
import ZH from "./zh"

type Lang = 'en' | 'zh'

const msgs: Record<Lang, typeof ZH> = {
  en: EN,
  zh: ZH
}

let lang: Lang = 'en'

// Infer language from browser
if (navigator.language.startsWith('zh')) {
  lang = 'zh'
}

export const getI18n = () => msgs[lang]

// export function ts(key: string, variables?: { [index: string]: any }) {
//   return t(key as keyof LocalizedMessages, variables)
// }

// /**
//  * Load the translation for the given key
//  *
//  * @param key
//  * @param variables
//  */
// export function t(key: keyof LocalizedMessages, variables?: { [index: string]: any }) {
//   // Check if the key exists
//   let msg = getI18n()[key]
//   if (!msg) {
//     // Check if the key exists in English
//     if (!(msg = getI18n()[key])) {
//       msg = key
//       console.error(`ERROR!! Missing translation reference entry (English) for ${key}`)
//     }
//     else console.warn(`Missing translation for ${key} in ${lang}`)
//   }
//   // Replace variables
//   if (variables) {
//     return msg.replace(/\${(.*?)}/g, (_: string, v: string | number) => variables[v] + "")
//   }
//   return msg
// }
// Object.assign(window, { t })


export {}

declare global {
  interface String {
    sed(variables: { [index: string]: any }): string
  }
}

String.prototype.sed = function (variables: { [index: string]: any }) {
  return this.replace(/\${(.*?)}/g, (_: string, v: string | number) => variables[v] + "")
}

Object.defineProperty(String.prototype, 'sed', { enumerable: false })
