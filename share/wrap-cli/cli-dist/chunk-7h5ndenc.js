// @bun
import {
  assertWorkspaceHost,
  init_hostGuard
} from "./chunk-p3a84etr.js";
import {
  init_launchCommand,
  launchCommand
} from "./chunk-m02z4tzd.js";
import {
  init_api,
  prepareWorkspaceApiRequest
} from "./chunk-260tj43w.js";
import"./chunk-mhtd3kea.js";
import"./chunk-73g8bk52.js";
import"./chunk-khh8a09c.js";
import"./chunk-64er5ppc.js";
import"./chunk-epvbnq43.js";
import"./chunk-h7cy00tf.js";
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
import {
  getOauthConfig,
  init_oauth
} from "./chunk-bk6ck5c2.js";
import"./chunk-6mdh70q0.js";
import"./chunk-ch92ycde.js";
import"./chunk-326zehp8.js";
import"./chunk-40t1d75v.js";
import"./chunk-e3abfxpy.js";
import"./chunk-fejeqe61.js";
import"./chunk-v5yhfnx0.js";
import"./chunk-hn4w9pkj.js";
import {
  ThemedBox_default,
  ThemedText,
  init_src,
  require_react
} from "./chunk-1ekct4sm.js";
import {
  require_jsx_runtime
} from "./chunk-x9xf2qa8.js";
import"./chunk-j1mep9ck.js";
import"./chunk-6x35ffpx.js";
import"./chunk-1zbwhcbt.js";
import"./chunk-wdyw5x2b.js";
import"./chunk-3yga13e5.js";
import"./chunk-ye35qwfx.js";
import"./chunk-e3j7m7k2.js";
import"./chunk-t37nnsvj.js";
import"./chunk-ew28k9dk.js";
import"./chunk-mhjmeh6r.js";
import"./chunk-m28vg9w4.js";
import"./chunk-m4zp6cf9.js";
import"./chunk-w8n8j7aw.js";
import"./chunk-c1yc761e.js";
import"./chunk-c5g9shkw.js";
import"./chunk-82pkdrt0.js";
import"./chunk-kb3758f7.js";
import"./chunk-v4e7ch76.js";
import"./chunk-tj0dzck2.js";
import"./chunk-aeysytks.js";
import"./chunk-ns1htxgd.js";
import"./chunk-ztqzmfx1.js";
import"./chunk-6k1rsk85.js";
import"./chunk-nxzx0ey9.js";
import"./chunk-yes1my80.js";
import {
  axios_default,
  init_axios
} from "./chunk-pecy49yr.js";
import"./chunk-azbab59e.js";
import"./chunk-3nk9q8dr.js";
import {
  __esm,
  __toESM
} from "./chunk-hhsxm2yr.js";

// src/utils/sanitizeId.ts
function sanitizeId(id) {
  if (id.length <= 8)
    return id;
  return `${id.slice(0, 8)}\u2026`;
}
var init_sanitizeId = () => {};

