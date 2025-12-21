"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PaginatedList from "./PaginatedList";
import { ListChecks, Clock, CheckCircle2, XCircle } from "lucide-react";

interface UserListsClientProps {
  username: string;
  isOwner: boolean;
  counts: any;
  showToWatchList: boolean;
  showWatchingList: boolean;
  showWatchedList: boolean;
  showDroppedList: boolean;
  isCompact?: boolean;
  itemsPerPage?: number; // <--- NOVA PROP
}

export default function UserListsClient({
  username,
  isOwner,
  counts,
  showToWatchList,
  showWatchingList,
  showWatchedList,
  showDroppedList,
  isCompact = false,
  itemsPerPage = 12, // Padrão
}: UserListsClientProps) {
  
  const defaultTab = showWatchedList && !showWatchingList && !showToWatchList 
    ? "WATCHED" 
    : (showWatchingList ? "WATCHING" : "TO_WATCH");

  const [activeTab, setActiveTab] = useState(defaultTab);
  const activeListCount = [showToWatchList, showWatchingList, showWatchedList, showDroppedList].filter(Boolean).length;

  return (
    <div className="w-full space-y-4">
      {activeListCount > 1 && (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* ... (TabsList igual ao anterior) ... */}
        </Tabs>
      )}

      <div className="mt-4">
        {/* Agora passamos itemsPerPage para todos */}
        {showWatchingList && activeTab === "WATCHING" && (
          <PaginatedList username={username} status="WATCHING" isOwner={isOwner} isCompact={isCompact} itemsPerPage={itemsPerPage} />
        )}
        {showToWatchList && activeTab === "TO_WATCH" && (
          <PaginatedList username={username} status="TO_WATCH" isOwner={isOwner} isCompact={isCompact} itemsPerPage={itemsPerPage} />
        )}
        {showWatchedList && activeTab === "WATCHED" && (
          <PaginatedList username={username} status="WATCHED" isOwner={isOwner} isCompact={isCompact} itemsPerPage={itemsPerPage} />
        )}
        {showDroppedList && activeTab === "DROPPED" && (
          <PaginatedList username={username} status="DROPPED" isOwner={isOwner} isCompact={isCompact} itemsPerPage={itemsPerPage} />
        )}
      </div>
    </div>
  );
}