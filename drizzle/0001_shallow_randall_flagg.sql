-- Step 1: Create the stations table
CREATE TABLE "stations" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	CONSTRAINT "stations_name_unique" UNIQUE("name")
);
--> statement-breakpoint

-- Step 2: Populate stations table with existing unique station IDs from loading_sessions
INSERT INTO "stations" ("name", "description")
SELECT DISTINCT 
	"station_id" as name,
	'Charging station ' || "station_id" as description
FROM "loading_sessions"
WHERE "station_id" IS NOT NULL
ORDER BY "station_id";
--> statement-breakpoint

-- Step 3: Add a temporary integer column for the new station_id
ALTER TABLE "loading_sessions" ADD COLUMN "station_id_new" integer;
--> statement-breakpoint

-- Step 4: Update the new column with the corresponding station IDs
UPDATE "loading_sessions"
SET "station_id_new" = "stations"."id"
FROM "stations"
WHERE "loading_sessions"."station_id" = "stations"."name";
--> statement-breakpoint

-- Step 5: Make the new column NOT NULL (all rows should now have values)
ALTER TABLE "loading_sessions" ALTER COLUMN "station_id_new" SET NOT NULL;
--> statement-breakpoint

-- Step 6: Drop the old text station_id column
ALTER TABLE "loading_sessions" DROP COLUMN "station_id";
--> statement-breakpoint

-- Step 7: Rename the temporary column to station_id
ALTER TABLE "loading_sessions" RENAME COLUMN "station_id_new" TO "station_id";
--> statement-breakpoint

-- Step 8: Add the foreign key constraint
ALTER TABLE "loading_sessions" ADD CONSTRAINT "loading_sessions_station_id_stations_id_fk" FOREIGN KEY ("station_id") REFERENCES "public"."stations"("id") ON DELETE no action ON UPDATE no action;