// src/commands/vault/vaultsApi.ts
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
async function buildHeaders() {
  let apiKey;
  try {
    const prepared = await prepareWorkspaceApiRequest();
    apiKey = prepared.apiKey;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new VaultsApiError(msg, 501);
  }
  assertWorkspaceHost(vaultsBaseUrl());
  return {
    "x-api-key": apiKey,
    "anthropic-version": "2023-06-01",
    "anthropic-beta": VAULTS_BETA_HEADER,
    "content-type": "application/json"
  };
}
function vaultsBaseUrl() {
  return `${getOauthConfig().BASE_API_URL}/v1/vaults`;
}
function classifyError(err, id) {
  const safeId = id ? ` (${sanitizeId(id)})` : "";
  if (axios_default.isAxiosError(err)) {
    const status = err.response?.status ?? 0;
    if (status === 401) {
      return new VaultsApiError("Authentication failed. Please run /login to re-authenticate.", 401);
    }
    if (status === 403) {
      return new VaultsApiError("Subscription required. Vault management requires a Claude Pro/Max/Team subscription.", 403);
    }
    if (status === 404) {
      return new VaultsApiError(`Vault or credential not found${safeId}.`, 404);
    }
    if (status === 429) {
      const retryAfter = err.response?.headers?.["retry-after"] ?? "";
      const detail = retryAfter ? ` Retry after ${retryAfter}s.` : "";
      return new VaultsApiError(`Rate limit exceeded.${detail}`, 429);
    }
    const msg = err.response?.data?.error?.message ?? err.message;
    return new VaultsApiError(msg, status);
  }
  if (err instanceof VaultsApiError)
    return err;
  return new VaultsApiError(err instanceof Error ? err.message : String(err), 0);
}
function parseRetryAfterMs(header) {
  if (!header)
    return null;
  const seconds = Number(header);
  if (!Number.isNaN(seconds) && seconds >= 0)
    return seconds * 1000;
  const date = Date.parse(header);
  if (!Number.isNaN(date))
    return Math.max(0, date - Date.now());
  return null;
}
async function withRetry(fn, id) {
  let lastErr;
  for (let attempt = 0;attempt < MAX_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const classified = classifyError(err, id);
      if (classified.statusCode >= 500) {
        lastErr = classified;
        if (attempt < MAX_RETRIES - 1) {
          const retryAfterHeader = axios_default.isAxiosError(err) ? err.response?.headers?.["retry-after"] : undefined;
          const waitMs = parseRetryAfterMs(retryAfterHeader) ?? 500 * 2 ** attempt;
          await sleep(waitMs);
        }
        continue;
      }
      throw classified;
    }
  }
  throw lastErr ?? new VaultsApiError("Request failed after retries", 0);
}
async function listVaults() {
  return withRetry(async () => {
    const headers = await buildHeaders();
    const response = await axios_default.get(vaultsBaseUrl(), {
      headers
    });
    return response.data.data ?? [];
  });
}
async function createVault(name) {
  return withRetry(async () => {
    const headers = await buildHeaders();
    const body = { name };
    const response = await axios_default.post(vaultsBaseUrl(), body, {
      headers
    });
    return response.data;
  });
}
async function getVault(id) {
  return withRetry(async () => {
    const headers = await buildHeaders();
    const response = await axios_default.get(`${vaultsBaseUrl()}/${id}`, {
      headers
    });
    return response.data;
  }, id);
}
async function archiveVault(id) {
  return withRetry(async () => {
    const headers = await buildHeaders();
    const response = await axios_default.post(`${vaultsBaseUrl()}/${id}/archive`, {}, { headers });
    return response.data;
  }, id);
}
async function listCredentials(vaultId) {
  return withRetry(async () => {
    const headers = await buildHeaders();
    const response = await axios_default.get(`${vaultsBaseUrl()}/${vaultId}/credentials`, { headers });
    return response.data.data ?? [];
  }, vaultId);
}
async function addCredential(vaultId, key, secret) {
  return withRetry(async () => {
    const headers = await buildHeaders();
    const body = { key, secret };
    const response = await axios_default.post(`${vaultsBaseUrl()}/${vaultId}/credentials`, body, { headers });
    return response.data;
  }, vaultId);
}
async function archiveCredential(vaultId, credentialId) {
  return withRetry(async () => {
    const headers = await buildHeaders();
    const response = await axios_default.post(`${vaultsBaseUrl()}/${vaultId}/credentials/${credentialId}/archive`, {}, { headers });
    return response.data;
  }, vaultId);
}
var VAULTS_BETA_HEADER = "managed-agents-2026-04-01", MAX_RETRIES = 3, VaultsApiError;
var init_vaultsApi = __esm(() => {
  init_axios();
  init_oauth();
  init_hostGuard();
  init_api();
  init_sanitizeId();
  VaultsApiError = class VaultsApiError extends Error {
    statusCode;
    constructor(message, statusCode) {
      super(message);
      this.statusCode = statusCode;
      this.name = "VaultsApiError";
    }
  };
});

