import express from "express";
import dotenv from "dotenv";
import ConnectDB from "./config/db.js";
import router from "./routes/billing.routes.js";

dotenv.config();
const port = process.env.PORT || 8004;

const app = express();
app.use(express.json());

app.use("/", router);

app.get("/health", (req, res) => {
  res.json({ message: "hello from billing" });
});

app.listen(port, async () => {
  console.log(`Billing service running on port ${port}`);
  await ConnectDB();
});
