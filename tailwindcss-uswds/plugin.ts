import { withOptions } from "tailwindcss/plugin";
import type { CSSRuleObject } from "tailwindcss/types/config";
import components from "./tokens/components.json";
import fonts from "./tokens/fonts.json";
import theme from "./tokens/theme.json";

const DEFAULT_OPTIONS = {
    fontPath: "../fonts",
    overrides: {
        borderRadius: "standard",
        borderWidth: "standard",
        boxShadow: "standard",
        colors: "standard",
        cursor: "standard",
        flex: "standard",
        fontFamily: "standard",
        fontFeatureSettings: "standard",
        fontSize: "standard",
        fontWeight: "standard",
        gap: "standard",
        height: "standard",
        letterSpacing: "standard",
        lineHeight: "standard",
        margin: "standard",
        maxHeight: "standard",
        maxWidth: "standard",
        measure: "standard",
        minHeight: "standard",
        minWidth: "standard",
        opacity: "standard",
        order: "standard",
        padding: "standard",
        screens: "standard",
        textIndent: "standard",
        width: "standard",
        zIndex: "standard",
    },
};

export default function uswds(options?: Partial<typeof DEFAULT_OPTIONS>) {
    return withOptions<Partial<typeof DEFAULT_OPTIONS> | undefined>(
        (options = {}) => {
            let opts = {
                ...DEFAULT_OPTIONS,
                ...options,
                overrides: {
                    ...DEFAULT_OPTIONS.overrides,
                    ...options.overrides,
                },
            };

            return ({ addBase, addUtilities, addComponents, e, theme }) => {
                let base = [
                    {
                        body: {
                            backgroundColor: theme("colors.white"),
                            color: theme("colors.ink"),
                            overflowX: "hidden",
                        },
                    },
                    ...fonts
                        .filter(font => Object.values(theme("fontWeight")!).includes(font.weight))
                        .map(font => ({
                            "@font-face": {
                                fontFamily: font.family,
                                fontStyle: font.style,
                                fontWeight: font.weight,
                                fontDisplay: "fallback",
                                src: `url(${opts.fontPath}/${font.dir}/${font.file}.woff2) format("woff2"),
                          url(${opts.fontPath}/${font.dir}/${font.file}.woff) format("woff"),
                          url(${opts.fontPath}/${font.dir}/${font.file}.ttf) format("truetype")`,
                            },
                        })),
                    ...Object.keys(theme("fontFamily")).map(key => ({
                        [`[class*=${e(`text-${key}`)}]`]: {
                            fontFamily: theme("fontFamily")!
                                [key].split(", ")
                                .map((s: string) => (s.includes(" ") ? `'${s}'` : s)),
                        },
                    })),
                ];

                addBase(base as any);

                let measureUtils = opts.overrides.measure
                    ? Object.keys(theme("measure")).map(key => ({
                          [`.${e(`measure-${key}`)}`]: { maxWidth: theme("measure")![key] },
                      }))
                    : {};
                let tabularUtils = opts.overrides.fontFeatureSettings
                    ? Object.keys(theme("fontFeatureSettings")).map(key => ({
                          [`.${e(`text-${key}`)}`]: {
                              fontFeatureSettings: theme("fontFeatureSettings")![key],
                          },
                      }))
                    : {};
                let textIndentUtils = opts.overrides.textIndent
                    ? Object.keys(theme("textIndent")).map(key => ({
                          [`.${e(
                              key.startsWith("-")
                                  ? `-text-indent-${key.slice(1)}`
                                  : `text-indent-${key}`,
                          )}`]: {
                              textIndent: theme("textIndent")![key],
                          },
                      }))
                    : {};

                addUtilities(
                    [
                        measureUtils,
                        tabularUtils,
                        textIndentUtils,
                    ] /*, { variants: ["responsive"] }*/,
                );

                addComponents(components as any as CSSRuleObject);
            };
        },

        (options = {}) => {
            let opts = {
                ...DEFAULT_OPTIONS,
                ...options,
                overrides: {
                    ...DEFAULT_OPTIONS.overrides,
                    ...options.overrides,
                },
            };

            let renderedTheme = {
                theme: Object.keys(opts.overrides).reduce(
                    (acc, key) => {
                        let override = opts.overrides[key as keyof typeof opts.overrides];

                        if (override) {
                            acc[key] = {
                                ...theme[key as keyof typeof theme].standard,
                                ...(override === "extended"
                                    ? theme[key as keyof typeof theme].extended
                                    : {}),
                            };
                        }

                        return acc;
                    },
                    {} as Record<string, any>,
                ),
            };

            return renderedTheme;
        },
    )(options);
}