// src/commands/vault/VaultView.tsx
function VaultRow({ vault }) {
  const isArchived = !!vault.archived_at;
  const createdAt = vault.created_at ? new Date(vault.created_at).toLocaleString() : "\u2014";
  return /* @__PURE__ */ jsx_runtime.jsxs(ThemedBox_default, {
    flexDirection: "column",
    marginBottom: 1,
    children: [
      /* @__PURE__ */ jsx_runtime.jsxs(ThemedBox_default, {
        children: [
          /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
            bold: true,
            children: vault.vault_id
          }),
          /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
            dimColor: true,
            children: " \xB7 "
          }),
          /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
            color: isArchived ? "warning" : "success",
            children: isArchived ? "archived" : "active"
          })
        ]
      }),
      /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
        children: [
          "Name: ",
          vault.name
        ]
      }),
      /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
        dimColor: true,
        children: [
          "Created: ",
          createdAt
        ]
      })
    ]
  });
}
function VaultView(props) {
  if (props.mode === "list") {
    if (props.vaults.length === 0) {
      return /* @__PURE__ */ jsx_runtime.jsx(ThemedBox_default, {
        children: /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
          dimColor: true,
          children: "No vaults found. Use /vault create <name> to create one."
        })
      });
    }
    return /* @__PURE__ */ jsx_runtime.jsxs(ThemedBox_default, {
      flexDirection: "column",
      children: [
        /* @__PURE__ */ jsx_runtime.jsx(ThemedBox_default, {
          marginBottom: 1,
          children: /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
            bold: true,
            children: [
              "Vaults (",
              props.vaults.length,
              ")"
            ]
          })
        }),
        props.vaults.map((vault) => /* @__PURE__ */ jsx_runtime.jsx(VaultRow, {
          vault
        }, vault.vault_id))
      ]
    });
  }
  if (props.mode === "detail") {
    const { vault } = props;
    const isArchived = !!vault.archived_at;
    const createdAt = vault.created_at ? new Date(vault.created_at).toLocaleString() : "\u2014";
    const archivedAt = vault.archived_at ? new Date(vault.archived_at).toLocaleString() : null;
    return /* @__PURE__ */ jsx_runtime.jsxs(ThemedBox_default, {
      flexDirection: "column",
      children: [
        /* @__PURE__ */ jsx_runtime.jsx(ThemedBox_default, {
          marginBottom: 1,
          children: /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
            bold: true,
            children: [
              "Vault: ",
              vault.vault_id
            ]
          })
        }),
        /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
          children: [
            "Name: ",
            vault.name
          ]
        }),
        /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
          children: [
            "Status:",
            " ",
            /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
              color: isArchived ? "warning" : "success",
              children: isArchived ? "archived" : "active"
            })
          ]
        }),
        /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
          dimColor: true,
          children: [
            "Created: ",
            createdAt
          ]
        }),
        archivedAt ? /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
          dimColor: true,
          children: [
            "Archived: ",
            archivedAt
          ]
        }) : null
      ]
    });
  }
  if (props.mode === "created") {
    const { vault } = props;
    return /* @__PURE__ */ jsx_runtime.jsxs(ThemedBox_default, {
      flexDirection: "column",
      children: [
        /* @__PURE__ */ jsx_runtime.jsx(ThemedBox_default, {
          children: /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
            bold: true,
            color: "success",
            children: "Vault created"
          })
        }),
        /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
          children: [
            "ID: ",
            vault.vault_id
          ]
        }),
        /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
          children: [
            "Name: ",
            vault.name
          ]
        })
      ]
    });
  }
  if (props.mode === "archived") {
    const { vault } = props;
    const archivedAt = vault.archived_at ? new Date(vault.archived_at).toLocaleString() : "\u2014";
    return /* @__PURE__ */ jsx_runtime.jsxs(ThemedBox_default, {
      flexDirection: "column",
      children: [
        /* @__PURE__ */ jsx_runtime.jsx(ThemedBox_default, {
          children: /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
            bold: true,
            color: "warning",
            children: "Vault archived"
          })
        }),
        /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
          children: [
            "ID: ",
            vault.vault_id
          ]
        }),
        /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
          dimColor: true,
          children: [
            "Archived at: ",
            archivedAt
          ]
        })
      ]
    });
  }
  if (props.mode === "credential-list") {
    const { vaultId, credentials } = props;
    if (credentials.length === 0) {
      return /* @__PURE__ */ jsx_runtime.jsx(ThemedBox_default, {
        children: /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
          dimColor: true,
          children: [
            "No credentials in vault ",
            vaultId,
            ". Use /vault add-credential ",
            vaultId,
            " <key> <value> to add one."
          ]
        })
      });
    }
    return /* @__PURE__ */ jsx_runtime.jsxs(ThemedBox_default, {
      flexDirection: "column",
      children: [
        /* @__PURE__ */ jsx_runtime.jsx(ThemedBox_default, {
          marginBottom: 1,
          children: /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
            bold: true,
            children: [
              "Credentials in ",
              vaultId,
              " (",
              credentials.length,
              ")"
            ]
          })
        }),
        credentials.map((cred) => {
          const isArchived = !!cred.archived_at;
          return /* @__PURE__ */ jsx_runtime.jsxs(ThemedBox_default, {
            flexDirection: "column",
            marginBottom: 1,
            children: [
              /* @__PURE__ */ jsx_runtime.jsxs(ThemedBox_default, {
                children: [
                  /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
                    bold: true,
                    children: cred.credential_id
                  }),
                  /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
                    dimColor: true,
                    children: " \xB7 "
                  }),
                  cred.kind ? /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
                    dimColor: true,
                    children: cred.kind
                  }) : null,
                  isArchived ? /* @__PURE__ */ jsx_runtime.jsxs(jsx_runtime.Fragment, {
                    children: [
                      /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
                        dimColor: true,
                        children: " \xB7 "
                      }),
                      /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
                        color: "warning",
                        children: "archived"
                      })
                    ]
                  }) : null
                ]
              }),
              /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
                dimColor: true,
                children: "Value: ***mask***"
              })
            ]
          }, cred.credential_id);
        })
      ]
    });
  }
  if (props.mode === "credential-added") {
    const { vaultId, credentialId } = props;
    return /* @__PURE__ */ jsx_runtime.jsxs(ThemedBox_default, {
      flexDirection: "column",
      children: [
        /* @__PURE__ */ jsx_runtime.jsx(ThemedBox_default, {
          children: /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
            bold: true,
            color: "success",
            children: "Credential added"
          })
        }),
        /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
          children: [
            "ID: ",
            credentialId
          ]
        }),
        /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
          children: [
            "Vault: ",
            vaultId
          ]
        }),
        /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
          dimColor: true,
          children: "Value: ***mask***"
        })
      ]
    });
  }
  if (props.mode === "credential-archived") {
    const { vaultId, credentialId } = props;
    return /* @__PURE__ */ jsx_runtime.jsxs(ThemedBox_default, {
      flexDirection: "column",
      children: [
        /* @__PURE__ */ jsx_runtime.jsx(ThemedBox_default, {
          children: /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
            bold: true,
            color: "warning",
            children: "Credential archived"
          })
        }),
        /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
          children: [
            "ID: ",
            credentialId
          ]
        }),
        /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
          children: [
            "Vault: ",
            vaultId
          ]
        })
      ]
    });
  }
  return /* @__PURE__ */ jsx_runtime.jsx(ThemedBox_default, {
    children: /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
      color: "error",
      children: props.message
    })
  });
}
var jsx_runtime;
var init_VaultView = __esm(() => {
  init_src();
  jsx_runtime = __toESM(require_jsx_runtime(), 1);
});

