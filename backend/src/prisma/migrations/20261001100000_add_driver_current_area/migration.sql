ALTER TABLE "Tesla"
ADD COLUMN "currentArea" TEXT;

ALTER TABLE "Tesla"
ADD CONSTRAINT "Tesla_currentArea_check"
CHECK (
  "currentArea" IS NULL OR
  "currentArea" IN (
    'Banani',
    'Gulshan',
    'Gulshan 1',
    'Mohakhali',
    'Dhanmondi',
    'Mirpur',
    'Uttara',
    'Farmgate',
    'Bashundhara'
  )
);

CREATE INDEX "Tesla_isOnline_currentArea_idx"
ON "Tesla"("isOnline", "currentArea");
