import { Trophy } from "lucide-react";

interface SplitMasterBadgeProps {
  wins: number;
}

export function SplitMasterBadge({ wins }: SplitMasterBadgeProps) {
  return (
    <div className='flex flex-col items-center gap-1.5'>
      <div className='flex items-center gap-1.5 bg-yellow-500/10 px-3 py-1.5 rounded-full'>
        <Trophy className='h-4 w-4 text-yellow-600 dark:text-yellow-400' />
        <span className='text-sm font-medium'>{wins}</span>
      </div>
      <span className='text-xs text-muted-foreground'>Split Master Wins</span>
    </div>
  );
}