// src/commands/vault/parseArgs.ts
function parseVaultArgs(args) {
  const trimmed = args.trim();
  if (trimmed === "" || trimmed === "list") {
    return { action: "list" };
  }
  const spaceIdx = trimmed.indexOf(" ");
  const subCmd = spaceIdx === -1 ? trimmed : trimmed.slice(0, spaceIdx);
  const rest = spaceIdx === -1 ? "" : trimmed.slice(spaceIdx + 1).trim();
  if (subCmd === "create") {
    if (!rest) {
      return {
        action: "invalid",
        reason: 'create requires a vault name, e.g. create "My Work Vault"'
      };
    }
    return { action: "create", name: rest };
  }
  if (subCmd === "get") {
    if (!rest) {
      return { action: "invalid", reason: "get requires a vault id" };
    }
    const id = rest.split(/\s+/)[0];
    if (!id) {
      return { action: "invalid", reason: "get requires a vault id" };
    }
    return { action: "get", id };
  }
  if (subCmd === "archive") {
    if (!rest) {
      return { action: "invalid", reason: "archive requires a vault id" };
    }
    const id = rest.split(/\s+/)[0];
    if (!id) {
      return { action: "invalid", reason: "archive requires a vault id" };
    }
    return { action: "archive", id };
  }
  if (subCmd === "add-credential") {
    const parts = rest.split(/\s+/);
    if (parts.length < 2 || !parts[0] || !parts[1]) {
      return {
        action: "invalid",
        reason: "add-credential requires vault_id, key, and value, e.g. add-credential vault_123 MY_API_KEY <value>"
      };
    }
    const vaultId = parts[0];
    const key = parts[1];
    const secret = parts.slice(2).join(" ");
    if (!secret.trim()) {
      return {
        action: "invalid",
        reason: "add-credential requires a non-empty credential value"
      };
    }
    return {
      action: "add-credential",
      vaultId,
      key,
      secret: secret.trim()
    };
  }
  if (subCmd === "archive-credential") {
    const parts = rest.split(/\s+/);
    if (parts.length < 2 || !parts[0] || !parts[1]) {
      return {
        action: "invalid",
        reason: "archive-credential requires vault_id and credential_id, e.g. archive-credential vault_123 cred_456"
      };
    }
    return {
      action: "archive-credential",
      vaultId: parts[0],
      credentialId: parts[1]
    };
  }
  return {
    action: "invalid",
    reason: `Unknown sub-command "${subCmd}". ${USAGE}`
  };
}
var USAGE = "Usage: /vault list | create NAME | get ID | archive ID | add-credential VAULT_ID KEY VALUE | archive-credential VAULT_ID CRED_ID";
var init_parseArgs = () => {};

