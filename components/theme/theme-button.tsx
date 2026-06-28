"use client";

import { Moon, Sun, Check } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { useThemeColor } from "./theme-color-provider";

const THEMES = [
  {
    id: "default",
    name: "Default",
    light: {
      bg: "bg-white",
      primary: "bg-slate-900",
      secondary: "bg-slate-100",
      border: "border-slate-300",
    },
    dark: {
      bg: "bg-zinc-950",
      primary: "bg-zinc-100",
      secondary: "bg-zinc-800",
      border: "border-zinc-800",
    },
  },
  {
    id: "claude",
    name: "Claude",
    light: {
      bg: "bg-[#f4f3ef]",
      primary: "bg-[#d97757]",
      secondary: "bg-[#e8e6e1]",
      border: "border-[#cdcbc6]",
    },
    dark: {
      bg: "bg-[#3a3939]",
      primary: "bg-[#e3805f]",
      secondary: "bg-[#2b2a2a]",
      border: "border-[#666666]",
    },
  },
];

export function ModeToggle() {
  const { setTheme, resolvedTheme } = useTheme();
  const { themeColor, setThemeColor } = useThemeColor();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='ghost' size='icon'>
          <Sun className='h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0' />
          <Moon className='absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100' />
          <span className='sr-only'>Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-56'>
        <div className='flex px-2 py-2 gap-1'>
          <Button
            variant={resolvedTheme === "light" ? "secondary" : "ghost"}
            size='sm'
            className='flex-1 text-xs h-8'
            onClick={(e) => {
              e.preventDefault();
              setTheme("light");
            }}
          >
            Light
          </Button>
          <Button
            variant={resolvedTheme === "dark" ? "secondary" : "ghost"}
            size='sm'
            className='flex-1 text-xs h-8'
            onClick={(e) => {
              e.preventDefault();
              setTheme("dark");
            }}
          >
            Dark
          </Button>
        </div>

        <DropdownMenuSeparator />

        {resolvedTheme === "light" ? (
          <>
            <DropdownMenuLabel className='text-xs text-muted-foreground font-normal'>
              Light Themes
            </DropdownMenuLabel>
            {THEMES.map((t) => (
              <DropdownMenuItem
                key={t.id}
                onClick={() => setThemeColor(t.id)}
                className='justify-between cursor-pointer py-2'
              >
                <div className='flex items-center gap-3'>
                  <div className='flex gap-1 items-center'>
                    <div
                      className={`h-4 w-4 rounded-full border ${t.light.border} ${t.light.bg.startsWith("bg-[") ? "" : t.light.bg}`}
                      style={
                        t.light.bg.startsWith("bg-[")
                          ? { backgroundColor: t.light.bg.slice(4, -1) }
                          : {}
                      }
                    />
                    <div
                      className={`h-4 w-4 rounded-full border ${t.light.border} ${t.light.primary.startsWith("bg-[") ? "" : t.light.primary}`}
                      style={
                        t.light.primary.startsWith("bg-[")
                          ? { backgroundColor: t.light.primary.slice(4, -1) }
                          : {}
                      }
                    />
                    <div
                      className={`h-4 w-4 rounded-full border ${t.light.border} ${t.light.secondary.startsWith("bg-[") ? "" : t.light.secondary}`}
                      style={
                        t.light.secondary.startsWith("bg-[")
                          ? { backgroundColor: t.light.secondary.slice(4, -1) }
                          : {}
                      }
                    />
                  </div>
                  <span className='text-sm'>{t.name}</span>
                </div>
                {themeColor === t.id && <Check className='h-4 w-4' />}
              </DropdownMenuItem>
            ))}
          </>
        ) : (
          <>
            <DropdownMenuLabel className='text-xs text-muted-foreground font-normal'>
              Dark Themes
            </DropdownMenuLabel>
            {THEMES.map((t) => (
              <DropdownMenuItem
                key={t.id}
                onClick={() => setThemeColor(t.id)}
                className='justify-between cursor-pointer py-2'
              >
                <div className='flex items-center gap-3'>
                  <div className='flex gap-1 items-center'>
                    <div
                      className={`h-4 w-4 rounded-full border ${t.dark.border} ${t.dark.bg.startsWith("bg-[") ? "" : t.dark.bg}`}
                      style={
                        t.dark.bg.startsWith("bg-[")
                          ? { backgroundColor: t.dark.bg.slice(4, -1) }
                          : {}
                      }
                    />
                    <div
                      className={`h-4 w-4 rounded-full ${t.dark.primary.startsWith("bg-[") ? "" : t.dark.primary}`}
                      style={
                        t.dark.primary.startsWith("bg-[")
                          ? { backgroundColor: t.dark.primary.slice(4, -1) }
                          : {}
                      }
                    />
                    <div
                      className={`h-4 w-4 rounded-full ${t.dark.secondary.startsWith("bg-[") ? "" : t.dark.secondary}`}
                      style={
                        t.dark.secondary.startsWith("bg-[")
                          ? { backgroundColor: t.dark.secondary.slice(4, -1) }
                          : {}
                      }
                    />
                  </div>
                  <span className='text-sm'>{t.name}</span>
                </div>
                {themeColor === t.id && <Check className='h-4 w-4' />}
              </DropdownMenuItem>
            ))}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
