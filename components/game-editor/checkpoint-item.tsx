"use client";

import {
  Checkpoint,
  CheckpointIcon,
  CheckpointTrigger,
} from "@/components/ai-elements/checkpoint";
import { RotateCcw, Trash2 } from "lucide-react";
import type { ChatCheckpoint } from "@/lib/types";

interface CheckpointItemProps {
  checkpoint: ChatCheckpoint;
  onRestore: (checkpoint: ChatCheckpoint) => void;
  onDelete: (checkpointId: string) => void;
}

export function CheckpointItem({
  checkpoint,
  onRestore,
  onDelete,
}: CheckpointItemProps) {
  return (
    <Checkpoint className="my-4">
      <CheckpointIcon className="text-amber-500" />
      <span className="text-xs font-medium text-amber-500 ml-1 mr-2 whitespace-nowrap">
        {checkpoint.label}
      </span>
      <CheckpointTrigger
        tooltip="Restore to this checkpoint"
        onClick={() => onRestore(checkpoint)}
        className="h-6 px-2 text-xs gap-1"
      >
        <RotateCcw className="size-3" />
        Restore
      </CheckpointTrigger>
      <CheckpointTrigger
        tooltip="Delete checkpoint"
        onClick={() => onDelete(checkpoint.id)}
        className="h-6 px-2 text-xs text-red-400 hover:text-red-300"
      >
        <Trash2 className="size-3" />
      </CheckpointTrigger>
    </Checkpoint>
  );
}
