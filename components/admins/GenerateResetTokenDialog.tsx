"use client";

import { useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { generatePasswordResetToken } from "@/actions/reset-password";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Copy, Check } from "lucide-react";

type GenerateResetTokenDialogProps = {
  userId: string;
};

export function GenerateResetTokenDialog({
  userId,
}: GenerateResetTokenDialogProps) {
  const [open, setOpen] = useState(false);
  const [expiry, setExpiry] = useState("");
  const [token, setToken] = useState<string | undefined>("");
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const router = useRouter();

  async function handleGenerate() {
    setIsGenerating(true);
    try {
      const result = await generatePasswordResetToken(
        userId,
        Number(expiry) as 1 | 15 | 60,
      );

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      setToken(result.token);

      // Auto copy the token
      if (result.token) {
        await navigator.clipboard.writeText(result.token);
        setCopied(true);
        toast.success("Token copied to clipboard!");

        // Reset copy feedback after 2 seconds
        setTimeout(() => {
          setCopied(false);
        }, 2000);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate token");
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleCopyToken() {
    if (!token) return;
    await navigator.clipboard.writeText(token);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  }

  function handleOpenChange(open: boolean) {
    if (!open) {
      // Reset state when closing
      setTimeout(() => {
        setExpiry("");
        setToken("");
        setCopied(false);
      }, 200);
    }
    setOpen(open);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size='sm' variant='outline'>
          Generate Token
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Generate Password Reset Token</DialogTitle>
          <DialogDescription>
            Select expiry duration and generate a token.
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4'>
          {/* Radio Group - Always visible */}
          <RadioGroup
            value={expiry}
            onValueChange={setExpiry}
            disabled={!!token}
          >
            <div className='flex items-center gap-2'>
              <RadioGroupItem value='1' id='1min' />
              <Label htmlFor='1min'>1 minute</Label>
            </div>

            <div className='flex items-center gap-2'>
              <RadioGroupItem value='15' id='15min' />
              <Label htmlFor='15min'>15 minutes</Label>
            </div>

            <div className='flex items-center gap-2'>
              <RadioGroupItem value='60' id='1hour' />
              <Label htmlFor='1hour'>1 hour</Label>
            </div>
          </RadioGroup>

          {/* Generate Button - Always visible */}
          <Button
            className='w-full'
            disabled={!expiry || !!token || isGenerating}
            onClick={handleGenerate}
          >
            {isGenerating ? "Generating..." : "Generate Token"}
          </Button>

          {/* Token Display - Shown after generation */}
          {token && (
            <div className='space-y-3 border-t pt-4'>
              <div className='rounded-md border p-3 font-mono text-center break-all bg-muted'>
                {token}
              </div>

              <p className='text-xs text-muted-foreground text-center'>
                Token copied to clipboard!{" "}
                {!copied && "Copy it now. It will not be shown again."}
              </p>

              <Button
                className='w-full gap-2'
                variant='outline'
                onClick={handleCopyToken}
              >
                {copied ? (
                  <>
                    <Check className='h-4 w-4 text-green-500' />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className='h-4 w-4' />
                    Copy Token
                  </>
                )}
              </Button>

              <Button
                className='w-full'
                variant='secondary'
                onClick={() => {
                  setToken("");
                  setCopied(false);
                  setOpen(false);
                  router.refresh();
                }}
              >
                Done
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
