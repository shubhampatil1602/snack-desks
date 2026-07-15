import { useState } from "react";
import { Copy, Check, Trash2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { BreakdownItemData } from "./types";

type ItemBreakdownListProps = {
  title?: string;
  items?: [string, BreakdownItemData][];
  groups?: {
    shopName: string;
    total: number;
    items: [string, BreakdownItemData][];
  }[];
  onCopy?: () => void;
  onDeleteItem?: (item: { name: string; data: BreakdownItemData }) => void;
};

export function ItemBreakdownList({
  title = "Item Breakdown",
  items,
  groups,
  onCopy,
  onDeleteItem,
}: ItemBreakdownListProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!onCopy) return;
    await onCopy();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className='space-y-2 border-t pt-2 max-h-120 overflow-y-auto scrollbar-hide [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]'>
      <div className='flex justify-between items-center'>
        <div className='flex items-center gap-3'>
          <h4 className='font-medium'>{title}</h4>
        </div>
        {onCopy && (
          <Button
            variant='ghost'
            size='sm'
            onClick={handleCopy}
            className='gap-2 text-xs px-1 py-0.5'
          >
            {copied ? (
              <>
                <Check className='size-3 text-green-500' />
                <span className='text-green-500'>Copied!</span>
              </>
            ) : (
              <>
                <Copy className='size-3' />
                Copy List
              </>
            )}
          </Button>
        )}
      </div>

      <div className='space-y-2'>
        {groups ? (
          groups.length === 0 ? (
            <p className='text-sm text-muted-foreground text-center py-4'>
              No items ordered
            </p>
          ) : (
            groups.map((group) => (
              <div key={group.shopName} className='mb-3 last:mb-0'>
                <div className='flex justify-between items-center border-t border-border/40 pt-1.5 mt-2 mb-1'>
                  <span className='uppercase tracking-widest text-xs font-semibold bg-primary/10 text-primary px-1.5 py-0.5 rounded-none'>
                    {group.shopName}
                  </span>
                  <span className='uppercase tracking-widest text-xs font-semibold bg-primary/10 text-primary px-1.5 py-0.5 rounded-none'>
                    {formatCurrency(group.total)}
                  </span>
                </div>
                <div className='space-y-0.5'>
                  {group.items.map(([name, value]) => (
                    <div
                      key={name}
                      className='flex justify-between text-sm items-center py-0.5 px-1'
                    >
                      <div className='flex items-center gap-2 text-muted-foreground'>
                        <span>
                          {value.quantity} &times; {name}
                        </span>
                        {onDeleteItem && (
                          <Button
                            variant='ghost'
                            size='icon'
                            className='h-5 w-5 rounded-none'
                            onClick={() => onDeleteItem({ name, data: value })}
                          >
                            <Trash2 className='h-3 w-3 text-destructive hover:bg-destructive hover:text-destructive-foreground' />
                          </Button>
                        )}
                      </div>
                      <div className='flex items-center gap-2'>
                        <span className='font-medium text-foreground tabular-nums'>
                          {formatCurrency(value.total)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )
        ) : !items || items.length === 0 ? (
          <p className='text-sm text-muted-foreground text-center py-4'>
            No items ordered
          </p>
        ) : (
          <div className='space-y-0.5'>
            {items.map(([name, value]) => (
              <div
                key={name}
                className='flex justify-between text-sm items-center py-0.5 px-1'
              >
                <div className='flex items-center gap-2 text-muted-foreground'>
                  <span>
                    {value.quantity} &times; {name}
                  </span>
                  {onDeleteItem && (
                    <Button
                      variant='ghost'
                      size='icon'
                      className='h-5 w-5 rounded-none text-destructive hover:bg-destructive hover:text-destructive-foreground'
                      onClick={() => onDeleteItem({ name, data: value })}
                    >
                      <Trash2 className='h-3 w-3' />
                    </Button>
                  )}
                </div>
                <div className='flex items-center gap-2'>
                  <span className='font-medium text-foreground tabular-nums'>
                    {formatCurrency(value.total)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
