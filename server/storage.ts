import {
  users,
  type User,
  type InsertUser,
  products,
  type Product,
  type InsertProduct,
  cartItems,
  type CartItem,
  type InsertCartItem,
  favorites,
  type Favorite,
  type InsertFavorite,
  notifications,
  type Notification,
  type InsertNotification,
} from "@shared/schema";
import { db } from "./db";
import { and, eq } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Product methods
  getProducts(): Promise<Product[]>;
  getProductById(id: number): Promise<Product | undefined>;
  getProductsByCategory(category: string): Promise<Product[]>;
  getProductsByGender(gender: string): Promise<Product[]>;
  getProductsByCategoryAndGender(
    category: string,
    gender: string
  ): Promise<Product[]>;
  searchProducts(query: string): Promise<Product[]>;

  // Cart methods
  getCartItems(userId: number): Promise<CartItem[]>;
  getCartItemWithDetails(
    userId: number
  ): Promise<(CartItem & { product: Product })[]>;
  addToCart(cartItem: InsertCartItem): Promise<CartItem>;
  updateCartItem(id: number, quantity: number): Promise<CartItem | undefined>;
  removeFromCart(id: number): Promise<boolean>;

  // Favorites methods
  getFavorites(userId: number): Promise<Favorite[]>;
  getFavoritesWithDetails(
    userId: number
  ): Promise<(Favorite & { product: Product })[]>;
  addToFavorites(favorite: InsertFavorite): Promise<Favorite>;
  removeFromFavorites(userId: number, productId: number): Promise<boolean>;

  // Notifications methods
  getNotifications(userId: number): Promise<Notification[]>;
  addNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: number): Promise<Notification | undefined>;
  deleteNotification(id: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  // Product methods
  async getProducts(): Promise<Product[]> {
    return await db.select().from(products);
  }

  async getProductById(id: number): Promise<Product | undefined> {
    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, id));
    return product || undefined;
  }

  async getProductsByCategory(category: string): Promise<Product[]> {
    return await db
      .select()
      .from(products)
      .where(eq(products.category, category));
  }

  async getProductsByGender(gender: string): Promise<Product[]> {
    return await db.select().from(products).where(eq(products.gender, gender));
  }

  async getProductsByCategoryAndGender(
    category: string,
    gender: string
  ): Promise<Product[]> {
    return await db
      .select()
      .from(products)
      .where(and(eq(products.category, category), eq(products.gender, gender)));
  }

  async searchProducts(query: string): Promise<Product[]> {
    const lowercaseQuery = query.toLowerCase();
    const allProducts = await db.select().from(products);

    return allProducts.filter(
      (product) =>
        product.name.toLowerCase().includes(lowercaseQuery) ||
        product.description.toLowerCase().includes(lowercaseQuery) ||
        product.category.toLowerCase().includes(lowercaseQuery)
    );
  }

  // Cart methods
  async getCartItems(userId: number): Promise<CartItem[]> {
    return await db
      .select()
      .from(cartItems)
      .where(eq(cartItems.userId, userId));
  }

  async getCartItemWithDetails(
    userId: number
  ): Promise<(CartItem & { product: Product })[]> {
    const items = await db
      .select()
      .from(cartItems)
      .where(eq(cartItems.userId, userId));
    const result: (CartItem & { product: Product })[] = [];

    for (const item of items) {
      const [product] = await db
        .select()
        .from(products)
        .where(eq(products.id, item.productId));
      if (product) {
        result.push({ ...item, product });
      }
    }

    return result;
  }

  async addToCart(insertCartItem: InsertCartItem): Promise<CartItem> {
    // Check if item already exists with same size
    const [existingItem] = await db
      .select()
      .from(cartItems)
      .where(
        and(
          eq(cartItems.userId, insertCartItem.userId),
          eq(cartItems.productId, insertCartItem.productId),
          eq(cartItems.size, insertCartItem.size)
        )
      );

    if (existingItem) {
      // Update quantity instead of creating new item
      const [updatedItem] = await db
        .update(cartItems)
        .set({ quantity: existingItem.quantity + insertCartItem.quantity })
        .where(eq(cartItems.id, existingItem.id))
        .returning();

      return updatedItem;
    }

    // Create new cart item
    const [cartItem] = await db
      .insert(cartItems)
      .values(insertCartItem)
      .returning();

    return cartItem;
  }

  async updateCartItem(
    id: number,
    quantity: number
  ): Promise<CartItem | undefined> {
    const [updatedItem] = await db
      .update(cartItems)
      .set({ quantity })
      .where(eq(cartItems.id, id))
      .returning();

    return updatedItem || undefined;
  }

  async removeFromCart(id: number): Promise<boolean> {
    const result = await db.delete(cartItems).where(eq(cartItems.id, id));
    return !!result;
  }

  // Favorites methods
  async getFavorites(userId: number): Promise<Favorite[]> {
    return await db
      .select()
      .from(favorites)
      .where(eq(favorites.userId, userId));
  }

  async getFavoritesWithDetails(
    userId: number
  ): Promise<(Favorite & { product: Product })[]> {
    const userFavorites = await db
      .select()
      .from(favorites)
      .where(eq(favorites.userId, userId));
    const result: (Favorite & { product: Product })[] = [];

    for (const favorite of userFavorites) {
      const [product] = await db
        .select()
        .from(products)
        .where(eq(products.id, favorite.productId));
      if (product) {
        result.push({ ...favorite, product });
      }
    }

    return result;
  }

  async addToFavorites(insertFavorite: InsertFavorite): Promise<Favorite> {
    // Check if already in favorites
    const [existingFavorite] = await db
      .select()
      .from(favorites)
      .where(
        and(
          eq(favorites.userId, insertFavorite.userId),
          eq(favorites.productId, insertFavorite.productId)
        )
      );

    if (existingFavorite) {
      return existingFavorite;
    }

    const [favorite] = await db
      .insert(favorites)
      .values(insertFavorite)
      .returning();

    return favorite;
  }

  async removeFromFavorites(
    userId: number,
    productId: number
  ): Promise<boolean> {
    const result = await db
      .delete(favorites)
      .where(
        and(eq(favorites.userId, userId), eq(favorites.productId, productId))
      );

    return !!result;
  }

  // Notifications methods
  async getNotifications(userId: number): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(notifications.id);
  }

  async addNotification(
    insertNotification: InsertNotification
  ): Promise<Notification> {
    const [notification] = await db
      .insert(notifications)
      .values(insertNotification)
      .returning();

    return notification;
  }

  async markNotificationAsRead(id: number): Promise<Notification | undefined> {
    const [updatedNotification] = await db
      .update(notifications)
      .set({ read: true })
      .where(eq(notifications.id, id))
      .returning();

    return updatedNotification || undefined;
  }

  async deleteNotification(id: number): Promise<boolean> {
    const result = await db
      .delete(notifications)
      .where(eq(notifications.id, id));
    return !!result;
  }
}

