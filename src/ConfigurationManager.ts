import { MODULE_ID } from "./constants";
import { SegueSceneConfig } from "./interfaces";

// default segue values, left here for convenience
export const DEFAULT_SEGUE_SCENE_CONFIG: SegueSceneConfig = {
    enabled: false,
    displayText: '',
    fadeOutDuration: 2000,
    textDisplayDuration: 4000,
    fadeInDuration: 2000,
    textSize: 48,
    textColor: '#CFC3AA',
    fontFamily: 'Goudy Bookletter',
    textFadeInDuration: 1000,
    textFadeOutDuration: 1000
};

export class ConfigurationManager {

    static registerSettings(): void {

        // ===============================================================================================
        // #region Module Settings
        // ===============================================================================================

        // Segue Over UI for players global setting
        game.settings.register(MODULE_ID, "segueOverUI", {
            name: "SEGUE.GlobalSettings.SegueOverUI.Name",
            hint: "SEGUE.GlobalSettings.SegueOverUI.Hint",
            scope: "world",
            config: true,
            type: Boolean,
            default: true
        });

        // Segue Under UI for GM only global setting
        game.settings.register(MODULE_ID, "gmSegueUnderUI", {
            name: game.i18n.localize("SEGUE.GlobalSettings.gmSegueUnderUI.Name"),
            hint: game.i18n.localize("SEGUE.GlobalSettings.gmSegueUnderUI.Hint"),
            scope: "world",
            config: true,
            type: Boolean,
            default: true
        });

        // TODO: future release (maybe) - add disable segue animation setting for GMs only (players will always see the segue animation)
        // timing issue: a noticeable delay is added at the end of the segue for the client/player, which needs to be addressed in the Math.max canvasReadyPromise in SegueManager.executeFullSegue
        // game.settings.register(MODULE_ID, "disableSegueForGM", {
        //     name: "Disable segue animation for GM only",
        //     hint: "If enabled, GMs will not see the segue animation (players still will)",
        //     scope: "world",
        //     config: true,
        //     default: false,
        //     type: Boolean,
        // });

        // ===============================================================================================
        // #endregion Module Settings
        // ===============================================================================================
    }

    /**
     * Retrieves the complete Segue config for a given scene
     * Combines the default configuration with any local flags set by the user/gm on the scene itself
     * 
     * @param scene The Scene document ID to get the configuration for.
     * @returns A complete SegueSceneConfig object.
     * 
     * @see interfaces
     */
    static getSceneConfiguration(scene: Scene): SegueSceneConfig {
        const flags = scene.flags as Record<string, unknown>;

        // see what flags have been set by the user
        const moduleFlags = flags[MODULE_ID] as Partial<SegueSceneConfig> | undefined;

        // if no flags are set, return defaults
        if (!moduleFlags) return { ...DEFAULT_SEGUE_SCENE_CONFIG };

        // merge defaults with user selected options while ignoring null/undefined/empty-string
        const merged: SegueSceneConfig = { ...DEFAULT_SEGUE_SCENE_CONFIG };

        for (const [key, defaultValue] of Object.entries(DEFAULT_SEGUE_SCENE_CONFIG)) {
            const override = moduleFlags[key];

            if (override !== null && override !== undefined && !(typeof override === 'string' && override.trim() === '')) {
                merged[key as keyof SegueSceneConfig] = override as any;
            }
        }

        return merged;
    }

    // kept for reference
    // static getSceneConfiguration(scene: Scene): SegueSceneConfig {
    //     const moduleFlags = (scene.flags as Record<string, any>)[MODULE_ID] as Partial<SegueSceneConfig> | undefined;
    //     return {
    //         ...DEFAULT_SEGUE_SCENE_CONFIG,
    //         ...(moduleFlags || {})
    //     };
    // }

    // unused for now (forever?) using foundry flags instead
    // static async setSceneConfiguration(scene: Scene, config: Partial<SegueSceneConfig>): Promise<Scene | undefined> {
    //     return await scene.setFlag(MODULE_ID, "", config);
    // }
}