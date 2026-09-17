// @bun
import {
  disableAllPlugins,
  disablePlugin,
  enablePlugin,
  installPlugin,
  uninstallPlugin,
  updatePluginCli
} from "./chunk-tjmw1t99.js";
import {
  cliError,
  cliOk
} from "./chunk-z2dp53wn.js";
import {
  getInstallCounts,
  init_installCounts,
  init_parseMarketplaceInput,
  init_validatePlugin,
  parseMarketplaceInput,
  validateManifest,
  validatePluginContents
} from "./chunk-tg8dgqmf.js";
import {
  VALID_INSTALLABLE_SCOPES,
  VALID_UPDATE_SCOPES
} from "./chunk-qagtcz4g.js";
import"./chunk-18eagg6f.js";
import {
  addMarketplaceSource,
  clearAllCaches,
  createPluginId,
  getPluginErrorMessage,
  init_cacheUtils,
  init_installedPluginsManager,
  init_marketplaceHelpers,
  init_marketplaceManager,
  init_mcpPluginIntegration,
  init_plugin,
  init_pluginLoader,
  isPluginInstalled,
  loadAllPlugins,
  loadInstalledPluginsV2,
  loadKnownMarketplacesConfig,
  loadMarketplacesWithGracefulDegradation,
  loadPluginMcpServers,
  refreshAllMarketplaces,
  refreshMarketplace,
  removeMarketplaceSource,
  saveMarketplaceToSettings
} from "./chunk-92frfsdm.js";
import"./chunk-14p6wvsq.js";
import"./chunk-sndpqnmg.js";
import"./chunk-5w7gsjdj.js";
import"./chunk-28jd8qjx.js";
import"./chunk-ptxteaeh.js";
import"./chunk-hkv7c3s6.js";
import"./chunk-f40jvwgw.js";
import"./chunk-w9t7xj87.js";
import"./chunk-xah6e91t.js";
import"./chunk-qvq9z8k4.js";
import"./chunk-9a9g5hbj.js";
import"./chunk-rgyzsbs3.js";
import"./chunk-qn6me9n1.js";
import"./chunk-0rhrpnpv.js";
import"./chunk-wgwq4gvd.js";
import"./chunk-djt39ze3.js";
import"./chunk-4x9pek6a.js";
import"./chunk-71sdcaq6.js";
import"./chunk-9hn8e6h1.js";
import {
  init_pluginIdentifier,
  parsePluginIdentifier,
  scopeToSettingSource
} from "./chunk-4rer68y0.js";
import"./chunk-f2rhkq3t.js";
import"./chunk-5cf3czgf.js";
import"./chunk-bhgvey4s.js";
import"./chunk-xp6v07f0.js";
import"./chunk-ffq9eh6d.js";
import"./chunk-kbkxsgv3.js";
import"./chunk-24kv69g3.js";
import"./chunk-2vk6e88k.js";
import"./chunk-n1j46ncq.js";
import"./chunk-hdtp7tn1.js";
import"./chunk-jt482g7x.js";
import"./chunk-4spgkgr3.js";
import"./chunk-8wzca1dh.js";
import"./chunk-833fsr7s.js";
import"./chunk-2m7k0qdy.js";
import"./chunk-60fkafk2.js";
import"./chunk-mt660rpv.js";
import"./chunk-7b68gcqs.js";
import"./chunk-q4dg9ftz.js";
import"./chunk-7tfdhkpy.js";
import"./chunk-nde5ym6a.js";
import"./chunk-a4q88q6t.js";
import"./chunk-1d7prqr7.js";
import"./chunk-nfc2mwg3.js";
import"./chunk-c40ryser.js";
import"./chunk-qw03ehq0.js";
import"./chunk-1qgb1568.js";
import"./chunk-0jw2cfy8.js";
import"./chunk-935nrvdb.js";
import"./chunk-8zz4z1q3.js";
import"./chunk-w6cgk6nk.js";
import"./chunk-hqxp6b72.js";
import"./chunk-2ehn4hjt.js";
import"./chunk-zymr6ztr.js";
import"./chunk-w5hnghah.js";
import"./chunk-vdz79ezt.js";
import"./chunk-msarpzkm.js";
import"./chunk-s76nvx50.js";
import"./chunk-gb0km2ev.js";
import"./chunk-ghhmj79c.js";
import"./chunk-73g8bk52.js";
import"./chunk-khh8a09c.js";
import"./chunk-rwny7j7h.js";
import"./chunk-epvbnq43.js";
import {
  init_stringUtils,
  plural
} from "./chunk-h7cy00tf.js";
import"./chunk-srzb9n7s.js";
import"./chunk-6tzyv21c.js";
import"./chunk-8kf8h7xf.js";
import"./chunk-bgan4cpf.js";
import"./chunk-jmv7k0jn.js";
import"./chunk-psygyacq.js";
import"./chunk-e2d0hkcr.js";
import"./chunk-g2931ep0.js";
import"./chunk-vwenx8ke.js";
import"./chunk-kkpmm4b2.js";
import"./chunk-etzpfazg.js";
import"./chunk-v4ypszbb.js";
import"./chunk-bk6ck5c2.js";
import"./chunk-ym6j0wv1.js";
import"./chunk-hjmatcgt.js";
import"./chunk-6mdh70q0.js";
import"./chunk-ch92ycde.js";
import"./chunk-e4dsy4g1.js";
import"./chunk-326zehp8.js";
import"./chunk-kc67kt75.js";
import"./chunk-40t1d75v.js";
import"./chunk-1k7v4v6f.js";
import"./chunk-e3abfxpy.js";
import"./chunk-q44zc68f.js";
import"./chunk-fejeqe61.js";
import"./chunk-v5yhfnx0.js";
import"./chunk-hn4w9pkj.js";
import"./chunk-1ekct4sm.js";
import"./chunk-x9xf2qa8.js";
import {
  init_analytics,
  logEvent
} from "./chunk-j1mep9ck.js";
import"./chunk-6x35ffpx.js";
import"./chunk-1zbwhcbt.js";
import"./chunk-wdyw5x2b.js";
import"./chunk-3yga13e5.js";
import"./chunk-ye35qwfx.js";
import"./chunk-e3j7m7k2.js";
import"./chunk-t37nnsvj.js";
import"./chunk-ew28k9dk.js";
import {
  init_log,
  logError
} from "./chunk-mhjmeh6r.js";
import"./chunk-m28vg9w4.js";
import"./chunk-m4zp6cf9.js";
import"./chunk-w8n8j7aw.js";
import"./chunk-c1yc761e.js";
import {
  figures_default,
  init_figures
} from "./chunk-c5g9shkw.js";
import {
  errorMessage,
  init_errors,
  init_slowOperations,
  jsonStringify
} from "./chunk-82pkdrt0.js";
import"./chunk-kb3758f7.js";
import {
  init_state,
  setUseCoworkPlugins
} from "./chunk-v4e7ch76.js";
import"./chunk-tj0dzck2.js";
import"./chunk-aeysytks.js";
import"./chunk-ns1htxgd.js";
import"./chunk-ztqzmfx1.js";
import"./chunk-6k1rsk85.js";
import"./chunk-nxzx0ey9.js";
import"./chunk-yes1my80.js";
import"./chunk-pecy49yr.js";
import"./chunk-azbab59e.js";
import"./chunk-3nk9q8dr.js";
import {
  __require
} from "./chunk-hhsxm2yr.js";

