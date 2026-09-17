// @bun
import {
  applyConfigEnvironmentVariables,
  init_managedEnv
} from "./chunk-92frfsdm.js";
import {
  init_sessionState,
  notifyPermissionModeChanged,
  notifySessionMetadataChanged
} from "./chunk-xah6e91t.js";
import {
  clearApiKeyHelperCache,
  clearAwsCredentialsCache,
  clearGcpCredentialsCache,
  getGlobalConfig,
  init_PermissionMode,
  init_auth,
  init_config1 as init_config,
  permissionModeFromString,
  saveGlobalConfig,
  toExternalPermissionMode
} from "./chunk-ghhmj79c.js";
import {
  init_log,
  logError
} from "./chunk-mhjmeh6r.js";
import {
  init_errors,
  toError
} from "./chunk-82pkdrt0.js";
import {
  init_state,
  setMainLoopModelOverride
} from "./chunk-v4e7ch76.js";

// src/state/onChangeAppState.ts
init_state();
init_auth();
init_config();
init_errors();
init_log();
init_managedEnv();
init_PermissionMode();
init_sessionState();
function externalMetadataToAppState(metadata) {
  return (prev) => ({
    ...prev,
    ...typeof metadata.permission_mode === "string" ? {
      toolPermissionContext: {
        ...prev.toolPermissionContext,
        mode: permissionModeFromString(metadata.permission_mode)
      }
    } : {},
    ...typeof metadata.is_ultraplan_mode === "boolean" ? { isUltraplanMode: metadata.is_ultraplan_mode } : {}
  });
}
function onChangeAppState({
  newState,
  oldState
}) {
  const prevMode = oldState.toolPermissionContext.mode;
  const newMode = newState.toolPermissionContext.mode;
  if (prevMode !== newMode) {
    const prevExternal = toExternalPermissionMode(prevMode);
    const newExternal = toExternalPermissionMode(newMode);
    if (prevExternal !== newExternal) {
      const isUltraplan = newExternal === "plan" && newState.isUltraplanMode && !oldState.isUltraplanMode ? true : null;
      notifySessionMetadataChanged({
        permission_mode: newExternal,
        is_ultraplan_mode: isUltraplan
      });
    }
    notifyPermissionModeChanged(newMode);
  }
  if (newState.mainLoopModel !== oldState.mainLoopModel) {
    setMainLoopModelOverride(newState.mainLoopModel);
  }
  if (newState.expandedView !== oldState.expandedView) {
    const showExpandedTodos = newState.expandedView === "tasks";
    const showSpinnerTree = newState.expandedView === "teammates";
    if (getGlobalConfig().showExpandedTodos !== showExpandedTodos || getGlobalConfig().showSpinnerTree !== showSpinnerTree) {
      saveGlobalConfig((current) => ({
        ...current,
        showExpandedTodos,
        showSpinnerTree
      }));
    }
  }
  if (newState.verbose !== oldState.verbose && getGlobalConfig().verbose !== newState.verbose) {
    const verbose = newState.verbose;
    saveGlobalConfig((current) => ({
      ...current,
      verbose
    }));
  }
  if (process.env.USER_TYPE === "ant") {
    if (newState.tungstenPanelVisible !== oldState.tungstenPanelVisible && newState.tungstenPanelVisible !== undefined && getGlobalConfig().tungstenPanelVisible !== newState.tungstenPanelVisible) {
      const tungstenPanelVisible = newState.tungstenPanelVisible;
      saveGlobalConfig((current) => ({ ...current, tungstenPanelVisible }));
    }
  }
  if (newState.settings !== oldState.settings) {
    try {
      clearApiKeyHelperCache();
      clearAwsCredentialsCache();
      clearGcpCredentialsCache();
      if (newState.settings.env !== oldState.settings.env) {
        applyConfigEnvironmentVariables();
      }
    } catch (error) {
      logError(toError(error));
    }
  }
}

export { externalMetadataToAppState, onChangeAppState };

//# debugId=75F84598A2A6C58164756E2164756E21
//# sourceMappingURL=chunk-x3zesw94.js.map
