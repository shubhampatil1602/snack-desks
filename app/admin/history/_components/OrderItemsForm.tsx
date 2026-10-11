"use client";

import { useMemo, useState } from "react";
import { formatCurrency, formatSplitNames, cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MenuItem } from "@/types/menu";
import { Spinner } from "@/components/ui/spinner";
import { Users, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { getOrganizationMembersForSplitAction } from "@/actions/orders";

export type OrderItemFormState = {
  menuItemId: string;
  quantity: number;
  name: string;
  price: string;
  isGroupOrderEnabled?: boolean;
  splitUserIds?: string[];
  splitUserNames?: string[];
};

type Props = {
  menuItems: MenuItem[];
  initialItems?: OrderItemFormState[];
  onSave: (
    items: {
      menuItemId: string;
      quantity: number;
      splitUserIds?: string[];
    }[],
  ) => void;
  onCancel: () => void;
  saveLabel?: string;
  isPending?: boolean;
  canSave?: boolean;
  children?: React.ReactNode;
  currentUserId?: string;
};

export function OrderItemsForm({
  menuItems,
  initialItems = [],
  onSave,
  onCancel,
  saveLabel = "Save Changes",
  isPending = false,
  canSave = true,
  children,
  currentUserId,
}: Props) {
  const [search, setSearch] = useState("");
  const [orderItems, setOrderItems] = useState<OrderItemFormState[]>(initialItems);
  const [hasChanges, setHasChanges] = useState(false);

  const filteredItems = useMemo(() => {
    return menuItems.filter(
      (item) =>
        item.isAvailable !== false &&
        item.name.toLowerCase().includes(search.toLowerCase()) &&
        !orderItems.some((orderItem) => orderItem.menuItemId === item.id),
    );
  }, [menuItems, orderItems, search]);

  function increment(menuItemId: string) {
    setHasChanges(true);
    setOrderItems((prev) =>
      prev.map((item) =>
        item.menuItemId === menuItemId
          ? { ...item, quantity: item.quantity + 1 }
          : item,
      ),
    );
  }

  function decrement(menuItemId: string) {
    setHasChanges(true);
    setOrderItems((prev) =>
      prev.flatMap((item) => {
        if (item.menuItemId !== menuItemId) return item;
        if (item.quantity === 1) return [];
        return { ...item, quantity: item.quantity - 1 };
      }),
    );
  }

  function addItem(item: MenuItem) {
    setHasChanges(true);
    setOrderItems((prev) => [
      ...prev,
      {
        menuItemId: item.id,
        quantity: 1,
        name: item.name,
        price: item.price.toString(),
        isGroupOrderEnabled: item.shop?.isGroupOrderEnabled ?? false,
      },
    ]);
    setSearch("");
  }

  function handleSaveSplit(
    menuItemId: string,
    userIds: string[],
    userNames: string[],
  ) {
    setHasChanges(true);
    setOrderItems((prev) =>
      prev.map((item) =>
        item.menuItemId === menuItemId
          ? { ...item, splitUserIds: userIds, splitUserNames: userNames }
          : item,
      ),
    );
  }

  const total = orderItems.reduce(
    (sum, item) => sum + Number(item.price) * item.quantity,
    0,
  );

  const isSaveEnabled =
    canSave &&
    (initialItems.length === 0 ? orderItems.length > 0 : hasChanges) &&
    !isPending;

  return (
    <div className='flex-1 flex flex-col h-full overflow-hidden'>
      <div className='flex-1 overflow-y-auto p-6 space-y-6'>
        {children}

        <div className='space-y-2'>
          <label className='text-sm font-medium'>Add Items</label>
          <Input
            placeholder='Search menu items...'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            disabled={isPending}
          />

          {search && (
            <div className='border divide-y max-h-48 overflow-y-auto mt-2'>
              {filteredItems.map((item) => (
                <button
                  key={item.id}
                  className='w-full flex justify-between p-3 text-left hover:bg-muted text-sm'
                  onClick={() => addItem(item)}
                  type='button'
                >
                  <div className='flex items-center gap-2'>
                    <span>{item.name}</span>
                    {item.shop?.isGroupOrderEnabled && (
                      <span className='text-[10px] bg-emerald-600 text-white font-medium px-1.5 py-0.5 rounded'>
                        Group Split
                      </span>
                    )}
                  </div>
                  <span>{formatCurrency(item.price)}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className='space-y-3 pb-4'>
          {orderItems.map((item) => {
            const isGroupOrder =
              item.isGroupOrderEnabled ??
              menuItems.find((m) => m.id === item.menuItemId)?.shop
                ?.isGroupOrderEnabled ??
              false;

            return (
              <div
                key={item.menuItemId}
                className='flex items-center justify-between border p-3'
              >
                <div className='space-y-1'>
                  <p className='font-medium text-sm'>{item.name}</p>
                  <p className='text-xs text-muted-foreground'>
                    {formatCurrency(item.price)}
                  </p>
                  {isGroupOrder && (
                    <AdminSplitUserModal
                      item={item}
                      currentUserId={currentUserId}
                      onSaveSplit={(userIds, userNames) =>
                        handleSaveSplit(item.menuItemId, userIds, userNames)
                      }
                    />
                  )}
                </div>

                <div className='flex items-center gap-2'>
                  <Button
                    size='icon'
                    variant='outline'
                    className='h-8 w-8'
                    onClick={() => decrement(item.menuItemId)}
                    disabled={isPending}
                    type='button'
                  >
                    -
                  </Button>

                  <span className='w-6 text-center text-sm'>{item.quantity}</span>

                  <Button
                    size='icon'
                    variant='outline'
                    className='h-8 w-8'
                    onClick={() => increment(item.menuItemId)}
                    disabled={isPending}
                    type='button'
                  >
                    +
                  </Button>
                </div>
              </div>
            );
          })}

          {orderItems.length === 0 && (
            <div className='text-center p-6 border border-dashed text-muted-foreground text-sm'>
              No items added yet. Search and add items above.
            </div>
          )}
        </div>
      </div>

      <div className='p-6 border-t bg-card mt-auto space-y-4'>
        <div className='flex items-center justify-between'>
          <span className='font-medium'>Total</span>
          <span className='font-semibold text-lg'>{formatCurrency(total)}</span>
        </div>

        <div className='flex justify-end gap-2'>
          <Button
            variant='outline'
            onClick={onCancel}
            disabled={isPending}
            type='button'
          >
            Cancel
          </Button>
          <Button
            onClick={() =>
              onSave(
                orderItems.map((i) => ({
                  menuItemId: i.menuItemId,
                  quantity: i.quantity,
                  splitUserIds: i.splitUserIds,
                })),
              )
            }
            disabled={!isSaveEnabled}
            type='button'
          >
            {isPending && <Spinner className='mr-2' />}
            {saveLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

function AdminSplitUserModal({
  item,
  currentUserId,
  onSaveSplit,
}: {
  item: OrderItemFormState;
  currentUserId?: string;
  onSaveSplit: (userIds: string[], userNames: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [users, setUsers] = useState<
    { id: string; name: string; email: string }[]
  >([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>(() =>
    (item.splitUserIds || []).filter((id) => !currentUserId || id !== currentUserId),
  );

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (nextOpen) {
      setSelectedIds(
        (item.splitUserIds || []).filter(
          (id) => !currentUserId || id !== currentUserId,
        ),
      );
      setLoading(true);
      getOrganizationMembersForSplitAction(currentUserId)
        .then((res) => {
          if (res.success && res.users) {
            setUsers(
              res.users.filter(
                (u) => !currentUserId || u.id !== currentUserId,
              ),
            );
          }
        })
        .finally(() => setLoading(false));
    }
  };

  const toggle = (id: string) => {
    if (currentUserId && id === currentUserId) return;
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const handleConfirm = () => {
    const validSelectedIds = selectedIds.filter(
      (id) => !currentUserId || id !== currentUserId,
    );
    const selectedUsers = users.filter((u) => validSelectedIds.includes(u.id));
    onSaveSplit(
      validSelectedIds,
      selectedUsers.map((u) => u.name),
    );
    setOpen(false);
  };

  const participantCount = selectedIds.length + 1;
  const sharePrice = (Number(item.price) * item.quantity) / participantCount;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {item.splitUserIds && item.splitUserIds.length > 0 ? (
          <button
            type='button'
            title={`Split with: ${item.splitUserNames?.join(", ") || `${item.splitUserIds.length} user(s)`}`}
            className='inline-flex items-center gap-1.5 text-xs text-primary bg-primary/10 hover:bg-primary/20 border border-primary/20 px-2.5 py-1 rounded-md font-medium cursor-pointer transition-colors max-w-full'
          >
            <Users className='h-3.5 w-3.5 shrink-0' />
            <span className='truncate'>
              Split with {formatSplitNames(item.splitUserNames || [])} (1/{participantCount})
            </span>
          </button>
        ) : (
          <button
            type='button'
            className='inline-flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 font-medium cursor-pointer transition-colors py-0.5'
          >
            <Users className='h-3.5 w-3.5 shrink-0' />
            <span>Split Item (Optional)</span>
          </button>
        )}
      </DialogTrigger>
      <DialogContent className='max-w-md p-5'>
        <DialogHeader>
          <DialogTitle className='text-base font-semibold'>
            Split {item.name}
          </DialogTitle>
          <p className='text-xs text-muted-foreground'>
            Select team members to split this item with. Cost will be divided equally.
          </p>
        </DialogHeader>

        <div className='p-3 bg-muted/50 rounded-lg text-xs space-y-1 border'>
          <div className='flex justify-between font-medium'>
            <span>Total Item Cost:</span>
            <span>{formatCurrency(Number(item.price) * item.quantity)}</span>
          </div>
          <div className='flex justify-between text-muted-foreground'>
            <span>Split:</span>
            <span>
              {participantCount} participants ({formatCurrency(sharePrice)} each)
            </span>
          </div>
        </div>

        <Input
          placeholder='Search team members...'
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className='h-8 text-xs'
        />

        <div className='max-h-48 overflow-y-auto space-y-1'>
          {loading ? (
            <div className='py-6 text-center text-xs text-muted-foreground'>
              Loading members...
            </div>
          ) : (
            users
              .filter(
                (u) =>
                  (!currentUserId || u.id !== currentUserId) &&
                  (u.name.toLowerCase().includes(search.toLowerCase()) ||
                    u.email.toLowerCase().includes(search.toLowerCase())),
              )
              .map((u) => {
                const isSelected = selectedIds.includes(u.id);
                return (
                  <div
                    key={u.id}
                    onClick={() => toggle(u.id)}
                    className={cn(
                      "flex items-center justify-between p-2 rounded border text-xs cursor-pointer",
                      isSelected
                        ? "bg-primary/10 border-primary text-primary font-medium"
                        : "hover:bg-muted/50",
                    )}
                  >
                    <div>
                      <div>{u.name}</div>
                      <div className='text-[10px] text-muted-foreground'>
                        {u.email}
                      </div>
                    </div>
                    {isSelected && <Check className='h-4 w-4 text-primary' />}
                  </div>
                );
              })
          )}
        </div>

        <div className='flex justify-end gap-2 pt-2 border-t'>
          {selectedIds.length > 0 && (
            <Button
              type='button'
              variant='ghost'
              size='sm'
              className='text-xs text-destructive'
              onClick={() => setSelectedIds([])}
            >
              Clear
            </Button>
          )}
          <Button
            type='button'
            variant='outline'
            size='sm'
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
          <Button type='button' size='sm' onClick={handleConfirm}>
            Save Split
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
