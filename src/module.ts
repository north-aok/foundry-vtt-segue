import { SegueManager } from './SegueManager';
import { ConfigurationManager } from "./ConfigurationManager";
import { MODULE_ID, MODULE_NAME } from './constants';
import { injectSceneConfig } from './injectSceneConfig';
import { getSceneFromLi } from './util/ui';

let segueSocket: any;

Hooks.once('init', () => {
    // CONFIG.debug.hooks = true;

    // ===============================================================================================
    // #region socketlib Init
    // ===============================================================================================

    segueSocket = window.socketlib.registerModule(MODULE_ID);
    // console.log(`${MODULE_NAME} | initialized socketlib for module: ${MODULE_ID}`);

    segueSocket.register("startSegue", async (sceneId: string) => {
        // console.log(`${MODULE_NAME} | socketlib received 'startSegue' for scene ID: ${sceneId}`);
        const scene = game.scenes?.get(sceneId);

        if (!scene) {
            console.warn(`${MODULE_NAME} | Socketlib: Could not find scene with ID ${sceneId}`);
            return;
        }

        // prevent segue if the scene is already active
        // notifies the GM only. clients/players will be unaware of anything happening
        if (canvas.scene?.id === scene.id) {
            if (game.user?.isGM) {
                ui.notifications.info(`${MODULE_NAME} | Target scene "${scene.name}" is already active. Segue NOT proceeding.`);
            }
            return;
        }

        // retrieve config on the receiving client
        const sceneConfig = ConfigurationManager.getSceneConfiguration(scene);

        // check if segue is enabled for the gm for this scene
        // const disableSegueForGM = game.settings.get(MODULE_ID, "disableSegueForGM");

        // TODO: future release (maybe)
        // if segue is not enabled for the gm, notify the GM and return for all clients and GM
        // if (game.user?.isGM && disableSegueForGM) {
        //     ui.notifications.info(`${MODULE_NAME} | Players are now viewing the segue...`);
        //     await scene.activate();
        // } else {
        // execute segue only if it's enabled for the scene
        await SegueManager.executeFullSegue(scene, {
            displayText: sceneConfig.displayText,
            fadeOutDuration: sceneConfig.fadeOutDuration,
            textDisplayDuration: sceneConfig.textDisplayDuration,
            fadeInDuration: sceneConfig.fadeInDuration,
            textSize: sceneConfig.textSize,
            textColor: sceneConfig.textColor,
            fontFamily: sceneConfig.fontFamily,
            textFadeInDuration: sceneConfig.textFadeInDuration,
            textFadeOutDuration: sceneConfig.textFadeOutDuration
        });
        // }
    });

    // ===============================================================================================
    // #endregion Socketlib Init
    // ===============================================================================================

    // register global module settings
    ConfigurationManager.registerSettings();

    // preload template
    foundry.applications.handlebars.loadTemplates([
        `modules/${MODULE_ID}/templates/scene-config.hbs`
    ]);
});

Hooks.once('ready', () => {
    const segueVersion = game.modules.get(MODULE_ID)?.version ?? "unknown";
    console.log(`%c🎬 ${MODULE_NAME} | ${segueVersion} Ready`, "color: orange; font-weight: bold;");
    
    // injects new Segue tab and content into scene configuration menu
    injectSceneConfig();
});

Hooks.on('getSceneContextOptions', (directory: SceneDirectory, options: ContextMenuEntry[]) => {
    // console.log(`%c${MODULE_NAME} | getSceneContextOptions hook fired`, "color: green; font-weight: bold;");
    // console.log(`${MODULE_NAME} | hook parameters:`, { directory, options });

    options.push({
        name: "Segue",
        icon: '<i class="fas fa-film"></i>',
        condition: (li: JQuery<HTMLElement> | HTMLElement) => {
            return game.user?.isGM;
        },
        callback: async (li: JQuery<HTMLElement> | HTMLElement) => {
            const scene = getSceneFromLi(li);

            if (!scene) {
                // console.error(`${MODULE_NAME} | context menu callback: could not find scene.`);
                ui.notifications.error(game.i18n.localize("SEGUE.Notifications.SceneNotFound"));
                return;
            }

            // console.log(`${MODULE_NAME} | context menu callback fired for scene: ${scene.name}`);

            // grab current scene config
            const sceneConfig = ConfigurationManager.getSceneConfiguration(scene);

            // check is Segue is enabled for the scene
            if (!sceneConfig.enabled) {
                ui.notifications.info(game.i18n.localize("SEGUE.Notifications.SegueNotEnabled"));
                return;
            }

            // ===============================================================================================
            // #region Emit Socket Event 
            // ===============================================================================================

            // executeForEveryone event
            if (segueSocket) {
                // console.log(`${MODULE_NAME} | calling socketlib 'startSegue' for scene ID: ${scene.id}`);
                await segueSocket.executeForEveryone("startSegue", scene.id);
            } else {
                console.error(`${MODULE_NAME} | segueSocket failed to intialize`);
                ui.notifications.error(`${MODULE_NAME} | segueSocket failed to initialize.`);
            }

            // ===============================================================================================
            // #endregion Emit Socket Event 
            // ===============================================================================================
        }
    });

    return options;
});
