import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    host: "ep-lucky-snow-abxh5w4k-pooler.eu-west-2.aws.neon.tech",
    port: 5432,
    user: "neondb_owner",
    password: "npg_wra6s2qySgIo",
    database: "neondb",
    ssl: true,
  },
});
