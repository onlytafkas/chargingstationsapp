import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockSelect } = vi.hoisted(() => ({
  mockSelect: vi.fn(),
}));

function createSelectChain(resolveWith: unknown) {
  const chain = {
    from: vi.fn(() => chain),
    where: vi.fn(() => chain),
    groupBy: vi.fn(() => chain),
    then: (resolve: (value: unknown) => unknown) => Promise.resolve(resolveWith).then(resolve),
  };

  return chain;
}

vi.mock("@/db", () => ({
  db: {
    select: mockSelect,
  },
}));

import { getTodaySessionCountsByStation } from "@/data/stations";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getTodaySessionCountsByStation", () => {
  it("returns an empty map when there are no sessions for today", async () => {
    mockSelect.mockReturnValue(createSelectChain([]));

    const result = await getTodaySessionCountsByStation(
      new Date("2026-03-20T12:00:00.000Z"),
    );

    expect(result).toEqual(new Map());
  });

  it("returns grouped counts keyed by station id", async () => {
    mockSelect.mockReturnValue(
      createSelectChain([
        { stationId: 2, count: 3 },
        { stationId: 5, count: 1 },
      ]),
    );

    const result = await getTodaySessionCountsByStation(
      new Date("2026-03-20T12:00:00.000Z"),
    );

    expect(result).toEqual(
      new Map([
        [2, 3],
        [5, 1],
      ]),
    );
  });
});