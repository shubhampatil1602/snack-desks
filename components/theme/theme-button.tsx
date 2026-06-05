"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";

export function ModeToggle() {
  const { setTheme, theme } = useTheme();

  return (
    <div>
      {theme === "light" ? (
        <Button variant='ghost' size='icon' onClick={() => setTheme("dark")}>
          <Sun className='size-4' />
        </Button>
      ) : (
        <Button variant='ghost' size='icon' onClick={() => setTheme("light")}>
          <Moon className='size-4' />
        </Button>
      )}
    </div>
  );
}
