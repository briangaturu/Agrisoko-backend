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
export const userRoleEnum = pgEnum("user_role", ["FARMER", "BUYER", "ADMIN"]);
export const listingStatusEnum = pgEnum("listing_status", ["ACTIVE", "SOLD", "PAUSED"]);
export const orderStatusEnum = pgEnum("order_status", ["PENDING", "PAID", "CONFIRMED", "CANCELLED"]);
export const paymentStatusEnum = pgEnum("payment_status", ["SUCCESS", "FAILED", "PENDING"]);

/* =========================
   USERS
========================= */
export const users = pgTable("users", {
  userId: uuid("id").primaryKey().defaultRandom(),
  fullName: varchar("full_name", { length: 100 }).notNull(),
  email: varchar("email", { length: 150 }).unique().notNull(),
  phone: varchar("phone", { length: 20 }).unique(),
  password: text("password").notNull(),
  role: userRoleEnum("role").default("BUYER").notNull(),
  isVerified: boolean("is_verified").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .references(() => users.userId, { onUpdate: "cascade", onDelete: "cascade" })
    .notNull(),
  location: varchar("location", { length: 150 }),
  bio: text("bio"),
  profileImage: text("profile_image"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

/* =========================
   CROPS
========================= */
export const crops = pgTable("crops", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  unit: varchar("unit", { length: 50 }).notNull(),
  cropUrl: varchar("crop_url", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

/* =========================
   LISTINGS
========================= */
export const listings = pgTable("listings", {
  id: uuid("id").primaryKey().defaultRandom(),
  farmerId: uuid("farmer_id")
    .references(() => users.userId, { onUpdate: "cascade", onDelete: "cascade" })
    .notNull(),
  cropId: uuid("crop_id")
    .references(() => crops.id, { onUpdate: "cascade", onDelete: "cascade" })
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
  id: uuid("id").primaryKey().defaultRandom(),
  listingId: uuid("listing_id")
    .references(() => listings.id, { onUpdate: "cascade", onDelete: "cascade" })
    .notNull(),
  imageUrl: text("image_url").notNull(),
});

/* =========================
   ORDERS
========================= */
export const orders = pgTable("orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  buyerId: uuid("buyer_id")
    .references(() => users.userId, { onUpdate: "cascade", onDelete: "cascade" })
    .notNull(),
  status: orderStatusEnum("status").default("PENDING"),
  totalAmount: numeric("total_amount", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const orderItems = pgTable("order_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id")
    .references(() => orders.id, { onUpdate: "cascade", onDelete: "cascade" })
    .notNull(),
  listingId: uuid("listing_id")
    .references(() => listings.id, { onUpdate: "cascade", onDelete: "cascade" })
    .notNull(),
  quantity: integer("quantity").notNull(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
});

/* =========================
   PAYMENTS
========================= */
export const payments = pgTable("payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id")
    .references(() => orders.id, { onUpdate: "cascade", onDelete: "cascade" })
    .notNull(),
  provider: varchar("provider", { length: 50 }).notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  status: paymentStatusEnum("status").default("PENDING"),
  transactionRef: varchar("transaction_ref", { length: 150 }),
  createdAt: timestamp("created_at").defaultNow(),
});

/* =========================
   MESSAGING
========================= */
export const conversations = pgTable("conversations", {
  id: uuid("id").primaryKey().defaultRandom(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const conversationParticipants = pgTable("conversation_participants", {
  id: uuid("id").primaryKey().defaultRandom(),
  conversationId: uuid("conversation_id")
    .references(() => conversations.id, { onUpdate: "cascade", onDelete: "cascade" })
    .notNull(),
  userId: uuid("user_id")
    .references(() => users.userId, { onUpdate: "cascade", onDelete: "cascade" })
    .notNull(),
});

export const messages = pgTable("messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  conversationId: uuid("conversation_id")
    .references(() => conversations.id, { onUpdate: "cascade", onDelete: "cascade" })
    .notNull(),
  senderId: uuid("sender_id")
    .references(() => users.userId, { onUpdate: "cascade", onDelete: "cascade" })
    .notNull(),
  content: text("content").notNull(),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

/* =========================
   CROP INSIGHTS
========================= */
export const cropPrices = pgTable("crop_prices", {
  id: uuid("id").primaryKey().defaultRandom(),
  cropId: uuid("crop_id")
    .references(() => crops.id, { onUpdate: "cascade", onDelete: "cascade" })
    .notNull(),
  market: varchar("market", { length: 100 }).notNull(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  date: timestamp("date").notNull(),
});

/* =========================
   NOTIFICATIONS
========================= */
export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .references(() => users.userId, { onUpdate: "cascade", onDelete: "cascade" })
    .notNull(),
  title: varchar("title", { length: 150 }).notNull(),
  message: text("message").notNull(),
  type: varchar("type", { length: 50 }).notNull(),
  isRead: boolean("is_read").default(false),
  link: varchar("link", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow(),
});



/* =========================
   RELATIONS
========================= */
export const usersRelations = relations(users, ({ one, many }) => ({
  profile: one(profiles, { fields: [users.userId], references: [profiles.userId] }),
  farmerListings: many(listings, { relationName: "farmer_listings" }),
  buyerOrders: many(orders, { relationName: "buyer_orders" }),
  conversationParticipants: many(conversationParticipants),
  sentMessages: many(messages, { relationName: "sender_messages" }),
  notifications: many(notifications),
}));

export const profilesRelations = relations(profiles, ({ one }) => ({
  user: one(users, { fields: [profiles.userId], references: [users.userId] }),
}));

export const cropsRelations = relations(crops, ({ many }) => ({
  listings: many(listings),
  prices: many(cropPrices),
}));

export const listingsRelations = relations(listings, ({ one, many }) => ({
  farmer: one(users, { fields: [listings.farmerId], references: [users.userId], relationName: "farmer_listings" }),
  crop: one(crops, { fields: [listings.cropId], references: [crops.id] }),
  images: many(listingImages),
  orderItems: many(orderItems),
}));

export const listingImagesRelations = relations(listingImages, ({ one }) => ({
  listing: one(listings, { fields: [listingImages.listingId], references: [listings.id] }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  buyer: one(users, { fields: [orders.buyerId], references: [users.userId], relationName: "buyer_orders" }),
  items: many(orderItems),
  payments: many(payments),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  listing: one(listings, { fields: [orderItems.listingId], references: [listings.id] }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  order: one(orders, { fields: [payments.orderId], references: [orders.id] }),
}));

export const conversationsRelations = relations(conversations, ({ many }) => ({
  participants: many(conversationParticipants),
  messages: many(messages),
}));

export const conversationParticipantsRelations = relations(conversationParticipants, ({ one }) => ({
  conversation: one(conversations, { fields: [conversationParticipants.conversationId], references: [conversations.id] }),
  user: one(users, { fields: [conversationParticipants.userId], references: [users.userId] }),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, { fields: [messages.conversationId], references: [conversations.id] }),
  sender: one(users, { fields: [messages.senderId], references: [users.userId], relationName: "sender_messages" }),
}));

export const cropPricesRelations = relations(cropPrices, ({ one }) => ({
  crop: one(crops, { fields: [cropPrices.cropId], references: [crops.id] }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, { fields: [notifications.userId], references: [users.userId] }),
}));