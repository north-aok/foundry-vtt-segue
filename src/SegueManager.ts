import { MODULE_ID, MODULE_NAME } from "./constants";
import { SegueParameters } from "./interfaces";

/**
 * Manages the full scene segue animation, including fade out/in, displaying text, etc.
 */
export class SegueManager {

    /**
     * Executes a full segue animation to transition to a new scene.
     * 
     * @param scene The target Scene document 
     * @param options Configuration options
     * @param options.displayText The text to display
     * @param options.fadeOutDuration The duration of the fade out from the current scene (ms)
     * @param options.textDisplayDuration The duration the text is displayed (ms)
     * @param options.fadeInDuration The duration of the fade in to the new scene (ms)
     * @param options.textSize The font size
     * @param options.textColor The color of the text
     * @param options.fontFamily The font family
     * @param options.textFadeInDuration Duration of text fade in (ms)
     * @param options.textFadeOutDuration Duration of text fade out (ms)
     * 
     * @see ConfigurationManager
     * @see interfaces
     */
    static async executeFullSegue(scene: Scene, options: SegueParameters) {
        console.log(`%c🎬 ${MODULE_NAME} | Initiating Segue to ${scene.name}`, "color: orange; font-weight: bold;");
        // console.log(`${MODULE_NAME} | segue Options:`, options);

        // prevent segue if the scene is already active
        // !! MOVED !! to socketlib registration in init hook so all clients (including the gm) don't execute the segue on an active scene
        // if (canvas.scene?.id === scene.id) {
        //     if (game.user?.isGM) {
        //         ui.notifications.warn(`${MODULE_NAME} | Target scene "${scene.name}" is already active. Segue NOT proceeding...`);
        //     }
        //     return;
        // }

        const {
            displayText,
            fadeOutDuration,
            textDisplayDuration,
            fadeInDuration,
            textSize,
            textColor,
            fontFamily,
            textFadeInDuration,
            textFadeOutDuration
        } = options;

        // create overlay for transition
        const overlay = $('<div class="segue-overlay"></div>');
        const textElement = $(`<div class="segue-text">${displayText}</div>`);

        // TODO: clean this up... the logic/wording is slightly confusing
        // check gm setting for over/under Foundry UI elements. Default Foundry UI has z-index=30, Foundry UI notifications have z-index=99999
        const overUI = game.settings.get(MODULE_ID, 'segueOverUI');
        const gmUnderUI = game.settings.get(MODULE_ID, 'gmSegueUnderUI');

        let overlayZIndex: number;

        // if (overUI) {
        //     // Global setting: always display overlay above UI
        //     overlayZIndex = 99999;
        // } else {
        //     if (game.user?.isGM) {
        //         // GM-specific override: display under UI if gmUnderUI is true
        //         overlayZIndex = gmUnderUI ? 29 : 99999;
        //     } else {
        //         // Players: always display overlay above UI
        //         overlayZIndex = 99999;
        //     }
        // }

        if (overUI) {
            overlayZIndex = 99999;
        } else {
            overlayZIndex = 29;
        }

        if (game.user?.isGM) {
            if (gmUnderUI) {
                overlayZIndex = 29;
            } else {
                overlayZIndex = 99999;
            }
        }

        // const overlayZIndex = overUI ? 99999 : 29;

        overlay.css({
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'black',
            opacity: 0,
            zIndex: overlayZIndex
        });

        // wait for css loading of font family/size
        await document.fonts.load(`${textSize}px "${fontFamily}"`);

        textElement.css({
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: '80%',
            whiteSpace: 'pre-line',
            transform: 'translate(-50%, -50%)',
            color: textColor,
            fontSize: `${textSize}px`,
            textAlign: 'center',
            textShadow: '2px 2px 4px rgba(0,0,0,0.7)',
            opacity: 0,
            fontFamily: fontFamily
        });

        // add text to overlay and append
        overlay.append(textElement);
        $('body').append(overlay);

        // delay helper
        const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

        // execute the configured Segue
        try {
            // console.log(`${MODULE_NAME} | fading out current scene (${fadeOutDuration}ms)...`);
            await overlay.animate({ opacity: 1 }, fadeOutDuration, 'linear').promise();

            if (game.user?.isGM) {
                // console.log(`${MODULE_NAME} | activating new scene: ${scene.name}...`);
                await scene.activate();
            } else {
                console.log(`${MODULE_NAME} | Player awaiting GM scene activation for: ${scene.name}...`);
            }

            // load new scene canvas in background
            const canvasReadyPromise = new Promise<void>(resolve => {
                const hookId = Hooks.once('canvasReady', (canvas) => {
                    if (canvas.scene?.id === scene.id) {
                        console.log(`%c🎬 ${MODULE_NAME} | ${canvas.scene.name} canvas ready in background`, "color: orange; font-weight: bold;");
                        // deregister hook to hopefully cover edge cases, like the player switching scenes themselves
                        Hooks.off('canvasReady', hookId);
                        resolve();
                    } else {
                        console.warn(`${MODULE_NAME} | canvasReady fired for incorrect scene (${canvas.scene?.name || 'N/A'})`);
                        Hooks.off('canvasReady', hookId);
                        resolve();
                    }
                });

                // some tweaking on Math.max needs to happen here to implement a GM only disable segue animation
                // currently, with a gm disable flag enabled, there is a delay (black screen) for a bit on the connected clients before the new scene fades in
                setTimeout(() => {
                    if (canvas.scene?.id !== scene.id) {
                        console.warn(`${MODULE_NAME} | canvasReady timeout for scene ${scene.name}`);
                    }
                    Hooks.off('canvasReady', hookId);
                    resolve();
                }, Math.max(5000, fadeOutDuration + textDisplayDuration + fadeInDuration + 2000));
            });

            // immediately start/fade-in text display while new canvas is loading behind overlay
            const textDisplayPromise = (async () => {
                if (displayText) {
                    await textElement.animate({ opacity: 1 }, textFadeInDuration, 'linear').promise();
                    await delay(Math.max(0, textDisplayDuration - 1000));
                    await textElement.animate({ opacity: 0 }, textFadeOutDuration, 'linear').promise();
                } else {
                    // no text provided, give a slight delay to avoid jank
                    await delay(500);
                }
            })();

            // wait for canvas loading and text display to complete
            await Promise.all([canvasReadyPromise, textDisplayPromise]);

            // fade into new scene
            await overlay.animate({ opacity: 0 }, fadeInDuration, 'linear').promise();

        } catch (error: any) {
            console.error(`${MODULE_NAME} | Error during segue:`, error);

            // notify GM on failure
            ui.notifications.error(game.i18n.localize(`SEGUE.Notifications.SegueFailed`) + ": " + (error as Error).message);

        } finally {
            // clean up
            overlay.remove();
            console.log(`%c🎬 ${MODULE_NAME} | Segue to ${scene.name} complete!`, "color: orange; font-weight: bold;");
        }
    }
}