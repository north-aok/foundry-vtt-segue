import { prepareContext } from "./util/handlers";
import { MODULE_ID } from "./constants";

/**
 * Injects new scene tab and content into SceneConfig
 * new tab reference: https://foundryvtt.wiki/en/development/guides/Tabs-and-Templates/Tabs-in-AppV2
 */
export function injectSceneConfig(): void {
    const config = (foundry.applications as any).sheets.SceneConfig;
    const parts = config.PARTS as Record<string, foundry.applications.api.HandlebarsApplicationMixin.HandlebarsTemplatePart>;

    // Rearrange footer, otherwise Save Changes button appears above the config hbs content
    const footer = parts.footer;
    delete parts.footer;
    parts.segue = {
        template: `modules/${MODULE_ID}/templates/scene-config.hbs`
    };
    parts.footer = footer;

    // tab definition
    config.TABS.sheet.tabs.push({
        id: "segue",
        label: "Segue",
        icon: "fa-regular fa-route",
    });

    // Register prepareContext
    libWrapper.register(
        MODULE_ID,
        "foundry.applications.sheets.SceneConfig.prototype._prepareContext",
        prepareContext
    );
}
