// https://github.com/Menci/Marina/blob/main/apps/web/uno.config.ts
import { createLocalFontProcessor } from '@unocss/preset-web-fonts/local';
import { defineConfig, presetWind3, presetAttributify, presetIcons, presetTypography, presetWebFonts, transformerDirectives } from 'unocss';
import presetAnimations from 'unocss-preset-animations';

function createColorSchemeConfig(hueBaseVariable: string, hueOffset = 0) {
  const calcBaseChroma = `(0.18 + (cos((var(--theme-colors-${hueBaseVariable}) + ${hueOffset}) * 3.14159265 / 180) * 0.04))`;

  const shades = {
    50: `color-mix(in oklch, oklch(95% calc(${calcBaseChroma} * 0.3) calc(var(--theme-colors-${hueBaseVariable}) + ${hueOffset}) / %alpha) 30%, oklch(100% 0 360 / %alpha))`,
    100: `color-mix(in oklch, oklch(95% calc(${calcBaseChroma} * 0.5) calc(var(--theme-colors-${hueBaseVariable}) + ${hueOffset}) / %alpha) 80%, oklch(100% 0 360 / %alpha))`,
    200: `oklch(90% calc(${calcBaseChroma} * 0.6) calc(var(--theme-colors-${hueBaseVariable}) + ${hueOffset}) / %alpha)`,
    300: `oklch(85% calc(${calcBaseChroma} * 0.75) calc(var(--theme-colors-${hueBaseVariable}) + ${hueOffset}) / %alpha)`,
    400: `oklch(74% calc(${calcBaseChroma}) calc(var(--theme-colors-${hueBaseVariable}) + ${hueOffset}) / %alpha)`,
    450: `oklch(68% calc(${calcBaseChroma}) calc(var(--theme-colors-${hueBaseVariable}) + ${hueOffset}) / %alpha)`,
    500: `oklch(62% calc(${calcBaseChroma} * 0.9) calc(var(--theme-colors-${hueBaseVariable}) + ${hueOffset}) / %alpha)`,
    600: `oklch(54% calc(${calcBaseChroma} * 1.15) calc(var(--theme-colors-${hueBaseVariable}) + ${hueOffset}) / %alpha)`,
    700: `oklch(49% calc(${calcBaseChroma} * 1.1) calc(var(--theme-colors-${hueBaseVariable}) + ${hueOffset}) / %alpha)`,
    800: `oklch(42% calc(${calcBaseChroma} * 0.85) calc(var(--theme-colors-${hueBaseVariable}) + ${hueOffset}) / %alpha)`,
    900: `oklch(37% calc(${calcBaseChroma} * 0.7) calc(var(--theme-colors-${hueBaseVariable}) + ${hueOffset}) / %alpha)`,
    950: `oklch(29% calc(${calcBaseChroma} * 0.5) calc(var(--theme-colors-${hueBaseVariable}) + ${hueOffset}) / %alpha)`,
    970: `oklch(20% calc(${calcBaseChroma} * 0.3) calc(var(--theme-colors-${hueBaseVariable}) + ${hueOffset}) / %alpha)`,
  } as const;

  return {
    ...shades,
    DEFAULT: `color-mix(in oklch, ${shades[500]}, ${shades[600]} var(--is-dark))`,
    foreground: shades[100],
  };
}

export default defineConfig({
  presets: [
    presetWind3(),
    presetAnimations(),
    presetAttributify(),
    presetTypography(),
    presetIcons({
      scale: 1.2,
      warn: true,
    }),
    presetWebFonts({
      fonts: {
        sans: {
          name: 'Normalized Quicksand',
          provider: 'none',
        },
        mono: {
          name: 'Maple Mono',
          provider: 'fontsource',
        },
      },
      processors: createLocalFontProcessor({
        cacheDir: 'node_modules/.cache/unocss/fonts',
        fontAssetsDir: 'public/assets/fonts/cache',
        fontServeBaseUrl: '/assets/fonts/cache',
      }),
    }),
  ],
  // By default, `.ts` and `.js` files are NOT extracted.
  // If you want to extract them, use the following configuration.
  // It's necessary to add the following configuration if you use shadcn-vue or shadcn-svelte.
  content: {
    pipeline: {
      include: [
        // the default
        /\.(vue|svelte|[jt]sx|mdx?|astro|elm|php|phtml|html)($|\?)/,
        // include js/ts files
        '(components|src)/**/*.{js,ts,vue}',
        '**/shadcn-ui/**/*.{vue,js,ts}',
        '**/ui/**/*.{vue,js,ts}',
      ],
    },
  },
  theme: {
    spacing: {
      4: '1rem',
    },
    colors: {
      primary: createColorSchemeConfig('hue-primary'),
      destructive: createColorSchemeConfig('hue-destructive'),
      warning: createColorSchemeConfig('hue-warning'),
      success: createColorSchemeConfig('hue-success'),
    },
    borderRadius: {
      xs: 'calc(var(--radius) - 6px)',
    },
    fontFamily: {
      jp: ['"ヒラギノ角ゴ Pro W3"', 'メイリオ', 'Meiryo', '"ＭＳ Ｐゴシック"', '"MS P Gothic"', 'sans-serif']
    }
  },
  extendTheme: theme => ({
    ...theme,
    breakpoints: {
      ...theme.breakpoints,
      '3xl': '1792px',
    },
  }),
  rules: [
    [/^dir-([a-zA-Z0-9-]+)$/, ([, dir]) => ({
      direction: dir,
    })],
    [/^my-([a-zA-Z0-9-]+)-([a-zA-Z0-9-.]+)$/, ([, varname, varval]) => ({
      [`--my-${varname}`]: varval
    })]
  ],
  shortcuts: {
    // Marina
    'form-error': 'text-3.5 font-medium text-destructive',
    'form-warning': 'text-3.5 font-medium text-warning',
    'form-info': 'text-3.5 font-medium text-muted-foreground',
  },
  transformers: [
    transformerDirectives(),
  ],
});