import express from "express";
import dotenv from "dotenv";
import proxy from "express-http-proxy";
import cors from "cors";
import cookieParser from "cookie-parser";
import { protect } from "./middleware/auth.middleware.js";
import { getCurrentUser } from "./controllers/user.controller.js";
import { proxyWithHeaders} from "./utils/proxyWithHeaders.js"
import morgan from "morgan";

dotenv.config();
const port = process.env.PORT || 8000;

const app = express();
app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true
}));
app.use(morgan("dev"));
app.use(express.json());
app.use(cookieParser());

const authProxy = proxy(process.env.AUTH_SERVICE, {
    proxyReqBodyDecorator: (bodyContent, srcReq) => {
        if (srcReq.body && typeof srcReq.body === "object" && Object.keys(srcReq.body).length > 0) {
            return JSON.stringify(srcReq.body);
        }
        return bodyContent;
    }
});

app.use("/api/auth", authProxy);
app.use("/api/chat", protect, proxyWithHeaders(process.env.CHAT_SERVICE));
app.use("/api/agent", protect, proxyWithHeaders(process.env.AGENT_SERVICE));

app.use("/api/billing", protect, proxyWithHeaders(process.env.BILLING_SERVICE));
app.get("/api/me", protect, getCurrentUser);
app.get("/", (req, res) => {
    res.json({ message: "hello from gateway" });
});

app.listen(port, () => {
    console.log(`Gateway running on port ${port}`);
});