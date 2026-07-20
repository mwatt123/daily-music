import { describe, it, expect } from "vitest";
import { deriveExtensionVersion } from "./extensionVersion";

describe("deriveExtensionVersion", () => {
  it("strips the leading v from a well-formed tag", () => {
    expect(deriveExtensionVersion("v1.3.0", "1.2.0")).toBe("1.3.0");
  });

  it("accepts a patch, minor, or major increment over the baseline", () => {
    expect(deriveExtensionVersion("v1.2.1", "1.2.0")).toBe("1.2.1");
    expect(deriveExtensionVersion("v1.3.0", "1.2.0")).toBe("1.3.0");
    expect(deriveExtensionVersion("v2.0.0", "1.2.0")).toBe("2.0.0");
  });

  it("compares version parts numerically, not lexically", () => {
    // "1.10.0" < "1.9.0" as strings, but 1.10.0 is the newer release.
    expect(deriveExtensionVersion("v1.10.0", "1.9.0")).toBe("1.10.0");
  });

  it("rejects a tag that is not vMAJOR.MINOR.PATCH", () => {
    for (const tag of ["1.3.0", "v1.3", "v1.3.0.0", "vfoo", "v1.3.0-beta", "v1.2.x"]) {
      expect(() => deriveExtensionVersion(tag, "1.2.0")).toThrow();
    }
  });

  it("rejects a version equal to the baseline", () => {
    expect(() => deriveExtensionVersion("v1.2.0", "1.2.0")).toThrow(/increment/i);
  });

  it("rejects a version lower than the baseline", () => {
    expect(() => deriveExtensionVersion("v1.1.9", "1.2.0")).toThrow(/increment/i);
  });

  it("rejects a malformed baseline", () => {
    expect(() => deriveExtensionVersion("v1.3.0", "not-a-version")).toThrow(/baseline/i);
  });
});
