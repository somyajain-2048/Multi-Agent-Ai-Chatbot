import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import router from "./routes/chat.routes.js";
import connectDB from "./config/db.js";

dotenv.config();
const port = process.env.PORT || 8002;

const app = express();
app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true
}));
app.use(express.json());

app.use("/", router);

app.get("/health", (req, res) => {
    res.json({ message: "hello from chat" });
});

app.listen(port, async () => {
    await connectDB();
    console.log(`chat service started on port ${port}`);
});