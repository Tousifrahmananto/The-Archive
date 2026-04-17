import { describe, expect, it } from "vitest";
import { cn } from "../src/lib/utils";

describe("cn", () => {
    it("merges plain class strings", () => {
        expect(cn("text-sm", "font-bold")).toBe("text-sm font-bold");
    });

    it("deduplicates conflicting tailwind utilities", () => {
        expect(cn("p-2", "p-4")).toBe("p-4");
    });

    it("ignores falsy and undefined values", () => {
        const condition = false;
        expect(cn("block", condition && "hidden", undefined, null, "md:block")).toBe("block md:block");
    });
});
