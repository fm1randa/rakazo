import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { describeToolActivity, stepStatusOf } from "./pi-runtime-tools.js";
import { longWorkProgressGuidance } from "./run-replies.js";

describe("step status field", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe("with RAKAZO_OPENING_ACKNOWLEDGEMENT=1", () => {
    beforeEach(() => {
      vi.stubEnv("RAKAZO_OPENING_ACKNOWLEDGEMENT", "1");
    });

    it("shows the model's status instead of the tool detail", () => {
      expect(
        describeToolActivity("shell", {
          command: "cd /home/rakazo && python3 -c 'print(1)'",
          status: "  Lendo o   ledger ",
        }),
      ).toBe("Lendo o ledger");
    });

    it("reads the status given on a use_tool call", () => {
      expect(
        describeToolActivity("use_tool", {
          name: "create_space",
          arguments: { name: "Finance" },
          status: "Criando o espaço",
        }),
      ).toBe("Criando o espaço");
    });

    it("falls back to the tool detail without a usable status", () => {
      expect(describeToolActivity("shell", { command: "ls", status: "   " })).toBe(
        "Running: ls",
      );
      expect(stepStatusOf({ status: 42 })).toBeUndefined();
    });

    it("cuts a long status to one working line", () => {
      const status = stepStatusOf({ status: "palavra ".repeat(20) });
      expect(status?.endsWith("…")).toBe(true);
      expect(status!.length).toBeLessThanOrEqual(61);
    });

    it("asks for the status field in the guidance", () => {
      expect(longWorkProgressGuidance()).toContain("status field");
    });
  });

  it("ignores the field when live narration is off", () => {
    expect(describeToolActivity("shell", { command: "ls", status: "Listando" })).toBe(
      "Running: ls",
    );
    expect(longWorkProgressGuidance()).toContain("never to announce that you are starting");
  });
});
