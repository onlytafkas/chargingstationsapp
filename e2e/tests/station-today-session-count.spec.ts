import { expect, test } from "@playwright/test";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "../../db/schema";
import { stations, sessions } from "@/db/schema";
import { withLibpqSslCompatibility } from "../../lib/postgres-connection-string";
import { assertSafeE2EDatabaseUrl, getRequiredE2EBranchName } from "../helpers/safety";
import { loginAsAdmin } from "../helpers/auth";
import { DashboardPage } from "../pages/dashboard.page";
import { StationPage } from "../pages/station.page";

const E2E_REGULAR_USER_ID = process.env.E2E_REGULAR_USER_ID ?? "user_e2e_regular";

function getE2EDatabaseUrl(): string {
  const databaseUrl = process.env.E2E_DATABASE_URL ?? "";

  getRequiredE2EBranchName();
  assertSafeE2EDatabaseUrl(databaseUrl);

  return withLibpqSslCompatibility(databaseUrl);
}

test.describe("Stations tab today counts", () => {
  const pool = new Pool({ connectionString: getE2EDatabaseUrl() });
  const isolatedDb = drizzle(pool, { schema });

  test.afterAll(async () => {
    await pool.end();
  });

  test("shows only today's sessions in each station card", async ({ page }) => {
    const uniqueSuffix = Date.now();
    const mixedStationName = `E2E-Mixed-Station-${uniqueSuffix}`;
    const historicalStationName = `E2E-History-Only-Station-${uniqueSuffix}`;

    const [mixedStation] = await isolatedDb
      .insert(stations)
      .values({ name: mixedStationName })
      .returning();
    const [historicalStation] = await isolatedDb
      .insert(stations)
      .values({ name: historicalStationName })
      .returning();

    const now = new Date();
    const todayBoundary = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const yesterdayStart = new Date(todayBoundary.getTime() - 60 * 60 * 1000);
    const todayStart = new Date(todayBoundary.getTime() + 60 * 60 * 1000);
    const secondTodayStart = new Date(todayBoundary.getTime() + 2 * 60 * 60 * 1000);

    await isolatedDb.insert(sessions).values([
      {
        userId: E2E_REGULAR_USER_ID,
        stationId: mixedStation.id,
        startTime: yesterdayStart,
        endTime: new Date(yesterdayStart.getTime() + 30 * 60 * 1000),
      },
      {
        userId: E2E_REGULAR_USER_ID,
        stationId: mixedStation.id,
        startTime: todayStart,
        endTime: new Date(todayStart.getTime() + 30 * 60 * 1000),
      },
      {
        userId: E2E_REGULAR_USER_ID,
        stationId: mixedStation.id,
        startTime: secondTodayStart,
        endTime: new Date(secondTodayStart.getTime() + 30 * 60 * 1000),
      },
      {
        userId: E2E_REGULAR_USER_ID,
        stationId: historicalStation.id,
        startTime: yesterdayStart,
        endTime: new Date(yesterdayStart.getTime() + 45 * 60 * 1000),
      },
    ]);

    await loginAsAdmin(page);

    const dashboard = new DashboardPage(page);
    const stationPage = new StationPage(page);

    await dashboard.gotoTab("stations");

    await expect(
      stationPage.getStationCard(mixedStationName).getByText("2 reservations today"),
    ).toBeVisible();
    await expect(
      stationPage.getStationCard(historicalStationName).getByText("No reservations today"),
    ).toBeVisible();
  });
});