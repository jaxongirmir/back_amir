"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerRoutes = registerRoutes;
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const storage_1 = require("./storage");
const auth_1 = require("./auth");
const schema_1 = require("../shared/schema");
const zod_1 = require("zod");
async function registerRoutes(app) {
    // Setup authentication
    (0, auth_1.setupAuth)(app);
    // API routes
    const apiRouter = express_1.default.Router();
    // Get all products
    apiRouter.get("/products", async (req, res) => {
        try {
            const products = await storage_1.storage.getProducts();
            res.json(products);
        }
        catch (error) {
            res.status(500).json({ message: "Failed to fetch products" });
        }
    });
    // Get products by filter
    apiRouter.get("/products/filter", async (req, res) => {
        try {
            const { gender, category } = req.query;
            let products;
            if (gender && category) {
                products = await storage_1.storage.getProductsByCategoryAndGender(category, gender);
            }
            else if (gender) {
                products = await storage_1.storage.getProductsByGender(gender);
            }
            else if (category) {
                products = await storage_1.storage.getProductsByCategory(category);
            }
            else {
                products = await storage_1.storage.getProducts();
            }
            res.json(products);
        }
        catch (error) {
            res.status(500).json({ message: "Failed to filter products" });
        }
    });
    // Search products
    apiRouter.get("/products/search", async (req, res) => {
        try {
            const { query } = req.query;
            if (!query || typeof query !== "string") {
                return res.status(400).json({ message: "Search query is required" });
            }
            const products = await storage_1.storage.searchProducts(query);
            res.json(products);
        }
        catch (error) {
            res.status(500).json({ message: "Failed to search products" });
        }
    });
    // Get product by ID
    apiRouter.get("/products/:id", async (req, res) => {
        try {
            const id = parseInt(req.params.id);
            if (isNaN(id)) {
                return res.status(400).json({ message: "Invalid product ID" });
            }
            const product = await storage_1.storage.getProductById(id);
            if (!product) {
                return res.status(404).json({ message: "Product not found" });
            }
            res.json(product);
        }
        catch (error) {
            res.status(500).json({ message: "Failed to fetch product" });
        }
    });
    // === Cart Routes ===
    // Get cart items
    apiRouter.get("/cart", async (req, res) => {
        try {
            if (!req.isAuthenticated()) {
                return res.status(401).json({ message: "Unauthorized" });
            }
            const userId = req.user.id;
            const cartItems = await storage_1.storage.getCartItemWithDetails(userId);
            res.json(cartItems);
        }
        catch (error) {
            res.status(500).json({ message: "Failed to fetch cart items" });
        }
    });
    // Add to cart
    apiRouter.post("/cart", async (req, res) => {
        try {
            if (!req.isAuthenticated()) {
                return res.status(401).json({ message: "Unauthorized" });
            }
            const userId = req.user.id;
            const cartItemData = { ...req.body, userId };
            const validatedData = schema_1.insertCartItemSchema.parse(cartItemData);
            const cartItem = await storage_1.storage.addToCart(validatedData);
            res.status(201).json(cartItem);
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                return res.status(400).json({ message: error.message });
            }
            res.status(500).json({ message: "Failed to add item to cart" });
        }
    });
    // Update cart item
    apiRouter.patch("/cart/:id", async (req, res) => {
        try {
            const id = parseInt(req.params.id);
            if (isNaN(id)) {
                return res.status(400).json({ message: "Invalid cart item ID" });
            }
            const { quantity } = req.body;
            if (typeof quantity !== "number" || quantity < 1) {
                return res.status(400).json({ message: "Invalid quantity" });
            }
            const updatedItem = await storage_1.storage.updateCartItem(id, quantity);
            if (!updatedItem) {
                return res.status(404).json({ message: "Cart item not found" });
            }
            res.json(updatedItem);
        }
        catch (error) {
            res.status(500).json({ message: "Failed to update cart item" });
        }
    });
    // Remove from cart
    apiRouter.delete("/cart/:id", async (req, res) => {
        try {
            const id = parseInt(req.params.id);
            if (isNaN(id)) {
                return res.status(400).json({ message: "Invalid cart item ID" });
            }
            const success = await storage_1.storage.removeFromCart(id);
            if (!success) {
                return res.status(404).json({ message: "Cart item not found" });
            }
            res.status(204).end();
        }
        catch (error) {
            res.status(500).json({ message: "Failed to remove item from cart" });
        }
    });
    // === Favorites Routes ===
    // Get favorites
    apiRouter.get("/favorites", async (req, res) => {
        try {
            if (!req.isAuthenticated()) {
                return res.status(401).json({ message: "Unauthorized" });
            }
            const userId = req.user.id;
            const favorites = await storage_1.storage.getFavoritesWithDetails(userId);
            res.json(favorites);
        }
        catch (error) {
            res.status(500).json({ message: "Failed to fetch favorites" });
        }
    });
    // Add to favorites
    apiRouter.post("/favorites", async (req, res) => {
        try {
            if (!req.isAuthenticated()) {
                return res.status(401).json({ message: "Unauthorized" });
            }
            const userId = req.user.id;
            const favoriteData = { ...req.body, userId };
            const validatedData = schema_1.insertFavoriteSchema.parse(favoriteData);
            const favorite = await storage_1.storage.addToFavorites(validatedData);
            res.status(201).json(favorite);
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                return res.status(400).json({ message: error.message });
            }
            res.status(500).json({ message: "Failed to add to favorites" });
        }
    });
    // Remove from favorites
    apiRouter.delete("/favorites/:productId", async (req, res) => {
        try {
            if (!req.isAuthenticated()) {
                return res.status(401).json({ message: "Unauthorized" });
            }
            const userId = req.user.id;
            const productId = parseInt(req.params.productId);
            if (isNaN(productId)) {
                return res.status(400).json({ message: "Invalid product ID" });
            }
            const success = await storage_1.storage.removeFromFavorites(userId, productId);
            if (!success) {
                return res.status(404).json({ message: "Favorite item not found" });
            }
            res.status(204).end();
        }
        catch (error) {
            res.status(500).json({ message: "Failed to remove from favorites" });
        }
    });
    // === Notifications Routes ===
    // Удалены по запросу пользователя
    // Register API routes
    app.use("/api", apiRouter);
    const httpServer = (0, http_1.createServer)(app);
    return httpServer;
}
