import React, { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Send, Zap, MessageSquare, FileText, Presentation, Globe, Paperclip, X } from "lucide-react";
import { updateConversationAsync } from "../features/updateConversation";
import { sendMessage } from "../features/sendMessage";
import { createConversation } from "../features/createConversation";
import { setConvTitle, addConversation, setSelectedConversation } from "../redux/conversationSlice";
import { addMessage, setAiThinking, setArtifacts } from "../redux/messageSlice";
import { setUserData } from "../redux/userSlice";

function ChatInput({ inputPrompt, setInputPrompt, onSend }) {
  const [value, setValue] = useState("");
  const [selectedAgent, setSelectedAgent] = useState("Auto");
  const [selectedFile, setSelectedFile] = useState(null);
  const inputRef = useRef(null);
  const fileRef = useRef(null);
  const dispatch = useDispatch();

  const { selectedConversation: conversation } = useSelector(
    (state) => state.conversations
  );
  const { aiThinking } = useSelector((state) => state.messages);
  const { userData } = useSelector((state) => state.user);

  useEffect(() => {
    if (inputPrompt !== undefined && inputPrompt !== "") {
      setValue(inputPrompt);
    }
  }, [inputPrompt]);

  // Dynamic textarea height calculation for smooth responsiveness
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      const nextHeight = Math.min(inputRef.current.scrollHeight, 160);
      inputRef.current.style.height = `${nextHeight}px`;
    }
  }, [value]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
        alert("Please select a PDF file.");
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileRef.current) {
      fileRef.current.value = "";
    }
  };

  const handleSendMessageAsync = async (overridePrompt) => {
    let textToSend = (typeof overridePrompt === "string" ? overridePrompt : value).trim();
    if (!textToSend && selectedFile) {
      textToSend = `Analyze the uploaded PDF: ${selectedFile.name}`;
    }
    if ((!textToSend && !selectedFile) || aiThinking) return;

    let currentConv = conversation;

    if (!currentConv) {
      currentConv = await createConversation();
      if (currentConv) {
        dispatch(addConversation(currentConv));
        dispatch(setSelectedConversation(currentConv));
      } else {
        console.error("Failed to create conversation");
        return;
      }
    }

    const convId = currentConv?._id || currentConv?.id;

    if (currentConv?.title === "New Chat" || currentConv?.title === "New Conversation") {
      await updateConversationAsync({ id: convId, title: textToSend });
      dispatch(setConvTitle({ conversationId: convId, title: textToSend }));
    }

    const agentToUse = selectedFile
      ? "pdfRag"
      : selectedAgent.toLowerCase() === "auto"
      ? "auto"
      : selectedAgent.toLowerCase();

    const formData = new FormData();
    formData.append("prompt", textToSend);
    if (convId) formData.append("conversationId", convId);
    formData.append("agent", agentToUse);
    if (selectedFile) formData.append("file", selectedFile);

    const userMessageContent = selectedFile
      ? `${textToSend}\n📄 Attached PDF: ${selectedFile.name}`
      : textToSend;

    dispatch(
      addMessage({
        role: "user",
        content: userMessageContent,
        conversationId: convId,
        createdAt: new Date().toISOString(),
      })
    );

    setValue("");
    setSelectedFile(null);
    if (fileRef.current) fileRef.current.value = "";
    if (setInputPrompt) setInputPrompt("");
    if (inputRef.current) inputRef.current.style.height = "auto";
    dispatch(setAiThinking(true));

    try {
      const data = await sendMessage(formData);
      dispatch(setArtifacts(data.artifacts || []));

      if (data?.credits !== undefined && userData) {
        dispatch(setUserData({ ...userData, credits: data.credits }));
      }

      const aiContent =
        data?.answer ||
        data?.aiResponse ||
        data?.content ||
        data?.message ||
        (typeof data === "string" ? data : JSON.stringify(data));

      dispatch(
        addMessage({
          role: "assistant",
          content: aiContent,
          images: data?.images,
          conversationId: convId,
          createdAt: new Date().toISOString(),
        })
      );
      console.log(data);
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.aiResponse ||
        "Sorry, I encountered an issue reaching the agent backend. Please check connection.";
      dispatch(
        addMessage({
          role: "assistant",
          content: errorMessage,
          conversationId: convId,
          isError: true,
        })
      );
    } finally {
      dispatch(setAiThinking(false));
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessageAsync();
    }
  };

  const agents = [
    {
      id: "auto",
      icon: Zap,
      label: "Auto",
      desc: "Auto-detect agent",
    },
    {
      id: "chat",
      icon: MessageSquare,
      label: "Chat",
      desc: "General assistant",
    },
    {
      id: "pdf",
      icon: FileText,
      label: "PDF",
      desc: "Analyze PDF files",
    },
    {
      id: "ppt",
      icon: Presentation,
      label: "PPT",
      desc: "Generate presentations",
    },
    {
      id: "search",
      icon: Globe,
      label: "Search",
      desc: "Live web search",
    },
  ];

  return (
    <div className="border-t border-white/[0.08] bg-[#0d0f14] px-2.5 py-3 sm:p-4 shrink-0 w-full">
      <div className="max-w-3xl mx-auto flex flex-col gap-2 sm:gap-3 w-full">
        {/* Agent Selector Bar */}
        <div className="grid grid-cols-5 gap-1 xs:gap-1.5 sm:flex sm:flex-wrap sm:gap-2 w-full">
          {agents.map((agent) => {
            const isActive = selectedAgent === agent.label;
            const Icon = agent.icon;
            return (
              <button
                key={agent.label}
                type="button"
                title={agent.desc}
                onClick={() => setSelectedAgent(agent.label)}
                className={`
                  flex-1 sm:flex-none
                  inline-flex
                  items-center
                  justify-center
                  gap-1 sm:gap-1.5
                  px-1.5 xs:px-2.5 sm:px-3
                  py-1.5 sm:py-2
                  rounded-full
                  text-[10px] xs:text-[11px] sm:text-xs
                  font-medium
                  transition-all
                  duration-200
                  cursor-pointer
                  select-none
                  min-w-0
                  ${
                    isActive
                      ? "bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 text-white border border-indigo-400/40 shadow-lg shadow-indigo-500/25 scale-[1.02] sm:scale-[1.03] font-semibold"
                      : "bg-[#13151c]/90 text-slate-400 hover:text-slate-100 hover:bg-white/[0.08] border border-white/[0.08]"
                  }
                `}
              >
                <Icon className="w-3 h-3 xs:w-3.5 xs:h-3.5 shrink-0" />
                <span className="truncate">{agent.label}</span>
              </button>
            );
          })}
        </div>

        {/* Selected File Badge */}
        {selectedFile && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-950/60 border border-indigo-500/30 rounded-lg text-xs text-indigo-200 w-fit max-w-full">
            <FileText size={14} className="text-indigo-400 shrink-0" />
            <span className="truncate max-w-[180px] xs:max-w-[240px] sm:max-w-[340px] font-medium">
              {selectedFile.name}
            </span>
            <button
              type="button"
              onClick={handleRemoveFile}
              className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors border-none cursor-pointer bg-transparent shrink-0"
              title="Remove file"
            >
              <X size={13} />
            </button>
          </div>
        )}

        {/* Input Box Wrapper */}
        <div className="flex items-end gap-1.5 sm:gap-2.5 bg-[#13151c] border border-white/[0.1] focus-within:border-indigo-500/50 rounded-xl sm:rounded-2xl p-1.5 sm:p-2.5 transition-all shadow-xl w-full">
          <input
            type="file"
            accept=".pdf"
            hidden
            ref={fileRef}
            onChange={handleFileChange}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={aiThinking}
            title="Upload PDF"
            className={`p-2 sm:p-2.5 rounded-lg sm:rounded-xl transition-all cursor-pointer border-none shrink-0 flex items-center justify-center ${
              selectedFile
                ? "bg-indigo-600/20 text-indigo-400 border border-indigo-500/30"
                : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.08]"
            }`}
          >
            <Paperclip size={18} className="sm:w-5 sm:h-5" />
          </button>
          
          <textarea
            ref={inputRef}
            rows={1}
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              if (setInputPrompt) setInputPrompt(e.target.value);
            }}
            onKeyDown={handleKeyDown}
            placeholder={selectedFile ? "Ask a question about this PDF..." : "Type a message..."}
            disabled={aiThinking}
            className="flex-1 bg-transparent border-none text-slate-100 placeholder-slate-500 text-xs sm:text-sm focus:outline-none resize-none min-h-[36px] sm:min-h-[40px] max-h-40 py-2 sm:py-2.5 px-1 sm:px-2 leading-relaxed"
          />

          <button
            type="button"
            onClick={() => handleSendMessageAsync()}
            disabled={(!value.trim() && !selectedFile) || aiThinking}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-indigo-600 text-white flex items-center justify-center hover:bg-indigo-500 active:scale-95 disabled:opacity-40 disabled:hover:bg-indigo-600 disabled:active:scale-100 transition-all shrink-0 cursor-pointer border-none shadow-md shadow-indigo-600/30"
            title="Send message"
          >
            <Send size={16} className="sm:w-[18px] sm:h-[18px]" />
          </button>
        </div>

        {/* Footer / Shortcut Info */}
        <div className="flex items-center justify-between px-1 sm:px-2 text-[10px] sm:text-[11px] text-slate-500 gap-2">
          <span className="hidden sm:inline">Press Enter to send, Shift+Enter for new line</span>
          <span className="sm:hidden">Tap Send to submit</span>
          <span className="truncate">CortexAI Agent System</span>
        </div>
      </div>
    </div>
  );
}

export default ChatInput;

