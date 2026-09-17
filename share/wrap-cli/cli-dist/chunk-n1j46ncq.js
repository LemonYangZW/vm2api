// @bun
import {
  init_useKeybinding
} from "./chunk-2m7k0qdy.js";
import {
  init_src,
  require_react,
  useDoublePress,
  useKeybindings,
  use_app_default
} from "./chunk-1ekct4sm.js";
import {
  __esm,
  __toESM
} from "./chunk-hhsxm2yr.js";

// src/hooks/useDoublePress.ts
var init_useDoublePress = __esm(() => {
  init_src();
  init_src();
});

// src/hooks/useExitOnCtrlCD.ts
function useExitOnCtrlCD(useKeybindingsHook, onInterrupt, onExit, isActive = true) {
  const { exit } = use_app_default();
  const [exitState, setExitState] = import_react.useState({
    pending: false,
    keyName: null
  });
  const exitFn = import_react.useMemo(() => onExit ?? exit, [onExit, exit]);
  const handleCtrlCDoublePress = useDoublePress((pending) => setExitState({ pending, keyName: "Ctrl-C" }), exitFn);
  const handleCtrlDDoublePress = useDoublePress((pending) => setExitState({ pending, keyName: "Ctrl-D" }), exitFn);
  const handleInterrupt = import_react.useCallback(() => {
    if (onInterrupt?.())
      return;
    handleCtrlCDoublePress();
  }, [handleCtrlCDoublePress, onInterrupt]);
  const handleExit = import_react.useCallback(() => {
    handleCtrlDDoublePress();
  }, [handleCtrlDDoublePress]);
  const handlers = import_react.useMemo(() => ({
    "app:interrupt": handleInterrupt,
    "app:exit": handleExit
  }), [handleInterrupt, handleExit]);
  useKeybindingsHook(handlers, { context: "Global", isActive });
  return exitState;
}
var import_react;
var init_useExitOnCtrlCD = __esm(() => {
  init_src();
  init_useDoublePress();
  import_react = __toESM(require_react(), 1);
});

// src/hooks/useExitOnCtrlCDWithKeybindings.ts
function useExitOnCtrlCDWithKeybindings(onExit, onInterrupt, isActive) {
  return useExitOnCtrlCD(useKeybindings, onInterrupt, onExit, isActive);
}
var init_useExitOnCtrlCDWithKeybindings = __esm(() => {
  init_useKeybinding();
  init_useExitOnCtrlCD();
});

export { init_useDoublePress, useExitOnCtrlCDWithKeybindings, init_useExitOnCtrlCDWithKeybindings };

//# debugId=130DDFA55F597DAF64756E2164756E21
//# sourceMappingURL=chunk-n1j46ncq.js.map
