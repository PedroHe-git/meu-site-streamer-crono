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
  itemsPerPage?: number;
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
  itemsPerPage = 12,
}: UserListsClientProps) {

  const defaultTab =
    (showWatchingList && "WATCHING") ||
    (showToWatchList && "TO_WATCH") ||
    (showWatchedList && "WATCHED") ||
    (showDroppedList && "DROPPED") ||
    "WATCHED";

  const [activeTab, setActiveTab] = useState(defaultTab);

  const activeListCount = [
    showToWatchList,
    showWatchingList,
    showWatchedList,
    showDroppedList,
  ].filter(Boolean).length;

  const tabs = [
    {
      key: "WATCHING",
      show: showWatchingList,
      label: "Assistindo",
      count: counts.WATCHING,
      Icon: Clock,
    },
    {
      key: "TO_WATCH",
      show: showToWatchList,
      label: "Para Assistir",
      count: counts.TO_WATCH,
      Icon: ListChecks,
    },
    {
      key: "WATCHED",
      show: showWatchedList,
      label: "Assistidos",
      count: counts.WATCHED,
      Icon: CheckCircle2,
    },
    {
      key: "DROPPED",
      show: showDroppedList,
      label: "Abandonados",
      count: counts.DROPPED,
      Icon: XCircle,
    },
  ];

  return (
    <div className="w-full space-y-4">
      {activeListCount > 1 ? (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList
            className="
              flex
              w-full
              justify-start
              gap-2
              p-0
              bg-transparent
              border-0
              h-auto
            "
          >
            {tabs
              .filter(tab => tab.show)
              .map(({ key, label, count, Icon }) => (
                <TabsTrigger
                  key={key}
                  value={key}
                  className="
                    flex
                    items-center
                    gap-2
                    px-4
                    py-2
                    rounded-lg
                    bg-transparent
                    border-0
                    text-gray-400
                    hover:text-white
                    transition-colors
                    data-[state=active]:bg-purple-600
                    data-[state=active]:text-white
                  "
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  
                  <span className="text-sm font-medium whitespace-nowrap">
                    {label}
                  </span>

                  <span className="text-xs font-bold">
                    {count || 0}
                  </span>
                </TabsTrigger>
              ))}
          </TabsList>
        </Tabs>
      ) : null}

      {/* CONTEÚDO */}
      <div className="mt-4 min-h-[300px]">
        {showWatchingList && activeTab === "WATCHING" && (
          <PaginatedList
            username={username}
            status="WATCHING"
            isOwner={isOwner}
            isCompact={isCompact}
            itemsPerPage={itemsPerPage}
          />
        )}

        {showToWatchList && activeTab === "TO_WATCH" && (
          <PaginatedList
            username={username}
            status="TO_WATCH"
            isOwner={isOwner}
            isCompact={isCompact}
            itemsPerPage={itemsPerPage}
          />
        )}

        {showWatchedList && activeTab === "WATCHED" && (
          <PaginatedList
            username={username}
            status="WATCHED"
            isOwner={isOwner}
            isCompact={isCompact}
            itemsPerPage={itemsPerPage}
          />
        )}

        {showDroppedList && activeTab === "DROPPED" && (
          <PaginatedList
            username={username}
            status="DROPPED"
            isOwner={isOwner}
            isCompact={isCompact}
            itemsPerPage={itemsPerPage}
          />
        )}
      </div>
    </div>
  );
}