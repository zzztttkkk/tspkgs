import "./types.js";
declare global {
    namespace NodeJS {
        interface Process {
            RegisterBeforeShutdownAction: (action: Action) => void;
        }
    }
}
