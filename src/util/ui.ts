/**
 * Returns the correct scene document from html <li> element
 * @param li The <li> element for a scene
 * @returns A game.scene document
 */
export function getSceneFromLi(li: JQuery | HTMLElement): Scene | undefined {
    const jqueryLi = $(li);
    const sceneId = jqueryLi.data('sceneId') || jqueryLi.data('entryId') || jqueryLi.data('documentId');

    if (!sceneId) {
        return undefined;
    }
    const scene = game.scenes?.get(sceneId);
    if (!scene) {
        return undefined;
    }
    return scene;
}