import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { AppDataSource } from "./config/database";
import authRoutes from "./routes/auth.routes";
import adminRoutes from "./routes/admin.routes";
import verificationRoutes from "./routes/verification.routes";
import rfpRoutes from "./routes/rfp.routes";
import bidRoutes from "./routes/bid.routes";
import contractRoutes from "./routes/contract.routes";
import healthRoute from "./routes/health.route";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec, swaggerUiOptions } from "./config/swagger";

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve);
app.get('/api-docs', swaggerUi.setup(swaggerSpec, swaggerUiOptions));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/vendor/verification", verificationRoutes);
app.use("/api/rfp", rfpRoutes);
app.use("/api/bids", bidRoutes);
app.use("/api/contracts", contractRoutes);
app.use("/api/health", healthRoute);

const PORT = process.env.PORT || 3000;

// Initialize database connection
AppDataSource.initialize()
    .then(() => {
        console.log("Database connection established");
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
            console.log(`Swagger documentation available at http://localhost:${PORT}/api-docs`);
        });
    })
    .catch((error) => {
        console.error("Error connecting to database:", error);
        process.exit(1);
    }); 