// Initialize sample data
async function initializeDatabase() {
  try {
    // Check if products table is empty
    const existingProducts = await db.select().from(products);

    if (existingProducts.length === 0) {
      // Add sample products
      const productsData: InsertProduct[] = [
        {
          name: "Summer Floral Dress",
          price: 5999, // $59.99
          description: "Elegant white summer dress with floral pattern",
          imageUrl:
            "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=600&h=800&q=80",
          category: "dresses",
          gender: "women",
          availableSizes: ["XS", "S", "M", "L", "XL"],
        },
        {
          name: "Denim Casual Shirt",
          price: 4599, // $45.99
          description: "Classic denim shirt for a casual look",
          imageUrl:
            "https://images.unsplash.com/photo-1589310243389-96a5483213a8?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=600&h=800&q=80",
          category: "shirts",
          gender: "men",
          availableSizes: ["S", "M", "L", "XL", "2XL"],
        },
        {
          name: "Leather Biker Jacket",
          price: 8999, // $89.99
          description: "Premium black leather jacket for a bold look",
          imageUrl:
            "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=600&h=800&q=80",
          category: "jackets",
          gender: "women",
          availableSizes: ["S", "M", "L"],
        },
        {
          name: "Classic White Sneakers",
          price: 6599, // $65.99
          description: "Comfortable casual sneakers for everyday wear",
          imageUrl:
            "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=600&h=800&q=80",
          category: "shoes",
          gender: "men",
          availableSizes: ["40", "41", "42", "43", "44", "45"],
        },
        {
          name: "Slim Fit T-Shirt",
          price: 2499, // $24.99
          description: "Comfortable slim fit t-shirt for everyday wear",
          imageUrl:
            "https://images.unsplash.com/photo-1581655353564-df123a1eb820?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=600&h=800&q=80",
          category: "tshirts",
          gender: "men",
          availableSizes: ["S", "M", "L", "XL"],
        },
        {
          name: "High Waist Jeans",
          price: 3999, // $39.99
          description: "Stylish high waist jeans for a modern look",
          imageUrl:
            "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=600&h=800&q=80",
          category: "pants",
          gender: "women",
          availableSizes: ["XS", "S", "M", "L"],
        },
        {
          name: "Wool Winter Coat",
          price: 11999, // $119.99
          description: "Warm wool coat perfect for winter season",
          imageUrl:
            "https://images.unsplash.com/photo-1539533018447-63fcce2678e3?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=600&h=800&q=80",
          category: "coats",
          gender: "women",
          availableSizes: ["S", "M", "L", "XL"],
        },
        {
          name: "Chino Pants",
          price: 3499, // $34.99
          description: "Classic chino pants for casual and formal occasions",
          imageUrl:
            "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=600&h=800&q=80",
          category: "pants",
          gender: "men",
          availableSizes: ["30", "32", "34", "36", "38"],
        },
      ];

      await db.insert(products).values(productsData);

      // Add initial notification for demo user (ID: 1)
      await db.insert(notifications).values({
        userId: 1,
        message: "Welcome to FashionZone! Explore our new summer collection.",
        read: false as boolean,
      });

      console.log("Database initialized with sample data");
    }
  } catch (error) {
    console.error("Error initializing database:", error);
  }
}

