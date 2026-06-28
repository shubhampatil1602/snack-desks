"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { DataPagination } from "@/components/ui/data-pagination";
import { usePagination } from "@/hooks/use-pagination";
import { MenuFormDialog } from "./MenuFormDialog";
import { DeleteMenuDialog } from "./DeleteMenuDialog";
import { toggleMenuItemAvailabilityAction } from "@/actions/menu";
import type { MenuCategory, MenuItem, ShopCategory } from "@/types/menu";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface MenuTableProps {
  data: MenuItem[];
  categories: MenuCategory[];
  shops: ShopCategory[];
}

export function MenuTable({ data, categories, shops }: MenuTableProps) {
  const [search, setSearch] = useState("");
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());
  const [toggledItems, setToggledItems] = useState<Record<string, boolean>>({});
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const items = data
    .filter((item) => !deletedIds.has(item.id))
    .map((item) => ({
      ...item,
      isAvailable: toggledItems[item.id] ?? item.isAvailable,
    }))
    .filter((item) =>
      selectedCategory === null
        ? true
        : item.menuCategoryId === selectedCategory,
    )
    .filter((item) => {
      const query = search.toLowerCase();

      return (
        item.name.toLowerCase().includes(query) ||
        item.menuCategory?.name.toLowerCase().includes(query)
      );
    });

  const pagination = usePagination({ data: items, itemsPerPage: 10 });

  async function handleToggle(id: string, current: boolean) {
    // optimistic update
    setToggledItems((prev) => ({ ...prev, [id]: !current }));

    const result = await toggleMenuItemAvailabilityAction(id, !current);
    if (!result.success) {
      // revert
      setToggledItems((prev) => ({ ...prev, [id]: current }));
      toast.error(result.error);
    }
  }

  function handleDeleted(id: string) {
    setDeletedIds((prev) => new Set(prev).add(id));
  }

  if (data.length === 0) {
    return (
      <div className='border border-dashed p-12 text-center'>
        <p className='text-sm text-muted-foreground'>
          No items on the menu yet. Add your first item.
        </p>
      </div>
    );
  }
  return (
    <div className='space-y-6'>
      <div className='flex items-center gap-2 flex-wrap'>
        <Badge
          className={cn(
            "cursor-pointer transition-all px-3 py-2 mr-1 border",
            selectedCategory === null
              ? "bg-accent opacity-100"
              : "opacity-50 hover:opacity-75",
          )}
          onClick={() => setSelectedCategory(null)}
        >
          All {data.filter((i) => !deletedIds.has(i.id)).length}
        </Badge>
        {categories.map((cat) => (
          <Badge
            key={cat.id}
            variant={selectedCategory === cat.id ? "default" : "outline"}
            className={cn(
              "cursor-pointer transition-all px-3 py-2 border",
              selectedCategory === cat.id
                ? "bg-accent opacity-100"
                : "opacity-50 hover:opacity-75",
            )}
            onClick={() => setSelectedCategory(cat.id)}
          >
            {cat.name}{" "}
            {
              data.filter(
                (i) => !deletedIds.has(i.id) && i.menuCategoryId === cat.id,
              ).length
            }
          </Badge>
        ))}
      </div>

      <div className='relative max-w-sm'>
        <Search className='absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground' />
        <Input
          placeholder='Search menu item...'
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className='pl-8'
        />
      </div>

      <div className='border'>
        <Table>
          <TableHeader className='bg-muted'>
            <TableRow>
              <TableHead>Item</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Shop</TableHead>
              <TableHead>Available</TableHead>
              <TableHead className='w-[100px]' />
            </TableRow>
          </TableHeader>
          <TableBody>
            {pagination.paginatedData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className='text-center text-muted-foreground py-8'
                >
                  No menu items found for{" "}
                  <span className='font-semibold'>{search}</span>
                </TableCell>
              </TableRow>
            ) : (
              pagination.paginatedData.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className='font-medium'>{item.name}</TableCell>
                  <TableCell>{formatCurrency(item.price)}</TableCell>
                  <TableCell>
                    <Badge variant='secondary'>{item.unit}</Badge>
                  </TableCell>
                  <TableCell>
                    {item.menuCategory ? (
                      <Badge variant='outline'>{item.menuCategory.name}</Badge>
                    ) : (
                      <span className='text-xs text-muted-foreground'>—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {item.shop ? (
                      <Badge variant='outline'>{item.shop.name}</Badge>
                    ) : (
                      <span className='text-xs text-muted-foreground'>—</span>
                    )}
                  </TableCell>

                  <TableCell>
                    <Switch
                      checked={item.isAvailable}
                      onCheckedChange={() =>
                        handleToggle(item.id, item.isAvailable)
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <div className='flex items-center gap-1'>
                      <MenuFormDialog
                        mode='edit'
                        item={item}
                        categories={categories}
                        shops={shops}
                      />
                      <DeleteMenuDialog
                        id={item.id}
                        name={item.name}
                        onDeleted={() => handleDeleted(item.id)}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <DataPagination {...pagination} />
      </div>
    </div>
  );
}
