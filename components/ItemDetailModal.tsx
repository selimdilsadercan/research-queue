"use client";

import { useEffect, useState } from "react";
import { Loader2, RefreshCw, Copy, Check } from "lucide-react";

interface ResearchItem {
  id: string;
  type: "instagram" | "youtube" | "website" | "article" | "other";
  title: string;
  url: string;
  description: string;
  createdAt: Date;
  boardIds: string[];
  favicon?: string;
  image?: string;
}

interface Board {
  id: string;
  name: string;
  description: string;
  items: ResearchItem[];
  createdAt: Date;
}

interface ItemDetailModalProps {
  item: ResearchItem | null;
  isOpen: boolean;
  onClose: () => void;
  boards: Board[];
  isLoading: boolean;
  editingItemBoards: boolean;
  onRefetch: (item: ResearchItem) => void;
  onDelete: (itemId: string) => void;
  onUpdateBoards: (itemId: string, newBoardIds: string[]) => void;
  onToggleEditBoards: () => void;
  getTypeIcon: (type: ResearchItem["type"]) => React.ReactNode;
  getTypeColor: (type: ResearchItem["type"]) => string;
  formatDate: (date: Date) => string;
  getBoardNames: (boardIds: string[]) => string;
}

export default function ItemDetailModal({
  item,
  isOpen,
  onClose,
  boards,
  isLoading,
  editingItemBoards,
  onRefetch,
  onDelete,
  onUpdateBoards,
  onToggleEditBoards,
  getTypeIcon,
  getTypeColor,
  formatDate,
  getBoardNames,
}: ItemDetailModalProps) {
  // Handle ESC key to close modal
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscKey);
    }

    return () => {
      document.removeEventListener("keydown", handleEscKey);
    };
  }, [isOpen, onClose]);

  const [copied, setCopied] = useState(false);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  // Handle click outside to close modal
  const handleBackdropClick = (event: React.MouseEvent) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  if (!isOpen || !item) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(255, 255, 255, 0.32)" }}
      onClick={handleBackdropClick}
    >
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              {item.favicon ? (
                <img
                  src={item.favicon}
                  alt="Favicon"
                  className="w-12 h-12 rounded-lg"
                />
              ) : (
                <div
                  className={`p-3 rounded-lg text-white ${getTypeColor(
                    item.type
                  )}`}
                >
                  {getTypeIcon(item.type)}
                </div>
              )}
              <div>
                <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200">
                  {item.title}
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {getBoardNames(item.boardIds)} • {formatDate(item.createdAt)}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Image Preview */}
          {item.image && (
            <div>
              <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Preview Image
              </h3>
              <div className="aspect-video bg-slate-100 dark:bg-slate-700 rounded-lg overflow-hidden">
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              </div>
            </div>
          )}

          {/* URL Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">
                URL
              </h3>
              <button
                onClick={() => copyToClipboard(item.url)}
                className="flex items-center gap-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-xs px-2 py-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-3 h-3" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    Copy
                  </>
                )}
              </button>
            </div>
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-blue-600 dark:text-blue-400 hover:underline break-all text-sm bg-slate-50 dark:bg-slate-700 p-3 rounded-lg"
            >
              {item.url}
            </a>
          </div>

          {/* Description Section */}
          {item.description && (
            <div>
              <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Description
              </h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm bg-slate-50 dark:bg-slate-700 p-3 rounded-lg">
                {item.description}
              </p>
            </div>
          )}

          {/* Details Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Content Type
              </h3>
              <div className="flex items-center gap-2">
                <div
                  className={`p-2 rounded-lg text-white ${getTypeColor(
                    item.type
                  )}`}
                >
                  {getTypeIcon(item.type)}
                </div>
                <span className="text-sm text-slate-600 dark:text-slate-400 capitalize">
                  {item.type}
                </span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Boards
                </h3>
                <button
                  onClick={onToggleEditBoards}
                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-xs"
                >
                  {editingItemBoards ? "Cancel" : "Edit"}
                </button>
              </div>
              {editingItemBoards ? (
                <div className="space-y-2">
                  {boards.map((board) => (
                    <label key={board.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={item.boardIds.includes(board.id)}
                        onChange={(e) => {
                          const newBoardIds = e.target.checked
                            ? [...item.boardIds, board.id]
                            : item.boardIds.filter((id) => id !== board.id);
                          onUpdateBoards(item.id, newBoardIds);
                        }}
                        className="rounded border-slate-300 dark:border-slate-600"
                      />
                      <span className="text-sm text-slate-600 dark:text-slate-400">
                        {board.name}
                      </span>
                    </label>
                  ))}
                </div>
              ) : (
                <div className="flex flex-wrap gap-1">
                  {item.boardIds.map((boardId) => {
                    const board = boards.find((b) => b.id === boardId);
                    return board ? (
                      <span
                        key={boardId}
                        className="inline-block bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-1 rounded text-xs"
                      >
                        {board.name}
                      </span>
                    ) : null;
                  })}
                </div>
              )}
            </div>

            <div>
              <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Added
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {formatDate(item.createdAt)}
              </p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Item ID
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 font-mono">
                {item.id}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium transition-colors text-center"
            >
              Open Link
            </a>
            <button
              onClick={(e) => {
                e.stopPropagation();
                console.log("Refetch button clicked for item:", item);
                onRefetch(item);
              }}
              disabled={isLoading}
              className="px-4 py-3 border border-slate-300 text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-700 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Refetching...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  Refetch
                </>
              )}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(item.id);
                onClose();
              }}
              className="px-4 py-3 border border-red-300 text-red-600 hover:bg-red-50 dark:border-red-600 dark:text-red-400 dark:hover:bg-red-900/20 rounded-lg font-medium transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
