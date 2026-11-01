"use client";

import { useState, useMemo } from "react";
import { formatCurrency } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { VegMark } from "@/components/veg-mark";
import type { FoodType } from "@/components/food-type-toggles";
import { toast } from "sonner";
import { DataPagination } from "@/components/ui/data-pagination";
import { usePagination } from "@/hooks/use-pagination";
import { MenuFormDialog } from "./MenuFormDialog";
import { DeleteMenuDialog } from "./DeleteMenuDialog";
import { toggleMenuItemAvailabilityAction } from "@/actions/menu";
import type { MenuCategory, MenuItem, ShopCategory } from "@/types/menu";
import { cn } from "@/lib/utils";
import { Search, X } from "lucide-react";
import {
  SortableTableHead,
  useColumnSort,
} from "@/components/ui/sortable-table-head";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type MenuSortKey = "price" | "itemsSold";

interface MenuTableProps {
  data: MenuItem[];
  categories: MenuCategory[];
  shops: ShopCategory[];
  soldByMenuItemId: Record<string, number>;
}

export function MenuTable({
  data,
  categories,
  shops,
  soldByMenuItemId,
}: MenuTableProps) {
  const [search, setSearch] = useState("");
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());
  const [toggledItems, setToggledItems] = useState<Record<string, boolean>>({});
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedShop, setSelectedShop] = useState<string | null>(null);
  const [availability, setAvailability] = useState<string>("all");
  const [foodType, setFoodType] = useState<FoodType>("all");
  const { sort, toggleSort } = useColumnSort<MenuSortKey>();

  const isFiltered =
    search !== "" ||
    selectedCategory !== null ||
    selectedShop !== null ||
    availability !== "all" ||
    foodType !== "all";

  const itemsWithoutCategoryFilter = useMemo(() => {
    const query = search.toLowerCase();

    return data.reduce((acc, item) => {
      if (deletedIds.has(item.id)) return acc;
      if (selectedShop && item.shopId !== selectedShop) return acc;

      const isAvailable = toggledItems[item.id] ?? item.isAvailable;
      
      if (availability === "available" && !isAvailable) return acc;
      if (availability === "unavailable" && isAvailable) return acc;
      if (foodType === "veg" && !item.isVeg) return acc;
      if (foodType === "nonveg" && item.isVeg) return acc;

      if (
        query &&
        !item.name.toLowerCase().includes(query) &&
        !item.menuCategory?.name.toLowerCase().includes(query)
      ) {
        return acc;
      }

      acc.push({ ...item, isAvailable });
      return acc;
    }, [] as MenuItem[]);
  }, [
    data,
    deletedIds,
    toggledItems,
    selectedShop,
    availability,
    foodType,
    search,
  ]);

  const items = useMemo(() => {
    if (!selectedCategory) return itemsWithoutCategoryFilter;
    return itemsWithoutCategoryFilter.filter(
      (item) => item.menuCategoryId === selectedCategory
    );
  }, [itemsWithoutCategoryFilter, selectedCategory]);

  const sortedItems = useMemo(() => {
    if (!sort) return items;

    const copy = [...items];
    copy.sort((a, b) => {
      const delta =
        sort.key === "price"
          ? Number(a.price) - Number(b.price)
          : (soldByMenuItemId[a.id] ?? 0) - (soldByMenuItemId[b.id] ?? 0);

      return sort.desc ? -delta : delta;
    });
    return copy;
  }, [items, sort, soldByMenuItemId]);

  const pagination = usePagination({ data: sortedItems, itemsPerPage: 10 });

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
      {/* same chips as the order window's menu */}
      <div className='flex flex-wrap items-center gap-2'>
        {[null, ...categories].map((cat) => {
          const count = cat
            ? itemsWithoutCategoryFilter.filter(
                (i) => i.menuCategoryId === cat.id,
              ).length
            : itemsWithoutCategoryFilter.length;
          const selected = selectedCategory === (cat?.id ?? null);

          return (
            <Button
              key={cat?.id ?? "all"}
              variant={selected ? "default" : "outline"}
              size='sm'
              aria-pressed={selected}
              onClick={() => setSelectedCategory(cat?.id ?? null)}
            >
              {cat ? cat.name : "All"}
              <span
                className={cn(
                  "font-normal tabular-nums",
                  selected ? "opacity-80" : "text-muted-foreground",
                )}
              >
                {count}
              </span>
            </Button>
          );
        })}
      </div>
      <div className='flex items-center justify-between gap-4 flex-wrap'>
        <div className='relative w-full max-w-sm flex-1 min-w-[200px]'>
          <Search className='absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground' />
          <Input
            placeholder='Search menu item...'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className='pl-8'
          />
        </div>

        <div className='flex items-center gap-2'>
          {shops.length > 0 && (
            <Select
              value={selectedShop ?? "all"}
              onValueChange={(v) => setSelectedShop(v === "all" ? null : v)}
            >
              <SelectTrigger className='w-[140px]'>
                <SelectValue placeholder='All Shops' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All Shops</SelectItem>
                {shops.map((shop) => (
                  <SelectItem key={shop.id} value={shop.id}>
                    {shop.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Select
            value={foodType}
            onValueChange={(value) => setFoodType(value as FoodType)}
          >
            <SelectTrigger className='w-[140px]' aria-label='Type'>
              <SelectValue placeholder='Type' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Types</SelectItem>
              <SelectItem value='veg'>
                <VegMark isVeg />
                Veg
              </SelectItem>
              <SelectItem value='nonveg'>
                <VegMark isVeg={false} />
                Non-veg
              </SelectItem>
            </SelectContent>
          </Select>

          <Select value={availability} onValueChange={setAvailability}>
            <SelectTrigger className='w-[140px]'>
              <SelectValue placeholder='Availability' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Status</SelectItem>
              <SelectItem value='available'>Available</SelectItem>
              <SelectItem value='unavailable'>Unavailable</SelectItem>
            </SelectContent>
          </Select>

          {isFiltered && (
            <Button
              variant='ghost'
              className='px-3'
              onClick={() => {
                setSearch("");
                setSelectedCategory(null);
                setSelectedShop(null);
                setAvailability("all");
                setFoodType("all");
              }}
            >
              <X className='h-4 w-4 mr-2' />
              Clear
            </Button>
          )}
        </div>
      </div>

      <div className='border overflow-x-auto'>
        <Table>
          <TableHeader className='bg-muted'>
            <TableRow>
              <TableHead>Item</TableHead>
              <SortableTableHead
                label="Price"
                sortKey="price"
                sort={sort}
                onSort={toggleSort}
              />
              <TableHead>Unit</TableHead>
              {/* the category chips already say it */}
              {!selectedCategory && <TableHead>Category</TableHead>}
              <TableHead>Shop</TableHead>
              <SortableTableHead
                label="Items sold"
                sortKey="itemsSold"
                sort={sort}
                onSort={toggleSort}
              />
              <TableHead>Available</TableHead>
              <TableHead className='w-[100px]' />
            </TableRow>
          </TableHeader>
          <TableBody>
            {pagination.paginatedData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={selectedCategory ? 7 : 8}
                  className='text-center text-muted-foreground py-8'
                >
                  {search ? (
                    <>
                      No menu items found for{" "}
                      <span className='font-semibold'>{search}</span>
                    </>
                  ) : (
                    "No menu items match these filters"
                  )}
                </TableCell>
              </TableRow>
            ) : (
              pagination.paginatedData.map((item) => (
                <TableRow
                  key={item.id}
                  // unavailable items fade, except the switch and actions
                  className={cn(
                    !item.isAvailable &&
                      "[&>td:not(:nth-last-child(-n+2))]:opacity-45",
                  )}
                >
                  <TableCell className='font-medium'>
                    <span className='flex items-center gap-3'>
                      <ItemThumb item={item} />
                      {item.name}
                    </span>
                  </TableCell>
                  <TableCell>{formatCurrency(item.price)}</TableCell>
                  <TableCell className='text-muted-foreground'>
                    {item.unit}
                  </TableCell>
                  {!selectedCategory && (
                    <TableCell>{item.menuCategory?.name ?? "—"}</TableCell>
                  )}
                  <TableCell>{item.shop?.name ?? "—"}</TableCell>

                  <TableCell className='tabular-nums'>
                    {soldByMenuItemId[item.id] ?? 0}
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

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

// photo (or letters when there's none), with the veg mark on its corner
function ItemThumb({ item }: { item: MenuItem }) {
  return (
    <span className='relative shrink-0'>
      <span className='grid h-10 w-10 place-items-center overflow-hidden bg-muted font-heading text-sm text-muted-foreground'>
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt=''
            loading='lazy'
            decoding='async'
            className='h-full w-full object-cover'
          />
        ) : (
          <span aria-hidden>{initials(item.name)}</span>
        )}
      </span>
      <VegMark
        isVeg={item.isVeg}
        className='absolute -bottom-1 -right-1 h-4 w-4 shadow-sm'
      />
    </span>
  );
}
