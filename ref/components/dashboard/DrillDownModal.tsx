import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface DrillDownModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  data: any[];
  columns: { key: string; label: string }[];
}

export function DrillDownModal({ open, onClose, title, data, columns }: DrillDownModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[85vh] flex flex-col p-0 gap-0 bg-card rounded-xl shadow-xl border border-border/30 overflow-hidden [&>button]:hidden">
        <DialogHeader className="px-6 py-5 border-b border-border/60 bg-gradient-to-r from-card to-card/95">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold text-foreground tracking-tight">
              {title}
            </DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 rounded-lg hover:bg-muted"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          {data.length > 0 && (
            <p className="text-sm text-foreground/80 mt-2 font-medium">
              {data.length} {data.length === 1 ? "record" : "records"} found
            </p>
          )}
          {/* Add subtle divider when data exists */}
          {data.length > 0 && <div className="border-t border-border/20 my-2" />}
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          {data.length === 0 ? (
            <div className="flex-1 flex items-center justify-center py-16">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
                  <X className="h-8 w-8 text-muted-foreground/50" />
                </div>
                <p className="text-base font-medium text-foreground mb-1">No data available</p>
                <p className="text-sm text-muted-foreground">
                  No records found for this selection
                </p>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-auto">
              <div className="relative">
                <table className="w-full border-collapse rounded-lg overflow-hidden shadow-sm bg-card">
                  <thead className="sticky top-0 z-10 bg-card border-b border-border/30">
                    <tr>
                      {columns.map((col, idx) => (
                        <th
                          key={col.key}
                          className={`
                            px-5 py-3 text-left text-sm font-semibold uppercase tracking-wider
                            text-foreground/70
                            ${idx === 0 ? 'pl-6' : ''}
                            ${idx === columns.length - 1 ? 'pr-6' : ''}
                            bg-card
                          `}
                        >
                          {col.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/40">
                    {data.map((row, rowIdx) => (
                      <tr
                        key={rowIdx}
                        className={`
                          group
                          transition-colors duration-150
                          border-b border-border/30
                          ${rowIdx % 2 === 0 ? 'bg-card' : 'bg-muted/20'}
                          hover:bg-gradient-to-r hover:from-primary/5 hover:to-primary/2
                          hover:shadow-sm
                          rounded-lg
                        `}
                      >
                        {columns.map((col, colIdx) => (
                          <td
                            key={col.key}
                            className={`
                              px-5 py-3 text-sm text-foreground/90
                              font-medium
                              ${colIdx === 0 ? 'pl-6' : ''}
                              ${colIdx === columns.length - 1 ? 'pr-6' : ''}
                              group-hover:text-foreground
                              transition-colors
                            `}
                          >
                            <div className="flex items-center min-h-[24px] truncate">
                              {row[col.key] || (
                                <span className="text-muted-foreground/50 italic">—</span>
                              )}
                            </div>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-border/60 bg-muted/20 flex justify-end">
          <Button
            onClick={onClose}
            variant="outline"
            className="px-6 font-medium"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