// src/cli/handlers/plugins.ts
init_figures();
init_state();
init_analytics();
import { basename, dirname } from "path";
init_plugin();
init_errors();
init_log();
init_cacheUtils();
init_installCounts();
init_installedPluginsManager();
init_marketplaceHelpers();
init_marketplaceManager();
init_mcpPluginIntegration();
init_parseMarketplaceInput();
init_pluginIdentifier();
init_pluginLoader();
init_validatePlugin();
init_slowOperations();
init_stringUtils();
function handleMarketplaceError(error, action) {
  logError(error);
  cliError(`${figures_default.cross} Failed to ${action}: ${errorMessage(error)}`);
}
function printValidationResult(result) {
  if (result.errors.length > 0) {
    console.log(`${figures_default.cross} Found ${result.errors.length} ${plural(result.errors.length, "error")}:
`);
    result.errors.forEach((error) => {
      console.log(`  ${figures_default.pointer} ${error.path}: ${error.message}`);
    });
    console.log("");
  }
  if (result.warnings.length > 0) {
    console.log(`${figures_default.warning} Found ${result.warnings.length} ${plural(result.warnings.length, "warning")}:
`);
    result.warnings.forEach((warning) => {
      console.log(`  ${figures_default.pointer} ${warning.path}: ${warning.message}`);
    });
    console.log("");
  }
}
async function pluginValidateHandler(manifestPath, options) {
  if (options.cowork)
    setUseCoworkPlugins(true);
  try {
    const result = await validateManifest(manifestPath);
    console.log(`Validating ${result.fileType} manifest: ${result.filePath}
`);
    printValidationResult(result);
    let contentResults = [];
    if (result.fileType === "plugin") {
      const manifestDir = dirname(result.filePath);
      if (basename(manifestDir) === ".claude-plugin") {
        contentResults = await validatePluginContents(dirname(manifestDir));
        for (const r of contentResults) {
          console.log(`Validating ${r.fileType}: ${r.filePath}
`);
          printValidationResult(r);
        }
      }
    }
    const allSuccess = result.success && contentResults.every((r) => r.success);
    const hasWarnings = result.warnings.length > 0 || contentResults.some((r) => r.warnings.length > 0);
    if (allSuccess) {
      cliOk(hasWarnings ? `${figures_default.tick} Validation passed with warnings` : `${figures_default.tick} Validation passed`);
    } else {
      console.log(`${figures_default.cross} Validation failed`);
      process.exit(1);
    }
  } catch (error) {
    logError(error);
    console.error(`${figures_default.cross} Unexpected error during validation: ${errorMessage(error)}`);
    process.exit(2);
  }
}
async function pluginListHandler(options) {
  if (options.cowork)
    setUseCoworkPlugins(true);
  logEvent("tengu_plugin_list_command", {});
  const installedData = loadInstalledPluginsV2();
  const { getPluginEditableScopes } = await import("./chunk-6a72a23p.js");
  const enabledPlugins = getPluginEditableScopes();
  const pluginIds = Object.keys(installedData.plugins);
  const {
    enabled: loadedEnabled,
    disabled: loadedDisabled,
    errors: loadErrors
  } = await loadAllPlugins();
  const allLoadedPlugins = [...loadedEnabled, ...loadedDisabled];
  const inlinePlugins = allLoadedPlugins.filter((p) => p.source.endsWith("@inline"));
  const inlineLoadErrors = loadErrors.filter((e) => e.source.endsWith("@inline") || e.source.startsWith("inline["));
  if (options.json) {
    const loadedPluginMap = new Map(allLoadedPlugins.map((p) => [p.source, p]));
    const plugins = [];
    for (const pluginId of pluginIds.sort()) {
      const installations = installedData.plugins[pluginId];
      if (!installations || installations.length === 0)
        continue;
      const pluginName = parsePluginIdentifier(pluginId).name;
      const pluginErrors = loadErrors.filter((e) => e.source === pluginId || ("plugin" in e) && e.plugin === pluginName).map(getPluginErrorMessage);
      for (const installation of installations) {
        const loadedPlugin = loadedPluginMap.get(pluginId);
        let mcpServers;
        if (loadedPlugin) {
          const servers = loadedPlugin.mcpServers || await loadPluginMcpServers(loadedPlugin);
          if (servers && Object.keys(servers).length > 0) {
            mcpServers = servers;
          }
        }
        plugins.push({
          id: pluginId,
          version: installation.version || "unknown",
          scope: installation.scope,
          enabled: enabledPlugins.has(pluginId),
          installPath: installation.installPath,
          installedAt: installation.installedAt,
          lastUpdated: installation.lastUpdated,
          projectPath: installation.projectPath,
          mcpServers,
          errors: pluginErrors.length > 0 ? pluginErrors : undefined
        });
      }
    }
    for (const p of inlinePlugins) {
      const servers = p.mcpServers || await loadPluginMcpServers(p);
      const pErrors = inlineLoadErrors.filter((e) => e.source === p.source || ("plugin" in e) && e.plugin === p.name).map(getPluginErrorMessage);
      plugins.push({
        id: p.source,
        version: p.manifest.version ?? "unknown",
        scope: "session",
        enabled: p.enabled !== false,
        installPath: p.path,
        mcpServers: servers && Object.keys(servers).length > 0 ? servers : undefined,
        errors: pErrors.length > 0 ? pErrors : undefined
      });
    }
    for (const e of inlineLoadErrors.filter((e2) => e2.source.startsWith("inline["))) {
      plugins.push({
        id: e.source,
        version: "unknown",
        scope: "session",
        enabled: false,
        installPath: "path" in e ? e.path : "",
        errors: [getPluginErrorMessage(e)]
      });
    }
    if (options.available) {
      const available = [];
      try {
        const [config, installCounts] = await Promise.all([
          loadKnownMarketplacesConfig(),
          getInstallCounts()
        ]);
        const { marketplaces } = await loadMarketplacesWithGracefulDegradation(config);
        for (const {
          name: marketplaceName,
          data: marketplace
        } of marketplaces) {
          if (marketplace) {
            for (const entry of marketplace.plugins) {
              const pluginId = createPluginId(entry.name, marketplaceName);
              if (!isPluginInstalled(pluginId)) {
                available.push({
                  pluginId,
                  name: entry.name,
                  description: entry.description,
                  marketplaceName,
                  version: entry.version,
                  source: entry.source,
                  installCount: installCounts?.get(pluginId)
                });
              }
            }
          }
        }
      } catch {}
      cliOk(jsonStringify({ installed: plugins, available }, null, 2));
    } else {
      cliOk(jsonStringify(plugins, null, 2));
    }
  }
  if (pluginIds.length === 0 && inlinePlugins.length === 0) {
    if (inlineLoadErrors.length === 0) {
      cliOk("No plugins installed. Use `claude plugin install` to install a plugin.");
    }
  }
  if (pluginIds.length > 0) {
    console.log(`Installed plugins:
`);
  }
  for (const pluginId of pluginIds.sort()) {
    const installations = installedData.plugins[pluginId];
    if (!installations || installations.length === 0)
      continue;
    const pluginName = parsePluginIdentifier(pluginId).name;
    const pluginErrors = loadErrors.filter((e) => e.source === pluginId || ("plugin" in e) && e.plugin === pluginName);
    for (const installation of installations) {
      const isEnabled = enabledPlugins.has(pluginId);
      const status = pluginErrors.length > 0 ? `${figures_default.cross} failed to load` : isEnabled ? `${figures_default.tick} enabled` : `${figures_default.cross} disabled`;
      const version = installation.version || "unknown";
      const scope = installation.scope;
      console.log(`  ${figures_default.pointer} ${pluginId}`);
      console.log(`    Version: ${version}`);
      console.log(`    Scope: ${scope}`);
      console.log(`    Status: ${status}`);
      for (const error of pluginErrors) {
        console.log(`    Error: ${getPluginErrorMessage(error)}`);
      }
      console.log("");
    }
  }
  if (inlinePlugins.length > 0 || inlineLoadErrors.length > 0) {
    console.log(`Session-only plugins (--plugin-dir):
`);
    for (const p of inlinePlugins) {
      const pErrors = inlineLoadErrors.filter((e) => e.source === p.source || ("plugin" in e) && e.plugin === p.name);
      const status = pErrors.length > 0 ? `${figures_default.cross} loaded with errors` : `${figures_default.tick} loaded`;
      console.log(`  ${figures_default.pointer} ${p.source}`);
      console.log(`    Version: ${p.manifest.version ?? "unknown"}`);
      console.log(`    Path: ${p.path}`);
      console.log(`    Status: ${status}`);
      for (const e of pErrors) {
        console.log(`    Error: ${getPluginErrorMessage(e)}`);
      }
      console.log("");
    }
    for (const e of inlineLoadErrors.filter((e2) => e2.source.startsWith("inline["))) {
      console.log(`  ${figures_default.pointer} ${e.source}: ${figures_default.cross} ${getPluginErrorMessage(e)}
`);
    }
  }
  cliOk();
}
async function marketplaceAddHandler(source, options) {
  if (options.cowork)
    setUseCoworkPlugins(true);
  try {
    const parsed = await parseMarketplaceInput(source);
    if (!parsed) {
      cliError(`${figures_default.cross} Invalid marketplace source format. Try: owner/repo, https://..., or ./path`);
    }
    if ("error" in parsed) {
      cliError(`${figures_default.cross} ${parsed.error}`);
    }
    const scope = options.scope ?? "user";
    if (scope !== "user" && scope !== "project" && scope !== "local") {
      cliError(`${figures_default.cross} Invalid scope '${scope}'. Use: user, project, or local`);
    }
    const settingSource = scopeToSettingSource(scope);
    let marketplaceSource = parsed;
    if (options.sparse && options.sparse.length > 0) {
      if (marketplaceSource.source === "github" || marketplaceSource.source === "git") {
        marketplaceSource = {
          ...marketplaceSource,
          sparsePaths: options.sparse
        };
      } else {
        cliError(`${figures_default.cross} --sparse is only supported for github and git marketplace sources (got: ${marketplaceSource.source})`);
      }
    }
    console.log("Adding marketplace...");
    const { name, alreadyMaterialized, resolvedSource } = await addMarketplaceSource(marketplaceSource, (message) => {
      console.log(message);
    });
    saveMarketplaceToSettings(name, { source: resolvedSource }, settingSource);
    clearAllCaches();
    let sourceType = marketplaceSource.source;
    if (marketplaceSource.source === "github") {
      sourceType = marketplaceSource.repo;
    }
    logEvent("tengu_marketplace_added", {
      source_type: sourceType
    });
    cliOk(alreadyMaterialized ? `${figures_default.tick} Marketplace '${name}' already on disk \u2014 declared in ${scope} settings` : `${figures_default.tick} Successfully added marketplace: ${name} (declared in ${scope} settings)`);
  } catch (error) {
    handleMarketplaceError(error, "add marketplace");
  }
}
async function marketplaceListHandler(options) {
  if (options.cowork)
    setUseCoworkPlugins(true);
  try {
    const config = await loadKnownMarketplacesConfig();
    const names = Object.keys(config);
    if (options.json) {
      const marketplaces = names.sort().map((name) => {
        const marketplace = config[name];
        const source = marketplace?.source;
        return {
          name,
          source: source?.source,
          ...source?.source === "github" && { repo: source.repo },
          ...source?.source === "git" && { url: source.url },
          ...source?.source === "url" && { url: source.url },
          ...source?.source === "directory" && { path: source.path },
          ...source?.source === "file" && { path: source.path },
          installLocation: marketplace?.installLocation
        };
      });
      cliOk(jsonStringify(marketplaces, null, 2));
    }
    if (names.length === 0) {
      cliOk("No marketplaces configured");
    }
    console.log(`Configured marketplaces:
`);
    names.forEach((name) => {
      const marketplace = config[name];
      console.log(`  ${figures_default.pointer} ${name}`);
      if (marketplace?.source) {
        const src = marketplace.source;
        if (src.source === "github") {
          console.log(`    Source: GitHub (${src.repo})`);
        } else if (src.source === "git") {
          console.log(`    Source: Git (${src.url})`);
        } else if (src.source === "url") {
          console.log(`    Source: URL (${src.url})`);
        } else if (src.source === "directory") {
          console.log(`    Source: Directory (${src.path})`);
        } else if (src.source === "file") {
          console.log(`    Source: File (${src.path})`);
        }
      }
      console.log("");
    });
    cliOk();
  } catch (error) {
    handleMarketplaceError(error, "list marketplaces");
  }
}
async function marketplaceRemoveHandler(name, options) {
  if (options.cowork)
    setUseCoworkPlugins(true);
  try {
    await removeMarketplaceSource(name);
    clearAllCaches();
    logEvent("tengu_marketplace_removed", {
      marketplace_name: name
    });
    cliOk(`${figures_default.tick} Successfully removed marketplace: ${name}`);
  } catch (error) {
    handleMarketplaceError(error, "remove marketplace");
  }
}
async function marketplaceUpdateHandler(name, options) {
  if (options.cowork)
    setUseCoworkPlugins(true);
  try {
    if (name) {
      console.log(`Updating marketplace: ${name}...`);
      await refreshMarketplace(name, (message) => {
        console.log(message);
      });
      clearAllCaches();
      logEvent("tengu_marketplace_updated", {
        marketplace_name: name
      });
      cliOk(`${figures_default.tick} Successfully updated marketplace: ${name}`);
    } else {
      const config = await loadKnownMarketplacesConfig();
      const marketplaceNames = Object.keys(config);
      if (marketplaceNames.length === 0) {
        cliOk("No marketplaces configured");
      }
      console.log(`Updating ${marketplaceNames.length} marketplace(s)...`);
      await refreshAllMarketplaces();
      clearAllCaches();
      logEvent("tengu_marketplace_updated_all", {
        count: marketplaceNames.length
      });
      cliOk(`${figures_default.tick} Successfully updated ${marketplaceNames.length} marketplace(s)`);
    }
  } catch (error) {
    handleMarketplaceError(error, "update marketplace(s)");
  }
}
async function pluginInstallHandler(plugin, options) {
  if (options.cowork)
    setUseCoworkPlugins(true);
  const scope = options.scope || "user";
  if (options.cowork && scope !== "user") {
    cliError("--cowork can only be used with user scope");
  }
  if (!VALID_INSTALLABLE_SCOPES.includes(scope)) {
    cliError(`Invalid scope: ${scope}. Must be one of: ${VALID_INSTALLABLE_SCOPES.join(", ")}.`);
  }
  const { name, marketplace } = parsePluginIdentifier(plugin);
  logEvent("tengu_plugin_install_command", {
    _PROTO_plugin_name: name,
    ...marketplace && {
      _PROTO_marketplace_name: marketplace
    },
    scope
  });
  await installPlugin(plugin, scope);
}
async function pluginUninstallHandler(plugin, options) {
  if (options.cowork)
    setUseCoworkPlugins(true);
  const scope = options.scope || "user";
  if (options.cowork && scope !== "user") {
    cliError("--cowork can only be used with user scope");
  }
  if (!VALID_INSTALLABLE_SCOPES.includes(scope)) {
    cliError(`Invalid scope: ${scope}. Must be one of: ${VALID_INSTALLABLE_SCOPES.join(", ")}.`);
  }
  const { name, marketplace } = parsePluginIdentifier(plugin);
  logEvent("tengu_plugin_uninstall_command", {
    _PROTO_plugin_name: name,
    ...marketplace && {
      _PROTO_marketplace_name: marketplace
    },
    scope
  });
  await uninstallPlugin(plugin, scope, options.keepData);
}
async function pluginEnableHandler(plugin, options) {
  if (options.cowork)
    setUseCoworkPlugins(true);
  let scope;
  if (options.scope) {
    if (!VALID_INSTALLABLE_SCOPES.includes(options.scope)) {
      cliError(`Invalid scope "${options.scope}". Valid scopes: ${VALID_INSTALLABLE_SCOPES.join(", ")}`);
    }
    scope = options.scope;
  }
  if (options.cowork && scope !== undefined && scope !== "user") {
    cliError("--cowork can only be used with user scope");
  }
  if (options.cowork && scope === undefined) {
    scope = "user";
  }
  const { name, marketplace } = parsePluginIdentifier(plugin);
  logEvent("tengu_plugin_enable_command", {
    _PROTO_plugin_name: name,
    ...marketplace && {
      _PROTO_marketplace_name: marketplace
    },
    scope: scope ?? "auto"
  });
  await enablePlugin(plugin, scope);
}
async function pluginDisableHandler(plugin, options) {
  if (options.all && plugin) {
    cliError("Cannot use --all with a specific plugin");
  }
  if (!options.all && !plugin) {
    cliError("Please specify a plugin name or use --all to disable all plugins");
  }
  if (options.cowork)
    setUseCoworkPlugins(true);
  if (options.all) {
    if (options.scope) {
      cliError("Cannot use --scope with --all");
    }
    logEvent("tengu_plugin_disable_command", {});
    await disableAllPlugins();
    return;
  }
  let scope;
  if (options.scope) {
    if (!VALID_INSTALLABLE_SCOPES.includes(options.scope)) {
      cliError(`Invalid scope "${options.scope}". Valid scopes: ${VALID_INSTALLABLE_SCOPES.join(", ")}`);
    }
    scope = options.scope;
  }
  if (options.cowork && scope !== undefined && scope !== "user") {
    cliError("--cowork can only be used with user scope");
  }
  if (options.cowork && scope === undefined) {
    scope = "user";
  }
  const { name, marketplace } = parsePluginIdentifier(plugin);
  logEvent("tengu_plugin_disable_command", {
    _PROTO_plugin_name: name,
    ...marketplace && {
      _PROTO_marketplace_name: marketplace
    },
    scope: scope ?? "auto"
  });
  await disablePlugin(plugin, scope);
}
async function pluginUpdateHandler(plugin, options) {
  if (options.cowork)
    setUseCoworkPlugins(true);
  const { name, marketplace } = parsePluginIdentifier(plugin);
  logEvent("tengu_plugin_update_command", {
    _PROTO_plugin_name: name,
    ...marketplace && {
      _PROTO_marketplace_name: marketplace
    }
  });
  let scope = "user";
  if (options.scope) {
    if (!VALID_UPDATE_SCOPES.includes(options.scope)) {
      cliError(`Invalid scope "${options.scope}". Valid scopes: ${VALID_UPDATE_SCOPES.join(", ")}`);
    }
    scope = options.scope;
  }
  if (options.cowork && scope !== "user") {
    cliError("--cowork can only be used with user scope");
  }
  await updatePluginCli(plugin, scope);
}
export {
  pluginValidateHandler,
  pluginUpdateHandler,
  pluginUninstallHandler,
  pluginListHandler,
  pluginInstallHandler,
  pluginEnableHandler,
  pluginDisableHandler,
  marketplaceUpdateHandler,
  marketplaceRemoveHandler,
  marketplaceListHandler,
  marketplaceAddHandler,
  handleMarketplaceError,
  VALID_UPDATE_SCOPES,
  VALID_INSTALLABLE_SCOPES
};

//# debugId=FE81DB0BD9BB1D5A64756E2164756E21
//# sourceMappingURL=chunk-mt39xm65.js.map
