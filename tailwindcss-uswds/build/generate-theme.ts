import fs from "node:fs";
import path from "node:path";
import * as sass from "sass";

type JsonValue = boolean | null | number | string | JsonObject | JsonValue[];
type JsonObject = { [key: string]: JsonValue };

const PACKAGES_DIR = path.resolve("./node_modules/@uswds/uswds/packages");
const DIR_PATH = path.resolve(`./tailwindcss-uswds/tokens/`);
const NO_CAMEL_CASE = ["accent-cool", "accent-warm"];
const REMOVED_PREFIXES = ["ls-", "neg"];
const REMOVED_PROPS = [
    "background-color",
    "border-color",
    "color",
    "function",
    "outline-color",
    "palette-color",
    "text-decoration-color",
];
const RENAMED_PROPS = { breakpoints: "screens", noValue: "default" };

const SASS_CAPTURE_FILE = `
@use "sass:map";
@use "sass:meta";
@use "uswds" as uswds with (
    $theme-show-notifications: false,
$theme-show-compile-warnings: false
);

$uswds-vars: meta.module-variables("uswds");
$color-families: (
    "black-transparent",
    "gray-cool",
    "gray",
    "gray-warm",
    "blue-cool",
    "blue",
    "blue-warm",
    "cyan",
    "gold",
    "green-cool",
    "green",
    "green-warm",
    "indigo-cool",
    "indigo",
    "indigo-warm",
    "magenta",
    "mint-cool",
    "mint",
    "orange",
    "orange-warm",
    "red-cool",
    "red",
    "red-warm",
    "violet",
    "violet-warm",
    "white-transparent",
    "yellow"
);
$color-grades: (5, 10, 20, 30, 40, 50, 60, 70, 80, 90);
$gray-grades: (1, 2, 3, 4, 5, 10, 20, 30, 40, 50, 60, 70, 80, 90);
$transparent-grades: (5, 10, 20, 30, 40, 50, 60, 70, 80, 90);
$vivid-grades: (5, 10, 20, 30, 40, 50, 60, 70, 80);
$required-colors: ("transparent", "black", "white", "ink");
$theme-font-families: ("mono", "sans", "serif", "heading", "body", "code", "alt", "ui");
$theme-font-sizes: ("3xs", "2xs", "xs", "sm", "md", "lg", "xl", "2xl", "3xl");
$system-font-families: ("mono", "sans", "serif");
$system-font-sizes: (micro, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20);

@function add-color-token($tokens, $token) {
    @return map.merge($tokens, ($token: uswds.color($token)));
}

$tokens-color-system: ();
@each $family in $color-families {
    @if $family == "gray" or $family == "gray-cool" or $family == "gray-warm" {
        @each $grade in $gray-grades {
            $tokens-color-system: add-color-token($tokens-color-system, "#{$family}-#{$grade}");
        }
    } @else if $family == "black-transparent" or $family == "white-transparent" {
        @each $grade in $transparent-grades {
            $tokens-color-system: add-color-token($tokens-color-system, "#{$family}-#{$grade}");
        }
    } @else {
        @each $grade in $color-grades {
            $tokens-color-system: add-color-token($tokens-color-system, "#{$family}-#{$grade}");
        }
        @each $grade in $vivid-grades {
            $tokens-color-system: add-color-token($tokens-color-system, "#{$family}-#{$grade}v");
        }
    }
}

$tokens-color-required: ();
@each $token in $required-colors {
    $tokens-color-required: map.merge($tokens-color-required, ($token: uswds.color($token)));
}

$tokens-font-theme: ();
@each $family in $theme-font-families {
    @each $size in $theme-font-sizes {
        $tokens-font-theme: map.merge(
            $tokens-font-theme,
            ("#{$family}-#{$size}": uswds.font-size($family, $size))
        );
    }
}

$tokens-font-system: ();
@each $family in $system-font-families {
    @each $size in $system-font-sizes {
        $tokens-font-system: map.merge(
            $tokens-font-system,
            ("#{$family}-#{$size}": uswds.font-size($family, $size))
        );
    }
}

$theme-data: map.merge(
    $uswds-vars,
    (
        "tokens-color-system": $tokens-color-system,
        "tokens-color-required": $tokens-color-required,
        "tokens-font-theme": $tokens-font-theme,
        "tokens-font-system": $tokens-font-system
    )
);

:root {
    content: capture($theme-data);
}
`;

