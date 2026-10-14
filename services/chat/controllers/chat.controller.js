import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";

export const createConversation = async (req, res) => {
  try {
    const userId = req.headers["x-user-id"];
    console.log("userId", userId);
    const conversation = await Conversation.create({
      userId: userId,
    });
    return res.status(200).json(conversation);
  } catch (error) {
    return res
      .status(500)
      .json({ message: `create conversation error ${error}` });
  }
};

export const getConversations = async (req, res) => {
  try {
    const userId = req.headers["x-user-id"];

    const conversation = await Conversation.find({
      userId: userId,
    }).sort({ updatedAt: -1 });
    return res.status(200).json(conversation);
  } catch (error) {
    return res.status(500).json({ message: `get conversation error ${error}` });
  }
};


export const updateConversation = async (req, res) => {
  try {
    const { id, title } = req.body;

    const conversation = await Conversation.findByIdAndUpdate(id, {
      title
    }, { new: true });
    return res.status(200).json(conversation);
  } catch (error) {
    return res.status(500).json({ message: `update conversation error ${error}` });
  }
};

export const saveMessage = async (req, res) => {
  try {
    const { conversationId, role, content,images } = req.body;
    const message = await Message.create({
      conversationId,
      content,
      role,
      images
    });
    return res.status(200).json(message);
  } catch (error) {
    return res.status(500).json({ message: `save msg error ${error}` });
  }
};

export const getMessages = async (req, res) => {
  try {
    const messages = await Message.find({
      conversationId: req.params.conversationId,
    }).sort({ createdAt: 1 });
    return res.status(200).json(messages);
  } catch (error) {
    return res.status(500).json({ message: `get msg error ${error}` });
  }
};

export const deleteConversation = async (req, res) => {
  try {
    const id = req.params.id || req.body.id;
    const userId = req.headers["x-user-id"];

    if (!id) {
      return res.status(400).json({ message: "Conversation ID is required" });
    }

    const conversation = await Conversation.findOneAndDelete({ _id: id, userId });
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    await Message.deleteMany({ conversationId: id });

    return res.status(200).json({ success: true, message: "Conversation deleted successfully", id });
  } catch (error) {
    return res.status(500).json({ message: `delete conversation error ${error?.message || error}` });
  }
};