import { createSlice } from "@reduxjs/toolkit";

const messageSlice = createSlice({
  name: "messages",
  initialState: {
    messages: [],
    artifacts: [],
    messagesLoading: false,
    aiThinking: false,
  },
  reducers: {
    setMessages: (state, action) => {
      state.messages = action.payload || [];
    },
    addMessage: (state, action) => {
      if (action.payload) {
        state.messages.push(action.payload);
      }
    },
    setArtifacts: (state, action) => {
      state.artifacts = action.payload || [];
    },
    clearMessages: (state) => {
      state.messages = [];
    },
    setMessagesLoading: (state, action) => {
      state.messagesLoading = action.payload;
    },
    setAiThinking: (state, action) => {
      state.aiThinking = action.payload;
    },
  },
});

export const {
  setMessages,
  addMessage,
  setArtifacts,
  clearMessages,
  setMessagesLoading,
  setAiThinking,
} = messageSlice.actions;

export default messageSlice.reducer;
