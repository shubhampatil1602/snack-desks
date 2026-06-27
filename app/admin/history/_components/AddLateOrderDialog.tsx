"use client";

import { useState, useTransition, useEffect } from "react";
import { toast } from "sonner";
import { Plus, Check, ChevronsUpDown } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
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
  const [comboboxOpen, setComboboxOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [eligibleUsers, setEligibleUsers] = useState<EligibleUser[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

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
      setComboboxOpen(false);
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
                <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant='outline'
                      role='combobox'
                      aria-expanded={comboboxOpen}
                      className='w-full justify-between font-normal'
                      disabled={pending}
                    >
                      {selectedUser
                        ? `${selectedUser.name} (${selectedUser.email})`
                        : "Search for a user..."}
                      <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className='w-[400px] p-0' align='start'>
                    <Command>
                      <CommandInput placeholder='Search users...' />
                      <CommandList>
                        <CommandEmpty>No users found.</CommandEmpty>
                        <CommandGroup>
                          {eligibleUsers.map((user) => (
                            <CommandItem
                              key={user.id}
                              value={`${user.name} ${user.email}`}
                              onSelect={() => {
                                setSelectedUserId(user.id);
                                setComboboxOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  selectedUserId === user.id
                                    ? "opacity-100"
                                    : "opacity-0",
                                )}
                              />
                              {user.name} ({user.email})
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              )}
            </div>
          </OrderItemsForm>
        )}
      </DialogContent>
    </Dialog>
  );
}
