import Link from "next/link";
import { Trophy, ArrowRight } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type UserRank = {
  rank: number;
  userId: string;
  name: string;
  spent: number;
  orders: number;
};

type UserRankCardProps = {
  rank: UserRank | null;
};

export function UserRankCard({ rank }: UserRankCardProps) {
  return (
    <Card size='sm'>
      <CardHeader>
        <CardTitle>Your Rank In Your Org.</CardTitle>
      </CardHeader>

      <CardContent>
        {!rank ? (
          <div className='text-center py-6'>
            <Trophy className='h-10 w-10 mx-auto text-muted-foreground mb-2' />

            <p className='text-sm text-muted-foreground'>
              No ranking available yet
            </p>
          </div>
        ) : (
          <div className='relative overflow-hidden bg-card'>
            {/* Diagonal Grid with Electric Orange */}
            <div
              className='absolute inset-0 z-0 pointer-events-none'
              style={{
                backgroundImage: `
                repeating-linear-gradient(45deg, rgba(255, 0, 100, 0.05) 0, rgba(255, 0, 100, 0.05) 1px, transparent 1px, transparent 20px),
                repeating-linear-gradient(-45deg, rgba(255, 0, 100, 0.05) 0, rgba(255, 0, 100, 0.05) 1px, transparent 1px, transparent 20px)
              `,
                backgroundSize: "40px 40px",
              }}
            />

            <div className='relative z-10'>
              <div className='space-y-6'>
                <div className='flex items-center gap-4'>
                  <div className='flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-950'>
                    <Trophy className='h-8 w-8 text-amber-600' />
                  </div>

                  <div>
                    <p className='text-sm text-muted-foreground'>
                      Current Position
                    </p>
                    <p className='text-4xl font-bold tracking-tight'>
                      #{rank.rank}
                    </p>
                  </div>
                </div>
                <div>
                  <p className='text-sm text-amber-600 dark:text-amber-500 font-medium'>
                    ✨ You just need {Math.max(0, rank.rank - 1)} more to be on
                    top
                  </p>
                </div>

                <div className='grid grid-cols-2 mt-20 gap-4'>
                  <div>
                    <p className='text-sm text-muted-foreground'>Total Spent</p>
                    <p className='text-xl font-bold'>
                      ₹{rank.spent.toFixed(2)}
                    </p>
                  </div>

                  <div>
                    <p className='text-sm text-muted-foreground'>Orders</p>
                    <p className='text-xl font-bold'>{rank.orders}</p>
                  </div>
                </div>

                <Button asChild className='w-full'>
                  <Link href='/rankings'>
                    View Full Rankings
                    <ArrowRight className='ml-2 h-4 w-4' />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