// src/commands/vault/launchVault.tsx
async function dispatchVault(parsed, onDone) {
  if (parsed.action === "list") {
    const vaults2 = await listVaults();
    onDone(vaults2.length === 0 ? "No vaults found." : `${vaults2.length} vault(s).`, { display: "system" });
    return { mode: "list", vaults: vaults2 };
  }
  if (parsed.action === "create") {
    const { name } = parsed;
    const vault = await createVault(name);
    onDone(`Vault created: ${vault.vault_id}`, { display: "system" });
    return { mode: "created", vault };
  }
  if (parsed.action === "get") {
    const { id } = parsed;
    const vault = await getVault(id);
    onDone(`Vault fetched.`, { display: "system" });
    return { mode: "detail", vault };
  }
  if (parsed.action === "archive") {
    const { id } = parsed;
    const vault = await archiveVault(id);
    onDone(`Vault archived.`, { display: "system" });
    return { mode: "archived", vault };
  }
  if (parsed.action === "add-credential") {
    const { vaultId, key, secret } = parsed;
    const cred = await addCredential(vaultId, key, secret);
    onDone(`Credential added: ${cred.credential_id}`, { display: "system" });
    return { mode: "credential-added", vaultId, credentialId: cred.credential_id };
  }
  if (parsed.action === "archive-credential") {
    const { vaultId, credentialId } = parsed;
    await archiveCredential(vaultId, credentialId);
    onDone(`Credential ${credentialId} archived.`, { display: "system" });
    return { mode: "credential-archived", vaultId, credentialId };
  }
  const vaults = await listVaults();
  onDone(vaults.length === 0 ? "No vaults found." : `${vaults.length} vault(s).`, { display: "system" });
  return { mode: "list", vaults };
}
var import_react, USAGE2 = "Usage: /vault list | create NAME | get ID | archive ID | add-credential VAULT_ID KEY VALUE | archive-credential VAULT_ID CRED_ID", callVault, callVaultListCredentials = async (onDone, vaultId) => {
  try {
    const credentials = await listCredentials(vaultId);
    onDone(credentials.length === 0 ? `No credentials in vault ${vaultId}.` : `${credentials.length} credential(s) in vault ${vaultId}.`, { display: "system" });
    return import_react.default.createElement(VaultView, {
      mode: "credential-list",
      vaultId,
      credentials
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    onDone(`Failed to list credentials: ${msg}`, { display: "system" });
    return import_react.default.createElement(VaultView, { mode: "error", message: msg });
  }
};
var init_launchVault = __esm(() => {
  init_vaultsApi();
  init_VaultView();
  init_parseArgs();
  init_launchCommand();
  import_react = __toESM(require_react(), 1);
  callVault = launchCommand({
    commandName: "vault",
    parseArgs: (raw) => {
      const result = parseVaultArgs(raw);
      if (result.action === "invalid") {
        return { action: "invalid", reason: `${USAGE2}
${result.reason}` };
      }
      return result;
    },
    dispatch: dispatchVault,
    View: VaultView,
    errorView: (msg) => import_react.default.createElement(VaultView, { mode: "error", message: msg })
  });
});
init_launchVault();

export {
  callVaultListCredentials,
  callVault
};

//# debugId=CB079BA895981B1C64756E2164756E21
//# sourceMappingURL=chunk-7h5ndenc.js.map
