"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tv, CheckCircle2, PlayCircle } from "lucide-react";

interface WeeklyDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (isFinale: boolean) => void;
  title: string;
}

export function WeeklyDialog({ isOpen, onClose, onConfirm, title }: WeeklyDialogProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="bg-zinc-900 border-zinc-800 text-white">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-purple-400">
            <Tv className="w-5 h-5" />
            Atualização Semanal
          </AlertDialogTitle>
          <AlertDialogDescription className="text-zinc-400 text-base">
            Você marcou um item de <strong className="text-white">{title}</strong>. 
            <br />
            Esse foi o último episódio da temporada/série?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2 mt-4">
          <AlertDialogCancel 
            onClick={onClose}
            className="bg-transparent border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-white"
          >
            Cancelar
          </AlertDialogCancel>
          
          <button
            onClick={() => onConfirm(false)} // False = Não é o final
            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors bg-blue-600 text-white hover:bg-blue-700 h-10 px-4 py-2 gap-2"
          >
            <PlayCircle className="w-4 h-4" />
            Não, tem mais {/* Texto simplificado */}
          </button>

          <AlertDialogAction
            onClick={() => onConfirm(true)} // True = É o final
            className="bg-green-600 text-white hover:bg-green-700 gap-2 border-none"
          >
            <CheckCircle2 className="w-4 h-4" />
            Sim, finalizei!
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}