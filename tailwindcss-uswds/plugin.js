import plugin from "tailwindcss/plugin";
import fonts from "../dist/fonts.json";
import props from "../dist/props.json";

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

/**
 *
 * @param {Partial<typeof DEFAULT_OPTIONS>} [options]
 * @returns
 */
export default function (options) {
    const uswdsPlugin = plugin.withOptions(
        /** @param {Partial<typeof DEFAULT_OPTIONS> | undefined} options */
        (options = {}) => {
            let opts = {
                ...DEFAULT_OPTIONS,
                ...options,
                overrides: {
                    ...DEFAULT_OPTIONS.overrides,
                    ...options.overrides,
                },
            };

            return ({ addBase, addUtilities, e, theme }) => {
                let base = [
                    {
                        body: {
                            backgroundColor: theme("colors.white"),
                            color: theme("colors.ink"),
                            overflowX: "hidden",
                        },
                    },
                    ...fonts
                        .filter(font => Object.values(theme("fontWeight")).includes(font.weight))
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
                            fontFamily: theme("fontFamily")
                                [key].split(", ")
                                .map(s => (s.includes(" ") ? `'${s}'` : s)),
                        },
                    })),
                ];

                addBase(base);

                let uMeasure = opts.overrides.measure
                    ? Object.keys(theme("measure")).map(key => ({
                          [`.${e(`measure-${key}`)}`]: { maxWidth: theme("measure")[key] },
                      }))
                    : {};
                let uTabular = opts.overrides.fontFeatureSettings
                    ? Object.keys(theme("fontFeatureSettings")).map(key => ({
                          [`.${e(`text-${key}`)}`]: {
                              fontFeatureSettings: theme("fontFeatureSettings")[key],
                          },
                      }))
                    : {};
                let uTextIndent = opts.overrides.textIndent
                    ? Object.keys(theme("textIndent")).map(key => ({
                          [`.${e(
                              key.startsWith("-")
                                  ? `-text-indent-${key.slice(1)}`
                                  : `text-indent-${key}`,
                          )}`]: {
                              textIndent: theme("textIndent")[key],
                          },
                      }))
                    : {};

                addUtilities([uMeasure, uTabular, uTextIndent], { variants: ["responsive"] });
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

            let theme = {
                theme: Object.keys(opts.overrides).reduce((acc, key) => {
                    let override = opts.overrides[key];

                    if (override) {
                        acc[key] = {
                            ...props[key].standard,
                            ...(override === "extended" ? props[key].extended : {}),
                        };
                    }

                    return acc;
                }, {}),
            };

            return theme;
        },
    );

    return uswdsPlugin(options);
}
