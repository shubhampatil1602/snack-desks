-- Order lines keep the price they were ordered at. Existing lines get
-- today's menu price, the closest we have to what they cost.
ALTER TABLE "order_item" ADD COLUMN IF NOT EXISTS "unitPrice" DECIMAL(10,2);

UPDATE "order_item" oi
SET "unitPrice" = m."price"
FROM "menu_item" m
WHERE m."id" = oi."menuItemId" AND oi."unitPrice" IS NULL;

ALTER TABLE "order_item" ALTER COLUMN "unitPrice" SET NOT NULL;
