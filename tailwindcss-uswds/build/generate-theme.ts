import type { JsonObject } from "get-sass-vars";
import getSassVars from "get-sass-vars";
import fs from "node:fs";
import path from "node:path";
import { Bundler } from "scss-bundle";
import { COMPILE_WARNINGS_DISABLED, COMPILE_WARNINGS_ENABLED } from "./constants";

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

function iterate<T extends Record<PropertyKey, any>>(
    object: T,
    apply: (key: keyof T, str: string) => any,
) {
    let newObj = {} as T;

    for (let key of Object.keys(object) as (keyof T)[]) {
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

type DirectoryPath = string;
type FilePath = string;

interface BundleSassOptions {
    directory: DirectoryPath;
    entryPoint: FilePath;
}

async function bundleSass({
    directory: projectDirectory,
    entryPoint,
}: BundleSassOptions): Promise<string> {
    const bundler = new Bundler(undefined, projectDirectory);
    const bundlerResult = await bundler.bundle(entryPoint);
    return bundlerResult.bundledContent!.replace(
        COMPILE_WARNINGS_ENABLED,
        COMPILE_WARNINGS_DISABLED,
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

    return { colors, fonts: parseFonts(systemTypefaceTokens), props };
}

interface GetTokensOptions {
    uswdsScss: FilePath;
}

async function generateTheme(options: GetTokensOptions) {
    let pathComponents = new URL(`file://$theme${options.uswdsScss}`).pathname.split("/");
    let entryPoint = pathComponents.pop()!;
    let directory = pathComponents.join("/");

    let bundledSass = await bundleSass({ directory, entryPoint });
    let uswdsVariables = iterate(
        await getSassVars(bundledSass, { camelize: true }),
        (key, value) => {
            if (key.toString().toLowerCase().includes("separator")) return value;
            return JSON.parse(value);
        },
    );
    return await generateTailwindTokens(uswdsVariables);
}

let { props, fonts } = await generateTheme({
    uswdsScss: path.resolve("./node_modules/uswds/src/stylesheets/uswds.scss"),
});

const DIR_PATH = path.resolve(`./tailwindcss-uswds/tokens/`);

if (!fs.existsSync(DIR_PATH)) {
    await fs.promises.mkdir(DIR_PATH, { recursive: true });
}

await fs.promises.writeFile(
    path.resolve(`./tailwindcss-uswds/tokens/props.json`),
    JSON.stringify(props, null, 4),
);

await fs.promises.writeFile(
    path.resolve(`./tailwindcss-uswds/tokens/fonts.json`),
    JSON.stringify(fonts, null, 4),
);
