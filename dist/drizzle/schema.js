"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationsRelations = exports.cropPricesRelations = exports.messagesRelations = exports.conversationParticipantsRelations = exports.conversationsRelations = exports.paymentsRelations = exports.orderItemsRelations = exports.ordersRelations = exports.listingImagesRelations = exports.listingsRelations = exports.cropsRelations = exports.profilesRelations = exports.usersRelations = exports.notifications = exports.cropPrices = exports.messages = exports.conversationParticipants = exports.conversations = exports.payments = exports.orderItems = exports.orders = exports.listingImages = exports.listings = exports.crops = exports.profiles = exports.users = exports.paymentStatusEnum = exports.orderStatusEnum = exports.listingStatusEnum = exports.userRoleEnum = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const drizzle_orm_1 = require("drizzle-orm");
/* =========================
   ENUMS
========================= */
exports.userRoleEnum = (0, pg_core_1.pgEnum)("user_role", ["FARMER", "BUYER", "ADMIN"]);
exports.listingStatusEnum = (0, pg_core_1.pgEnum)("listing_status", ["ACTIVE", "SOLD", "PAUSED"]);
exports.orderStatusEnum = (0, pg_core_1.pgEnum)("order_status", [
    "PENDING",
    "PAID",
    "RECEIVED",
    "SHIPPED",
    "DELIVERED",
    "CONFIRMED",
    "CANCELLED",
    "DISPUTED",
    "REFUNDED",
    "AUTO_RELEASED",
]);
exports.paymentStatusEnum = (0, pg_core_1.pgEnum)("payment_status", ["SUCCESS", "FAILED", "PENDING"]);
/* =========================
   USERS
========================= */
exports.users = (0, pg_core_1.pgTable)("users", {
    userId: (0, pg_core_1.uuid)("id").primaryKey().defaultRandom(),
    fullName: (0, pg_core_1.varchar)("full_name", { length: 100 }).notNull(),
    email: (0, pg_core_1.varchar)("email", { length: 150 }).unique().notNull(),
    phone: (0, pg_core_1.varchar)("phone", { length: 20 }).unique(),
    password: (0, pg_core_1.text)("password").notNull(),
    role: (0, exports.userRoleEnum)("role").default("BUYER").notNull(),
    isVerified: (0, pg_core_1.boolean)("is_verified").default(false),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").defaultNow(),
});
exports.profiles = (0, pg_core_1.pgTable)("profiles", {
    id: (0, pg_core_1.uuid)("id").primaryKey().defaultRandom(),
    userId: (0, pg_core_1.uuid)("user_id")
        .references(() => exports.users.userId, { onUpdate: "cascade", onDelete: "cascade" })
        .notNull(),
    location: (0, pg_core_1.varchar)("location", { length: 150 }),
    bio: (0, pg_core_1.text)("bio"),
    profileImage: (0, pg_core_1.text)("profile_image"),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").defaultNow(),
});
/* =========================
   CROPS
========================= */
exports.crops = (0, pg_core_1.pgTable)("crops", {
    id: (0, pg_core_1.uuid)("id").primaryKey().defaultRandom(),
    name: (0, pg_core_1.varchar)("name", { length: 100 }).notNull(),
    category: (0, pg_core_1.varchar)("category", { length: 100 }).notNull(),
    unit: (0, pg_core_1.varchar)("unit", { length: 50 }).notNull(),
    cropUrl: (0, pg_core_1.varchar)("crop_url", { length: 255 }).notNull(),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
});
/* =========================
   LISTINGS
========================= */
exports.listings = (0, pg_core_1.pgTable)("listings", {
    id: (0, pg_core_1.uuid)("id").primaryKey().defaultRandom(),
    farmerId: (0, pg_core_1.uuid)("farmer_id")
        .references(() => exports.users.userId, { onUpdate: "cascade", onDelete: "cascade" })
        .notNull(),
    cropId: (0, pg_core_1.uuid)("crop_id")
        .references(() => exports.crops.id, { onUpdate: "cascade", onDelete: "cascade" })
        .notNull(),
    pricePerUnit: (0, pg_core_1.numeric)("price_per_unit", { precision: 10, scale: 2 }).notNull(),
    quantityAvailable: (0, pg_core_1.integer)("quantity_available").notNull(),
    description: (0, pg_core_1.text)("description"),
    location: (0, pg_core_1.varchar)("location", { length: 150 }),
    status: (0, exports.listingStatusEnum)("status").default("ACTIVE"),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").defaultNow(),
});
exports.listingImages = (0, pg_core_1.pgTable)("listing_images", {
    id: (0, pg_core_1.uuid)("id").primaryKey().defaultRandom(),
    listingId: (0, pg_core_1.uuid)("listing_id")
        .references(() => exports.listings.id, { onUpdate: "cascade", onDelete: "cascade" })
        .notNull(),
    imageUrl: (0, pg_core_1.text)("image_url").notNull(),
});
/* =========================
   ORDERS
========================= */
exports.orders = (0, pg_core_1.pgTable)("orders", {
    id: (0, pg_core_1.uuid)("id").primaryKey().defaultRandom(),
    buyerId: (0, pg_core_1.uuid)("buyer_id")
        .references(() => exports.users.userId, { onUpdate: "cascade", onDelete: "cascade" })
        .notNull(),
    status: (0, exports.orderStatusEnum)("status").default("PENDING"),
    totalAmount: (0, pg_core_1.numeric)("total_amount", { precision: 10, scale: 2 }).notNull(),
    // ── Escrow fields ──────────────────────────────────────────
    mpesaRequestId: (0, pg_core_1.varchar)("mpesa_request_id", { length: 100 }),
    mpesaReceiptNumber: (0, pg_core_1.varchar)("mpesa_receipt_number", { length: 100 }),
    farmerPhone: (0, pg_core_1.varchar)("farmer_phone", { length: 20 }),
    commissionAmount: (0, pg_core_1.numeric)("commission_amount", { precision: 10, scale: 2 }),
    farmerAmount: (0, pg_core_1.numeric)("farmer_amount", { precision: 10, scale: 2 }),
    deliveredAt: (0, pg_core_1.timestamp)("delivered_at"),
    autoReleaseAt: (0, pg_core_1.timestamp)("auto_release_at"),
    // ───────────────────────────────────────────────────────────
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)("updated_at").defaultNow(),
});
exports.orderItems = (0, pg_core_1.pgTable)("order_items", {
    id: (0, pg_core_1.uuid)("id").primaryKey().defaultRandom(),
    orderId: (0, pg_core_1.uuid)("order_id")
        .references(() => exports.orders.id, { onUpdate: "cascade", onDelete: "cascade" })
        .notNull(),
    listingId: (0, pg_core_1.uuid)("listing_id")
        .references(() => exports.listings.id, { onUpdate: "cascade", onDelete: "cascade" })
        .notNull(),
    quantity: (0, pg_core_1.integer)("quantity").notNull(),
    price: (0, pg_core_1.numeric)("price", { precision: 10, scale: 2 }).notNull(),
});
/* =========================
   PAYMENTS
========================= */
exports.payments = (0, pg_core_1.pgTable)("payments", {
    id: (0, pg_core_1.uuid)("id").primaryKey().defaultRandom(),
    orderId: (0, pg_core_1.uuid)("order_id")
        .references(() => exports.orders.id, { onUpdate: "cascade", onDelete: "cascade" })
        .notNull(),
    provider: (0, pg_core_1.varchar)("provider", { length: 50 }).notNull(),
    amount: (0, pg_core_1.numeric)("amount", { precision: 10, scale: 2 }).notNull(),
    status: (0, exports.paymentStatusEnum)("status").default("PENDING"),
    transactionRef: (0, pg_core_1.varchar)("transaction_ref", { length: 150 }),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
});
/* =========================
   MESSAGING
========================= */
exports.conversations = (0, pg_core_1.pgTable)("conversations", {
    id: (0, pg_core_1.uuid)("id").primaryKey().defaultRandom(),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
});
exports.conversationParticipants = (0, pg_core_1.pgTable)("conversation_participants", {
    id: (0, pg_core_1.uuid)("id").primaryKey().defaultRandom(),
    conversationId: (0, pg_core_1.uuid)("conversation_id")
        .references(() => exports.conversations.id, { onUpdate: "cascade", onDelete: "cascade" })
        .notNull(),
    userId: (0, pg_core_1.uuid)("user_id")
        .references(() => exports.users.userId, { onUpdate: "cascade", onDelete: "cascade" })
        .notNull(),
});
exports.messages = (0, pg_core_1.pgTable)("messages", {
    id: (0, pg_core_1.uuid)("id").primaryKey().defaultRandom(),
    conversationId: (0, pg_core_1.uuid)("conversation_id")
        .references(() => exports.conversations.id, { onUpdate: "cascade", onDelete: "cascade" })
        .notNull(),
    senderId: (0, pg_core_1.uuid)("sender_id")
        .references(() => exports.users.userId, { onUpdate: "cascade", onDelete: "cascade" })
        .notNull(),
    content: (0, pg_core_1.text)("content").notNull(),
    isRead: (0, pg_core_1.boolean)("is_read").default(false),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
});
/* =========================
   CROP INSIGHTS
========================= */
exports.cropPrices = (0, pg_core_1.pgTable)("crop_prices", {
    id: (0, pg_core_1.uuid)("id").primaryKey().defaultRandom(),
    cropId: (0, pg_core_1.uuid)("crop_id")
        .references(() => exports.crops.id, { onUpdate: "cascade", onDelete: "cascade" })
        .notNull(),
    market: (0, pg_core_1.varchar)("market", { length: 100 }).notNull(),
    price: (0, pg_core_1.numeric)("price", { precision: 10, scale: 2 }).notNull(),
    date: (0, pg_core_1.timestamp)("date").notNull(),
});
/* =========================
   NOTIFICATIONS
========================= */
exports.notifications = (0, pg_core_1.pgTable)("notifications", {
    id: (0, pg_core_1.uuid)("id").primaryKey().defaultRandom(),
    userId: (0, pg_core_1.uuid)("user_id")
        .references(() => exports.users.userId, { onUpdate: "cascade", onDelete: "cascade" })
        .notNull(),
    title: (0, pg_core_1.varchar)("title", { length: 150 }).notNull(),
    message: (0, pg_core_1.text)("message").notNull(),
    type: (0, pg_core_1.varchar)("type", { length: 50 }).notNull(),
    isRead: (0, pg_core_1.boolean)("is_read").default(false),
    link: (0, pg_core_1.varchar)("link", { length: 255 }),
    createdAt: (0, pg_core_1.timestamp)("created_at").defaultNow(),
});
/* =========================
   RELATIONS
========================= */
exports.usersRelations = (0, drizzle_orm_1.relations)(exports.users, ({ one, many }) => ({
    profile: one(exports.profiles, { fields: [exports.users.userId], references: [exports.profiles.userId] }),
    farmerListings: many(exports.listings, { relationName: "farmer_listings" }),
    buyerOrders: many(exports.orders, { relationName: "buyer_orders" }),
    conversationParticipants: many(exports.conversationParticipants),
    sentMessages: many(exports.messages, { relationName: "sender_messages" }),
    notifications: many(exports.notifications),
}));
exports.profilesRelations = (0, drizzle_orm_1.relations)(exports.profiles, ({ one }) => ({
    user: one(exports.users, { fields: [exports.profiles.userId], references: [exports.users.userId] }),
}));
exports.cropsRelations = (0, drizzle_orm_1.relations)(exports.crops, ({ many }) => ({
    listings: many(exports.listings),
    prices: many(exports.cropPrices),
}));
exports.listingsRelations = (0, drizzle_orm_1.relations)(exports.listings, ({ one, many }) => ({
    farmer: one(exports.users, { fields: [exports.listings.farmerId], references: [exports.users.userId], relationName: "farmer_listings" }),
    crop: one(exports.crops, { fields: [exports.listings.cropId], references: [exports.crops.id] }),
    images: many(exports.listingImages),
    orderItems: many(exports.orderItems),
}));
exports.listingImagesRelations = (0, drizzle_orm_1.relations)(exports.listingImages, ({ one }) => ({
    listing: one(exports.listings, { fields: [exports.listingImages.listingId], references: [exports.listings.id] }),
}));
exports.ordersRelations = (0, drizzle_orm_1.relations)(exports.orders, ({ one, many }) => ({
    buyer: one(exports.users, { fields: [exports.orders.buyerId], references: [exports.users.userId], relationName: "buyer_orders" }),
    items: many(exports.orderItems),
    payments: many(exports.payments),
}));
exports.orderItemsRelations = (0, drizzle_orm_1.relations)(exports.orderItems, ({ one }) => ({
    order: one(exports.orders, { fields: [exports.orderItems.orderId], references: [exports.orders.id] }),
    listing: one(exports.listings, { fields: [exports.orderItems.listingId], references: [exports.listings.id] }),
}));
exports.paymentsRelations = (0, drizzle_orm_1.relations)(exports.payments, ({ one }) => ({
    order: one(exports.orders, { fields: [exports.payments.orderId], references: [exports.orders.id] }),
}));
exports.conversationsRelations = (0, drizzle_orm_1.relations)(exports.conversations, ({ many }) => ({
    participants: many(exports.conversationParticipants),
    messages: many(exports.messages),
}));
exports.conversationParticipantsRelations = (0, drizzle_orm_1.relations)(exports.conversationParticipants, ({ one }) => ({
    conversation: one(exports.conversations, { fields: [exports.conversationParticipants.conversationId], references: [exports.conversations.id] }),
    user: one(exports.users, { fields: [exports.conversationParticipants.userId], references: [exports.users.userId] }),
}));
exports.messagesRelations = (0, drizzle_orm_1.relations)(exports.messages, ({ one }) => ({
    conversation: one(exports.conversations, { fields: [exports.messages.conversationId], references: [exports.conversations.id] }),
    sender: one(exports.users, { fields: [exports.messages.senderId], references: [exports.users.userId], relationName: "sender_messages" }),
}));
exports.cropPricesRelations = (0, drizzle_orm_1.relations)(exports.cropPrices, ({ one }) => ({
    crop: one(exports.crops, { fields: [exports.cropPrices.cropId], references: [exports.crops.id] }),
}));
exports.notificationsRelations = (0, drizzle_orm_1.relations)(exports.notifications, ({ one }) => ({
    user: one(exports.users, { fields: [exports.notifications.userId], references: [exports.users.userId] }),
}));
