import { DataSource } from "typeorm";
import dotenv from "dotenv";
import path from "path";

dotenv.config();

const entitiesPath = process.env.NODE_ENV === "production" 
    ? [path.join(__dirname, "..", "models", "*.js")]
    : ["src/models/**/*.ts"];

export const AppDataSource = new DataSource({
    type: "postgres",
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "5432"),
    username: process.env.DB_USERNAME || "postgres",
    password: process.env.DB_PASSWORD || "postgres",
    database: process.env.DB_NAME || "unisphere",
    synchronize: process.env.NODE_ENV !== "production",
    logging: process.env.NODE_ENV !== "production",
    entities: entitiesPath,
    migrations: ["src/migrations/**/*.ts"],
    subscribers: ["src/subscribers/**/*.ts"],
}); 