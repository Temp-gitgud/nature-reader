import dotenv from "dotenv";
import { defineConfig } from "prisma/config";

// Load environment variables from .env.local
dotenv.config({ path: ".env.local" });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
    // @ts-ignore
    directUrl: process.env["DIRECT_URL"],
  },
});