function removePrefix(from: string, source: string[]) {
    const regex = new RegExp(source.join("|"), "gi");
    return from.replace(regex, "");
}

function renameProp<T>(key: keyof T, source: T) {
    return source[key] ? source[key] : key;
}

function toCamelCase(s: string) {
    if (NO_CAMEL_CASE.includes(s)) {
        return s;
    }

    return s.replace(/-([a-z])/g, g => g[1].toUpperCase());
}

function formatNumber(value: number) {
    return Number.isInteger(value) ? value.toString() : Number(value.toFixed(6)).toString();
}

function formatSassColor(value: sass.SassColor) {
    const red = Math.round(value.channel("red", { space: "rgb" }));
    const green = Math.round(value.channel("green", { space: "rgb" }));
    const blue = Math.round(value.channel("blue", { space: "rgb" }));
    const alpha = value.channel("alpha");
    const toHex = (channel: number) => channel.toString(16).padStart(2, "0");

    if (alpha !== 1) {
        return `rgba(${red},${green},${blue},${formatNumber(alpha)})`;
    }

    return `#${toHex(red)}${toHex(green)}${toHex(blue)}`;
}

function sassValueToJson(value: sass.Value): JsonValue {
    if (value instanceof sass.SassString) {
        return value.text;
    }

    if (value instanceof sass.SassNumber) {
        const numerators = [...value.numeratorUnits].join("*");
        const denominators = [...value.denominatorUnits].join("*");
        const unit = denominators ? `${numerators}/${denominators}` : numerators;

        return unit ? `${formatNumber(value.value)}${unit}` : value.value;
    }

    if (value instanceof sass.SassColor) {
        return formatSassColor(value);
    }

    if (value instanceof sass.SassBoolean) {
        return value.value;
    }

    if (value === sass.sassNull || value.realNull === null) {
        return null;
    }

    const map = value.tryMap();
    if (map) {
        let object = {} as JsonObject;
        for (let [key, mapValue] of map.contents) {
            object[String(sassValueToJson(key))] = sassValueToJson(mapValue);
        }
        return object;
    }

    const list = value.asList;
    if (list.size !== 1 || value.hasBrackets || value.separator) {
        return list.toArray().map(sassValueToJson);
    }

    return value.toString();
}

async function readUSWDSVariables() {
    let captured: JsonValue | undefined;

    await sass.compileStringAsync(SASS_CAPTURE_FILE, {
        loadPaths: [PACKAGES_DIR],
        quietDeps: true,
        logger: { warn() {}, debug() {} },
        silenceDeprecations: [
            "import",
            "global-builtin",
            "mixed-decls",
            "color-functions",
            "abs-percent",
            "slash-div",
            "function-units",
            "legacy-js-api",
        ],
        functions: {
            "capture($value)": ([value]) => {
                captured = sassValueToJson(value);
                return new sass.SassString("ok");
            },
        },
    });

    if (!captured || typeof captured !== "object" || Array.isArray(captured)) {
        throw new Error("Unable to capture USWDS theme variables from Sass.");
    }

    return captured;
}

function parseFonts(obj: any) {
    return Object.keys(obj)
        .filter(key => obj[key].src)
        .reduce(
            (acc, key) => {
                const { "display-name": family, src } = obj[key];

                Object.keys(src)
                    .filter(style => style !== "dir")
                    .forEach(style => {
                        const weight = src[style];
                        const array = Object.keys(weight)
                            .filter(key => weight[key])
                            .map(key => ({
                                dir: src.dir,
                                family,
                                file: weight[key],
                                style: style === "roman" ? "normal" : style,
                                weight: key,
                            }));
                        acc.push(...array);
                    });

                return acc;
            },
            [] as { dir: any; family: any; file: any; style: string; weight: string }[],
        );
}

