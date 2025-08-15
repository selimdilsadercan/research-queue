"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  Filter,
  Search,
  Globe,
  FileText,
  Instagram,
  Youtube,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import ItemDetailModal from "../components/ItemDetailModal";
import { fetchWebsiteMetadata } from "@/lib/actions";

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

// Helper functions for localStorage
const saveBoardsToStorage = (boards: Board[]) => {
  try {
    localStorage.setItem("research-boards", JSON.stringify(boards));
  } catch (error) {
    console.error("Error saving boards to localStorage:", error);
  }
};

const loadBoardsFromStorage = (): Board[] => {
  try {
    const stored = localStorage.getItem("research-boards");
    if (stored) {
      const boards = JSON.parse(stored);
      // Convert string dates back to Date objects
      return boards.map((board: any) => ({
        ...board,
        createdAt: new Date(board.createdAt),
        items: board.items.map((item: any) => ({
          ...item,
          createdAt: new Date(item.createdAt),
        })),
      }));
    }
  } catch (error) {
    console.error("Error loading boards from localStorage:", error);
  }
  return [];
};

export default function ResearchQueue() {
  const [boards, setBoards] = useState<Board[]>([]);
  const [showCreateBoard, setShowCreateBoard] = useState(false);
  const [showAddItem, setShowAddItem] = useState(false);
  const [editingBoard, setEditingBoard] = useState<string | null>(null);
  const [selectedBoardFilter, setSelectedBoardFilter] = useState<string | null>(
    null
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [newBoard, setNewBoard] = useState({ name: "", description: "" });
  const [newItem, setNewItem] = useState({ url: "", boardIds: [] as string[] });
  const [selectedItem, setSelectedItem] = useState<ResearchItem | null>(null);
  const [showItemDetail, setShowItemDetail] = useState(false);
  const [editingItemBoards, setEditingItemBoards] = useState(false);

  // Load boards from localStorage on component mount
  useEffect(() => {
    const loadedBoards = loadBoardsFromStorage();
    setBoards(loadedBoards);
  }, []);

  // Save boards to localStorage whenever boards state changes
  useEffect(() => {
    if (boards.length > 0) {
      saveBoardsToStorage(boards);
    }
  }, [boards]);

  // Get all items from all boards
  const getAllItems = (): ResearchItem[] => {
    return boards.flatMap((board) =>
      board.items.map((item) => ({
        ...item,
        boardIds: [board.id],
      }))
    );
  };

  // Filter items based on selected board and search query
  const getFilteredItems = (): ResearchItem[] => {
    let items = getAllItems();

    if (selectedBoardFilter) {
      items = items.filter((item) =>
        item.boardIds.includes(selectedBoardFilter)
      );
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      items = items.filter(
        (item) =>
          item.title.toLowerCase().includes(query) ||
          item.description.toLowerCase().includes(query) ||
          item.url.toLowerCase().includes(query)
      );
    }

    return items.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  };

  const createBoard = () => {
    if (!newBoard.name.trim()) return;

    const board: Board = {
      id: uuidv4(),
      name: newBoard.name,
      description: newBoard.description,
      items: [],
      createdAt: new Date(),
    };

    setBoards([...boards, board]);
    setNewBoard({ name: "", description: "" });
    setShowCreateBoard(false);
  };

  const deleteBoard = (boardId: string) => {
    if (
      confirm("Are you sure you want to delete this board and all its items?")
    ) {
      setBoards(boards.filter((board) => board.id !== boardId));
      if (selectedBoardFilter === boardId) {
        setSelectedBoardFilter(null);
      }
    }
  };

  const updateBoard = (boardId: string, updates: Partial<Board>) => {
    setBoards(
      boards.map((board) =>
        board.id === boardId ? { ...board, ...updates } : board
      )
    );
    setEditingBoard(null);
  };

  const addItem = async () => {
    if (!newItem.url.trim() || newItem.boardIds.length === 0) return;

    setIsLoading(true);

    try {
      // Validate URL
      const url = new URL(newItem.url);

      // Fetch metadata from API
      const metadata = await fetchWebsiteMetadata(newItem.url);

      const item: ResearchItem = {
        id: uuidv4(),
        type: (metadata.type as ResearchItem["type"]) || "website",
        title: metadata.title,
        url: newItem.url,
        description: metadata.description,
        createdAt: new Date(),
        boardIds: newItem.boardIds,
        favicon: metadata.favicon,
        image: metadata.image || "",
      };

      // Add item to all selected boards
      const updatedBoards = boards.map((b) =>
        newItem.boardIds.includes(b.id)
          ? { ...b, items: [...b.items, item] }
          : b
      );

      setBoards(updatedBoards);
      setNewItem({ url: "", boardIds: [] });
      setShowAddItem(false);
    } catch (error) {
      console.error("Error adding item:", error);
      alert(
        "Invalid URL. Please enter a valid URL starting with http:// or https://"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const deleteItem = (itemId: string) => {
    if (confirm("Are you sure you want to delete this item?")) {
      const updatedBoards = boards.map((board) => ({
        ...board,
        items: board.items.filter((item) => item.id !== itemId),
      }));
      setBoards(updatedBoards);
    }
  };

  const openItemDetail = (item: ResearchItem) => {
    setSelectedItem(item);
    setShowItemDetail(true);
  };

  const closeItemDetail = () => {
    setSelectedItem(null);
    setShowItemDetail(false);
    setEditingItemBoards(false);
  };

  const updateItemBoards = (itemId: string, newBoardIds: string[]) => {
    const updatedBoards = boards.map((board) => ({
      ...board,
      items: board.items.map((item) =>
        item.id === itemId ? { ...item, boardIds: newBoardIds } : item
      ),
    }));
    setBoards(updatedBoards);

    // Update the selected item in the popup
    if (selectedItem && selectedItem.id === itemId) {
      setSelectedItem({ ...selectedItem, boardIds: newBoardIds });
    }

    setEditingItemBoards(false);
  };

  const refetchItemMetadata = async (item: ResearchItem) => {
    console.log("=== REFETCH FUNCTION CALLED ===");
    console.log("Refetching metadata for item:", item);
    setIsLoading(true);

    try {
      console.log("Fetching metadata from API");
      const metadata = await fetchWebsiteMetadata(item.url);
      console.log("Fetched metadata:", metadata);

      const updatedItem: ResearchItem = {
        ...item,
        type: (metadata.type as ResearchItem["type"]) || item.type,
        title: metadata.title,
        description: metadata.description,
        favicon: metadata.favicon,
        image: metadata.image || "",
      };

      console.log("Updated item:", updatedItem);

      // Update the item in the boards
      const updatedBoards = boards.map((board) => ({
        ...board,
        items: board.items.map((boardItem) =>
          boardItem.id === item.id ? updatedItem : boardItem
        ),
      }));

      console.log("Updated boards:", updatedBoards);
      setBoards(updatedBoards);

      // Update the selected item in the popup
      setSelectedItem(updatedItem);
      console.log("Refetch completed successfully");
    } catch (error) {
      console.error("Error refetching metadata:", error);
      alert("Failed to refetch metadata. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const getTypeIcon = (type: ResearchItem["type"]) => {
    switch (type) {
      case "instagram":
        return <Instagram className="w-4 h-4" />;
      case "youtube":
        return <Youtube className="w-4 h-4" />;
      case "website":
        return <Globe className="w-4 h-4" />;
      case "article":
        return <FileText className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: ResearchItem["type"]) => {
    switch (type) {
      case "instagram":
        return "bg-gradient-to-r from-purple-500 to-pink-500";
      case "youtube":
        return "bg-gradient-to-r from-red-500 to-red-600";
      case "website":
        return "bg-gradient-to-r from-blue-500 to-blue-600";
      case "article":
        return "bg-gradient-to-r from-green-500 to-green-600";
      default:
        return "bg-gradient-to-r from-gray-500 to-gray-600";
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const getBoardNames = (boardIds: string[]) => {
    return boardIds
      .map((boardId) => {
        const board = boards.find((b) => b.id === boardId);
        return board?.name || "Unknown Board";
      })
      .join(", ");
  };

  const filteredItems = getFilteredItems();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="flex h-screen">
        {/* Left Panel - Board Filter */}
        <div className="w-80 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-slate-200 dark:border-slate-700">
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-2">
              Research Queue
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Organize your research items
            </p>
          </div>

          {/* Search */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-700">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-slate-200 text-sm"
              />
            </div>
          </div>

          {/* Board Filter */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  Boards
                </h2>
                <button
                  onClick={() => setShowCreateBoard(true)}
                  className="p-1 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* All Items Filter */}
              <button
                onClick={() => setSelectedBoardFilter(null)}
                className={`w-full text-left p-3 rounded-lg mb-2 transition-colors ${
                  selectedBoardFilter === null
                    ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
                    : "hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">All Items</span>
                  <span className="text-sm bg-slate-200 dark:bg-slate-600 px-2 py-1 rounded">
                    {getAllItems().length}
                  </span>
                </div>
              </button>

              {/* Board Filters */}
              {boards.map((board) => (
                <div key={board.id} className="mb-2">
                  <button
                    onClick={() => setSelectedBoardFilter(board.id)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      selectedBoardFilter === board.id
                        ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
                        : "hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{board.name}</div>
                        {board.description && (
                          <div className="text-xs text-slate-500 dark:text-slate-500 truncate">
                            {board.description}
                          </div>
                        )}
                      </div>
                      <span className="text-sm bg-slate-200 dark:bg-slate-600 px-2 py-1 rounded ml-2">
                        {board.items.length}
                      </span>
                    </div>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Add Item Button */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setShowAddItem(true)}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Item
            </button>
          </div>
        </div>

        {/* Center Panel - Items Queue */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200">
                  {selectedBoardFilter
                    ? boards.find((b) => b.id === selectedBoardFilter)?.name ||
                      "Unknown Board"
                    : "All Items"}
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {filteredItems.length} item
                  {filteredItems.length !== 1 ? "s" : ""}
                </p>
              </div>
              {selectedBoardFilter && (
                <button
                  onClick={() => setSelectedBoardFilter(null)}
                  className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm"
                >
                  Clear Filter
                </button>
              )}
            </div>
          </div>

          {/* Items Grid */}
          <div className="flex-1 overflow-y-auto p-6">
            {filteredItems.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredItems.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer"
                    onClick={() => openItemDetail(item)}
                  >
                    <div className="space-y-3">
                      {/* Image Preview */}
                      {item.image && (
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
                      )}

                      {/* Title with Favicon */}
                      <div className="flex items-center gap-3">
                        {item.favicon ? (
                          <img
                            src={item.favicon}
                            alt="Favicon"
                            className="w-6 h-6 rounded flex-shrink-0"
                          />
                        ) : (
                          <div
                            className={`p-1.5 rounded-lg text-white ${getTypeColor(
                              item.type
                            )} flex-shrink-0`}
                          >
                            {getTypeIcon(item.type)}
                          </div>
                        )}
                        <h3 className="font-semibold text-slate-800 dark:text-slate-200 line-clamp-2 flex-1">
                          {item.title}
                        </h3>
                      </div>
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-blue-600 dark:text-blue-400 hover:underline break-all text-sm"
                      >
                        {item.url}
                      </a>
                      {item.description && (
                        <p className="text-slate-600 dark:text-slate-400 text-sm line-clamp-3">
                          {item.description}
                        </p>
                      )}
                      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-500">
                        <span>Added {formatDate(item.createdAt)}</span>
                        <span className="bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">
                          {getBoardNames(item.boardIds)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-12 max-w-md mx-auto">
                  <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Plus className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-2">
                    No items found
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 mb-6">
                    {searchQuery || selectedBoardFilter
                      ? "Try adjusting your search or filter criteria"
                      : "Start adding research items to your boards"}
                  </p>
                  <button
                    onClick={() => setShowAddItem(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                  >
                    Add Your First Item
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Board Modal */}
      {showCreateBoard && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4 text-slate-800 dark:text-slate-200">
              Create New Board
            </h3>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Board name"
                value={newBoard.name}
                onChange={(e) =>
                  setNewBoard({ ...newBoard, name: e.target.value })
                }
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-slate-200"
                onKeyPress={(e) => e.key === "Enter" && createBoard()}
              />
              <textarea
                placeholder="Board description (optional)"
                value={newBoard.description}
                onChange={(e) =>
                  setNewBoard({ ...newBoard, description: e.target.value })
                }
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-slate-200 resize-none"
                rows={3}
              />
              <div className="flex gap-2">
                <button
                  onClick={createBoard}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg transition-colors"
                >
                  Create
                </button>
                <button
                  onClick={() => setShowCreateBoard(false)}
                  className="flex-1 bg-slate-300 hover:bg-slate-400 dark:bg-slate-600 dark:hover:bg-slate-500 text-slate-700 dark:text-slate-200 py-2 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Item Modal */}
      {showAddItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4 text-slate-800 dark:text-slate-200">
              Add Research Item
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Boards
                </label>
                <div className="space-y-2 max-h-32 overflow-y-auto border border-slate-300 dark:border-slate-600 rounded-lg p-3 bg-slate-50 dark:bg-slate-700">
                  {boards.map((board) => (
                    <label key={board.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={newItem.boardIds.includes(board.id)}
                        onChange={(e) => {
                          const newBoardIds = e.target.checked
                            ? [...newItem.boardIds, board.id]
                            : newItem.boardIds.filter((id) => id !== board.id);
                          setNewItem({ ...newItem, boardIds: newBoardIds });
                        }}
                        className="rounded border-slate-300 dark:border-slate-600"
                      />
                      <span className="text-sm text-slate-700 dark:text-slate-300">
                        {board.name}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  URL
                </label>
                <input
                  type="url"
                  placeholder="https://example.com"
                  value={newItem.url}
                  onChange={(e) =>
                    setNewItem({ ...newItem, url: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-slate-200"
                  onKeyPress={(e) => e.key === "Enter" && addItem()}
                />
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  We'll automatically detect the content type and fetch the
                  title, description, and favicon.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={addItem}
                  disabled={
                    isLoading ||
                    !newItem.url.trim() ||
                    newItem.boardIds.length === 0
                  }
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Fetching...
                    </>
                  ) : (
                    "Add Item"
                  )}
                </button>
                <button
                  onClick={() => setShowAddItem(false)}
                  disabled={isLoading}
                  className="flex-1 bg-slate-300 hover:bg-slate-400 dark:bg-slate-600 dark:hover:bg-slate-500 text-slate-700 dark:text-slate-200 py-2 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Item Detail Modal */}
      <ItemDetailModal
        item={selectedItem}
        isOpen={showItemDetail}
        onClose={closeItemDetail}
        boards={boards}
        isLoading={isLoading}
        editingItemBoards={editingItemBoards}
        onRefetch={refetchItemMetadata}
        onDelete={deleteItem}
        onUpdateBoards={updateItemBoards}
        onToggleEditBoards={() => setEditingItemBoards(!editingItemBoards)}
        getTypeIcon={getTypeIcon}
        getTypeColor={getTypeColor}
        formatDate={formatDate}
        getBoardNames={getBoardNames}
      />
    </div>
  );
}
