import express, { Application, Request, Response  } from "express";
import { userRouter } from "./users/user.route";
import cors from "cors";
import { rateLimiterMiddleware } from "./middleware/rateLimiter";
import { NextFunction } from "express";
import { authRouter } from "./Auth/Auth.route";
import { cropRouter } from "./crops/crop.route";
import { listingsRouter } from "./listings/listings.route";
import { ordersRouter } from "./orders/orders.route";
import { paymentsRouter } from "./payments/payments.route";


const app: Application = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

//logger middleware
const logger = (req: Request, res: Response, next: NextFunction) => {
  console.log(`${req.method} ${req.path}`);
  next();
};
app.use(logger);
app.use(rateLimiterMiddleware);

//default route
app.get("/", (req: Request, res: Response) => {
  res.send("Welcome to the Farm Marketplace API");
});

//User routes
app.use("/api/users", userRouter);
app.use("/api/auth", authRouter); // Assuming auth routes are in the same router for simplicity
// crop endpoints
app.use("/api/crops", cropRouter);
// listings endpoints
app.use("/api/listings", listingsRouter);
//orders endpoints
app.use("/api/orders", ordersRouter)
//payments endpoints
app.use("/api/payments", paymentsRouter)







export default app;