function parseValues(obj: any) {
    return Object.keys(obj)
        .filter(key => (obj[key] || obj[key] === 0) && !REMOVED_PROPS.includes(key))
        .map(key => key.replaceAll("$", ""))
        .reduce((acc, key) => {
            const newKey = removePrefix(
                renameProp(key as "breakpoints" | "noValue", RENAMED_PROPS),
                REMOVED_PREFIXES,
            );
            if (typeof obj[key] === "object") {
                if (obj[key].slug) {
                    if (obj[key].content) {
                        acc[obj[newKey].slug] = obj[key].content;
                    }
                } else {
                    acc[toCamelCase(newKey)] = parseValues(obj[key]);
                }
            } else {
                acc[newKey] = obj[key]?.toString();
            }

            return acc;
        }, {} as any);
}

function unflattenColors(obj: any) {
    return Object.keys(obj).reduce(
        (acc, key) => {
            const array = key.split("-");
            const value = array.pop()!;
            const newKey = array.join("-");

            return { ...acc, [newKey]: { ...acc[newKey], [value]: obj[key] } };
        },
        {} as Record<string, object>,
    );
}

async function generateTailwindTokens(variables: JsonObject) {
    let {
        allProjectColors,
        projectFontWeights,
        systemProperties,
        systemTypefaceTokens,
        tokensColorBasic,
        tokensColorRequired,
        // tokensColorState,
        tokensColorSystem,
        // tokensColorTheme,
        tokensFontSystem,
        tokensFontTheme,
    } = parseValues(variables);

    let colors = unflattenColors(tokensColorSystem);

    let theme = {
        ...systemProperties,
        borderWidth: {
            standard: {
                ...systemProperties.borderWidth.standard,
                ...systemProperties.border.standard,
            },
            extended: {
                ...systemProperties.borderWidth.extended,
                ...systemProperties.border.extended,
            },
        },
        colors: {
            standard: {
                ...allProjectColors,
                ...tokensColorBasic,
                ...tokensColorRequired,
            },
            extended: colors,
        },
        fontSize: {
            standard: tokensFontTheme,
            extended: tokensFontSystem,
        },
        fontWeight: {
            standard: projectFontWeights,
            extended: systemProperties.fontWeight.extended,
        },
        margin: {
            standard: {
                ...systemProperties.margin.standard,
                ...systemProperties.marginHorizontal.standard,
                ...systemProperties.marginVertical.standard,
            },
            extended: {
                ...systemProperties.margin.extended,
                ...systemProperties.marginHorizontal.extended,
                ...systemProperties.marginVertical.extended,
            },
        },
    };

    // For some reason, the boxShadow property gets corrupted during this processs
    // This is a temporary fix until a permenant fix is implemente in bundleSass or getSassVars
    let boxShadow = theme.boxShadow;
    let standard = boxShadow.standard;

    for (let key of Object.keys(standard)) {
        if (typeof standard[key] !== "object") continue;
        let corruptedValues = standard[key] as Record<string, string>;
        let values = Object.values(corruptedValues).join(" ");
        standard[key] = values;
    }

    theme = {
        ...theme,
        boxShadow: {
            standard: {
                ...standard,
            },
            extended: {
                ...boxShadow.extended,
            },
        },
    };

    return { fonts: parseFonts(systemTypefaceTokens), theme };
}

async function generateTheme() {
    let uswdsVariables = await readUSWDSVariables();
    return await generateTailwindTokens(uswdsVariables);
}

let { theme, fonts } = await generateTheme();

if (!fs.existsSync(DIR_PATH)) {
    await fs.promises.mkdir(DIR_PATH, { recursive: true });
}

await fs.promises.writeFile(
    path.resolve(`./tailwindcss-uswds/tokens/theme.json`),
    `${JSON.stringify(theme, null, 4)}\n`,
);

await fs.promises.writeFile(
    path.resolve(`./tailwindcss-uswds/tokens/fonts.json`),
    `${JSON.stringify(fonts, null, 4)}\n`,
);
