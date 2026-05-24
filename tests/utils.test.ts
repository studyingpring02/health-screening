// jsdom·RSC 의존성 없는 안전한 smoke test. 회귀 테스트는 이 디렉토리에 누적.
import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";

describe("cn", () => {
  it("merges tailwind classes (later wins)", () => {
    expect(cn("p-2", "p-4")).toBe("p-4");
  });
  it("filters falsy", () => {
    expect(cn("a", false, undefined, "b")).toBe("a b");
  });
});
