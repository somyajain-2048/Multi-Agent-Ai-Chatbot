import { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  Sparkles,
  Bot,
  User,
  Copy,
  Check,
  PanelLeftOpen,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import ChatInput from "./ChatInput";
import MessageBubble from "./MessageBubble";
import { getMessages } from "../features/getMessages";
import { sendMessageToAgent } from "../features/sendMessage";
import { createConversation } from "../features/createConversation";
import {
  addConversation,
  setSelectedConversation,
  setConvTitle,
} from "../redux/conversationSlice";
import { updateConversationAsync } from "../features/updateConversation";
import {
  setMessages,
  addMessage,
  setMessagesLoading,
  setAiThinking,
} from "../redux/messageSlice";
import { setUserData } from "../redux/userSlice";

function ChatArea({ isSidebarOpen, toggleSidebar }) {
  const dispatch = useDispatch();
  const { selectedConversation } = useSelector((state) => state.conversations);
  const { messages, messagesLoading, aiThinking } = useSelector(
    (state) => state.messages
  );
  const { userData } = useSelector((state) => state.user);

  const [inputPrompt, setInputPrompt] = useState("");
  const [copiedIndex, setCopiedIndex] = useState(null);
  const messagesEndRef = useRef(null);

  const convId = selectedConversation?._id || selectedConversation?.id;

  // Fetch messages whenever selected conversation changes
  useEffect(() => {
    if (!convId) return;

    const fetchHistory = async () => {
      dispatch(setMessagesLoading(true));
      const history = await getMessages(convId);
      dispatch(setMessages(history));
      dispatch(setMessagesLoading(false));
    };

    fetchHistory();
  }, [convId, dispatch]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, aiThinking]);

  const handleSend = async (customPrompt) => {
    const textToSend = customPrompt || inputPrompt;
    if (!textToSend.trim() || aiThinking) return;

    let targetConvId = convId;

    if (!targetConvId) {
      const newConv = await createConversation();
      if (newConv) {
        dispatch(addConversation(newConv));
        dispatch(setSelectedConversation(newConv));
        targetConvId = newConv._id || newConv.id;
      } else {
        console.error("Failed to auto-create conversation");
        return;
      }
    }

    if (selectedConversation?.title === "New Chat" || selectedConversation?.title === "New Conversation") {
      await updateConversationAsync({ id: targetConvId, title: textToSend.trim() });
      dispatch(setConvTitle({ conversationId: targetConvId, title: textToSend.trim() }));
    }

    const userMsg = {
      conversationId: targetConvId,
      role: "user",
      content: textToSend.trim(),
      createdAt: new Date().toISOString(),
    };

    // Add user message to state immediately
    dispatch(addMessage(userMsg));
    if (!customPrompt) setInputPrompt("");
    dispatch(setAiThinking(true));

    try {
      const currentAgent = "auto";
      const response = await sendMessageToAgent(textToSend.trim(), targetConvId, currentAgent);
      
      if (response?.credits !== undefined && userData) {
        dispatch(setUserData({ ...userData, credits: response.credits }));
      }
      
      // response could be string or object containing aiResponse
      const aiContent =
        typeof response === "string"
          ? response
          : response?.aiResponse || response?.content || response?.message || JSON.stringify(response);

      const aiMsg = {
        conversationId: targetConvId,
        role: "assistant",
        content: aiContent,
        images: response?.images,
        createdAt: new Date().toISOString(),
      };

      dispatch(addMessage(aiMsg));
    } catch (error) {
      console.error("Agent error:", error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.aiResponse ||
        "Sorry, I encountered an issue reaching the agent backend. Please check connection.";
      dispatch(
        addMessage({
          conversationId: targetConvId,
          role: "assistant",
          content: errorMessage,
          isError: true,
        })
      );
    } finally {
      dispatch(setAiThinking(false));
    }
  };

  const copyToClipboard = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="flex-1 flex flex-col h-screen bg-[#0b0c10] text-slate-100 overflow-hidden relative">
      {/* Top Header */}
      <header className="h-14 sm:h-16 border-b border-white/[0.08] bg-[#0d0f14]/80 backdrop-blur-md px-3 sm:px-4 flex items-center justify-between shrink-0 z-10">
        <div className="flex items-center gap-2 sm:gap-3">
          {!isSidebarOpen && (
            <button
              type="button"
              onClick={toggleSidebar}
              className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-white/[0.06] transition-colors cursor-pointer border-none bg-transparent shrink-0"
              title="Open Sidebar"
            >
              <PanelLeftOpen size={18} />
            </button>
          )}

          <div className="flex flex-col min-w-0">
            <h1 className="text-xs sm:text-sm font-semibold text-slate-200 truncate max-w-[150px] sm:max-w-md">
              {selectedConversation?.title || "New Conversation"}
            </h1>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span className="text-[10px] sm:text-[11px] font-medium text-slate-400 truncate">
                Cortex Multi-Agent Engine
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[11px] sm:text-xs font-medium flex items-center gap-1.5">
            <Sparkles size={12} />
            <span className="hidden xs:inline sm:inline">Agent Graph v1.0</span>
            <span className="xs:hidden">v1.0</span>
          </div>
        </div>
      </header>

      {/* Main Chat Body */}
      <div className="flex-1 overflow-y-auto px-3 sm:px-6 md:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6 flex flex-col">
        {/* Loading messages state */}
        {messagesLoading ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
            <span className="text-xs sm:text-sm font-medium">Loading chat history...</span>
          </div>
        ) : messages.length === 0 ? (
          /* Welcome View */
          <div className="flex-1 max-w-3xl mx-auto h-full flex flex-col justify-center items-center text-center my-auto py-10 px-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-600 flex items-center justify-center shadow-xl shadow-indigo-500/25 mb-4 sm:mb-6 glow-indigo">
              <Sparkles className="w-7 h-7 sm:w-8 sm:h-8 text-white animate-pulse" />
            </div>

            <h2 className="text-xl sm:text-3xl font-extrabold text-slate-100 tracking-tight mb-2 sm:mb-3">
              How can CortexAI assist you today?
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm max-w-md leading-relaxed">
              Experience dynamic multi-agent intelligence. Type any request below to start reasoning.
            </p>
          </div>
        ) : (
          /* Messages List */
          <div className="max-w-3xl mx-auto w-full space-y-1">
            {messages.map((msg, index) => (
              <MessageBubble
                key={index}
                role={msg.role}
                content={msg.content}
                images={msg.images}
                isError={msg.isError}
                userPicture={userData?.picture}
                onRegenerate={
                  msg.role === "assistant" && index > 0
                    ? () => handleSend(messages[index - 1]?.content)
                    : undefined
                }
              />
            ))}

            {/* AI Thinking Indicator */}
            {aiThinking && (
              <div className="flex gap-3 sm:gap-4 justify-start my-4 items-start">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shrink-0 mt-1 shadow-md">
                  <Bot size={16} />
                </div>
                <div className="py-2 flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                  <span className="text-xs sm:text-sm font-medium text-slate-400 animate-pulse">
                    Cortex Agent is reasoning...
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <ChatInput
        inputPrompt={inputPrompt}
        setInputPrompt={setInputPrompt}
        onSend={handleSend}
        aiThinking={aiThinking}
      />
    </div>
  );
}

export default ChatArea;