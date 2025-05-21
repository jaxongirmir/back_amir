"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.insertNotificationSchema = exports.notificationsRelations = exports.notifications = exports.insertFavoriteSchema = exports.favoritesRelations = exports.favorites = exports.insertCartItemSchema = exports.cartItemsRelations = exports.cartItems = exports.insertProductSchema = exports.productsRelations = exports.products = exports.insertUserSchema = exports.usersRelations = exports.users = exports.sessions = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const drizzle_orm_1 = require("drizzle-orm");
const drizzle_zod_1 = require("drizzle-zod");
exports.sessions = (0, pg_core_1.pgTable)("user_sessions", {
    sid: (0, pg_core_1.text)("sid").primaryKey(),
    sess: (0, pg_core_1.jsonb)("sess").notNull(),
    expire: (0, pg_core_1.timestamp)("expire").notNull(),
});
exports.users = (0, pg_core_1.pgTable)("users", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    username: (0, pg_core_1.text)("username").notNull().unique(),
    password: (0, pg_core_1.text)("password").notNull(),
});
exports.usersRelations = (0, drizzle_orm_1.relations)(exports.users, ({ many }) => ({
    cartItems: many(exports.cartItems),
    favorites: many(exports.favorites),
    notifications: many(exports.notifications),
}));
exports.insertUserSchema = (0, drizzle_zod_1.createInsertSchema)(exports.users).pick({
    username: true,
    password: true,
});
exports.products = (0, pg_core_1.pgTable)("products", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    name: (0, pg_core_1.text)("name").notNull(),
    price: (0, pg_core_1.integer)("price").notNull(),
    description: (0, pg_core_1.text)("description").notNull(),
    imageUrl: (0, pg_core_1.text)("image_url").notNull(),
    category: (0, pg_core_1.text)("category").notNull(),
    gender: (0, pg_core_1.text)("gender").notNull(),
    availableSizes: (0, pg_core_1.jsonb)("available_sizes").notNull(),
});
exports.productsRelations = (0, drizzle_orm_1.relations)(exports.products, ({ many }) => ({
    cartItems: many(exports.cartItems),
    favorites: many(exports.favorites),
}));
exports.insertProductSchema = (0, drizzle_zod_1.createInsertSchema)(exports.products).omit({
    id: true,
});
exports.cartItems = (0, pg_core_1.pgTable)("cart_items", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    userId: (0, pg_core_1.integer)("user_id").notNull(),
    productId: (0, pg_core_1.integer)("product_id").notNull(),
    size: (0, pg_core_1.text)("size").notNull(),
    quantity: (0, pg_core_1.integer)("quantity").notNull(),
});
exports.cartItemsRelations = (0, drizzle_orm_1.relations)(exports.cartItems, ({ one }) => ({
    user: one(exports.users, {
        fields: [exports.cartItems.userId],
        references: [exports.users.id],
    }),
    product: one(exports.products, {
        fields: [exports.cartItems.productId],
        references: [exports.products.id],
    }),
}));
exports.insertCartItemSchema = (0, drizzle_zod_1.createInsertSchema)(exports.cartItems).omit({
    id: true,
});
exports.favorites = (0, pg_core_1.pgTable)("favorites", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    userId: (0, pg_core_1.integer)("user_id").notNull(),
    productId: (0, pg_core_1.integer)("product_id").notNull(),
});
exports.favoritesRelations = (0, drizzle_orm_1.relations)(exports.favorites, ({ one }) => ({
    user: one(exports.users, {
        fields: [exports.favorites.userId],
        references: [exports.users.id],
    }),
    product: one(exports.products, {
        fields: [exports.favorites.productId],
        references: [exports.products.id],
    }),
}));
exports.insertFavoriteSchema = (0, drizzle_zod_1.createInsertSchema)(exports.favorites).omit({
    id: true,
});
exports.notifications = (0, pg_core_1.pgTable)("notifications", {
    id: (0, pg_core_1.serial)("id").primaryKey(),
    userId: (0, pg_core_1.integer)("user_id").notNull(),
    message: (0, pg_core_1.text)("message").notNull(),
    read: (0, pg_core_1.boolean)("read").notNull().default(false),
});
exports.notificationsRelations = (0, drizzle_orm_1.relations)(exports.notifications, ({ one }) => ({
    user: one(exports.users, {
        fields: [exports.notifications.userId],
        references: [exports.users.id],
    }),
}));
exports.insertNotificationSchema = (0, drizzle_zod_1.createInsertSchema)(exports.notifications).omit({
    id: true,
});
