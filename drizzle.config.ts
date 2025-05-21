import { defineConfig } from "drizzle-kit";
import dotenv from "dotenv";

dotenv.config();

// Проверка обязательных переменных окружения
function getRequiredEnvVar(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export default defineConfig({
  out: "./migrations",
  schema: "./../shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    host: getRequiredEnvVar("DB_HOST"),
    port: 5432,
    user: getRequiredEnvVar("DB_USER"),
    password: getRequiredEnvVar("DB_PASSWORD"),
    database: getRequiredEnvVar("DB_NAME"),
    ssl: true,
  },
});
