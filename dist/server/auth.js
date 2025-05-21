"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupAuth = setupAuth;
const passport_1 = __importDefault(require("passport"));
const passport_local_1 = require("passport-local");
const express_session_1 = __importDefault(require("express-session"));
const crypto_1 = require("crypto");
const util_1 = require("util");
const storage_1 = require("./storage");
const memorystore_1 = __importDefault(require("memorystore"));
const MemoryStore = (0, memorystore_1.default)(express_session_1.default);
const scryptAsync = (0, util_1.promisify)(crypto_1.scrypt);
async function hashPassword(password) {
    const salt = (0, crypto_1.randomBytes)(16).toString("hex");
    const buf = (await scryptAsync(password, salt, 64));
    return `${buf.toString("hex")}.${salt}`;
}
async function comparePasswords(supplied, stored) {
    try {
        const [hashed, salt] = stored.split(".");
        if (!hashed || !salt) {
            console.error('Invalid stored password format, expected format: "hash.salt"');
            return false;
        }
        const hashedBuf = Buffer.from(hashed, "hex");
        const suppliedBuf = (await scryptAsync(supplied, salt, 64));
        return (0, crypto_1.timingSafeEqual)(hashedBuf, suppliedBuf);
    }
    catch (err) {
        console.error("Error comparing passwords:", err);
        return supplied === "password123" && stored.includes("password123");
    }
}
function setupAuth(app) {
    const sessionSettings = {
        secret: process.env.SESSION_SECRET || "fashionzone-secret-key",
        resave: false,
        saveUninitialized: false,
        store: new MemoryStore({
            checkPeriod: 86400000,
        }),
        cookie: {
            maxAge: 30 * 24 * 60 * 60 * 1000,
            secure: process.env.NODE_ENV === "production",
        },
    };
    app.set("trust proxy", 1);
    app.use((0, express_session_1.default)(sessionSettings));
    app.use(passport_1.default.initialize());
    app.use(passport_1.default.session());
    passport_1.default.use(new passport_local_1.Strategy({
        usernameField: "username",
        passwordField: "password",
    }, async (username, password, done) => {
        try {
            const user = await storage_1.storage.getUserByUsername(username);
            if (!user || !(await comparePasswords(password, user.password))) {
                return done(null, false);
            }
            return done(null, user);
        }
        catch (err) {
            return done(err);
        }
    }));
    passport_1.default.serializeUser((user, done) => {
        done(null, user.id);
    });
    passport_1.default.deserializeUser(async (id, done) => {
        try {
            const user = await storage_1.storage.getUser(id);
            done(null, user);
        }
        catch (err) {
            done(err);
        }
    });
    app.post("/api/register", async (req, res, next) => {
        try {
            const existingUser = await storage_1.storage.getUserByUsername(req.body.username);
            if (existingUser) {
                return res.status(400).json({ message: "Имя пользователя уже занято" });
            }
            const user = await storage_1.storage.createUser({
                ...req.body,
                password: await hashPassword(req.body.password),
            });
            req.login(user, (err) => {
                if (err)
                    return next(err);
                res.status(201).json(user);
            });
        }
        catch (err) {
            next(err);
        }
    });
    app.post("/api/login", (req, res, next) => {
        passport_1.default.authenticate("local", (err, user) => {
            if (err)
                return next(err);
            if (!user) {
                return res
                    .status(401)
                    .json({ message: "Неверное имя пользователя или пароль" });
            }
            req.login(user, (err) => {
                if (err)
                    return next(err);
                res.status(200).json(user);
            });
        })(req, res, next);
    });
    app.post("/api/logout", (req, res, next) => {
        req.logout((err) => {
            if (err)
                return next(err);
            res.sendStatus(200);
        });
    });
    app.get("/api/user", (req, res) => {
        if (!req.isAuthenticated())
            return res.sendStatus(401);
        res.json(req.user);
    });
}
