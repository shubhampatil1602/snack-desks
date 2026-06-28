import { Card, CardContent } from "@/components/ui/card";
import { User, Mail, Building2, CalendarDays } from "lucide-react";
import { format } from "date-fns";
import { SplitMasterBadge } from "./SplitMasterBadge";

interface ProfileHeaderProps {
  user: {
    id: string;
    name: string;
    email: string;
  };
  member: {
    createdAt: Date;
    organization?: {
      name: string;
    } | null;
  };
  splitMasterWins: number;
}

export function ProfileHeader({
  user,
  member,
  splitMasterWins,
}: ProfileHeaderProps) {
  return (
    <Card size='sm'>
      <CardContent className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4'>
        <div className='flex items-center gap-4'>
          <div className='hidden h-16 w-16 rounded-full bg-primary/10 sm:flex items-center justify-center'>
            <User className='h-8 w-8 text-primary' />
          </div>
          <div>
            <h1 className='text-2xl font-heading tracking-wide'>{user.name}</h1>
            <div className='flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 mt-1 text-sm text-muted-foreground'>
              <div className='flex items-center gap-1'>
                <Mail className='h-3.5 w-3.5' />
                <span>{user.email}</span>
              </div>
              <div className='flex items-center gap-1'>
                <Building2 className='h-3.5 w-3.5' />
                <span>{member.organization?.name || "Your Org"}</span>
              </div>
              <div className='flex items-center gap-1'>
                <CalendarDays className='h-3.5 w-3.5' />
                <span>Member since {format(member.createdAt, "MMM yyyy")}</span>
              </div>
            </div>
          </div>
        </div>

        <SplitMasterBadge wins={splitMasterWins} />
      </CardContent>
    </Card>
  );
}
