import {
  PanelLeftClose,
  PenSquare,
  Plus,
  MessageSquare,
  LogOut,
  Sparkles,
  X,
  User,
  Coins,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  addConversation,
  setConversation,
  setSelectedConversation,
  removeConversation,
} from "../redux/conversationSlice";
import { clearMessages } from "../redux/messageSlice";
import { logoutUser } from "../redux/userSlice";
import { getConversations } from "../features/getConversations";
import { createConversation } from "../features/createConversation";
import { deleteConversationAsync } from "../features/deleteConversation";
import { logout } from "../features/logout";

function SideBar({ isOpen, onClose, toggleSidebar, onOpenBilling }) {
  const dispatch = useDispatch();
  const [imgError, setImgError] = useState(false);
  const { conversations, selectedConversation } = useSelector(
    (state) => state.conversations
  );
  const { userData } = useSelector((state) => state.user);

  useEffect(() => {
    const fetchConvs = async () => {
      const data = await getConversations();
      dispatch(setConversation(data));
    };
    fetchConvs();
  }, [dispatch]);

  const handleCreateConversation = async () => {
    const data = await createConversation();
    if (data) {
      dispatch(addConversation(data));
      dispatch(clearMessages());
    }
    if (window.innerWidth < 1024 && onClose) onClose();
  };

  const handleSelect = (conv) => {
    dispatch(setSelectedConversation(conv));
    dispatch(clearMessages());
    if (window.innerWidth < 1024 && onClose) onClose();
  };

  const handleDeleteConversation = async (e, convId) => {
    e.stopPropagation();
    if (!convId) return;
    dispatch(removeConversation(convId));
    if ((selectedConversation?._id || selectedConversation?.id) === convId) {
      dispatch(clearMessages());
    }
    await deleteConversationAsync(convId);
  };

  const handleLogout = async () => {
    await logout();
    dispatch(logoutUser());
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50
        h-screen shrink-0 flex flex-col
        bg-[#0d0f14] border-r border-white/[0.08]
        transition-all duration-200 ease-in-out
        ${
          isOpen
            ? "translate-x-0 w-[280px]"
            : "-translate-x-full lg:-translate-x-full w-[280px] lg:w-0 lg:border-r-0 overflow-hidden"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="text-[16px] font-bold text-slate-100 tracking-tight">
              CortexAI
            </span>
            <span className="text-[10px] font-semibold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full tracking-wide uppercase">
              {userData?.plan || "Free"}
            </span>
          </div>

          <div className="flex items-center gap-1">
            {/* Desktop collapse toggle */}
            <button
              type="button"
              className="hidden lg:flex items-center justify-center w-7 h-7 rounded-lg text-slate-400
              hover:text-slate-200 hover:bg-white/[0.06] transition-colors duration-150 bg-transparent border-none cursor-pointer"
              onClick={toggleSidebar}
              title="Close Sidebar"
            >
              <PanelLeftClose size={18} />
            </button>

            {/* Mobile close button */}
            <button
              type="button"
              className="lg:hidden flex items-center justify-center w-7 h-7 rounded-lg text-slate-400
              hover:text-slate-200 hover:bg-white/[0.06] transition-colors duration-150 bg-transparent border-none cursor-pointer"
              onClick={onClose}
              title="Close Menu"
            >
              <X size={18} />
            </button>

            <button
              type="button"
              className="flex items-center justify-center w-7 h-7 rounded-lg text-slate-400
              hover:text-slate-200 hover:bg-white/[0.06] transition-colors duration-150 bg-transparent border-none cursor-pointer"
              onClick={handleCreateConversation}
              title="New Chat"
            >
              <PenSquare size={16} />
            </button>
          </div>
        </div>

        {/* Action Button */}
        <div className="px-3.5 pt-4 pb-2">
          <button
            type="button"
            className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-white
            bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 rounded-xl py-2.5 border border-indigo-400/20 cursor-pointer
            hover:opacity-95 hover:shadow-lg hover:shadow-indigo-500/20 transition-all duration-150"
            onClick={handleCreateConversation}
          >
            <Plus size={18} />
            New Conversation
          </button>
        </div>

        {/* Recent list title */}
        <div className="px-5 pt-3 pb-1.5 text-[10.5px] font-semibold uppercase tracking-widest text-slate-500">
          {conversations.length === 0 ? "No Conversations" : "Recent Chats"}
        </div>

        {/* Conversation Items */}
        <div className="flex-1 overflow-y-auto px-2.5 pb-2 space-y-0.5">
          {conversations.map((conv, i) => {
            const convId = conv?._id || conv?.id;
            const selectedId = selectedConversation?._id || selectedConversation?.id;
            const isActive = selectedId === convId;

            return (
              <div key={convId ?? i} className="group/item relative flex items-center w-full">
                <button
                  type="button"
                  onClick={() => handleSelect(conv)}
                  className={`w-full text-left flex items-center gap-2.5 px-3 py-2.5 rounded-xl border transition-all duration-150 cursor-pointer pr-9
                  ${
                    isActive
                      ? "bg-indigo-500/10 border-indigo-500/20 text-slate-100 shadow-sm"
                      : "bg-transparent border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]"
                  }`}
                >
                  <div
                    className={`flex items-center justify-center shrink-0 w-7 h-7 rounded-lg transition-colors duration-150 
                    ${isActive ? "bg-indigo-500/20 text-indigo-400" : "bg-white/[0.04] text-slate-400"}`}
                  >
                    <MessageSquare size={14} />
                  </div>
                  <span className="text-[13px] font-medium truncate flex-1">
                    {conv?.title || `Conversation ${conversations.length - i}`}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={(e) => handleDeleteConversation(e, convId)}
                  className="absolute right-2 p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 opacity-0 group-hover/item:opacity-100 transition-all cursor-pointer border-none bg-transparent"
                  title="Delete Conversation"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })}
        </div>

        {/* User Footer */}
        {userData && (
          <div className="p-3 border-t border-white/[0.08] bg-[#090b0e]">
            <div className="flex items-center justify-between p-2 rounded-xl bg-white/[0.03] border border-white/[0.04]">
              <div className="flex items-center gap-2.5 overflow-hidden flex-1 min-w-0">
                {(userData.picture || userData.avatar) && !imgError ? (
                  <img
                    src={userData.picture || userData.avatar}
                    alt="User Avatar"
                    onError={() => setImgError(true)}
                    className="w-8 h-8 rounded-lg object-cover border border-indigo-500/30 shrink-0"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300 shrink-0">
                    <User size={16} />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-[13.5px] font-semibold text-slate-100 truncate">
                    {userData?.name || userData?.displayName || "User"}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-px capitalize truncate">
                    {userData?.plan ? `${userData.plan} Plan` : "Free Plan"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={onOpenBilling}
                  className="flex items-center justify-center w-7 h-7 rounded-[7px] border-none bg-transparent text-yellow-500 cursor-pointer hover:bg-white/[0.08] hover:text-yellow-400 transition-all duration-150"
                  title="Coins & Credits"
                >
                  <Coins size={16} />
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex items-center justify-center w-7 h-7 rounded-[7px] border-none bg-transparent text-slate-400 cursor-pointer hover:bg-white/[0.08] hover:text-rose-400 transition-all duration-150"
                  title="Sign Out"
                >
                  <LogOut size={16} />
                </button>
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}

export default SideBar;
