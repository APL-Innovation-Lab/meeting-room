import fs from "node:fs";
import path from "node:path";
import postcss from "postcss";
import postcssJs from "postcss-js";
import * as sass from "sass";

import { COMPILE_WARNINGS_DISABLED, COMPILE_WARNINGS_ENABLED } from "./constants.ts";

const PACKAGES_DIR = path.resolve("./node_modules/@uswds/uswds/packages");
const DIR_PATH = path.resolve(`./tailwindcss-uswds/tokens/`);

const BUNDLE_FILE = `
@use "uswds";
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
    let compiledStyles = await sass.compileStringAsync(
        BUNDLE_FILE.replace(COMPILE_WARNINGS_ENABLED, COMPILE_WARNINGS_DISABLED),
        { loadPaths: [PACKAGES_DIR] },
    );
    return remapURLs(compiledStyles.css);
}

let css = await compileUSWDSComponentStyles();
let cssJson = postcssJs.objectify(postcss.parse(css));
if (!fs.existsSync(DIR_PATH)) await fs.promises.mkdir(DIR_PATH, { recursive: true });
await fs.promises.writeFile(COMPILED_COMPONENTS_PATH, JSON.stringify(cssJson, null, 4));
