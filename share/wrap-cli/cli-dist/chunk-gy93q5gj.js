// @bun
import {
  env,
  init_env
} from "./chunk-kkpmm4b2.js";
import {
  ThemedBox_default,
  ThemedText,
  init_src,
  useTheme
} from "./chunk-1ekct4sm.js";
import {
  require_jsx_runtime
} from "./chunk-x9xf2qa8.js";
import {
  __toESM
} from "./chunk-hhsxm2yr.js";

// src/components/LogoV2/WelcomeV2.tsx
init_src();
init_env();
var jsx_runtime = __toESM(require_jsx_runtime(), 1);
var WELCOME_V2_WIDTH = 58;
function WelcomeV2() {
  const [theme] = useTheme();
  const welcomeMessage = "Welcome to Claude Code";
  if (env.terminal === "Apple_Terminal") {
    return /* @__PURE__ */ jsx_runtime.jsx(AppleTerminalWelcomeV2, {
      theme,
      welcomeMessage
    });
  }
  if (["light", "light-daltonized", "light-ansi"].includes(theme)) {
    return /* @__PURE__ */ jsx_runtime.jsx(ThemedBox_default, {
      width: WELCOME_V2_WIDTH,
      children: /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
        children: [
          /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
            children: [
              /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
                color: "claude",
                children: [
                  welcomeMessage,
                  " "
                ]
              }),
              /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
                dimColor: true,
                children: [
                  "v",
                  "2.8.4",
                  " "
                ]
              })
            ]
          }),
          /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
            children: "\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026"
          }),
          /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
            children: "                                                          "
          }),
          /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
            children: "                                                          "
          }),
          /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
            children: "                                                          "
          }),
          /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
            children: "            \u2591\u2591\u2591\u2591\u2591\u2591                                        "
          }),
          /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
            children: "    \u2591\u2591\u2591   \u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591                                      "
          }),
          /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
            children: "   \u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591                                    "
          }),
          /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
            children: "                                                          "
          }),
          /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
            children: [
              /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
                dimColor: true,
                children: "                           \u2591\u2591\u2591\u2591"
              }),
              /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
                children: "                     \u2588\u2588    "
              })
            ]
          }),
          /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
            children: [
              /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
                dimColor: true,
                children: "                         \u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591"
              }),
              /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
                children: "               \u2588\u2588\u2592\u2592\u2588\u2588  "
              })
            ]
          }),
          /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
            children: "                                            \u2592\u2592      \u2588\u2588   \u2592"
          }),
          /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
            children: [
              "      ",
              /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
                color: "clawd_body",
                children: " \u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588 "
              }),
              "                         \u2592\u2592\u2591\u2591\u2592\u2592      \u2592 \u2592\u2592"
            ]
          }),
          /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
            children: [
              "      ",
              /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
                color: "clawd_body",
                backgroundColor: "clawd_background",
                children: "\u2588\u2588\u2584\u2588\u2588\u2588\u2588\u2588\u2584\u2588\u2588"
              }),
              "                           \u2592\u2592         \u2592\u2592 "
            ]
          }),
          /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
            children: [
              "      ",
              /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
                color: "clawd_body",
                children: " \u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588 "
              }),
              "                          \u2591          \u2592   "
            ]
          }),
          /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
            children: [
              "\u2026\u2026\u2026\u2026\u2026\u2026\u2026",
              /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
                color: "clawd_body",
                children: "\u2588 \u2588   \u2588 \u2588"
              }),
              "\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2591\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2592\u2026\u2026\u2026\u2026"
            ]
          })
        ]
      })
    });
  }
  return /* @__PURE__ */ jsx_runtime.jsx(ThemedBox_default, {
    width: WELCOME_V2_WIDTH,
    children: /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
      children: [
        /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
          children: [
            /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
              color: "claude",
              children: [
                welcomeMessage,
                " "
              ]
            }),
            /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
              dimColor: true,
              children: [
                "v",
                "2.8.4",
                " "
              ]
            })
          ]
        }),
        /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
          children: "\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026"
        }),
        /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
          children: "                                                          "
        }),
        /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
          children: "     *                                       \u2588\u2588\u2588\u2588\u2588\u2593\u2593\u2591     "
        }),
        /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
          children: "                                 *         \u2588\u2588\u2588\u2593\u2591     \u2591\u2591   "
        }),
        /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
          children: "            \u2591\u2591\u2591\u2591\u2591\u2591                        \u2588\u2588\u2588\u2593\u2591           "
        }),
        /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
          children: "    \u2591\u2591\u2591   \u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591                      \u2588\u2588\u2588\u2593\u2591           "
        }),
        /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
          children: [
            /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
              children: "   \u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591    "
            }),
            /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
              bold: true,
              children: "*"
            }),
            /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
              children: "                \u2588\u2588\u2593\u2591\u2591      \u2593   "
            })
          ]
        }),
        /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
          children: "                                             \u2591\u2593\u2593\u2588\u2588\u2588\u2593\u2593\u2591    "
        }),
        /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
          dimColor: true,
          children: " *                                 \u2591\u2591\u2591\u2591                   "
        }),
        /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
          dimColor: true,
          children: "                                 \u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591                 "
        }),
        /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
          dimColor: true,
          children: "                               \u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591           "
        }),
        /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
          children: [
            "      ",
            /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
              color: "clawd_body",
              children: " \u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588 "
            }),
            "                                       ",
            /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
              dimColor: true,
              children: "*"
            }),
            /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
              children: " "
            })
          ]
        }),
        /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
          children: [
            "      ",
            /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
              color: "clawd_body",
              children: "\u2588\u2588\u2584\u2588\u2588\u2588\u2588\u2588\u2584\u2588\u2588"
            }),
            /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
              children: "                        "
            }),
            /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
              bold: true,
              children: "*"
            }),
            /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
              children: "                "
            })
          ]
        }),
        /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
          children: [
            "      ",
            /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
              color: "clawd_body",
              children: " \u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588\u2588 "
            }),
            "     *                                   "
          ]
        }),
        /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
          children: [
            "\u2026\u2026\u2026\u2026\u2026\u2026\u2026",
            /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
              color: "clawd_body",
              children: "\u2588 \u2588   \u2588 \u2588"
            }),
            "\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026"
          ]
        })
      ]
    })
  });
}
function AppleTerminalWelcomeV2({ theme, welcomeMessage }) {
  const isLightTheme = ["light", "light-daltonized", "light-ansi"].includes(theme);
  if (isLightTheme) {
    return /* @__PURE__ */ jsx_runtime.jsx(ThemedBox_default, {
      width: WELCOME_V2_WIDTH,
      children: /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
        children: [
          /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
            children: [
              /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
                color: "claude",
                children: [
                  welcomeMessage,
                  " "
                ]
              }),
              /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
                dimColor: true,
                children: [
                  "v",
                  "2.8.4",
                  " "
                ]
              })
            ]
          }),
          /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
            children: "\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026"
          }),
          /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
            children: "                                                          "
          }),
          /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
            children: "                                                          "
          }),
          /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
            children: "                                                          "
          }),
          /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
            children: "            \u2591\u2591\u2591\u2591\u2591\u2591                                        "
          }),
          /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
            children: "    \u2591\u2591\u2591   \u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591                                      "
          }),
          /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
            children: "   \u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591                                    "
          }),
          /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
            children: "                                                          "
          }),
          /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
            children: [
              /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
                dimColor: true,
                children: "                           \u2591\u2591\u2591\u2591"
              }),
              /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
                children: "                     \u2588\u2588    "
              })
            ]
          }),
          /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
            children: [
              /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
                dimColor: true,
                children: "                         \u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591"
              }),
              /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
                children: "               \u2588\u2588\u2592\u2592\u2588\u2588  "
              })
            ]
          }),
          /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
            children: "                                            \u2592\u2592      \u2588\u2588   \u2592"
          }),
          /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
            children: "                                          \u2592\u2592\u2591\u2591\u2592\u2592      \u2592 \u2592\u2592"
          }),
          /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
            children: [
              "      ",
              /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
                color: "clawd_body",
                children: "\u2597"
              }),
              /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
                color: "clawd_background",
                backgroundColor: "clawd_body",
                children: [
                  " ",
                  "\u2597",
                  "     ",
                  "\u2596",
                  " "
                ]
              }),
              /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
                color: "clawd_body",
                children: "\u2596"
              }),
              "                           \u2592\u2592         \u2592\u2592 "
            ]
          }),
          /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
            children: [
              "       ",
              /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
                backgroundColor: "clawd_body",
                children: " ".repeat(9)
              }),
              "                           \u2591          \u2592   "
            ]
          }),
          /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
            children: [
              "\u2026\u2026\u2026\u2026\u2026\u2026\u2026",
              /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
                backgroundColor: "clawd_body",
                children: " "
              }),
              /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
                children: " "
              }),
              /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
                backgroundColor: "clawd_body",
                children: " "
              }),
              /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
                children: "   "
              }),
              /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
                backgroundColor: "clawd_body",
                children: " "
              }),
              /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
                children: " "
              }),
              /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
                backgroundColor: "clawd_body",
                children: " "
              }),
              "\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2591\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2592\u2026\u2026\u2026\u2026"
            ]
          })
        ]
      })
    });
  }
  return /* @__PURE__ */ jsx_runtime.jsx(ThemedBox_default, {
    width: WELCOME_V2_WIDTH,
    children: /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
      children: [
        /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
          children: [
            /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
              color: "claude",
              children: [
                welcomeMessage,
                " "
              ]
            }),
            /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
              dimColor: true,
              children: [
                "v",
                "2.8.4",
                " "
              ]
            })
          ]
        }),
        /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
          children: "\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026"
        }),
        /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
          children: "                                                          "
        }),
        /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
          children: "     *                                       \u2588\u2588\u2588\u2588\u2588\u2593\u2593\u2591     "
        }),
        /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
          children: "                                 *         \u2588\u2588\u2588\u2593\u2591     \u2591\u2591   "
        }),
        /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
          children: "            \u2591\u2591\u2591\u2591\u2591\u2591                        \u2588\u2588\u2588\u2593\u2591           "
        }),
        /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
          children: "    \u2591\u2591\u2591   \u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591                      \u2588\u2588\u2588\u2593\u2591           "
        }),
        /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
          children: [
            /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
              children: "   \u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591    "
            }),
            /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
              bold: true,
              children: "*"
            }),
            /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
              children: "                \u2588\u2588\u2593\u2591\u2591      \u2593   "
            })
          ]
        }),
        /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
          children: "                                             \u2591\u2593\u2593\u2588\u2588\u2588\u2593\u2593\u2591    "
        }),
        /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
          dimColor: true,
          children: " *                                 \u2591\u2591\u2591\u2591                   "
        }),
        /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
          dimColor: true,
          children: "                                 \u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591                 "
        }),
        /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
          dimColor: true,
          children: "                               \u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591\u2591           "
        }),
        /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
          children: [
            "                                                      ",
            /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
              dimColor: true,
              children: "*"
            }),
            /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
              children: " "
            })
          ]
        }),
        /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
          children: [
            "        ",
            /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
              color: "clawd_body",
              children: "\u2597"
            }),
            /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
              color: "clawd_background",
              backgroundColor: "clawd_body",
              children: [
                " ",
                "\u2597",
                "     ",
                "\u2596",
                " "
              ]
            }),
            /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
              color: "clawd_body",
              children: "\u2596"
            }),
            /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
              children: "                       "
            }),
            /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
              bold: true,
              children: "*"
            }),
            /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
              children: "                "
            })
          ]
        }),
        /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
          children: [
            "        ",
            /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
              backgroundColor: "clawd_body",
              children: " ".repeat(9)
            }),
            "      *                                   "
          ]
        }),
        /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
          children: [
            "\u2026\u2026\u2026\u2026\u2026\u2026\u2026",
            /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
              backgroundColor: "clawd_body",
              children: " "
            }),
            /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
              children: " "
            }),
            /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
              backgroundColor: "clawd_body",
              children: " "
            }),
            /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
              children: "   "
            }),
            /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
              backgroundColor: "clawd_body",
              children: " "
            }),
            /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
              children: " "
            }),
            /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
              backgroundColor: "clawd_body",
              children: " "
            }),
            "\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026"
          ]
        })
      ]
    })
  });
}

export { WelcomeV2 };

//# debugId=AC668896361745D064756E2164756E21
//# sourceMappingURL=chunk-gy93q5gj.js.map
