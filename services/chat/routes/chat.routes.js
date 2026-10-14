import express from "express";
import {
  createConversation,
  getConversations,
  saveMessage,
  getMessages,
  updateConversation,
  deleteConversation
} from "../controllers/chat.controller.js";

const router = express.Router();

router.get("/create-conversation", createConversation);
router.post("/create-conversation", createConversation);
router.get("/get-conversations", getConversations);
router.post("/update-conversation", updateConversation);
router.delete("/delete-conversation/:id", deleteConversation);
router.post("/delete-conversation/:id", deleteConversation);
router.delete("/delete-conversation", deleteConversation);
router.post("/delete-conversation", deleteConversation);
router.post("/save-message", saveMessage);
router.get("/get-messages/:conversationId", getMessages);
router.post("/get-messages/:conversationId", getMessages);

export default router;
