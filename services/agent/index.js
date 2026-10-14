import express from "express";
import dotenv from "dotenv";
import ConnectDB from "./config/db.js";
import router from "./routes/agent.route.js";


import path from "path";
import fs from "fs";

dotenv.config();
const port = process.env.PORT || 8003;

const app = express();
app.use(express.json());
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use("/pdf", express.static(uploadsDir));

app.use("/", router);

app.get("/", (req, res) => {
  res.json({ message: "hello from agent" });
});

app.use((err, req, res, next) => {
    console.error("Agent service error:", err);

    if (err.status) {
        return res.status(err.status).json(err.data || { message: err.message });
    }

    return res.status(500).json({ message: `Agent service error: ${err?.message || err}` });
});

app.listen(port, async () => {
  console.log(`agent service running on port ${port}`);
  await ConnectDB();
});
