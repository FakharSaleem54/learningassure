"use client";

import { useState } from "react";
import { ArrowUp, ArrowDown } from "lucide-react";
import { voteThread, voteReply } from "@/app/actions/forum";

interface VoteButtonsProps {
    itemId: string;
    itemType: 'thread' | 'reply';
    currentVotes: number;
    userVote?: number; // 1, -1, or undefined
}

export default function VoteButtons({ itemId, itemType, currentVotes, userVote }: VoteButtonsProps) {
    const [votes, setVotes] = useState(currentVotes);
    const [myVote, setMyVote] = useState(userVote || 0);
    const [isLoading, setIsLoading] = useState(false);

    const handleVote = async (value: number) => {
        if (isLoading) return;
        setIsLoading(true);

        const action = itemType === 'thread' ? voteThread : voteReply;
        const result = await action(itemId, value);

        if (result.success) {
            if (myVote === value) {
                // Removing vote
                setVotes(votes - value);
                setMyVote(0);
            } else if (myVote === 0) {
                // New vote
                setVotes(votes + value);
                setMyVote(value);
            } else {
                // Changing vote
                setVotes(votes + value * 2);
                setMyVote(value);
            }
        }

        setIsLoading(false);
    };

    return (
        <div className="flex flex-col items-center gap-1">
            <button
                onClick={() => handleVote(1)}
                disabled={isLoading}
                className={`p-2 rounded-lg transition-all ${myVote === 1
                        ? 'text-primary bg-blue-50'
                        : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'
                    } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                title="Upvote"
            >
                <ArrowUp size={24} strokeWidth={myVote === 1 ? 3 : 2} />
            </button>
            <span className={`font-bold text-xl ${votes > 0 ? 'text-green-600' : votes < 0 ? 'text-red-500' : 'text-gray-500'
                }`}>
                {votes}
            </span>
            <button
                onClick={() => handleVote(-1)}
                disabled={isLoading}
                className={`p-2 rounded-lg transition-all ${myVote === -1
                        ? 'text-red-500 bg-red-50'
                        : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'
                    } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                title="Downvote"
            >
                <ArrowDown size={24} strokeWidth={myVote === -1 ? 3 : 2} />
            </button>
        </div>
    );
}