// Create demo user and initialize data
export async function setupDatabase() {
  console.log("🔌 Подключение к базе данных...");
  try {
    const existingUsers = await db.select().from(users);
    console.log("🔍 Найдено пользователей:", existingUsers.length);

    if (existingUsers.length === 0) {
      console.log("🆕 Создаю демо-пользователя...");
      await db.insert(users).values({
        username: "demo",
        password: "password123",
      });
      console.log("✅ Демо-пользователь создан");
    }

    await initializeDatabase();
  } catch (error) {
    console.error("❌ Ошибка при инициализации БД:", error);
  }
}

// In-memory storage implementation
class MemStorage implements IStorage {
  private users: User[] = [];
  private products: Product[] = [];
  private cartItems: CartItem[] = [];
  private favoritesItems: Favorite[] = [];
  private notificationItems: Notification[] = [];
  private userId = 1;
  private productId = 1;
  private cartItemId = 1;
  private favoriteId = 1;
  private notificationId = 1;

  constructor() {
    // Initialize with mock data
    this.initMockData();
  }

  private initMockData() {
    // Create demo user
    this.users.push({
      id: this.userId++,
      username: "demo",
      password:
        "54ca7b83a424aed496ef5ef4f0ddf48108d450e0a995315c2080f3b058a2d1c7.29a7c9482d883c1f60bff14b3a181a01", // hashed "password123"
    });

    // Add sample products
    const productsData: InsertProduct[] = [
      {
        name: "Summer Floral Dress",
        price: 5999, // $59.99
        description: "Elegant white summer dress with floral pattern",
        imageUrl:
          "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=600&h=800&q=80",
        category: "dresses",
        gender: "women",
        availableSizes: ["XS", "S", "M", "L", "XL"],
      },
      {
        name: "Denim Casual Shirt",
        price: 4599, // $45.99
        description: "Classic denim shirt for a casual look",
        imageUrl:
          "https://images.unsplash.com/photo-1589310243389-96a5483213a8?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=600&h=800&q=80",
        category: "shirts",
        gender: "men",
        availableSizes: ["S", "M", "L", "XL", "2XL"],
      },
      {
        name: "Leather Biker Jacket",
        price: 8999, // $89.99
        description: "Premium black leather jacket for a bold look",
        imageUrl:
          "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=600&h=800&q=80",
        category: "jackets",
        gender: "women",
        availableSizes: ["S", "M", "L"],
      },
      {
        name: "Classic White Sneakers",
        price: 6599, // $65.99
        description: "Comfortable casual sneakers for everyday wear",
        imageUrl:
          "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=600&h=800&q=80",
        category: "shoes",
        gender: "men",
        availableSizes: ["40", "41", "42", "43", "44", "45"],
      },
      {
        name: "Slim Fit T-Shirt",
        price: 2499, // $24.99
        description: "Comfortable slim fit t-shirt for everyday wear",
        imageUrl:
          "https://images.unsplash.com/photo-1581655353564-df123a1eb820?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=600&h=800&q=80",
        category: "tshirts",
        gender: "men",
        availableSizes: ["S", "M", "L", "XL"],
      },
      {
        name: "High Waist Jeans",
        price: 3999, // $39.99
        description: "Stylish high waist jeans for a modern look",
        imageUrl:
          "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=600&h=800&q=80",
        category: "pants",
        gender: "women",
        availableSizes: ["XS", "S", "M", "L"],
      },
      {
        name: "Wool Winter Coat",
        price: 11999, // $119.99
        description: "Warm wool coat perfect for winter season",
        imageUrl:
          "https://images.unsplash.com/photo-1539533018447-63fcce2678e3?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=600&h=800&q=80",
        category: "coats",
        gender: "women",
        availableSizes: ["S", "M", "L", "XL"],
      },
      {
        name: "Chino Pants",
        price: 3499, // $34.99
        description: "Classic chino pants for casual and formal occasions",
        imageUrl:
          "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=600&h=800&q=80",
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
      read: false as boolean,
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.find((user) => user.id === id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return this.users.find((user) => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    // Пароль уже должен быть хеширован в auth.ts при регистрации
    // Мы просто добавляем ID и сохраняем пользователя
    const newUser: User = {
      ...insertUser,
      id: this.userId++,
    };
    this.users.push(newUser);
    return newUser;
  }

  // Product methods
  async getProducts(): Promise<Product[]> {
    return [...this.products];
  }

  async getProductById(id: number): Promise<Product | undefined> {
    return this.products.find((product) => product.id === id);
  }

  async getProductsByCategory(category: string): Promise<Product[]> {
    return this.products.filter((product) => product.category === category);
  }

  async getProductsByGender(gender: string): Promise<Product[]> {
    return this.products.filter((product) => product.gender === gender);
  }

  async getProductsByCategoryAndGender(
    category: string,
    gender: string
  ): Promise<Product[]> {
    return this.products.filter(
      (product) => product.category === category && product.gender === gender
    );
  }

  async searchProducts(query: string): Promise<Product[]> {
    const lowercaseQuery = query.toLowerCase();
    return this.products.filter(
      (product) =>
        product.name.toLowerCase().includes(lowercaseQuery) ||
        product.description.toLowerCase().includes(lowercaseQuery) ||
        product.category.toLowerCase().includes(lowercaseQuery)
    );
  }

  // Cart methods
  async getCartItems(userId: number): Promise<CartItem[]> {
    return this.cartItems.filter((item) => item.userId === userId);
  }

  async getCartItemWithDetails(
    userId: number
  ): Promise<(CartItem & { product: Product })[]> {
    const items = this.cartItems.filter((item) => item.userId === userId);
    const result: (CartItem & { product: Product })[] = [];

    for (const item of items) {
      const product = this.products.find((p) => p.id === item.productId);
      if (product) {
        result.push({ ...item, product });
      }
    }

    return result;
  }

  async addToCart(insertCartItem: InsertCartItem): Promise<CartItem> {
    // Check if item already exists with same size
    const existingItem = this.cartItems.find(
      (item) =>
        item.userId === insertCartItem.userId &&
        item.productId === insertCartItem.productId &&
        item.size === insertCartItem.size
    );

    if (existingItem) {
      // Update quantity
      existingItem.quantity += insertCartItem.quantity;
      return existingItem;
    }

    // Create new cart item
    const newItem: CartItem = {
      ...insertCartItem,
      id: this.cartItemId++,
    };
    this.cartItems.push(newItem);
    return newItem;
  }

  async updateCartItem(
    id: number,
    quantity: number
  ): Promise<CartItem | undefined> {
    const item = this.cartItems.find((item) => item.id === id);
    if (item) {
      item.quantity = quantity;
      return item;
    }
    return undefined;
  }

  async removeFromCart(id: number): Promise<boolean> {
    const index = this.cartItems.findIndex((item) => item.id === id);
    if (index !== -1) {
      this.cartItems.splice(index, 1);
      return true;
    }
    return false;
  }

  // Favorites methods
  async getFavorites(userId: number): Promise<Favorite[]> {
    return this.favoritesItems.filter((fav) => fav.userId === userId);
  }

  async getFavoritesWithDetails(
    userId: number
  ): Promise<(Favorite & { product: Product })[]> {
    const favs = this.favoritesItems.filter((fav) => fav.userId === userId);
    const result: (Favorite & { product: Product })[] = [];

    for (const fav of favs) {
      const product = this.products.find((p) => p.id === fav.productId);
      if (product) {
        result.push({ ...fav, product });
      }
    }

    return result;
  }

  async addToFavorites(insertFavorite: InsertFavorite): Promise<Favorite> {
    // Check if already in favorites
    const existingFav = this.favoritesItems.find(
      (fav) =>
        fav.userId === insertFavorite.userId &&
        fav.productId === insertFavorite.productId
    );

    if (existingFav) {
      return existingFav;
    }

    const newFav: Favorite = {
      ...insertFavorite,
      id: this.favoriteId++,
    };
    this.favoritesItems.push(newFav);
    return newFav;
  }

  async removeFromFavorites(
    userId: number,
    productId: number
  ): Promise<boolean> {
    const index = this.favoritesItems.findIndex(
      (fav) => fav.userId === userId && fav.productId === productId
    );
    if (index !== -1) {
      this.favoritesItems.splice(index, 1);
      return true;
    }
    return false;
  }

  // Notifications methods
  async getNotifications(userId: number): Promise<Notification[]> {
    return this.notificationItems.filter((n) => n.userId === userId);
  }

  async addNotification(
    insertNotification: InsertNotification
  ): Promise<Notification> {
    // Обязательно устанавливаем read: false если он не определен
    const newNotification: Notification = {
      ...insertNotification,
      id: this.notificationId++,
      read: insertNotification.read ?? false,
    };
    this.notificationItems.push(newNotification);
    return newNotification;
  }

  async markNotificationAsRead(id: number): Promise<Notification | undefined> {
    const notification = this.notificationItems.find((n) => n.id === id);
    if (notification) {
      notification.read = true;
      return notification;
    }
    return undefined;
  }

  async deleteNotification(id: number): Promise<boolean> {
    const index = this.notificationItems.findIndex((n) => n.id === id);
    if (index !== -1) {
      this.notificationItems.splice(index, 1);
      return true;
    }
    return false;
  }
}

// Export storage instance
export const storage = new DatabaseStorage();
