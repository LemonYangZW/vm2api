// @bun
import {
  captureException,
  init_sentry
} from "./chunk-f2rhkq3t.js";
import {
  ThemedBox_default,
  ThemedText,
  init_src,
  require_react
} from "./chunk-1ekct4sm.js";
import {
  require_jsx_runtime
} from "./chunk-x9xf2qa8.js";
import {
  init_log,
  logError
} from "./chunk-mhjmeh6r.js";
import {
  __esm,
  __toESM
} from "./chunk-hhsxm2yr.js";

// src/components/SentryErrorBoundary.tsx
var React, jsx_runtime, SentryErrorBoundary;
var init_SentryErrorBoundary = __esm(() => {
  init_src();
  init_sentry();
  init_log();
  React = __toESM(require_react(), 1);
  jsx_runtime = __toESM(require_jsx_runtime(), 1);
  SentryErrorBoundary = class SentryErrorBoundary extends React.Component {
    constructor(props) {
      super(props);
      this.state = { hasError: false, error: null, errorInfo: null };
    }
    static getDerivedStateFromError(error) {
      return { hasError: true, error };
    }
    componentDidCatch(error, errorInfo) {
      this.setState({ errorInfo });
      const boundary = this.props.name || "SentryErrorBoundary";
      const lines = ["", `[ErrorBoundary:${boundary}] React rendering error caught`, `  Message: ${error.message}`];
      if (errorInfo.componentStack) {
        lines.push(`  Component stack:
${errorInfo.componentStack}`);
      }
      console.error(lines.join(`
`));
      logError(error);
      captureException(error, {
        componentBoundary: boundary,
        componentStack: errorInfo.componentStack
      });
    }
    render() {
      if (this.state.hasError) {
        return /* @__PURE__ */ jsx_runtime.jsxs(ThemedBox_default, {
          flexDirection: "column",
          paddingX: 1,
          paddingY: 1,
          children: [
            /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
              color: "error",
              bold: true,
              children: "React Rendering Error"
            }),
            /* @__PURE__ */ jsx_runtime.jsx(ThemedText, {
              color: "error",
              children: this.state.error?.message
            }),
            this.props.name && /* @__PURE__ */ jsx_runtime.jsxs(ThemedText, {
              dimColor: true,
              children: [
                "Boundary: ",
                this.props.name
              ]
            })
          ]
        });
      }
      return this.props.children;
    }
  };
});

export { SentryErrorBoundary, init_SentryErrorBoundary };

//# debugId=1180097871E9A36864756E2164756E21
//# sourceMappingURL=chunk-w9t7xj87.js.map
