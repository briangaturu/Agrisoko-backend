ALTER TABLE "conversation_participants" ALTER COLUMN "id" SET DATA TYPE serial;--> statement-breakpoint
ALTER TABLE "conversation_participants" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "conversation_participants" ALTER COLUMN "conversation_id" SET DATA TYPE serial;--> statement-breakpoint
ALTER TABLE "conversation_participants" ALTER COLUMN "user_id" SET DATA TYPE serial;--> statement-breakpoint
ALTER TABLE "conversations" ALTER COLUMN "id" SET DATA TYPE serial;--> statement-breakpoint
ALTER TABLE "conversations" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "crop_prices" ALTER COLUMN "id" SET DATA TYPE serial;--> statement-breakpoint
ALTER TABLE "crop_prices" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "crop_prices" ALTER COLUMN "crop_id" SET DATA TYPE serial;--> statement-breakpoint
ALTER TABLE "crops" ALTER COLUMN "id" SET DATA TYPE serial;--> statement-breakpoint
ALTER TABLE "crops" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "listing_images" ALTER COLUMN "id" SET DATA TYPE serial;--> statement-breakpoint
ALTER TABLE "listing_images" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "listing_images" ALTER COLUMN "listing_id" SET DATA TYPE serial;--> statement-breakpoint
ALTER TABLE "listings" ALTER COLUMN "id" SET DATA TYPE serial;--> statement-breakpoint
ALTER TABLE "listings" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "listings" ALTER COLUMN "farmer_id" SET DATA TYPE serial;--> statement-breakpoint
ALTER TABLE "listings" ALTER COLUMN "crop_id" SET DATA TYPE serial;--> statement-breakpoint
ALTER TABLE "messages" ALTER COLUMN "id" SET DATA TYPE serial;--> statement-breakpoint
ALTER TABLE "messages" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "messages" ALTER COLUMN "conversation_id" SET DATA TYPE serial;--> statement-breakpoint
ALTER TABLE "messages" ALTER COLUMN "sender_id" SET DATA TYPE serial;--> statement-breakpoint
ALTER TABLE "order_items" ALTER COLUMN "id" SET DATA TYPE serial;--> statement-breakpoint
ALTER TABLE "order_items" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "order_items" ALTER COLUMN "order_id" SET DATA TYPE serial;--> statement-breakpoint
ALTER TABLE "order_items" ALTER COLUMN "listing_id" SET DATA TYPE serial;--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "id" SET DATA TYPE serial;--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "buyer_id" SET DATA TYPE serial;--> statement-breakpoint
ALTER TABLE "payments" ALTER COLUMN "id" SET DATA TYPE serial;--> statement-breakpoint
ALTER TABLE "payments" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "payments" ALTER COLUMN "order_id" SET DATA TYPE serial;--> statement-breakpoint
ALTER TABLE "profiles" ALTER COLUMN "id" SET DATA TYPE serial;--> statement-breakpoint
ALTER TABLE "profiles" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "profiles" ALTER COLUMN "user_id" SET DATA TYPE serial;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "id" SET DATA TYPE serial;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "id" DROP DEFAULT;