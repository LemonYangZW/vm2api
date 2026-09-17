// @bun
import {
  init_sprites,
  renderSprite
} from "./chunk-n5ycabe0.js";
import {
  RARITY_COLORS,
  RARITY_STARS,
  STAT_NAMES,
  generateSeed,
  getCompanion,
  init_companion,
  init_types,
  rollWithSeed
} from "./chunk-bhgvey4s.js";
import {
  getClaudeAIOAuthTokens,
  getGlobalConfig,
  getUserAgent,
  init_auth,
  init_config1 as init_config,
  init_http,
  saveGlobalConfig
} from "./chunk-ghhmj79c.js";
import"./chunk-73g8bk52.js";
import"./chunk-khh8a09c.js";
import"./chunk-rwny7j7h.js";
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
  require_react,
  use_input_default
} from "./chunk-1ekct4sm.js";
import {
  require_jsx_runtime
} from "./chunk-x9xf2qa8.js";
import"./chunk-j1mep9ck.js";
import"./chunk-6x35ffpx.js";
import"./chunk-1zbwhcbt.js";
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
import"./chunk-pecy49yr.js";
import"./chunk-azbab59e.js";
import"./chunk-3nk9q8dr.js";
import {
  __esm,
  __toESM
} from "./chunk-hhsxm2yr.js";

// src/buddy/CompanionCard.tsx
function StatBar({ name, value }) {
  const clamped = Math.max(0, Math.min(100, value));
  const filled = Math.round(clamped / 10);
  const bar = "\u2588".repeat(filled) + "\u2591".repeat(10 - filled);
  return /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
    children: [
      name.padEnd(10),
      " ",
      bar,
      " ",
      String(value).padStart(3)
    ]
  });
}
function CompanionCard({
  companion,
  lastReaction,
  onDone
}) {
  const color = RARITY_COLORS[companion.rarity];
  const stars = RARITY_STARS[companion.rarity];
  const sprite = renderSprite(companion, 0);
  use_input_default(() => {
    onDone?.(undefined, { display: "skip" });
  }, { isActive: onDone !== undefined });
  return /* @__PURE__ */ jsx_runtime.jsxs(ThemedBox_default, {
    flexDirection: "column",
    borderStyle: "round",
    borderColor: color,
    paddingX: CARD_PADDING_X,
    paddingY: 1,
    width: CARD_WIDTH,
    flexShrink: 0,
    children: [
      /* @__PURE__ */ jsx_runtime.jsxs(ThemedBox_default, {
        justifyContent: "space-between",
        children: [
          /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
            bold: true,
            color,
            children: [
              stars,
              " ",
              companion.rarity.toUpperCase()
            ]
          }),
          /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
            color,
            children: companion.species.toUpperCase()
          })
        ]
      }),
      companion.shiny && /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
        color: "warning",
        bold: true,
        children: [
          "\u2728",
          " SHINY ",
          "\u2728"
        ]
      }),
      /* @__PURE__ */ jsx_runtime.jsx(ThemedBox_default, {
        flexDirection: "column",
        marginY: 1,
        children: sprite.map((line, i) => /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
          color,
          children: line
        }, i))
      }),
      /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
        bold: true,
        children: companion.name
      }),
      /* @__PURE__ */ jsx_runtime.jsx(ThemedBox_default, {
        marginY: 1,
        children: /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
          dimColor: true,
          italic: true,
          children: [
            '"',
            companion.personality,
            '"'
          ]
        })
      }),
      /* @__PURE__ */ jsx_runtime.jsx(ThemedBox_default, {
        flexDirection: "column",
        children: STAT_NAMES.map((name) => /* @__PURE__ */ jsx_runtime.jsx(StatBar, {
          name,
          value: companion.stats[name] ?? 0
        }, name))
      }),
      lastReaction && /* @__PURE__ */ jsx_runtime.jsxs(ThemedBox_default, {
        flexDirection: "column",
        marginTop: 1,
        children: [
          /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
            dimColor: true,
            children: "last said"
          }),
          /* @__PURE__ */ jsx_runtime.jsx(ThemedBox_default, {
            borderStyle: "round",
            borderColor: "inactive",
            paddingX: 1,
            children: /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
              dimColor: true,
              italic: true,
              children: lastReaction
            })
          })
        ]
      })
    ]
  });
}
var jsx_runtime, CARD_WIDTH = 40, CARD_PADDING_X = 2;
var init_CompanionCard = __esm(() => {
  init_src();
  init_src();
  init_sprites();
  init_types();
  jsx_runtime = __toESM(require_jsx_runtime(), 1);
});

