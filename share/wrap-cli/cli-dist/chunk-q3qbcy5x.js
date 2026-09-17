// @bun
import {
  init_AppState,
  useAppState
} from "./chunk-drtrgzzb.js";
import {
  getDefaultMainLoopModelSetting,
  init_growthbook,
  init_model,
  onGrowthBookRefresh,
  parseUserSpecifiedModel
} from "./chunk-necthexa.js";
import {
  require_react
} from "./chunk-1ekct4sm.js";
import {
  __esm,
  __toESM
} from "./chunk-hhsxm2yr.js";

// src/hooks/useMainLoopModel.ts
function useMainLoopModel() {
  const mainLoopModel = useAppState((s) => s.mainLoopModel);
  const mainLoopModelForSession = useAppState((s) => s.mainLoopModelForSession);
  const [, forceRerender] = import_react.useReducer((x) => x + 1, 0);
  import_react.useEffect(() => onGrowthBookRefresh(forceRerender), []);
  const model = parseUserSpecifiedModel(mainLoopModelForSession ?? mainLoopModel ?? getDefaultMainLoopModelSetting());
  return model;
}
var import_react;
var init_useMainLoopModel = __esm(() => {
  init_growthbook();
  init_AppState();
  init_model();
  import_react = __toESM(require_react(), 1);
});

export { useMainLoopModel, init_useMainLoopModel };

//# debugId=0D65FE6BC6ED092B64756E2164756E21
//# sourceMappingURL=chunk-q3qbcy5x.js.map
