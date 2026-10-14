import { createSlice } from "@reduxjs/toolkit";

const conversationSlice = createSlice({
  name: "conversations",
  initialState: {
    conversations: [],
    selectedConversation: null,
  },
  reducers: {
    setConversation: (state, action) => {
      state.conversations = action.payload || [];
    },
    addConversation: (state, action) => {
      if (action.payload) {
        state.conversations.unshift(action.payload);
        state.selectedConversation = action.payload;
      }
    },
    setSelectedConversation: (state, action) => {
      state.selectedConversation = action.payload;
    },
    setConvTitle: (state, action) => {
      const { title, conversationId } = action.payload;
      state.conversations = state.conversations.map((conv) => {
          if (conv._id === conversationId) {
              return { ...conv, title };
          }
          return conv;
      });

      if (state.selectedConversation?._id === conversationId) {
          state.selectedConversation = { ...state.selectedConversation, title };
      }
    },
    removeConversation: (state, action) => {
      const targetId = action.payload;
      state.conversations = state.conversations.filter(
        (conv) => (conv._id || conv.id) !== targetId
      );
      const activeId = state.selectedConversation?._id || state.selectedConversation?.id;
      if (activeId === targetId) {
        state.selectedConversation = state.conversations[0] || null;
      }
    },
  },
});

export const {
  setConversation,
  addConversation,
  setSelectedConversation,
  setConvTitle,
  removeConversation
} = conversationSlice.actions;

export default conversationSlice.reducer;

