import React, { useState } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Check, Copy, ExternalLink, X, Bot, User, AlertCircle, ThumbsUp, ThumbsDown, RotateCcw } from 'lucide-react';

function MessageBubble({ role, content, images, isError, userPicture, onRegenerate }) {
  const isUser = role === 'user';
  const [lightBox, setLightBox] = useState(null);
  const [copiedCode, setCopiedCode] = useState('');
  const [copiedMessage, setCopiedMessage] = useState(false);
  const [liked, setLiked] = useState(null);

  const copyCode = async (code) => {
    await navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => {
      setCopiedCode('');
    }, 2000);
  };

  const copyMessageText = async () => {
    if (!content) return;
    await navigator.clipboard.writeText(content);
    setCopiedMessage(true);
    setTimeout(() => {
      setCopiedMessage(false);
    }, 2000);
  };

  if (isUser) {
    return (
      <div className="flex justify-end gap-2.5 sm:gap-3 w-full my-4">
        <div className="flex flex-col items-end max-w-[88%] sm:max-w-[78%] min-w-0">
          {/* Images preview if any */}
          {images && images.length > 0 && (
            <div className="flex flex-wrap justify-end gap-2 mb-2">
              {images.map((img, index) => {
                const imgUrl = typeof img === 'string' ? img : img?.url || img?.src;
                if (!imgUrl) return null;
                return (
                  <img
                    key={index}
                    src={imgUrl}
                    alt="attachment"
                    onClick={() => setLightBox(imgUrl)}
                    loading="lazy"
                    onError={(e) => e.currentTarget.remove()}
                    className="w-36 h-24 sm:w-44 sm:h-28 rounded-xl object-cover border border-white/10 cursor-zoom-in hover:opacity-90 transition shadow-md"
                  />
                );
              })}
            </div>
          )}

          {/* ChatGPT User Message Pill */}
          <div className="bg-[#2f2f38] text-slate-100 px-4 py-3 rounded-2xl rounded-tr-sm text-xs sm:text-sm leading-relaxed break-words whitespace-pre-wrap shadow-sm">
            {content}
          </div>
        </div>

        {/* User Avatar */}
        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-700 border border-white/10 flex items-center justify-center text-slate-300 shrink-0 mt-0.5 shadow-sm">
          {userPicture ? (
            <img src={userPicture} alt="user" className="w-full h-full rounded-full object-cover" />
          ) : (
            <User size={15} />
          )}
        </div>
      </div>
    );
  }

  // Assistant (AI) Message ChatGPT Layout
  return (
    <div className="flex gap-3 sm:gap-4 w-full my-5 group">
      {/* ChatGPT Assistant Avatar */}
      <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-white shrink-0 mt-1 shadow-md ${
        isError ? 'bg-rose-600' : 'bg-gradient-to-tr from-indigo-600 to-violet-600'
      }`}>
        {isError ? <AlertCircle size={16} /> : <Bot size={16} />}
      </div>

      <div className="flex-1 min-w-0 text-slate-200 leading-relaxed">
        {/* Render Attached Images */}
        {images && images.length > 0 && (
          <div className="flex flex-wrap gap-3 mb-3">
            {images.map((img, index) => {
              const imgUrl = typeof img === 'string' ? img : img?.url || img?.src;
              if (!imgUrl) return null;
              return (
                <img
                  key={index}
                  src={imgUrl}
                  alt="AI output"
                  onClick={() => setLightBox(imgUrl)}
                  loading="lazy"
                  onError={(e) => e.currentTarget.remove()}
                  className="max-w-xs sm:max-w-md max-h-64 rounded-xl object-contain border border-white/10 cursor-zoom-in hover:opacity-95 transition shadow-lg bg-[#161822]"
                />
              );
            })}
          </div>
        )}

        {/* Markdown Content */}
        <div className={`prose prose-invert max-w-none text-xs sm:text-sm text-slate-200 leading-7 ${isError ? 'text-rose-300' : ''}`}>
          <Markdown
            remarkPlugins={[remarkGfm]}
            components={{
              h1: ({ children }) => (
                <h1 className="text-xl sm:text-2xl font-bold text-slate-100 mt-5 mb-3 border-b border-white/10 pb-2">{children}</h1>
              ),
              h2: ({ children }) => (
                <h2 className="text-lg sm:text-xl font-semibold text-slate-100 mt-4 mb-2">{children}</h2>
              ),
              h3: ({ children }) => (
                <h3 className="text-base sm:text-lg font-semibold text-slate-200 mt-3 mb-2">{children}</h3>
              ),
              p: ({ children }) => (
                <p className="mb-3 leading-7 whitespace-pre-wrap break-words">{children}</p>
              ),
              ul: ({ children }) => (
                <ul className="list-disc pl-6 space-y-1.5 my-3 text-slate-200 leading-7">{children}</ul>
              ),
              ol: ({ children }) => (
                <ol className="list-decimal pl-6 space-y-1.5 my-3 text-slate-200 leading-7">{children}</ol>
              ),
              li: ({ children }) => (
                <li className="leading-7">{children}</li>
              ),
              blockquote: ({ children }) => (
                <blockquote className="border-l-4 border-indigo-500/80 bg-indigo-500/[0.05] pl-4 py-2 my-3 rounded-r-lg text-slate-300 italic">
                  {children}
                </blockquote>
              ),
              table: ({ children }) => (
                <div className="overflow-x-auto my-4 w-full rounded-xl border border-white/10 bg-[#141620]">
                  <table className="min-w-full divide-y divide-white/10 text-xs sm:text-sm text-left">
                    {children}
                  </table>
                </div>
              ),
              th: ({ children }) => (
                <th className="bg-white/5 px-4 py-2.5 font-semibold text-slate-200 border-b border-white/10">
                  {children}
                </th>
              ),
              td: ({ children }) => (
                <td className="px-4 py-2.5 border-b border-white/[0.05] text-slate-300">{children}</td>
              ),
              a: ({ href, children }) => (
                <a
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  className="text-indigo-400 hover:text-indigo-300 underline underline-offset-4 decoration-indigo-400/50 inline-flex items-center gap-1 font-medium transition-colors"
                >
                  {children}
                  <ExternalLink size={13} />
                </a>
              ),
              code: ({ className, children }) => {
                const value = String(children).replace(/\n$/, '');

                if (!className) {
                  return (
                    <code className="px-1.5 py-0.5 rounded-md bg-white/[0.08] text-slate-200 font-mono text-xs sm:text-sm font-normal no-underline border-none">
                      {value}
                    </code>
                  );
                }

                const language = className.replace('language-', '');

                return (
                  <div className="my-4 overflow-hidden rounded-xl border border-white/[0.08] bg-[#0d0d0d] w-full min-w-0 no-underline shadow-none">
                    <div className="flex items-center justify-between bg-[#161616] border-b border-white/[0.08] px-4 py-2 text-xs text-slate-400 font-mono">
                      <span className="uppercase text-xs font-semibold tracking-wider text-slate-300">
                        {language || 'code'}
                      </span>
                      <button
                        type="button"
                        className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors bg-transparent border-none cursor-pointer px-2 py-1 rounded hover:bg-white/10"
                        onClick={() => copyCode(value)}
                      >
                        {copiedCode === value ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400 font-medium">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy code</span>
                          </>
                        )}
                      </button>
                    </div>
                    <div className="w-full min-w-0 overflow-x-auto text-xs sm:text-sm bg-[#0d0d0d] no-underline">
                      <SyntaxHighlighter
                        style={oneDark}
                        language={language || 'text'}
                        PreTag="div"
                        wrapLongLines={true}
                        codeTagProps={{ style: { textDecoration: 'none', background: 'transparent' } }}
                        customStyle={{
                          margin: 0,
                          padding: '1.25rem 1rem',
                          background: '#0d0d0d',
                          fontSize: '0.85rem',
                          lineHeight: '1.6',
                          textDecoration: 'none',
                        }}
                      >
                        {value}
                      </SyntaxHighlighter>
                    </div>
                  </div>
                );
              },
            }}
          >
            {content}
          </Markdown>
        </div>

        {/* ChatGPT Style Action Bar */}
        {!isError && (
          <div className="flex items-center gap-1 mt-3 opacity-80 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={copyMessageText}
              title="Copy message"
              className="p-1.5 rounded-lg hover:bg-white/[0.08] text-slate-400 hover:text-slate-200 transition-colors border-none bg-transparent cursor-pointer flex items-center gap-1.5 text-xs"
            >
              {copiedMessage ? (
                <>
                  <Check size={14} className="text-emerald-400" />
                  <span className="text-emerald-400 font-medium">Copied</span>
                </>
              ) : (
                <Copy size={14} />
              )}
            </button>

            <button
              type="button"
              onClick={() => setLiked(liked === 'up' ? null : 'up')}
              title="Good response"
              className={`p-1.5 rounded-lg hover:bg-white/[0.08] transition-colors border-none bg-transparent cursor-pointer ${
                liked === 'up' ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ThumbsUp size={14} />
            </button>

            <button
              type="button"
              onClick={() => setLiked(liked === 'down' ? null : 'down')}
              title="Bad response"
              className={`p-1.5 rounded-lg hover:bg-white/[0.08] transition-colors border-none bg-transparent cursor-pointer ${
                liked === 'down' ? 'text-rose-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ThumbsDown size={14} />
            </button>

            {onRegenerate && (
              <button
                type="button"
                onClick={onRegenerate}
                title="Regenerate response"
                className="p-1.5 rounded-lg hover:bg-white/[0.08] text-slate-400 hover:text-slate-200 transition-colors border-none bg-transparent cursor-pointer"
              >
                <RotateCcw size={14} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      {lightBox && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setLightBox(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setLightBox(null)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300 p-2 border-none bg-transparent cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={lightBox}
              alt="Preview"
              className="max-w-full max-h-[85vh] object-contain rounded-lg"
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default MessageBubble;
