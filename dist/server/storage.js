"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.storage = exports.DatabaseStorage = void 0;
exports.setupDatabase = setupDatabase;
const schema_1 = require("../shared/schema");
const db_1 = require("./db");
const drizzle_orm_1 = require("drizzle-orm");
class DatabaseStorage {
    // User methods
    async getUser(id) {
        const [user] = await db_1.db.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.id, id));
        return user || undefined;
    }
    async getUserByUsername(username) {
        const [user] = await db_1.db
            .select()
            .from(schema_1.users)
            .where((0, drizzle_orm_1.eq)(schema_1.users.username, username));
        return user || undefined;
    }
    async createUser(insertUser) {
        const [user] = await db_1.db.insert(schema_1.users).values(insertUser).returning();
        return user;
    }
    // Product methods
    async getProducts() {
        return await db_1.db.select().from(schema_1.products);
    }
    async getProductById(id) {
        const [product] = await db_1.db
            .select()
            .from(schema_1.products)
            .where((0, drizzle_orm_1.eq)(schema_1.products.id, id));
        return product || undefined;
    }
    async getProductsByCategory(category) {
        return await db_1.db
            .select()
            .from(schema_1.products)
            .where((0, drizzle_orm_1.eq)(schema_1.products.category, category));
    }
    async getProductsByGender(gender) {
        return await db_1.db.select().from(schema_1.products).where((0, drizzle_orm_1.eq)(schema_1.products.gender, gender));
    }
    async getProductsByCategoryAndGender(category, gender) {
        return await db_1.db
            .select()
            .from(schema_1.products)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.products.category, category), (0, drizzle_orm_1.eq)(schema_1.products.gender, gender)));
    }
    async searchProducts(query) {
        const lowercaseQuery = query.toLowerCase();
        const allProducts = await db_1.db.select().from(schema_1.products);
        return allProducts.filter((product) => product.name.toLowerCase().includes(lowercaseQuery) ||
            product.description.toLowerCase().includes(lowercaseQuery) ||
            product.category.toLowerCase().includes(lowercaseQuery));
    }
    // Cart methods
    async getCartItems(userId) {
        return await db_1.db
            .select()
            .from(schema_1.cartItems)
            .where((0, drizzle_orm_1.eq)(schema_1.cartItems.userId, userId));
    }
    async getCartItemWithDetails(userId) {
        const items = await db_1.db
            .select()
            .from(schema_1.cartItems)
            .where((0, drizzle_orm_1.eq)(schema_1.cartItems.userId, userId));
        const result = [];
        for (const item of items) {
            const [product] = await db_1.db
                .select()
                .from(schema_1.products)
                .where((0, drizzle_orm_1.eq)(schema_1.products.id, item.productId));
            if (product) {
                result.push({ ...item, product });
            }
        }
        return result;
    }
    async addToCart(insertCartItem) {
        // Check if item already exists with same size
        const [existingItem] = await db_1.db
            .select()
            .from(schema_1.cartItems)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.cartItems.userId, insertCartItem.userId), (0, drizzle_orm_1.eq)(schema_1.cartItems.productId, insertCartItem.productId), (0, drizzle_orm_1.eq)(schema_1.cartItems.size, insertCartItem.size)));
        if (existingItem) {
            // Update quantity instead of creating new item
            const [updatedItem] = await db_1.db
                .update(schema_1.cartItems)
                .set({ quantity: existingItem.quantity + insertCartItem.quantity })
                .where((0, drizzle_orm_1.eq)(schema_1.cartItems.id, existingItem.id))
                .returning();
            return updatedItem;
        }
        // Create new cart item
        const [cartItem] = await db_1.db
            .insert(schema_1.cartItems)
            .values(insertCartItem)
            .returning();
        return cartItem;
    }
    async updateCartItem(id, quantity) {
        const [updatedItem] = await db_1.db
            .update(schema_1.cartItems)
            .set({ quantity })
            .where((0, drizzle_orm_1.eq)(schema_1.cartItems.id, id))
            .returning();
        return updatedItem || undefined;
    }
    async removeFromCart(id) {
        const result = await db_1.db.delete(schema_1.cartItems).where((0, drizzle_orm_1.eq)(schema_1.cartItems.id, id));
        return !!result;
    }
    // Favorites methods
    async getFavorites(userId) {
        return await db_1.db
            .select()
            .from(schema_1.favorites)
            .where((0, drizzle_orm_1.eq)(schema_1.favorites.userId, userId));
    }
    async getFavoritesWithDetails(userId) {
        const userFavorites = await db_1.db
            .select()
            .from(schema_1.favorites)
            .where((0, drizzle_orm_1.eq)(schema_1.favorites.userId, userId));
        const result = [];
        for (const favorite of userFavorites) {
            const [product] = await db_1.db
                .select()
                .from(schema_1.products)
                .where((0, drizzle_orm_1.eq)(schema_1.products.id, favorite.productId));
            if (product) {
                result.push({ ...favorite, product });
            }
        }
        return result;
    }
    async addToFavorites(insertFavorite) {
        // Check if already in favorites
        const [existingFavorite] = await db_1.db
            .select()
            .from(schema_1.favorites)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.favorites.userId, insertFavorite.userId), (0, drizzle_orm_1.eq)(schema_1.favorites.productId, insertFavorite.productId)));
        if (existingFavorite) {
            return existingFavorite;
        }
        const [favorite] = await db_1.db
            .insert(schema_1.favorites)
            .values(insertFavorite)
            .returning();
        return favorite;
    }
    async removeFromFavorites(userId, productId) {
        const result = await db_1.db
            .delete(schema_1.favorites)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.favorites.userId, userId), (0, drizzle_orm_1.eq)(schema_1.favorites.productId, productId)));
        return !!result;
    }
    // Notifications methods
    async getNotifications(userId) {
        return await db_1.db
            .select()
            .from(schema_1.notifications)
            .where((0, drizzle_orm_1.eq)(schema_1.notifications.userId, userId))
            .orderBy(schema_1.notifications.id);
    }
    async addNotification(insertNotification) {
        const [notification] = await db_1.db
            .insert(schema_1.notifications)
            .values(insertNotification)
            .returning();
        return notification;
    }
    async markNotificationAsRead(id) {
        const [updatedNotification] = await db_1.db
            .update(schema_1.notifications)
            .set({ read: true })
            .where((0, drizzle_orm_1.eq)(schema_1.notifications.id, id))
            .returning();
        return updatedNotification || undefined;
    }
    async deleteNotification(id) {
        const result = await db_1.db
            .delete(schema_1.notifications)
            .where((0, drizzle_orm_1.eq)(schema_1.notifications.id, id));
        return !!result;
    }
}
exports.DatabaseStorage = DatabaseStorage;
// Initialize sample data
async function initializeDatabase() {
    try {
        // Check if products table is empty
        const existingProducts = await db_1.db.select().from(schema_1.products);
        if (existingProducts.length === 0) {
            // Add sample products
            const productsData = [
                {
                    name: "Summer Floral Dress",
                    price: 5999, // $59.99
                    description: "Elegant white summer dress with floral pattern",
                    imageUrl: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=600&h=800&q=80",
                    category: "dresses",
                    gender: "women",
                    availableSizes: ["XS", "S", "M", "L", "XL"],
                },
                {
                    name: "Denim Casual Shirt",
                    price: 4599, // $45.99
                    description: "Classic denim shirt for a casual look",
                    imageUrl: "https://images.unsplash.com/photo-1589310243389-96a5483213a8?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=600&h=800&q=80",
                    category: "shirts",
                    gender: "men",
                    availableSizes: ["S", "M", "L", "XL", "2XL"],
                },
                {
                    name: "Leather Biker Jacket",
                    price: 8999, // $89.99
                    description: "Premium black leather jacket for a bold look",
                    imageUrl: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=600&h=800&q=80",
                    category: "jackets",
                    gender: "women",
                    availableSizes: ["S", "M", "L"],
                },
                {
                    name: "Classic White Sneakers",
                    price: 6599, // $65.99
                    description: "Comfortable casual sneakers for everyday wear",
                    imageUrl: "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=600&h=800&q=80",
                    category: "shoes",
                    gender: "men",
                    availableSizes: ["40", "41", "42", "43", "44", "45"],
                },
                {
                    name: "Slim Fit T-Shirt",
                    price: 2499, // $24.99
                    description: "Comfortable slim fit t-shirt for everyday wear",
                    imageUrl: "https://images.unsplash.com/photo-1581655353564-df123a1eb820?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=600&h=800&q=80",
                    category: "tshirts",
                    gender: "men",
                    availableSizes: ["S", "M", "L", "XL"],
                },
                {
                    name: "High Waist Jeans",
                    price: 3999, // $39.99
                    description: "Stylish high waist jeans for a modern look",
                    imageUrl: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=600&h=800&q=80",
                    category: "pants",
                    gender: "women",
                    availableSizes: ["XS", "S", "M", "L"],
                },
                {
                    name: "Wool Winter Coat",
                    price: 11999, // $119.99
                    description: "Warm wool coat perfect for winter season",
                    imageUrl: "https://images.unsplash.com/photo-1539533018447-63fcce2678e3?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=600&h=800&q=80",
                    category: "coats",
                    gender: "women",
                    availableSizes: ["S", "M", "L", "XL"],
                },
                {
                    name: "Chino Pants",
                    price: 3499, // $34.99
                    description: "Classic chino pants for casual and formal occasions",
                    imageUrl: "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=600&h=800&q=80",
                    category: "pants",
                    gender: "men",
                    availableSizes: ["30", "32", "34", "36", "38"],
                },
            ];
            await db_1.db.insert(schema_1.products).values(productsData);
            // Add initial notification for demo user (ID: 1)
            await db_1.db.insert(schema_1.notifications).values({
                userId: 1,
                message: "Welcome to FashionZone! Explore our new summer collection.",
                read: false,
            });
            console.log("Database initialized with sample data");
        }
    }
    catch (error) {
        console.error("Error initializing database:", error);
    }
}
// Create demo user and initialize data
async function setupDatabase() {
    console.log("🔌 Подключение к базе данных...");
    try {
        const existingUsers = await db_1.db.select().from(schema_1.users);
        console.log("🔍 Найдено пользователей:", existingUsers.length);
        if (existingUsers.length === 0) {
            console.log("🆕 Создаю демо-пользователя...");
            await db_1.db.insert(schema_1.users).values({
                username: "demo",
                password: "password123",
            });
            console.log("✅ Демо-пользователь создан");
        }
        await initializeDatabase();
    }
    catch (error) {
        console.error("❌ Ошибка при инициализации БД:", error);
    }
}
// In-memory storage implementation
class MemStorage {
    users = [];
    products = [];
    cartItems = [];
    favoritesItems = [];
    notificationItems = [];
    userId = 1;
    productId = 1;
    cartItemId = 1;
    favoriteId = 1;
    notificationId = 1;
    constructor() {
        // Initialize with mock data
        this.initMockData();
    }
    initMockData() {
        // Create demo user
        this.users.push({
            id: this.userId++,
            username: "demo",
            password: "54ca7b83a424aed496ef5ef4f0ddf48108d450e0a995315c2080f3b058a2d1c7.29a7c9482d883c1f60bff14b3a181a01", // hashed "password123"
        });
        // Add sample products
        const productsData = [
            {
                name: "Summer Floral Dress",
                price: 5999, // $59.99
                description: "Elegant white summer dress with floral pattern",
                imageUrl: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=600&h=800&q=80",
                category: "dresses",
                gender: "women",
                availableSizes: ["XS", "S", "M", "L", "XL"],
            },
            {
                name: "Denim Casual Shirt",
                price: 4599, // $45.99
                description: "Classic denim shirt for a casual look",
                imageUrl: "https://images.unsplash.com/photo-1589310243389-96a5483213a8?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=600&h=800&q=80",
                category: "shirts",
                gender: "men",
                availableSizes: ["S", "M", "L", "XL", "2XL"],
            },
            {
                name: "Leather Biker Jacket",
                price: 8999, // $89.99
                description: "Premium black leather jacket for a bold look",
                imageUrl: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=600&h=800&q=80",
                category: "jackets",
                gender: "women",
                availableSizes: ["S", "M", "L"],
            },
            {
                name: "Classic White Sneakers",
                price: 6599, // $65.99
                description: "Comfortable casual sneakers for everyday wear",
                imageUrl: "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=600&h=800&q=80",
                category: "shoes",
                gender: "men",
                availableSizes: ["40", "41", "42", "43", "44", "45"],
            },
            {
                name: "Slim Fit T-Shirt",
                price: 2499, // $24.99
                description: "Comfortable slim fit t-shirt for everyday wear",
                imageUrl: "https://images.unsplash.com/photo-1581655353564-df123a1eb820?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=600&h=800&q=80",
                category: "tshirts",
                gender: "men",
                availableSizes: ["S", "M", "L", "XL"],
            },
            {
                name: "High Waist Jeans",
                price: 3999, // $39.99
                description: "Stylish high waist jeans for a modern look",
                imageUrl: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=600&h=800&q=80",
                category: "pants",
                gender: "women",
                availableSizes: ["XS", "S", "M", "L"],
            },
            {
                name: "Wool Winter Coat",
                price: 11999, // $119.99
                description: "Warm wool coat perfect for winter season",
                imageUrl: "https://images.unsplash.com/photo-1539533018447-63fcce2678e3?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=600&h=800&q=80",
                category: "coats",
                gender: "women",
                availableSizes: ["S", "M", "L", "XL"],
            },
            {
                name: "Chino Pants",
                price: 3499, // $34.99
                description: "Classic chino pants for casual and formal occasions",
                imageUrl: "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=600&h=800&q=80",
                category: "pants",
                gender: "men",
                availableSizes: ["30", "32", "34", "36", "38"],
            },
        ];
        for (const product of productsData) {
            this.products.push({
                ...product,
                id: this.productId++,
            });
        }
        // Add initial notification for demo user
        this.notificationItems.push({
            id: this.notificationId++,
            userId: 1,
            message: "Welcome to AmirHub! Explore our new summer collection.",
            read: false,
        });
    }
    // User methods
    async getUser(id) {
        return this.users.find((user) => user.id === id);
    }
    async getUserByUsername(username) {
        return this.users.find((user) => user.username === username);
    }
    async createUser(insertUser) {
        // Пароль уже должен быть хеширован в auth.ts при регистрации
        // Мы просто добавляем ID и сохраняем пользователя
        const newUser = {
            ...insertUser,
            id: this.userId++,
        };
        this.users.push(newUser);
        return newUser;
    }
    // Product methods
    async getProducts() {
        return [...this.products];
    }
    async getProductById(id) {
        return this.products.find((product) => product.id === id);
    }
    async getProductsByCategory(category) {
        return this.products.filter((product) => product.category === category);
    }
    async getProductsByGender(gender) {
        return this.products.filter((product) => product.gender === gender);
    }
    async getProductsByCategoryAndGender(category, gender) {
        return this.products.filter((product) => product.category === category && product.gender === gender);
    }
    async searchProducts(query) {
        const lowercaseQuery = query.toLowerCase();
        return this.products.filter((product) => product.name.toLowerCase().includes(lowercaseQuery) ||
            product.description.toLowerCase().includes(lowercaseQuery) ||
            product.category.toLowerCase().includes(lowercaseQuery));
    }
    // Cart methods
    async getCartItems(userId) {
        return this.cartItems.filter((item) => item.userId === userId);
    }
    async getCartItemWithDetails(userId) {
        const items = this.cartItems.filter((item) => item.userId === userId);
        const result = [];
        for (const item of items) {
            const product = this.products.find((p) => p.id === item.productId);
            if (product) {
                result.push({ ...item, product });
            }
        }
        return result;
    }
    async addToCart(insertCartItem) {
        // Check if item already exists with same size
        const existingItem = this.cartItems.find((item) => item.userId === insertCartItem.userId &&
            item.productId === insertCartItem.productId &&
            item.size === insertCartItem.size);
        if (existingItem) {
            // Update quantity
            existingItem.quantity += insertCartItem.quantity;
            return existingItem;
        }
        // Create new cart item
        const newItem = {
            ...insertCartItem,
            id: this.cartItemId++,
        };
        this.cartItems.push(newItem);
        return newItem;
    }
    async updateCartItem(id, quantity) {
        const item = this.cartItems.find((item) => item.id === id);
        if (item) {
            item.quantity = quantity;
            return item;
        }
        return undefined;
    }
    async removeFromCart(id) {
        const index = this.cartItems.findIndex((item) => item.id === id);
        if (index !== -1) {
            this.cartItems.splice(index, 1);
            return true;
        }
        return false;
    }
    // Favorites methods
    async getFavorites(userId) {
        return this.favoritesItems.filter((fav) => fav.userId === userId);
    }
    async getFavoritesWithDetails(userId) {
        const favs = this.favoritesItems.filter((fav) => fav.userId === userId);
        const result = [];
        for (const fav of favs) {
            const product = this.products.find((p) => p.id === fav.productId);
            if (product) {
                result.push({ ...fav, product });
            }
        }
        return result;
    }
    async addToFavorites(insertFavorite) {
        // Check if already in favorites
        const existingFav = this.favoritesItems.find((fav) => fav.userId === insertFavorite.userId &&
            fav.productId === insertFavorite.productId);
        if (existingFav) {
            return existingFav;
        }
        const newFav = {
            ...insertFavorite,
            id: this.favoriteId++,
        };
        this.favoritesItems.push(newFav);
        return newFav;
    }
    async removeFromFavorites(userId, productId) {
        const index = this.favoritesItems.findIndex((fav) => fav.userId === userId && fav.productId === productId);
        if (index !== -1) {
            this.favoritesItems.splice(index, 1);
            return true;
        }
        return false;
    }
    // Notifications methods
    async getNotifications(userId) {
        return this.notificationItems.filter((n) => n.userId === userId);
    }
    async addNotification(insertNotification) {
        // Обязательно устанавливаем read: false если он не определен
        const newNotification = {
            ...insertNotification,
            id: this.notificationId++,
            read: insertNotification.read ?? false,
        };
        this.notificationItems.push(newNotification);
        return newNotification;
    }
    async markNotificationAsRead(id) {
        const notification = this.notificationItems.find((n) => n.id === id);
        if (notification) {
            notification.read = true;
            return notification;
        }
        return undefined;
    }
    async deleteNotification(id) {
        const index = this.notificationItems.findIndex((n) => n.id === id);
        if (index !== -1) {
            this.notificationItems.splice(index, 1);
            return true;
        }
        return false;
    }
}
// Export storage instance
exports.storage = new DatabaseStorage();
