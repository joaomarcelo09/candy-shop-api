CREATE TABLE "session_orders" (
    "id" UUID NOT NULL,
    "session_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "registered_by_user_id" UUID,

    CONSTRAINT "session_orders_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "order_candies" (
    "id" UUID NOT NULL,
    "session_order_id" UUID NOT NULL,
    "candy_id" UUID NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit_price_snapshot" INTEGER NOT NULL,

    CONSTRAINT "order_candies_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "session_orders"
ADD CONSTRAINT "session_orders_session_id_fkey"
FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "order_candies"
ADD CONSTRAINT "order_candies_session_order_id_fkey"
FOREIGN KEY ("session_order_id") REFERENCES "session_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "order_candies"
ADD CONSTRAINT "order_candies_candy_id_fkey"
FOREIGN KEY ("candy_id") REFERENCES "candies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
