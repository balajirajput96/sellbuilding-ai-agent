import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

type PackageManifest = {
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  pnpm?: unknown;
};

const projectRoot = resolve(import.meta.dirname, "..");
const manifest = JSON.parse(
  readFileSync(resolve(projectRoot, "package.json"), "utf8"),
) as PackageManifest;
const workspaceConfig = readFileSync(
  resolve(projectRoot, "pnpm-workspace.yaml"),
  "utf8",
);
const vitestConfig = readFileSync(
  resolve(projectRoot, "vitest.config.ts"),
  "utf8",
);

function versionParts(versionRange: string | undefined) {
  const match = versionRange?.match(/(\d+)\.(\d+)\.(\d+)/);
  return match ? match.slice(1).map(Number) : null;
}

describe("dependency security posture", () => {
  it("keeps Vitest on the first patched 3.x release or later", () => {
    const [major, minor, patch] = versionParts(manifest.devDependencies?.vitest) ?? [];
    expect(major).toBeGreaterThanOrEqual(3);
    expect([major, minor, patch]).toEqual([3, 2, 6]);
  });

  it("keeps the tRPC packages aligned on a patched 11.x release", () => {
    const versions = [
      manifest.dependencies?.["@trpc/client"],
      manifest.dependencies?.["@trpc/react-query"],
      manifest.dependencies?.["@trpc/server"],
    ].map(versionParts);

    expect(versions.every(Boolean)).toBe(true);
    expect(new Set(versions.map(parts => parts?.join("."))).size).toBe(1);
    expect(versions[0]?.[0]).toBe(11);
    expect(versions[0]?.[1]).toBeGreaterThanOrEqual(8);
  });

  it("keeps test execution non-UI and security resolutions active", () => {
    expect(manifest.scripts?.test).toBe("vitest run");
    expect(vitestConfig).not.toMatch(/--ui|api\.host|browser\s*:/);
    expect(manifest.pnpm).toBeUndefined();
    expect(workspaceConfig).toContain("patchedDependencies:");
    expect(workspaceConfig).toContain("wouter@3.7.1");
    expect(workspaceConfig).toContain('"tailwindcss>nanoid": "3.3.7"');
    expect(workspaceConfig).toContain('"nanoid": "5.1.16"');
    expect(workspaceConfig).toContain('"body-parser": "1.20.6"');
  });
});
