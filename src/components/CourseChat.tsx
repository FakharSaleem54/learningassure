'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, Loader2, X, User } from 'lucide-react';

interface Message {
    id: string;
    sender: 'ai' | 'student';
    text: string;
    isStreaming?: boolean;
}

export default function CourseChat({ courseId, activeLessonTitle, activeLessonId }: { courseId: string, activeLessonTitle?: string, activeLessonId?: string }) {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { id: 'welcome', sender: 'ai', text: 'Hello! I can answer questions based on this course\'s content. What would you like to know?' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const scrollRef = useRef<HTMLDivElement>(null);
    const bubbleRef = useRef<HTMLDivElement>(null);
    const hasDraggedRef = useRef(false);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: 'smooth' });
        }
        if (isOpen) {
            setUnreadCount(0);
        }
    }, [messages, isOpen]);

    // Classic drag implementation
    useEffect(() => {
        const elmnt = bubbleRef.current;
        if (!elmnt || isOpen) return;

        let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

        function dragMouseDown(e: MouseEvent) {
            e.preventDefault();
            hasDraggedRef.current = false;
            pos3 = e.clientX;
            pos4 = e.clientY;
            document.onmouseup = closeDragElement;
            document.onmousemove = elementDrag;
        }

        function elementDrag(e: MouseEvent) {
            e.preventDefault();
            pos1 = pos3 - e.clientX;
            pos2 = pos4 - e.clientY;
            pos3 = e.clientX;
            pos4 = e.clientY;

            if (Math.abs(pos1) > 3 || Math.abs(pos2) > 3) {
                hasDraggedRef.current = true;
            }

            let newTop = elmnt!.offsetTop - pos2;
            let newLeft = elmnt!.offsetLeft - pos1;

            newTop = Math.max(10, Math.min(window.innerHeight - 80, newTop));
            newLeft = Math.max(10, Math.min(window.innerWidth - 80, newLeft));

            elmnt!.style.top = newTop + "px";
            elmnt!.style.left = newLeft + "px";
            elmnt!.style.right = "auto";
            elmnt!.style.bottom = "auto";
        }

        function closeDragElement() {
            document.onmouseup = null;
            document.onmousemove = null;
        }

        elmnt.onmousedown = dragMouseDown;

        return () => {
            elmnt.onmousedown = null;
            document.onmouseup = null;
            document.onmousemove = null;
        };
    }, [isOpen]);

    const handleBubbleClick = () => {
        if (!hasDraggedRef.current) {
            setIsOpen(true);
        }
        hasDraggedRef.current = false;
    };

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;
        console.log('Sending message:', input);

        const userMsg: Message = { id: Date.now().toString(), sender: 'student', text: input };
        const aiMsgId = (Date.now() + 1).toString();

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        // Add placeholder for streaming AI message
        setMessages(prev => [...prev, { id: aiMsgId, sender: 'ai', text: '', isStreaming: true }]);

        try {
            const res = await fetch('/api/course-chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    question: userMsg.text,
                    courseId,
                    currentLectureTitle: activeLessonTitle,
                    currentLectureId: activeLessonId,
                    stream: true
                }),
            });

            if (!res.ok || !res.body) {
                throw new Error('Failed to get response');
            }

            const reader = res.body.getReader();
            const decoder = new TextDecoder();

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split('\n').filter(line => line.startsWith('data: '));

                for (const line of lines) {
                    const data = line.slice(6); // Remove 'data: ' prefix
                    try {
                        const parsed = JSON.parse(data);

                        if (parsed.token) {
                            // Append token to AI message
                            setMessages(prev => prev.map(msg =>
                                msg.id === aiMsgId
                                    ? { ...msg, text: msg.text + parsed.token }
                                    : msg
                            ));
                        }

                        if (parsed.done) {
                            // Streaming complete
                            setMessages(prev => prev.map(msg =>
                                msg.id === aiMsgId
                                    ? { ...msg, isStreaming: false }
                                    : msg
                            ));
                            if (!isOpen) setUnreadCount(c => c + 1);
                        }

                        if (parsed.error) {
                            setMessages(prev => prev.map(msg =>
                                msg.id === aiMsgId
                                    ? { ...msg, text: 'Sorry, I encountered an error.', isStreaming: false }
                                    : msg
                            ));
                        }

                        // Handle non-streaming response (greeting, etc)
                        if (parsed.answer) {
                            setMessages(prev => prev.map(msg =>
                                msg.id === aiMsgId
                                    ? { ...msg, text: parsed.answer, isStreaming: false }
                                    : msg
                            ));
                            if (!isOpen) setUnreadCount(c => c + 1);
                        }
                    } catch (e) {
                        // Skip malformed JSON
                    }
                }
            }

        } catch (error) {
            console.error(error);
            setMessages(prev => prev.map(msg =>
                msg.id === aiMsgId
                    ? { ...msg, text: "Sorry, I couldn't reach the server.", isStreaming: false }
                    : msg
            ));
        } finally {
            setIsLoading(false);
        }
    };

    // Bubble (collapsed) view
    if (!isOpen) {
        return (
            <div
                ref={bubbleRef}
                onClick={handleBubbleClick}
                style={{
                    position: 'fixed',
                    bottom: '100px',
                    left: '30px',
                    zIndex: 9999
                }}
                className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-full shadow-2xl hover:shadow-blue-500/50 transition-shadow hover:scale-105 flex items-center justify-center select-none cursor-grab active:cursor-grabbing animate-pulse-slow"
                role="button"
                aria-label="Open AI Course Assistant"
            >
                <span className="absolute inset-0 rounded-full bg-blue-400 chat-ping-ring pointer-events-none -z-0"></span>
                <Bot className="w-8 h-8 pointer-events-none relative z-10" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white animate-bounce pointer-events-none z-20">
                        {unreadCount}
                    </span>
                )}
            </div>
        );
    }

    // Expanded chat panel - Fixed size: 320x400px - NO GROWTH
    return (
        <div
            style={{
                position: 'fixed',
                bottom: '100px',
                left: '30px',
                zIndex: 9999,
                width: '320px',
                height: '400px',
                maxHeight: '400px',
                overflow: 'hidden'
            }}
            className="flex flex-col border rounded-xl bg-white shadow-2xl animate-in slide-in-from-bottom-5 fade-in duration-200"
        >
            {/* Header - Fixed height */}
            <div className="p-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-xl flex items-center justify-between shadow-sm" style={{ flexShrink: 0 }}>
                <div className="flex items-center gap-2 font-semibold text-sm">
                    <Bot className="w-5 h-5" />
                    <span>AI Course Assistant</span>
                </div>
                <button
                    onClick={() => setIsOpen(false)}
                    className="hover:bg-white/20 p-1 rounded-full transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            {/* Chat Body - Scrollable with visible scrollbar */}
            <div
                className="p-3 space-y-2 bg-gray-50 chat-scrollbar"
                style={{
                    flex: 1,
                    overflowY: 'scroll',
                    minHeight: 0
                }}
            >
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex items-end gap-1.5 ${msg.sender === 'student' ? 'justify-end' : 'justify-start'}`}>
                        {/* AI Avatar */}
                        {msg.sender === 'ai' && (
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
                                <Bot className="w-3 h-3 text-white" />
                            </div>
                        )}

                        <div className={`max-w-[85%] p-2 rounded-xl text-xs shadow-sm ${msg.sender === 'student'
                            ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-br-none'
                            : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'
                            }`}>
                            {msg.text}
                            {/* Typing cursor while streaming */}
                            {msg.isStreaming && (
                                <span className="inline-block w-1.5 h-3 bg-blue-500 ml-0.5 animate-pulse rounded-sm"></span>
                            )}
                        </div>

                        {/* User Avatar */}
                        {msg.sender === 'student' && (
                            <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0">
                                <User className="w-3 h-3 text-gray-600" />
                            </div>
                        )}
                    </div>
                ))}
                <div ref={scrollRef} />
            </div>

            {/* Input Area */}
            <div className="p-2 border-t bg-white rounded-b-xl flex gap-2 flex-shrink-0">
                <input
                    className="flex-1 border border-gray-200 rounded-full px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ask about this lecture..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                    disabled={isLoading}
                />
                <button
                    type="button"
                    onClick={handleSend}
                    disabled={isLoading || !input.trim()}
                    className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-2 rounded-full hover:shadow-lg disabled:opacity-50 transition-all hover:scale-105"
                >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
            </div>
        </div>
    );
}
