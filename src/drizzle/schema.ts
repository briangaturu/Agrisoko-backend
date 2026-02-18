import {
  pgTable,
  uuid,
  varchar,
  text,
  numeric,
  integer,
  boolean,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

/* =========================
   ENUMS
========================= */

export const userRoleEnum = pgEnum("user_role", [
  "FARMER",
  "BUYER",
  "ADMIN",
]);

export const listingStatusEnum = pgEnum("listing_status", [
  "ACTIVE",
  "SOLD",
  "PAUSED",
]);

export const orderStatusEnum = pgEnum("order_status", [
  "PENDING",
  "PAID",
  "DELIVERED",
  "CANCELLED",
]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "SUCCESS",
  "FAILED",
  "PENDING",
]);

/* =========================
   USERS & PROFILES
========================= */

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  fullName: varchar("full_name", { length: 100 }).notNull(),
  email: varchar("email", { length: 150 }).unique().notNull(),
  phone: varchar("phone", { length: 20 }).unique(),
  passwordHash: text("password_hash").notNull(),
  role: userRoleEnum("role").default("BUYER").notNull(),
  isVerified: boolean("is_verified").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const profiles = pgTable("profiles", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .references(() => users.id)
    .notNull(),
  location: varchar("location", { length: 150 }),
  bio: text("bio"),
  profileImage: text("profile_image"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

/* =========================
   CATEGORIES & CROPS
========================= */

export const categories = pgTable("categories", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 100 }).unique().notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const crops = pgTable("crops", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  categoryId: uuid("category_id")
    .references(() => categories.id)
    .notNull(),
  unit: varchar("unit", { length: 50 }).notNull(), // kg, bag, crate
  createdAt: timestamp("created_at").defaultNow(),
});

/* =========================
   MARKETPLACE LISTINGS
========================= */

export const listings = pgTable("listings", {
  id: uuid("id").defaultRandom().primaryKey(),
  farmerId: uuid("farmer_id")
    .references(() => users.id)
    .notNull(),
  cropId: uuid("crop_id")
    .references(() => crops.id)
    .notNull(),
  pricePerUnit: numeric("price_per_unit", { precision: 10, scale: 2 }).notNull(),
  quantityAvailable: integer("quantity_available").notNull(),
  description: text("description"),
  location: varchar("location", { length: 150 }),
  status: listingStatusEnum("status").default("ACTIVE"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const listingImages = pgTable("listing_images", {
  id: uuid("id").defaultRandom().primaryKey(),
  listingId: uuid("listing_id")
    .references(() => listings.id)
    .notNull(),
  imageUrl: text("image_url").notNull(),
});

/* =========================
   ORDERS & PAYMENTS
========================= */

export const orders = pgTable("orders", {
  id: uuid("id").defaultRandom().primaryKey(),
  buyerId: uuid("buyer_id")
    .references(() => users.id)
    .notNull(),
  status: orderStatusEnum("status").default("PENDING"),
  totalAmount: numeric("total_amount", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const orderItems = pgTable("order_items", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderId: uuid("order_id")
    .references(() => orders.id)
    .notNull(),
  listingId: uuid("listing_id")
    .references(() => listings.id)
    .notNull(),
  quantity: integer("quantity").notNull(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
});

export const payments = pgTable("payments", {
  id: uuid("id").defaultRandom().primaryKey(),
  orderId: uuid("order_id")
    .references(() => orders.id)
    .notNull(),
  provider: varchar("provider", { length: 50 }).notNull(), // MPESA, STRIPE
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  status: paymentStatusEnum("status").default("PENDING"),
  transactionRef: varchar("transaction_ref", { length: 150 }),
  createdAt: timestamp("created_at").defaultNow(),
});

/* =========================
   MESSAGING
========================= */

export const conversations = pgTable("conversations", {
  id: uuid("id").defaultRandom().primaryKey(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const conversationParticipants = pgTable(
  "conversation_participants",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    conversationId: uuid("conversation_id")
      .references(() => conversations.id)
      .notNull(),
    userId: uuid("user_id")
      .references(() => users.id)
      .notNull(),
  }
);

export const messages = pgTable("messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  conversationId: uuid("conversation_id")
    .references(() => conversations.id)
    .notNull(),
  senderId: uuid("sender_id")
    .references(() => users.id)
    .notNull(),
  content: text("content").notNull(),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

/* =========================
   CROP INSIGHTS
========================= */

export const cropPrices = pgTable("crop_prices", {
  id: uuid("id").defaultRandom().primaryKey(),
  cropId: uuid("crop_id")
    .references(() => crops.id)
    .notNull(),
  market: varchar("market", { length: 100 }).notNull(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  date: timestamp("date").notNull(),
});

/* =========================
   RELATIONS (ADDED ONLY)
========================= */

export const usersRelations = relations(users, ({ one, many }) => ({
  profile: one(profiles, {
    fields: [users.id],
    references: [profiles.userId],
  }),

  farmerListings: many(listings, { relationName: "farmer_listings" }),
  buyerOrders: many(orders, { relationName: "buyer_orders" }),

  conversationParticipants: many(conversationParticipants),
  sentMessages: many(messages, { relationName: "sender_messages" }),
}));

export const profilesRelations = relations(profiles, ({ one }) => ({
  user: one(users, {
    fields: [profiles.userId],
    references: [users.id],
  }),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  crops: many(crops),
}));

export const cropsRelations = relations(crops, ({ one, many }) => ({
  category: one(categories, {
    fields: [crops.categoryId],
    references: [categories.id],
  }),
  listings: many(listings),
  prices: many(cropPrices),
}));

export const listingsRelations = relations(listings, ({ one, many }) => ({
  farmer: one(users, {
    fields: [listings.farmerId],
    references: [users.id],
    relationName: "farmer_listings",
  }),
  crop: one(crops, {
    fields: [listings.cropId],
    references: [crops.id],
  }),
  images: many(listingImages),
  orderItems: many(orderItems),
}));

export const listingImagesRelations = relations(listingImages, ({ one }) => ({
  listing: one(listings, {
    fields: [listingImages.listingId],
    references: [listings.id],
  }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  buyer: one(users, {
    fields: [orders.buyerId],
    references: [users.id],
    relationName: "buyer_orders",
  }),
  items: many(orderItems),
  payments: many(payments),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  listing: one(listings, {
    fields: [orderItems.listingId],
    references: [listings.id],
  }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  order: one(orders, {
    fields: [payments.orderId],
    references: [orders.id],
  }),
}));

export const conversationsRelations = relations(conversations, ({ many }) => ({
  participants: many(conversationParticipants),
  messages: many(messages),
}));

export const conversationParticipantsRelations = relations(
  conversationParticipants,
  ({ one }) => ({
    conversation: one(conversations, {
      fields: [conversationParticipants.conversationId],
      references: [conversations.id],
    }),
    user: one(users, {
      fields: [conversationParticipants.userId],
      references: [users.id],
    }),
  })
);

export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
    relationName: "sender_messages",
  }),
}));

export const cropPricesRelations = relations(cropPrices, ({ one }) => ({
  crop: one(crops, {
    fields: [cropPrices.cropId],
    references: [crops.id],
  }),
}));
