export interface SegueParameters {
    displayText: string;
    fadeOutDuration: number;
    textDisplayDuration: number;
    fadeInDuration: number;
    textSize: number;
    textColor: string;
    fontFamily: string;
    textFadeInDuration: number;
    textFadeOutDuration: number;
}

export interface SegueSceneConfig {
    enabled: boolean;
    displayText: string;
    fadeOutDuration: number;
    textDisplayDuration: number;
    fadeInDuration: number;
    textSize: number;
    textColor: string;
    fontFamily: string;
    textFadeInDuration: number;
    textFadeOutDuration: number;
}

// define segueSocket (see module.ts > #socketlib Init)
declare global {
    interface Window {
        socketlib: {
            registerModule: (module: string) => {
                executeForEveryone: (fnName: string, ...args: any[]) => Promise<any>;
                register: (fnName: string, callback: (...args: any[]) => Promise<any> | any) => void;
            };
        };
    }
}