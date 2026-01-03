import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ComparisonItem } from "@/data/mockDB";
import { ShieldCheck, Fingerprint, Stamp } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DossierModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  winner: ComparisonItem;
  loser: ComparisonItem;
  matchPercentage: number;
}

const DossierModal = ({ open, onOpenChange, winner, loser, matchPercentage }: DossierModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#f0f0f0] text-black max-w-2xl font-mono p-0 overflow-hidden border-0 shadow-2xl">
        <div className="bg-[url('https://www.transparenttextures.com/patterns/aged-paper.png')] p-8 h-full relative">
            {/* Watermark */}
            <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
                <Stamp className="w-96 h-96 -rotate-12" />
            </div>

            <DialogHeader className="border-b-2 border-black pb-4 mb-6">
                <div className="flex justify-between items-start">
                    <div>
                        <DialogTitle className="text-3xl font-black uppercase tracking-tighter mb-1">Confidential</DialogTitle>
                        <p className="text-xs uppercase tracking-widest font-bold opacity-60">AI Intelligence Report #884-X</p>
                    </div>
                    <div className="border-2 border-black px-2 py-1">
                        <p className="text-xs font-bold uppercase">Classification: Top Secret</p>
                    </div>
                </div>
            </DialogHeader>

            <div className="grid grid-cols-3 gap-8 mb-8">
                <div className="col-span-2 space-y-4">
                    <div>
                        <h4 className="text-xs font-bold uppercase border-b border-black/20 mb-2">Subject: Winner</h4>
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-black text-white flex items-center justify-center font-black text-xl rounded">
                                A+
                            </div>
                            <div>
                                <h2 className="text-2xl font-black uppercase">{winner.name}</h2>
                                <p className="text-xs font-bold opacity-60">ID: {winner.id.toUpperCase()}</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-black/5 p-4 rounded border border-black/10">
                        <p className="text-sm font-medium leading-relaxed">
                            <span className="font-bold">Summary:</span> Utilizing advanced AI analysis, {winner.name} has demonstrated superior capability over {loser.name}. 
                            The aggregate score differential of <span className="font-bold">+{matchPercentage - 80}%</span> indicates a decisive strategic advantage.
                        </p>
                    </div>
                </div>

                <div className="col-span-1 bg-white border border-black/20 p-2 shadow-sm rotate-1">
                    <img src={winner.image} className="w-full h-32 object-cover filter grayscale contrast-125 mb-2" alt="Evidence" />
                    <p className="text-[10px] text-center font-bold uppercase">Fig 1.1: Visual Confirmation</p>
                </div>
            </div>

            <div className="space-y-4 mb-8">
                <h4 className="text-xs font-bold uppercase border-b border-black/20 mb-2">Key Intel Metrics</h4>
                <div className="grid grid-cols-2 gap-4">
                    {Object.entries(winner.metrics).slice(0, 4).map(([key, value]) => (
                        <div key={key} className="flex justify-between items-center border-b border-dotted border-black/30 pb-1">
                            <span className="text-sm uppercase font-bold">{key}</span>
                            <span className="font-mono font-black">{value}/100</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex justify-between items-end pt-4 border-t-2 border-black">
                <div className="flex items-center gap-2 text-xs font-bold uppercase opacity-60">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Verified by SideBy AI Engine</span>
                </div>
                <div className="flex items-center gap-4">
                    <Fingerprint className="w-8 h-8 opacity-20" />
                    <Button onClick={() => window.print()} className="bg-black text-white hover:bg-black/80 font-bold uppercase text-xs">
                        Print Record
                    </Button>
                </div>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DossierModal;