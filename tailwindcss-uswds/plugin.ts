import plugin from "tailwindcss/plugin";

import componentClasses from "./tokens/component-classes.json";
import fonts from "./tokens/fonts.json";
import themeTokens from "./tokens/theme.json";

// Tailwind v3 passed an `e` (escapeClassName) helper into plugins to escape
// class-name strings embedded in the raw selectors built below. Tailwind v4
// removed it from the plugin API, so we replicate the CSSOM CSS.escape algorithm
// locally. For plain [a-z0-9-] USWDS tokens this is the identity function, so the
// emitted selectors are byte-identical to the v3 output.
function e(value: string): string {
    let result = "";
    for (let i = 0; i < value.length; i++) {
        const c = value.charCodeAt(i);
        if (c === 0) {
            result += "�";
        } else if (
            (c >= 0x01 && c <= 0x1f) ||
            c === 0x7f ||
            (i === 0 && c >= 0x30 && c <= 0x39) ||
            (i === 1 && c >= 0x30 && c <= 0x39 && value.charCodeAt(0) === 0x2d)
        ) {
            result += `\\${c.toString(16)} `;
        } else if (i === 0 && value.length === 1 && c === 0x2d) {
            result += `\\${value[i]}`;
        } else if (
            c >= 0x80 ||
            c === 0x2d ||
            c === 0x5f ||
            (c >= 0x30 && c <= 0x39) ||
            (c >= 0x41 && c <= 0x5a) ||
            (c >= 0x61 && c <= 0x7a)
        ) {
            result += value[i];
        } else {
            result += `\\${value[i]}`;
        }
    }
    return result;
}

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
    return plugin.withOptions<Partial<typeof DEFAULT_OPTIONS> | undefined>(
        (options = {}) => {
            let opts = {
                ...DEFAULT_OPTIONS,
                ...options,
                overrides: {
                    ...DEFAULT_OPTIONS.overrides,
                    ...options.overrides,
                },
            };

            return ({ addBase, addComponents, addUtilities, matchUtilities, theme }) => {
                // Read font families from the committed USWDS tokens rather than the
                // theme() accessor: under v4 the legacy accessor merges in Tailwind's
                // default sans/serif/mono stacks (with emoji fallbacks), which leaked
                // into and mangled the `[class*=text-*]` rules below.
                let fontFamilies: Record<string, string> = {
                    ...themeTokens.fontFamily.standard,
                    ...(opts.overrides.fontFamily === "extended"
                        ? themeTokens.fontFamily.extended
                        : {}),
                };

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
                    ...Object.entries(fontFamilies).map(([key, value]) => ({
                        // The token value is already a valid CSS font-family list.
                        [`[class*=${e(`text-${key}`)}]`]: {
                            fontFamily: value,
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
                // v4's addUtilities takes a flat Record[]; each *Utils above is an
                // array (or {}), so flatten one level instead of passing nested arrays.
                addUtilities([measureUtils, tabularUtils].flat());

                // text-indent has negative tokens (e.g. -text-indent-1). v4 rejects
                // statically-defined utilities whose selector starts with "-", so we
                // register it via matchUtilities with supportsNegativeValues. The
                // negative tokens are exact negations of the positive ones, so v4
                // regenerates them and the emitted CSS matches the v3 output.
                if (opts.overrides.textIndent) {
                    let textIndent: Record<string, string> = theme("textIndent");
                    let values = Object.fromEntries(
                        Object.keys(textIndent)
                            .filter(key => !key.startsWith("-"))
                            .map(key => [key, textIndent[key]]),
                    );

                    matchUtilities(
                        { "text-indent": (value: string) => ({ textIndent: value }) },
                        { values, supportsNegativeValues: true },
                    );
                }

                // Register the USWDS component class names (the actual styles live in
                // the imported components.css @layer) as empty components, purely so
                // Tailwind v4 IntelliSense offers them as completions. v4 only
                // autocompletes classes that are part of its design system, and a raw
                // @import'd stylesheet is not — without this, usa-* autocomplete is
                // lost vs. the v3 addComponents behavior. Empty bodies emit no CSS.
                addComponents(
                    Object.fromEntries(
                        componentClasses
                            .filter(name => /^[a-z][\w-]*$/.test(name))
                            .map(name => [`.${name}`, {}]),
                    ),
                );
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
                                ...themeTokens[key as keyof typeof themeTokens].standard,
                                ...(override === "extended"
                                    ? themeTokens[key as keyof typeof themeTokens].extended
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
