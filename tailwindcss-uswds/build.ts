/* eslint-disable @typescript-eslint/no-unused-vars */
import { transform } from "lightningcss";
import fs from "node:fs";
import path from "node:path";
import * as sass from "sass";
import { Bundler } from "scss-bundle";

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
const BUNDLED_SCSS = path.resolve("./dist/uswds-full.bundled.scss");
const BUNDLED_COMPONENTS = path.resolve("./dist/uswds-components.css");

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

function iterate(object: any, apply: (key: string, str: string) => any) {
    let newObj = {} as any;

    for (let key of Object.keys(object)) {
        if (object.hasOwnProperty(key)) {
            if (typeof object[key] === "object") {
                newObj[key] = iterate(object[key], (k, v) => apply(k, v));
            } else if (typeof object[key] === "string") {
                newObj[key] = apply(key, object[key]);
            }
        }
    }

    return newObj;
}

async function bundleSass({ outputPath }: { outputPath: string }) {
    const projectDirectory = path.resolve("./node_modules/uswds/src/stylesheets");
    const bundler = new Bundler(undefined, projectDirectory);
    const result = await bundler.bundle("./uswds.scss");
    await fs.promises.writeFile(outputPath, result.bundledContent!);
}

async function bundleUSWDSComponentSass({
    outputPath,
    fontsDirectory = "./fonts",
}: {
    outputPath: string;
    fontsDirectory?: string;
}) {
    let projectDirectory = path.resolve("./node_modules/uswds/src/stylesheets");
    await fs.promises.writeFile(
        path.resolve(`${projectDirectory}/uswds-components.scss`),
        `
        @import "packages/required";
        @import "packages/global";
        @import "packages/uswds-components";
        `,
    );

    let bundler = new Bundler(undefined, projectDirectory);
    let bundlerResult = await bundler.bundle("./uswds-components.scss");
    let bundledScss = bundlerResult.bundledContent!.replace(
        `$theme-show-compile-warnings: true !default;\n$theme-show-notifications: true !default;`,
        `$theme-show-compile-warnings: false !default;\n$theme-show-notifications: false !default;`,
    );

    let compiledStyles = await sass.compileStringAsync(bundledScss);

    let { code: rawCSS } = transform({
        filename: "uswds-components.css",
        code: Buffer.from(compiledStyles.css),
        minify: true,
    });

    let css = new TextDecoder().decode(rawCSS).replaceAll("../fonts", fontsDirectory);
    await fs.promises.writeFile(outputPath, css);
}

async function exportTokens(parsed: any) {
    await fs.promises.writeFile(
        path.resolve(`./dist/tokens.json`),
        JSON.stringify(parsed, null, 4),
    );
}

async function exportTailwindJson(parsed: any) {
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
    } = parseValues(parsed);

    let colors = unflattenColors(tokensColorSystem);

    let props = {
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

    let tailwindConfig = { colors, fonts: parseFonts(systemTypefaceTokens), props };

    for (let key of Object.keys(tailwindConfig)) {
        fs.promises.writeFile(
            path.resolve(`./dist/${key}.json`),
            JSON.stringify(tailwindConfig[key as keyof typeof tailwindConfig], null, 4),
        );
    }
}

// await bundleSass({ outputPath: BUNDLED_SCSS });

// let uswdsVariables = iterate(
//     await getSassVars(await fs.promises.readFile(BUNDLED_SCSS, "utf-8"), {
//         camelize: true,
//     }),
//     (key, value) => {
//         if (key.toLowerCase().includes("separator")) return value;
//         return JSON.parse(value);
//     },
// );

// await exportTailwindJson(uswdsVariables);
// await exportTokens(uswdsVariables);

// await fs.promises.rm(path.resolve("./dist/uswds.bundled.scss"));

await bundleUSWDSComponentSass({ outputPath: BUNDLED_COMPONENTS });
