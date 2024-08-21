import fs from "node:fs";
import path from "node:path";
import postcss from "postcss";
import postcssJs from "postcss-js";
import * as sass from "sass";
import { Bundler } from "scss-bundle";
import { COMPILE_WARNINGS_DISABLED, COMPILE_WARNINGS_ENABLED } from "./constants";

const PROJECT_DIR = path.resolve("./node_modules/uswds/src/stylesheets");
const DIR_PATH = path.resolve(`./tailwindcss-uswds/tokens/`);

const BUNDLE_FILE_PATH = "./uswds-components.scss";
const BUNDLE_FILE_RESOLVED_PATH = `${PROJECT_DIR}/${BUNDLE_FILE_PATH.substring(2, BUNDLE_FILE_PATH.length)}`;
const BUNDLE_FILE = `
    @import "packages/required";
    @import "packages/global";
    @import "packages/uswds-components";
`;

const COMPILED_COMPONENTS_PATH = path.resolve("./tailwindcss-uswds/tokens/components.json");

function remapURLs(css: string) {
    const ORIG_IMG_URL_PATTERN = 'url("../';
    const REPLACE_IMG_PATTERN = 'url("/';

    const ORIG_FONT_URL_PATTERN = "url(../";
    const REPLACE_FONT_PATTERN = "url(/";

    return css
        .replaceAll(ORIG_IMG_URL_PATTERN, REPLACE_IMG_PATTERN)
        .replaceAll(ORIG_FONT_URL_PATTERN, REPLACE_FONT_PATTERN);
}

async function compileUSWDSComponentStyles(
    {
        fontsDirectory = "../fonts",
    }: {
        fontsDirectory?: string;
    } = { fontsDirectory: "../fonts" },
) {
    await fs.promises.writeFile(BUNDLE_FILE_RESOLVED_PATH, BUNDLE_FILE);

    let bundler = new Bundler(undefined, PROJECT_DIR);
    let bundlerResult = await bundler.bundle(BUNDLE_FILE_PATH);
    let bundledScss = bundlerResult.bundledContent!.replace(
        COMPILE_WARNINGS_ENABLED,
        COMPILE_WARNINGS_DISABLED,
    );

    await fs.promises.rm(BUNDLE_FILE_RESOLVED_PATH);

    let compiledStyles = await sass.compileStringAsync(bundledScss);
    return remapURLs(compiledStyles.css);
}

let css = await compileUSWDSComponentStyles();
let cssJson = postcssJs.objectify(postcss.parse(css));
if (!fs.existsSync(DIR_PATH)) await fs.promises.mkdir(DIR_PATH, { recursive: true });
await fs.promises.writeFile(COMPILED_COMPONENTS_PATH, JSON.stringify(cssJson, null, 4));
