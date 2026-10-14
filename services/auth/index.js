import express from "express";
import dotenv from "dotenv";
import ConnectDB from "./config/db.js"
import router from "./routes/auth.route.js";

dotenv.config();
const port = process.env.PORT ||8001;

const app = express();
app.use(express.json());

app.use("/",router)
app.get("/", (req, res) => {
  res.json({ message: "hello from gateway" });
});

app.listen(port,async () => {
  console.log(`Auth service running on port ${port}`);
 await ConnectDB();
});
