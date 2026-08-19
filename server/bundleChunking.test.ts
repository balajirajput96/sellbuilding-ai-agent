import { describe, expect, it } from "vitest";
import config from "../vite.config";

describe("Vite bundle chunking", () => {
  it("separates framework, UI, and chart dependencies from the entry bundle", () => {
    const output = config.build?.rollupOptions?.output;
    expect(output).toBeDefined();
    expect(Array.isArray(output)).toBe(false);

    if (!output || Array.isArray(output)) {
      throw new Error("Expected a single Rollup output configuration");
    }

    const manualChunks = output.manualChunks;
    expect(manualChunks).toBeTypeOf("function");

    if (typeof manualChunks !== "function") {
      throw new Error("Expected a manual chunk resolver");
    }

    expect(manualChunks("/repo/node_modules/react/index.js")).toBe("react-vendor");
    expect(manualChunks("/repo/node_modules/@radix-ui/react-dialog/dist/index.js")).toBe("ui-vendor");
    expect(manualChunks("/repo/node_modules/recharts/es6/index.js")).toBe("charts-vendor");
    expect(manualChunks("/repo/client/src/App.tsx")).toBeUndefined();
  });
});
