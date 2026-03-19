import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/db", async () => await import("@/__tests__/integration/helpers/test-db"));

import { mem, emptyBackup } from "@/__tests__/integration/helpers/test-db";
import { createLoadingSession } from "@/data/loading-sessions";
import { createStation, getTodaySessionCountsByStation } from "@/data/stations";
import { createUser } from "@/data/usersinfo";

let backup: ReturnType<typeof mem.backup>;

beforeAll(() => {
  emptyBackup.restore();
  backup = mem.backup();
});

afterAll(() => {
  emptyBackup.restore();
});

beforeEach(() => {
  backup.restore();
});

describe("getTodaySessionCountsByStation", () => {
  it("returns an empty map when no sessions start today", async () => {
    const now = new Date();
    const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 9, 0, 0, 0);

    const station = await createStation({ name: "Yesterday Only Station" });
    await createUser({ userId: "user_today_counts_empty", carNumberPlate: "TODAY-000", mobileNumber: "+15550000050" });
    await createLoadingSession({
      userId: "user_today_counts_empty",
      stationId: station.id,
      startTime: yesterday.toISOString(),
    });

    const result = await getTodaySessionCountsByStation(now);

    expect(result).toEqual(new Map());
  });

  it("counts only sessions whose start time falls within today", async () => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterdayStart = new Date(todayStart.getTime() - 60 * 60 * 1000);
    const firstTodayStart = new Date(todayStart.getTime() + 60 * 60 * 1000);
    const secondTodayStart = new Date(todayStart.getTime() + 2 * 60 * 60 * 1000);
    const tomorrowStart = new Date(todayStart.getTime() + 25 * 60 * 60 * 1000);

    const alphaStation = await createStation({ name: "Alpha Today Counts" });
    const betaStation = await createStation({ name: "Beta Today Counts" });

    await createUser({ userId: "user_today_counts_grouped", carNumberPlate: "TODAY-111", mobileNumber: "+15550000051" });

    await createLoadingSession({
      userId: "user_today_counts_grouped",
      stationId: alphaStation.id,
      startTime: yesterdayStart.toISOString(),
    });
    await createLoadingSession({
      userId: "user_today_counts_grouped",
      stationId: alphaStation.id,
      startTime: firstTodayStart.toISOString(),
    });
    await createLoadingSession({
      userId: "user_today_counts_grouped",
      stationId: alphaStation.id,
      startTime: secondTodayStart.toISOString(),
    });
    await createLoadingSession({
      userId: "user_today_counts_grouped",
      stationId: betaStation.id,
      startTime: tomorrowStart.toISOString(),
    });

    const result = await getTodaySessionCountsByStation(now);

    expect(result).toEqual(new Map([[alphaStation.id, 2]]));
    expect(result.has(betaStation.id)).toBe(false);
  });
});