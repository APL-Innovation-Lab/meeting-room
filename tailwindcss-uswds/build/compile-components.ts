import fs from "node:fs";
import path from "node:path";
import postcss from "postcss";
import * as sass from "sass";

import { COMPILE_WARNINGS_DISABLED, COMPILE_WARNINGS_ENABLED } from "./constants.ts";

const PACKAGES_DIR = path.resolve("./node_modules/@uswds/uswds/packages");
const DIR_PATH = path.resolve(`./tailwindcss-uswds/tokens/`);

const BUNDLE_FILE = `
@use "uswds";
`;

const COMPILED_COMPONENTS_PATH = path.resolve("./tailwindcss-uswds/tokens/components.css");
const COMPONENT_CLASSES_PATH = path.resolve("./tailwindcss-uswds/tokens/component-classes.json");

function remapURLs(css: string) {
    const ORIG_IMG_URL_PATTERN = 'url("../';
    const REPLACE_IMG_PATTERN = 'url("/';

    const ORIG_FONT_URL_PATTERN = "url(../";
    const REPLACE_FONT_PATTERN = "url(/";

    return css
        .replaceAll(ORIG_IMG_URL_PATTERN, REPLACE_IMG_PATTERN)
        .replaceAll(ORIG_FONT_URL_PATTERN, REPLACE_FONT_PATTERN);
}

async function compileUSWDSComponentStyles() {
    let compiledStyles = await sass.compileStringAsync(
        BUNDLE_FILE.replace(COMPILE_WARNINGS_ENABLED, COMPILE_WARNINGS_DISABLED),
        { loadPaths: [PACKAGES_DIR] },
    );
    return remapURLs(compiledStyles.css);
}

let css = await compileUSWDSComponentStyles();

// `@charset` is only valid at the very top of a standalone stylesheet. Once this
// CSS is inlined into Tailwind's `components` cascade layer (see app/styles/tailwind.css)
// it is invalid and the bundler rejects it, so strip it here.
css = css.replace(/@charset\s+["'][^"']*["'];\s*/gi, "");

if (!fs.existsSync(DIR_PATH)) await fs.promises.mkdir(DIR_PATH, { recursive: true });
await fs.promises.writeFile(COMPILED_COMPONENTS_PATH, css);

// Extract the USWDS component class names (the `usa-*` classes) defined in the
// compiled stylesheet. The plugin re-registers these as empty components so
// Tailwind v4 IntelliSense offers them as completions (the actual styles come from
// components.css). Tailwind v4 only surfaces classes that are part of its design
// system, and a raw @import'd stylesheet is not — so without this, usa-*
// autocomplete would be lost. We intentionally skip USWDS's utility classes
// (margin-*, grid-*, text-bold, …) since they duplicate Tailwind's own utilities.
let componentClasses = new Set<string>();
postcss.parse(css).walkRules(rule => {
    const parent = rule.parent;
    if (parent && parent.type === "atrule" && /keyframes$/i.test((parent as postcss.AtRule).name)) {
        return;
    }
    for (const match of rule.selector.matchAll(/\.(usa-[\w-]*)/g)) {
        componentClasses.add(match[1]);
    }
});

await fs.promises.writeFile(
    COMPONENT_CLASSES_PATH,
    JSON.stringify([...componentClasses].sort(), null, 4),
);
