"use client";

import { useState, useEffect, useMemo } from "react";
import DatePicker, { registerLocale } from "react-datepicker";
import { ptBR } from "date-fns/locale/pt-BR";
registerLocale("pt-BR", ptBR);
import { format } from "date-fns";
import { Media, MediaStatus, ScheduleItem, MediaType } from "@prisma/client";
import "react-datepicker/dist/react-datepicker.css";
import { FiRefreshCw } from 'react-icons/fi';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


// Tipagem (sem mudanças)
type MediaStatusWithMedia = MediaStatus & { media: Media };
type ScheduleItemWithMedia = ScheduleItem & { media: Media };
type Props = { agendaveisList: MediaStatusWithMedia[]; initialScheduleItems: ScheduleItemWithMedia[]; onScheduleChanged: () => void; };

export default function ScheduleManager({ agendaveisList, initialScheduleItems, onScheduleChanged, }: Props) {
  // Estados (sem mudanças)
  const [selectedMediaId, setSelectedMediaId] = useState<string>(""); /* ... */ const [scheduledAt, setScheduledAt] = useState<Date>(new Date()); const [horario, setHorario] = useState<string>(""); const [seasonNumber, setSeasonNumber] = useState<number | "">(""); const [episodeNumber, setEpisodeNumber] = useState<number | "">(""); const [episodeNumberEnd, setEpisodeNumberEnd] = useState<number | "">(""); const [scheduleItems, setScheduleItems] = useState(initialScheduleItems); const [loading, setLoading] = useState(false); const [message, setMessage] = useState(""); const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false); const [isCompleteDialogOpen, setIsCompleteDialogOpen] = useState(false); const [itemToConfirm, setItemToConfirm] = useState<ScheduleItemWithMedia | null>(null);

  useEffect(() => { setScheduleItems(initialScheduleItems); }, [initialScheduleItems]);

  const selectedItemInfo = useMemo(() => agendaveisList.find( (item) => item.mediaId === selectedMediaId ), [agendaveisList, selectedMediaId]);
  const isMovie = selectedItemInfo?.media.mediaType === MediaType.MOVIE;

  // handleAddItem (sem mudanças)
  const handleAddItem = async (e: React.FormEvent) => { /* ... (igual) ... */ e.preventDefault(); if (!selectedMediaId) { setMessage("Selecione um item."); return; } setLoading(true); setMessage(""); try { const res = await fetch("/api/schedule", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mediaId: selectedMediaId, scheduledAt: scheduledAt.toISOString(), horario: horario || null, seasonNumber: seasonNumber || null, episodeNumber: episodeNumber || null, episodeNumberEnd: episodeNumberEnd || null, }), }); if (!res.ok) throw new Error(await res.text()); setMessage("Item adicionado!"); setSelectedMediaId(""); setHorario(""); setSeasonNumber(""); setEpisodeNumber(""); setEpisodeNumberEnd(""); onScheduleChanged(); } catch (error: any) { setMessage(`Erro: ${error.message}`); } finally { setLoading(false); } };
  // handleRemoveItem (sem mudanças)
  const handleRemoveItem = (item: ScheduleItemWithMedia) => { /* ... (igual) ... */ setItemToConfirm(item); setIsRemoveDialogOpen(true); };
  // handleCompleteItem (sem mudanças)
  const handleCompleteItem = (item: ScheduleItemWithMedia) => { /* ... (igual) ... */ setItemToConfirm(item); setIsCompleteDialogOpen(true); };
  // confirmRemoveItem (sem mudanças)
  const confirmRemoveItem = async () => { /* ... (igual) ... */ if (!itemToConfirm) return; setLoading(true); setMessage(""); try { const res = await fetch(`/api/schedule?id=${itemToConfirm.id}`, { method: "DELETE" }); if (!res.ok) throw new Error(await res.text()); setMessage("Item removido."); onScheduleChanged(); } catch (error: any) { setMessage(`Erro ao remover: ${error.message}`); } finally { setLoading(false); setItemToConfirm(null); setIsRemoveDialogOpen(false); } };
  // confirmCompleteItem (sem mudanças)
  const confirmCompleteItem = async () => { /* ... (igual) ... */ if (!itemToConfirm) return; setLoading(true); setMessage(""); try { const res = await fetch("/api/schedule/complete", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ scheduleItemId: itemToConfirm.id }), }); if (!res.ok) throw new Error(await res.text()); const result = await res.json(); setMessage(result.scheduleItemDeleted ? "Item concluído e removido!" : "Progresso semanal atualizado!"); onScheduleChanged(); } catch (error: any) { setMessage(`Erro ao concluir: ${error.message}`); } finally { setLoading(false); setItemToConfirm(null); setIsCompleteDialogOpen(false); } };

  // --- [NOVO] Lógica para verificar se o item a confirmar é semanal ---
  // Procuramos o MediaStatus correspondente na lista de agendáveis
  const isConfirmItemWeekly = useMemo(() => {
    if (!itemToConfirm) return false;
    const mediaStatus = agendaveisList.find(ms => ms.mediaId === itemToConfirm.mediaId);
    return mediaStatus?.isWeekly ?? false;
  }, [itemToConfirm, agendaveisList]);
  // --- [FIM NOVO] ---

  return (
    <div className="space-y-6">
      {/* Formulário (sem mudanças) */}
      <form onSubmit={handleAddItem} className="space-y-4">
         {/* ... (Select Media, DatePicker, Horário, T/E Inputs, Botão Agendar - iguais) ... */}
         <div> <Label htmlFor="schedule-select-media">Item (da lista &ldquo;Assistindo&rdquo;)</Label> <Select value={selectedMediaId} onValueChange={setSelectedMediaId}> <SelectTrigger id="schedule-select-media" className="mt-1"> <SelectValue placeholder="Selecione um item..." /> </SelectTrigger> <SelectContent> {agendaveisList.map((ms) => ( <SelectItem key={ms.mediaId} value={ms.mediaId}> {ms.media.title} </SelectItem> ))} </SelectContent> </Select> </div>
          <div className="grid grid-cols-2 gap-4"> <div> <Label>Data</Label> <DatePicker selected={scheduledAt} onChange={(date: Date | null) => { if (date) { setScheduledAt(date); } }} dateFormat="dd/MM/yyyy" locale="pt-BR" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mt-1" minDate={new Date()} /> </div> <div> <Label htmlFor="schedule-time">Horário (Opc.)</Label> <Input id="schedule-time" type="time" value={horario} onChange={(e) => setHorario(e.target.value)} className="mt-1" /> </div> </div>
          {!isMovie && selectedMediaId && ( <div className="grid grid-cols-3 gap-2 pt-2"> <div> <Label htmlFor="schedule-season">Temp.</Label> <Input id="schedule-season" type="number" min="0" value={seasonNumber} onChange={(e) => setSeasonNumber(e.target.value === '' ? '' : parseInt(e.target.value))} placeholder="T" className="mt-1"/> </div> <div> <Label htmlFor="schedule-ep-start">Ep. Início</Label> <Input id="schedule-ep-start" type="number" min="0" value={episodeNumber} onChange={(e) => setEpisodeNumber(e.target.value === '' ? '' : parseInt(e.target.value))} placeholder="Ep" className="mt-1"/> </div> <div> <Label htmlFor="schedule-ep-end">Ep. Fim (Opc.)</Label> <Input id="schedule-ep-end" type="number" min="0" value={episodeNumberEnd} onChange={(e) => setEpisodeNumberEnd(e.target.value === '' ? '' : parseInt(e.target.value))} placeholder="Fim" className="mt-1"/> </div> </div> )}
          <Button type="submit" disabled={loading} className="w-full"> {loading ? "A guardar..." : "Agendar Item"} </Button>
          {message && <p className="text-sm text-center text-gray-500 pt-1">{message}</p>}
      </form>

      {/* Lista do Cronograma Atual (sem mudanças) */}
       <div className="space-y-4 pt-4 border-t"> <h3 className="text-xl font-semibold">Próximos Agendamentos</h3> {scheduleItems.length === 0 && ( <p className="text-slate-500 text-sm">Nenhum item agendado.</p> )} <ul className="space-y-2 max-h-96 overflow-y-auto pr-2"> {scheduleItems.map(item => { const mediaStatusInfo = agendaveisList.find(ms => ms.mediaId === item.mediaId); const isItemWeekly = mediaStatusInfo?.isWeekly ?? false; return ( <li key={item.id} className="flex justify-between items-center text-sm gap-2 p-3 border rounded-md bg-white shadow-sm"> <div className="flex flex-col overflow-hidden mr-2"> <span className="font-semibold truncate flex items-center gap-1" title={item.media.title}> {item.media.title} {isItemWeekly && (<FiRefreshCw className="inline text-blue-500 flex-shrink-0" title="Item Semanal"/>)} </span> <span className="text-xs text-indigo-600 whitespace-nowrap"> {format(new Date(item.scheduledAt), "EEE, dd/MM/yy", { locale: ptBR })} {item.horario && (<span className="text-slate-500 font-medium"> {' às ' + item.horario} </span> )} </span> {(item.seasonNumber || item.episodeNumber) && ( <span className="text-xs font-bold text-slate-600 whitespace-nowrap"> {item.seasonNumber && `T${item.seasonNumber}`} {item.episodeNumber && !item.episodeNumberEnd && ` E${item.episodeNumber}`} {item.episodeNumber && item.episodeNumberEnd && ` E${item.episodeNumber}-${item.episodeNumberEnd}`} </span> )} </div> <div className="flex gap-2 flex-shrink-0"> <Button variant={isItemWeekly ? "default" : "secondary"} size="sm" className="h-7 px-2 text-xs bg-green-600 hover:bg-green-700 disabled:opacity-50" onClick={() => handleCompleteItem(item)} disabled={loading} title={isItemWeekly ? "Marcar episódio(s) como visto(s)" : "Concluir e mover para 'Já Vi'"} > {isItemWeekly ? "Visto" : "Concluir"} </Button> <Button variant="destructive" size="sm" className="h-7 px-2 text-xs disabled:opacity-50" onClick={() => handleRemoveItem(item)} disabled={loading} title="Remover do agendamento" > Remover </Button> </div> </li> ); })} </ul> </div>


      {/* AlertDialogs (Atualizados) */}
       {/* Diálogo de Remoção (sem mudanças na lógica, apenas texto) */}
       <AlertDialog open={isRemoveDialogOpen} onOpenChange={setIsRemoveDialogOpen}> <AlertDialogContent> <AlertDialogHeader> <AlertDialogTitle>Confirmar Remoção</AlertDialogTitle> <AlertDialogDescription> Tem a certeza que deseja remover &ldquo;{itemToConfirm?.media?.title}&rdquo; do cronograma? </AlertDialogDescription> </AlertDialogHeader> <AlertDialogFooter> <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel> <Button variant="destructive" onClick={confirmRemoveItem} disabled={loading}> {loading ? "A remover..." : "Remover"} </Button> </AlertDialogFooter> </AlertDialogContent> </AlertDialog>

       {/* Diálogo de Conclusão (Atualizado) */}
       <AlertDialog open={isCompleteDialogOpen} onOpenChange={setIsCompleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Conclusão</AlertDialogTitle>
            <AlertDialogDescription>
              {/* --- [MUDANÇA AQUI] Usa isConfirmItemWeekly --- */}
              {isConfirmItemWeekly ?
                `Marcar o episódio/intervalo agendado de "${itemToConfirm?.media?.title}" como visto? O item permanecerá na lista 'Assistindo'.`
              : `Marcar "${itemToConfirm?.media?.title}" como concluído e movê-lo para a lista 'Já Assistido'?`
              }
              {/* --- [FIM MUDANÇA] --- */}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
             <Button
                // --- [MUDANÇA AQUI] Usa isConfirmItemWeekly ---
                variant={isConfirmItemWeekly ? "default" : "secondary"}
                className="bg-green-600 hover:bg-green-700"
                onClick={confirmCompleteItem}
                disabled={loading}
             >
               {loading ? "A processar..." : (isConfirmItemWeekly ? "Confirmar Visto" : "Confirmar Conclusão")}
            {/* --- [FIM MUDANÇA] --- */}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}

