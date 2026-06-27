"use client";

import { useState, useTransition, useEffect } from "react";
import { toast } from "sonner";
import { Plus, Check, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";
import {
  createLateOrderAction,
  getEligibleUsersForLateOrderAction,
} from "@/actions/orders";
import { useRouter } from "next/navigation";
import { MenuItem } from "@/types/menu";
import { OrderItemsForm } from "./OrderItemsForm";

type Props = {
  windowId: string;
  windowLabel: string;
  menuItems: MenuItem[];
};

type EligibleUser = {
  id: string;
  name: string;
  email: string;
};

export function AddLateOrderDialog({
  windowId,
  windowLabel,
  menuItems,
}: Props) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [eligibleUsers, setEligibleUsers] = useState<EligibleUser[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [userSearch, setUserSearch] = useState("");

  const router = useRouter();

  useEffect(() => {
    if (open) {
      getEligibleUsersForLateOrderAction(windowId)
        .then((result) => {
          if (result.success && result.users) {
            setEligibleUsers(result.users);
          } else {
            toast.error(result.error || "Failed to load users");
          }
        })
        .finally(() => {
          setIsLoadingUsers(false);
        });
    }
  }, [open, windowId]);

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (nextOpen) {
      setIsLoadingUsers(true);
    } else {
      setSelectedUserId("");
      setUserSearch("");
    }
  }

  function handleSave(items: { menuItemId: string; quantity: number }[]) {
    startTransition(async () => {
      const result = await createLateOrderAction({
        windowId,
        userId: selectedUserId,
        items,
      });

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success("Late order added successfully");
      setOpen(false);
      router.refresh();
    });
  }

  const filteredUsers = eligibleUsers.filter(
    (u) =>
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase())
  );
  const selectedUser = eligibleUsers.find((u) => u.id === selectedUserId);


  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size='sm' variant='lateOrder'>
          <Plus className='h-3.5 w-3.5' />
          Add Late Order
        </Button>
      </DialogTrigger>

      <DialogContent className='max-w-2xl max-h-[85vh] flex flex-col p-0 gap-0'>
        <DialogHeader className='p-6 pb-4 border-b'>
          <DialogTitle>Add Late Order - {windowLabel}</DialogTitle>
        </DialogHeader>

        {open && (
          <OrderItemsForm
            menuItems={menuItems}
            onSave={handleSave}
            onCancel={() => setOpen(false)}
            isPending={pending}
            canSave={selectedUserId !== ""}
            saveLabel='Submit Late Order'
          >
            <div className='space-y-2'>
              <label className='text-sm font-medium'>Select User</label>
              {isLoadingUsers ? (
                <div className='flex items-center gap-2 text-sm text-muted-foreground p-2 border'>
                  <Spinner /> Loading eligible users...
                </div>
              ) : eligibleUsers.length === 0 ? (
                <div className='text-sm text-muted-foreground p-2 border bg-muted/20'>
                  All users have placed an order for this window.
                </div>
              ) : (
                <div className="space-y-3">
                  <Input
                    placeholder="Search for a user by name or email..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    disabled={pending}
                  />

                  {selectedUser && !userSearch.trim() && (
                    <div className="flex items-center justify-between p-3 border rounded-md bg-muted/30">
                      <div className="text-sm truncate mr-4">
                        <span className="font-medium text-foreground">{selectedUser.name}</span>{" "}
                        <span className="text-muted-foreground">({selectedUser.email})</span>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-7 w-7 p-0 shrink-0 text-muted-foreground hover:text-foreground" 
                        onClick={() => setSelectedUserId("")}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}

                  {userSearch.trim() && (
                    <div className="border divide-y max-h-48 overflow-y-auto mt-2">
                      {filteredUsers.length === 0 ? (
                        <div className="p-3 text-sm text-muted-foreground text-center">
                          No users found.
                        </div>
                      ) : (
                        filteredUsers.map((user) => (
                          <button
                            key={user.id}
                            type="button"
                            className={cn(
                              "w-full flex items-center justify-between p-3 text-left hover:bg-muted text-sm",
                              selectedUserId === user.id
                                ? "bg-muted font-medium"
                                : ""
                            )}
                            onClick={() => {
                              setSelectedUserId(user.id);
                              setUserSearch("");
                            }}
                          >
                            <div className="flex-1 truncate">
                              <span>{user.name}</span>{" "}
                              <span className="text-muted-foreground text-xs font-normal">
                                ({user.email})
                              </span>
                            </div>
                            {selectedUserId === user.id && (
                              <Check className="h-4 w-4 text-primary shrink-0 ml-2" />
                            )}
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </OrderItemsForm>
        )}
      </DialogContent>
    </Dialog>
  );
}