// src/buddy/companionReact.ts
function triggerCompanionReaction(messages, setReaction) {
  const companion = getCompanion();
  if (!companion || getGlobalConfig().companionMuted)
    return;
  const addressed = isAddressed(messages, companion.name);
  const now = Date.now();
  if (!addressed && now - lastReactTime < MIN_INTERVAL_MS)
    return;
  const transcript = buildTranscript(messages);
  if (!transcript.trim())
    return;
  lastReactTime = now;
  callBuddyReactAPI(companion, transcript, addressed).then((reaction) => {
    if (!reaction)
      return;
    recentReactions.push(reaction);
    if (recentReactions.length > MAX_RECENT)
      recentReactions.shift();
    setReaction(reaction);
  }).catch(() => {});
}
function isAddressed(messages, name) {
  const pattern = new RegExp(`\\b${escapeRegex(name)}\\b`, "i");
  for (let i = messages.length - 1;i >= Math.max(0, messages.length - 3); i--) {
    const m = messages[i];
    if (m?.type !== "user")
      continue;
    const content = m.message?.content;
    if (typeof content === "string" && pattern.test(content))
      return true;
  }
  return false;
}
function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function buildTranscript(messages) {
  return messages.slice(-12).filter((m) => m.type === "user" || m.type === "assistant").map((m) => {
    const role = m.type === "user" ? "user" : "claude";
    const content = m.message?.content;
    const text = typeof content === "string" ? content.slice(0, 300) : Array.isArray(content) ? content.filter((b) => b?.type === "text").map((b) => b.text).join(" ").slice(0, 300) : "";
    return `${role}: ${text}`;
  }).join(`
`).slice(0, 5000);
}
async function callBuddyReactAPI(companion, transcript, addressed) {
  const tokens = getClaudeAIOAuthTokens();
  if (!tokens?.accessToken)
    return null;
  const orgId = getGlobalConfig().oauthAccount?.organizationUuid;
  if (!orgId)
    return null;
  const baseUrl = getOauthConfig().BASE_API_URL;
  const url = `${baseUrl}/api/organizations/${orgId}/claude_code/buddy_react`;
  const resp = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${tokens.accessToken}`,
      "Content-Type": "application/json",
      "User-Agent": getUserAgent()
    },
    body: JSON.stringify({
      name: companion.name.slice(0, 32),
      personality: companion.personality.slice(0, 200),
      species: companion.species,
      rarity: companion.rarity,
      stats: companion.stats,
      transcript,
      reason: addressed ? "addressed" : "turn",
      recent: recentReactions.map((r) => r.slice(0, 200)),
      addressed
    }),
    signal: AbortSignal.timeout(1e4)
  });
  if (!resp.ok)
    return null;
  try {
    const data = await resp.json();
    return data.reaction?.trim() || null;
  } catch {
    return null;
  }
}
var lastReactTime = 0, MIN_INTERVAL_MS = 45000, recentReactions, MAX_RECENT = 8;
var init_companionReact = __esm(() => {
  init_companion();
  init_config();
  init_auth();
  init_oauth();
  init_http();
  recentReactions = [];
});

// src/commands/buddy/buddy.ts
function speciesLabel(species) {
  return species.charAt(0).toUpperCase() + species.slice(1);
}
async function call(onDone, context, args) {
  const sub = args?.trim().toLowerCase() ?? "";
  const setState = context.setAppState;
  if (sub === "off") {
    saveGlobalConfig((cfg) => ({ ...cfg, companionMuted: true }));
    onDone("companion muted", { display: "system" });
    return null;
  }
  if (sub === "on") {
    saveGlobalConfig((cfg) => ({ ...cfg, companionMuted: false }));
    onDone("companion unmuted", { display: "system" });
    return null;
  }
  if (sub === "pet") {
    const companion2 = getCompanion();
    if (!companion2) {
      onDone("no companion yet \xB7 run /buddy first", { display: "system" });
      return null;
    }
    saveGlobalConfig((cfg) => ({ ...cfg, companionMuted: false }));
    setState?.((prev) => ({ ...prev, companionPetAt: Date.now() }));
    triggerCompanionReaction(context.messages ?? [], (reaction) => setState?.((prev) => prev.companionReaction === reaction ? prev : { ...prev, companionReaction: reaction }));
    onDone(`petted ${companion2.name}`, { display: "system" });
    return null;
  }
  const companion = getCompanion();
  if (companion && getGlobalConfig().companionMuted) {
    saveGlobalConfig((cfg) => ({ ...cfg, companionMuted: false }));
  }
  if (companion) {
    const lastReaction = context.getAppState?.()?.companionReaction;
    return import_react.default.createElement(CompanionCard, {
      companion,
      lastReaction,
      onDone
    });
  }
  const seed = generateSeed();
  const r = rollWithSeed(seed);
  const name = SPECIES_NAMES[r.bones.species] ?? "Buddy";
  const personality = SPECIES_PERSONALITY[r.bones.species] ?? "Mysterious and code-savvy.";
  const stored = {
    name,
    personality,
    seed,
    hatchedAt: Date.now()
  };
  saveGlobalConfig((cfg) => ({ ...cfg, companion: stored }));
  const stars = RARITY_STARS[r.bones.rarity];
  const sprite = renderSprite(r.bones, 0);
  const shiny = r.bones.shiny ? " \u2728 Shiny!" : "";
  const lines = [
    "A wild companion appeared!",
    "",
    ...sprite,
    "",
    `${name} the ${speciesLabel(r.bones.species)}${shiny}`,
    `Rarity: ${stars} (${r.bones.rarity})`,
    `"${personality}"`,
    "",
    "Your companion will now appear beside your input box!",
    "Say its name to get its take \xB7 /buddy pet \xB7 /buddy off"
  ];
  onDone(lines.join(`
`), { display: "system" });
  return null;
}
var import_react, SPECIES_NAMES, SPECIES_PERSONALITY;
var init_buddy = __esm(() => {
  init_companion();
  init_types();
  init_sprites();
  init_CompanionCard();
  init_config();
  init_companionReact();
  import_react = __toESM(require_react(), 1);
  SPECIES_NAMES = {
    duck: "Waddles",
    goose: "Goosberry",
    blob: "Gooey",
    cat: "Whiskers",
    dragon: "Ember",
    octopus: "Inky",
    owl: "Hoots",
    penguin: "Waddleford",
    turtle: "Shelly",
    snail: "Trailblazer",
    ghost: "Casper",
    axolotl: "Axie",
    capybara: "Chill",
    cactus: "Spike",
    robot: "Byte",
    rabbit: "Flops",
    mushroom: "Spore",
    chonk: "Chonk"
  };
  SPECIES_PERSONALITY = {
    duck: "Quirky and easily amused. Leaves rubber duck debugging tips everywhere.",
    goose: "Assertive and honks at bad code. Takes no prisoners in code reviews.",
    blob: "Adaptable and goes with the flow. Sometimes splits into two when confused.",
    cat: "Independent and judgmental. Watches you type with mild disdain.",
    dragon: "Fiery and passionate about architecture. Hoards good variable names.",
    octopus: "Multitasker extraordinaire. Wraps tentacles around every problem at once.",
    owl: 'Wise but verbose. Always says "let me think about that" for exactly 3 seconds.',
    penguin: "Cool under pressure. Slides gracefully through merge conflicts.",
    turtle: "Patient and thorough. Believes slow and steady wins the deploy.",
    snail: "Methodical and leaves a trail of useful comments. Never rushes.",
    ghost: "Ethereal and appears at the worst possible moments with spooky insights.",
    axolotl: "Regenerative and cheerful. Recovers from any bug with a smile.",
    capybara: "Zen master. Remains calm while everything around is on fire.",
    cactus: "Prickly on the outside but full of good intentions. Thrives on neglect.",
    robot: "Efficient and literal. Processes feedback in binary.",
    rabbit: "Energetic and hops between tasks. Finishes before you start.",
    mushroom: "Quietly insightful. Grows on you over time.",
    chonk: "Big, warm, and takes up the whole couch. Prioritizes comfort over elegance."
  };
});
init_buddy();

export {
  call
};

//# debugId=0F3945262916E2C664756E2164756E21
//# sourceMappingURL=chunk-qmkszxb7.js.map
