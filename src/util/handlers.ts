import { ConfigurationManager } from "../ConfigurationManager";
import { SEGUE_FONTS } from "./fonts";


/**
 * Wrapper around Foundry default _prepareContext
 * Gets config from ConfigurationManager and adds in custom fonts along with those found in CONFIG.fontDefinitions
 * w/r/t fonts, this method is cleaner than registering all custom fonts within the init hook, which make them available to ALL aspects of Foundry
 * and muddyied up the editor (e.g. journals) with a giant unscrollable font list.
 * 
 * TODO: add definitions to replace 'any' types
 * 
 * @this {SceneConfig} The Scene Configuration form instance for which the context is being prepared.
 * @param {Function} wrapped - The original _prepareContext method being wrapped.
 * @param {...any} args - Arguments passed to the original _prepareContext method.
 * @returns {Promise<any>} The modified context object with Segue configuration and font list added.
 *
 * @see injectSceneConfig
 * @see ConfigurationManager.getSceneConfiguration
 * @see CONFIG.fontDefinitions
 * @see SEGUE_FONTS
 */
export async function prepareContext(
    this: SceneConfig,
    wrapped: (...args: any[]) => Promise<any>,
    ...args: any[]
): Promise<any> {
    // console.log(`${MODULE_ID} | prepareContext called`);

    const context = await wrapped(...args);
    const config = ConfigurationManager.getSceneConfiguration(this.document);

    context.segue = config;

    // grab all default (or registered by other modules) fonts
    let defaultFonts: FontArray = [];
    if (CONFIG.fontDefinitions) {
        defaultFonts = Object.entries(CONFIG.fontDefinitions).map(([key, value]) => ({
            value: key,
            label: value.family || key
        }));
    }

    // merge with fonts defined in fonts.ts/main.css
    const allFonts = [...defaultFonts, ...SEGUE_FONTS];

    // remove duplicates, if any
    const uniqueSet = new Set<string>();
    context.fontFamilies = allFonts.filter(font => {
        if (uniqueSet.has(font.value)) {
            return false;
        }
        uniqueSet.add(font.value);
        return true;
    });

    // sort the final merged array of default and custom fonts
    context.fontFamilies.sort((a, b) => a.label.localeCompare(b.label));

    // console.table(context.fontFamilies);

    // unused, left for reference
    // registering fonts directly within the init hook to CONFIG.fontDefinitions muddies up the registered fonts within text editors throughout Foundry,
    // and the font window within a journal editor (for example) isn't scrollable, meaning a giant list of fonts made the font picker unusable
    // 
    // dynamically set the font families based on CONFIG.fontDefinitions. new fonts (in assets/fonts/) are registered in init hook (see custom fonts region in src/module.ts)
    // CONFIG.fontDefinitions also contains fonts registered by Foundry (included default fonts, Signika, Modesto, etc)
    // if (CONFIG.fontDefinitions && typeof CONFIG.fontDefinitions === "object") {
    //     context.fontFamilies = Object.entries(CONFIG.fontDefinitions)
    //         .map(([key, def]) => ({
    //             value: key,
    //             label: def.family || key
    //         }))
    //         .sort((a, b) => a.label.localeCompare(b.label));
    // } else {
    //     context.fontFamilies = []; // fallback or default
    // }

    return context;
}