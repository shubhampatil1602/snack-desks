"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";
import Link from "next/link";
import { useChat } from "@ai-sdk/react";
import {
  DefaultChatTransport,
  lastAssistantMessageIsCompleteWithToolCalls,
  type UIMessage,
} from "ai";
import { nanoid } from "nanoid";
import { toast } from "sonner";
import {
  ArrowUp,
  CircleCheck,
  CircleX,
  Clock,
  MessagesSquare,
  Plus,
  RotateCcw,
  Square,
  Store,
  Trash2,
} from "lucide-react";

import type { SnackyDataTools } from "@/modules/snacky/data-tools";
import type { SnackyChatSummary } from "@/modules/snacky/chats";
import {
  deleteSnackyChatAction,
  getSnackyChatAction,
  getWindowToDeleteAction,
} from "@/actions/snacky";
import { closeWindowAction, createWindowAction } from "@/actions/order-window";
import { deleteOrderWindowAction } from "@/actions/delete-order-window";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useSidebar } from "@/components/ui/sidebar";
import { SnackyMark } from "@/components/snacky-mark";
import { SnackyInline } from "@/components/snacky-text";
import { cn, formatCurrency } from "@/lib/utils";

type SnackyMessage = UIMessage<unknown, never, SnackyDataTools>;
type Part = SnackyMessage["parts"][number];
type Shop = { id: string; name: string };
type ActiveChat = { id: string; messages: UIMessage[] };

type WindowStarter = { label: string; shops: string[]; tagline?: string; prompt: string };

const LOOKING_AT: Record<string, string> = {
  "tool-spendBreakdown": "Adding up spend…",
  "tool-orderWindows": "Looking at order windows…",
  "tool-windowSummary": "Going through the window…",
  "tool-windowWinners": "Counting spin wins…",
  "tool-members": "Checking who's in the org…",
  "tool-menuItems": "Reading the menu…",
  "tool-openOrderWindow": "Getting the window ready…",
  "tool-closeOrderWindow": "Getting ready to close the window…",
  "tool-deleteOrderWindow": "Finding the window to delete…",
};

const DISCLAIMER = "Chats are deleted 24 hours after they start.";

// keeps ?chat= in the address bar, so a reload comes back to the same chat
// a short "yes" or "no" typed under a card answers the card. Anything that
// changes it ("yes but only RK") goes to Snacky to propose again
const CHANGES = /\b(but|only|without|instead|change|add|remove|except|also|not|with)\b/i;
const YES = /^(y|ya|yes|yeah|yep|yup|haan|han|ha|ok|okay|sure|confirm|confirmed|go|go ahead|do it|done|open|open it|close|close it|delete|delete it)\b/i;
const NO = /^(n|no|nope|nah|nahi|cancel|stop|dont|don't|keep it|keep it open|leave it)\b/i;

function typedAnswer(text: string): "yes" | "no" | null {
  const clean = text.trim().replace(/[.!]+$/, "");
  if (clean.split(/\s+/).length > 6 || CHANGES.test(clean)) return null;
  if (NO.test(clean)) return "no";
  if (YES.test(clean)) return "yes";
  return null;
}

function showChatInUrl(id: string | null) {
  window.history.replaceState(null, "", id ? `?chat=${id}` : window.location.pathname);
}

export function AskSnacky({
  initialChats,
  initialChat,
  shops,
  windowStarters,
}: {
  initialChats: SnackyChatSummary[];
  initialChat: ActiveChat | null;
  shops: Shop[];
  // the org's usual windows, from its history
  windowStarters: WindowStarter[];
}) {
  const [chats, setChats] = useState(initialChats);
  const [active, setActive] = useState<ActiveChat>(
    () => initialChat ?? { id: nanoid(), messages: [] },
  );
  const [chatsOpen, setChatsOpen] = useState(false);

  // The chat list takes the app sidebar's place here: the sidebar folds to
  // icons on arrival and goes back to how it was on leaving
  const { open: sidebarOpen, setOpen: setSidebarOpen } = useSidebar();
  const readSidebarOpen = useEffectEvent(() => sidebarOpen);
  const foldSidebar = useEffectEvent((open: boolean) => setSidebarOpen(open));
  useEffect(() => {
    const wasOpen = readSidebarOpen();
    foldSidebar(false);
    return () => foldSidebar(wasOpen);
  }, []);

  function newChat() {
    setChatsOpen(false);
    setActive({ id: nanoid(), messages: [] });
    showChatInUrl(null);
  }

  async function openChat(id: string) {
    setChatsOpen(false);
    if (id === active.id) return;
    const chat = await getSnackyChatAction(id);
    if (!chat) {
      toast.error("That chat has been deleted");
      setChats((list) => list.filter((c) => c.id !== id));
      return;
    }
    setActive({ id: chat.id, messages: chat.messages });
    showChatInUrl(chat.id);
  }

  async function removeChat(id: string) {
    setChats((list) => list.filter((c) => c.id !== id));
    if (id === active.id) newChat();
    await deleteSnackyChatAction(id);
  }

  // the first question names the chat and puts it at the top of the list
  function onStarted(title: string) {
    const id = active.id;
    setChats((list) =>
      list.some((c) => c.id === id)
        ? list
        : [{ id, title: title.slice(0, 60), createdAt: new Date() }, ...list],
    );
    showChatInUrl(id);
  }

  const chatList = (
    <ChatList chats={chats} activeId={active.id} onOpen={openChat} onDelete={removeChat} />
  );

  return (
    <div className='grid h-[calc(100svh-var(--header-height)-2.5rem)] min-h-[30rem] gap-4 lg:grid-cols-[15rem_minmax(0,1fr)]'>
      <aside className='hidden min-h-0 min-w-0 flex-col border bg-card lg:flex'>
        <div className='border-b p-2'>
          <Button variant='outline' className='w-full justify-start' onClick={newChat}>
            <Plus /> New chat
          </Button>
        </div>
        <div className='min-h-0 flex-1 overflow-x-hidden overflow-y-auto p-2'>{chatList}</div>
        <p className='flex gap-1.5 border-t p-3 text-xs text-muted-foreground'>
          <Clock className='mt-px size-3.5 shrink-0' />
          {DISCLAIMER}
        </p>
      </aside>

      <ChatPane
        key={active.id}
        chat={active}
        shops={shops}
        windowStarters={windowStarters}
        onStarted={onStarted}
        header={
          <div className='flex items-center gap-1 lg:hidden'>
            <Popover open={chatsOpen} onOpenChange={setChatsOpen}>
              <PopoverTrigger asChild>
                <Button variant='ghost' size='icon' aria-label='Chats'>
                  <MessagesSquare />
                </Button>
              </PopoverTrigger>
              <PopoverContent align='end' className='w-72 p-2'>
                <div className='max-h-[50svh] overflow-y-auto'>{chatList}</div>
                <p className='mt-2 border-t px-1 pt-2 text-xs text-muted-foreground'>{DISCLAIMER}</p>
              </PopoverContent>
            </Popover>
            <Button variant='ghost' size='icon' aria-label='New chat' onClick={newChat}>
              <Plus />
            </Button>
          </div>
        }
      />
    </div>
  );
}

function ChatList({
  chats,
  activeId,
  onOpen,
  onDelete,
}: {
  chats: SnackyChatSummary[];
  activeId: string;
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  if (chats.length === 0) {
    return <p className='px-2 py-3 text-sm text-muted-foreground'>No chats yet.</p>;
  }
  return (
    <ul className='grid min-w-0 grid-cols-1 gap-0.5'>
      {chats.map((chat) => (
        <li key={chat.id} className='group relative min-w-0'>
          <button
            type='button'
            onClick={() => onOpen(chat.id)}
            title={chat.title}
            className={cn(
              "block w-full min-w-0 truncate border-l-2 border-transparent py-2 pr-8 pl-3 text-left text-sm text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground",
              chat.id === activeId && "border-primary bg-primary/10 font-medium text-foreground",
            )}
          >
            {chat.title}
          </button>
          <button
            type='button'
            onClick={() => onDelete(chat.id)}
            aria-label={`Delete "${chat.title}"`}
            className='absolute top-1/2 right-1 -translate-y-1/2 p-1 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-destructive focus-visible:opacity-100'
          >
            <Trash2 className='size-3.5' />
          </button>
        </li>
      ))}
    </ul>
  );
}

function ChatPane({
  chat,
  shops,
  windowStarters,
  onStarted,
  header,
}: {
  chat: ActiveChat;
  shops: Shop[];
  windowStarters: WindowStarter[];
  onStarted: (title: string) => void;
  header: React.ReactNode;
}) {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const [transport] = useState(
    () =>
      new DefaultChatTransport<SnackyMessage>({
        api: "/api/snacky",
        // the server keeps the chat; send only the newest message
        prepareSendMessagesRequest: ({ id, messages }) => ({
          body: { id, message: messages.at(-1) },
        }),
      }),
  );
  const { messages, sendMessage, status, stop, error, clearError, addToolOutput, regenerate } =
    useChat<SnackyMessage>({
      id: chat.id,
      messages: chat.messages as SnackyMessage[],
      transport,
      // carry on once the admin has confirmed or cancelled a window
      sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
    });

  const busy = status === "submitted" || status === "streaming";

  // only the conversation scrolls; the box to type in stays put
  useEffect(() => {
    const box = scrollRef.current;
    box?.scrollTo({ top: box.scrollHeight, behavior: "smooth" });
  }, [messages, status]);

  function ask(text: string) {
    const question = text.trim();
    if (!question || busy) return;
    // the card's own button, so a typed yes does exactly what a click does
    const answer = typedAnswer(question);
    const button =
      answer &&
      [
        ...(scrollRef.current?.querySelectorAll<HTMLButtonElement>(
          answer === "yes" ? "[data-card-yes]" : "[data-card-no]",
        ) ?? []),
      ].at(-1);
    if (button) {
      if (!button.disabled) button.click();
      setInput("");
      return;
    }
    clearError();
    if (messages.length === 0) onStarted(question);
    sendMessage({ text: question });
    setInput("");
  }

  return (
    <section className='flex min-h-0 flex-col border bg-card'>
      <header className='flex items-center gap-3 border-b px-4 py-2.5'>
        <SnackyMark />
        <div className='min-w-0 flex-1'>
          <h1 className='font-heading text-base leading-tight'>Ask Snacky</h1>
          <p className='truncate text-xs text-muted-foreground'>
            Questions about orders, spend, people and the menu, or open a window
          </p>
        </div>
        {header}
      </header>

      <div ref={scrollRef} className='min-h-0 flex-1 space-y-5 overflow-y-auto p-4'>
        {messages.length === 0 && (
          <div className='mx-auto flex max-w-xl flex-col items-center gap-4 py-10 text-center'>
            <SnackyMark className='size-12' />
            <div>
              <p className='font-heading text-lg'>Hi, I&apos;m Snacky</p>
              <p className='text-sm text-muted-foreground'>
                Ask me anything about your org&apos;s snack orders.
              </p>
            </div>
            <WindowStarters starters={windowStarters} onPick={ask} />
          </div>
        )}

        {messages.map((message) =>
          message.role === "user" ? (
            <div key={message.id} className='flex justify-end'>
              <p className='max-w-[80%] bg-primary px-3 py-2 text-sm whitespace-pre-wrap text-primary-foreground'>
                {message.parts.map((part) => (part.type === "text" ? part.text : "")).join("")}
              </p>
            </div>
          ) : (
            <div key={message.id} className='flex gap-3'>
              <SnackyMark />
              <div className='min-w-0 flex-1 space-y-3 pt-0.5'>
                {message.parts.map((part, index) =>
                  part.type === "tool-openOrderWindow" ? (
                    <WindowProposal
                      key={index}
                      part={part}
                      shops={shops}
                      onDone={(output) =>
                        addToolOutput({
                          tool: "openOrderWindow",
                          toolCallId: part.toolCallId,
                          output,
                        })
                      }
                    />
                  ) : part.type === "tool-deleteOrderWindow" ? (
                    <DeleteProposal
                      key={index}
                      part={part}
                      onDone={(output) =>
                        addToolOutput({
                          tool: "deleteOrderWindow",
                          toolCallId: part.toolCallId,
                          output,
                        })
                      }
                    />
                  ) : part.type === "tool-closeOrderWindow" ? (
                    <CloseProposal
                      key={index}
                      part={part}
                      onDone={(output) =>
                        addToolOutput({
                          tool: "closeOrderWindow",
                          toolCallId: part.toolCallId,
                          output,
                        })
                      }
                    />
                  ) : (
                    <AnswerPart key={index} part={part} />
                  ),
                )}
              </div>
            </div>
          ),
        )}

        {status === "submitted" && (
          <div className='flex gap-3'>
            <SnackyMark />
            <p className='flex items-center gap-2 pt-1 text-sm text-muted-foreground'>
              <Spinner /> Thinking…
            </p>
          </div>
        )}

        {error && (
          <div className='flex items-center gap-3 text-sm text-destructive'>
            <p>{error.message || "Snacky couldn't answer that. Try again."}</p>
            <Button size='sm' variant='outline' onClick={() => regenerate()}>
              <RotateCcw /> Retry
            </Button>
          </div>
        )}
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          ask(input);
        }}
        className='flex items-end gap-2 border-t p-3'
      >
        <textarea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              ask(input);
            }
          }}
          rows={1}
          maxLength={500}
          placeholder='Ask Snacky… e.g. "Who ordered the most samosas in October?"'
          className='field-sizing-content max-h-40 min-h-9 flex-1 resize-none bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground'
        />
        {busy ? (
          <Button type='button' size='icon' variant='outline' aria-label='Stop' onClick={stop}>
            <Square />
          </Button>
        ) : (
          <Button type='submit' size='icon' aria-label='Ask' disabled={!input.trim()}>
            <ArrowUp />
          </Button>
        )}
      </form>
    </section>
  );
}

// the org's usual windows as a short list: label and shops, then the
// tagline it last used
function WindowStarters({
  starters,
  onPick,
}: {
  starters: WindowStarter[];
  onPick: (text: string) => void;
}) {
  if (starters.length === 0) {
    starters = [{ label: "Tea", shops: [], prompt: "Open a tea window" }];
  }
  return (
    <div className='w-full max-w-md space-y-2 text-left'>
      <p className='text-center text-xs font-semibold text-muted-foreground'>Open a usual window</p>
      <ul className='divide-y border'>
        {starters.map((starter) => (
          <li key={starter.prompt}>
            <button
              type='button'
              onClick={() => onPick(starter.prompt)}
              className='block w-full min-w-0 px-3 py-2 text-left transition-colors hover:bg-muted/60'
            >
              <span className='flex items-baseline gap-2'>
                <span className='truncate text-sm font-medium'>{starter.label}</span>
                {starter.shops.length > 0 && (
                  <span className='truncate text-xs text-muted-foreground'>
                    {starter.shops.join(", ")}
                  </span>
                )}
              </span>
              <span className='block truncate text-xs text-muted-foreground italic'>
                {starter.tagline ? `"${starter.tagline}"` : "Snacky writes the tagline"}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

type WindowPart = Extract<Part, { type: "tool-openOrderWindow" }>;
type WindowOutcome = { opened: boolean; note: string };

// Snacky only proposes the window; it opens when the admin clicks Open
function WindowProposal({
  part,
  shops,
  onDone,
}: {
  part: WindowPart;
  shops: Shop[];
  onDone: (outcome: WindowOutcome) => void;
}) {
  const [opening, setOpening] = useState(false);
  // Snacky's pick of shops, which the admin can change before opening
  const [pickedIds, setPickedIds] = useState<string[] | null>(null);

  if (part.state === "input-streaming") {
    return (
      <p className='flex items-center gap-2 text-sm text-muted-foreground'>
        <Spinner /> {LOOKING_AT[part.type]}
      </p>
    );
  }
  if (part.state === "output-available") {
    return part.output.opened ? (
      <p className='flex flex-wrap items-center gap-2 text-sm'>
        <CircleCheck className='size-4 text-emerald-600' />
        Window opened.
        <Link href='/admin/order-window' className='text-primary underline-offset-4 hover:underline'>
          Go to order window
        </Link>
      </p>
    ) : (
      <p className='flex items-center gap-2 text-sm text-muted-foreground'>
        <CircleX className='size-4' /> Not opened: {part.output.note}
      </p>
    );
  }
  if (part.state !== "input-available") return null;

  const { label, tagline, durationMinutes } = part.input;
  const wanted = (part.input.shops ?? []).map((name) => name.trim().toLowerCase());
  const selected =
    pickedIds ?? shops.filter((shop) => wanted.includes(shop.name.toLowerCase())).map((shop) => shop.id);
  const picked = shops.filter((shop) => selected.includes(shop.id));
  const toggle = (id: string) =>
    setPickedIds(selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id]);

  async function open() {
    setOpening(true);
    const result = await createWindowAction({
      label: label.trim().slice(0, 25),
      tagline: tagline?.trim() || undefined,
      duration: durationMinutes,
      shopIds: picked.map((shop) => shop.id),
    });
    setOpening(false);
    if (result.success) {
      toast.success("Order window opened");
      onDone({ opened: true, note: `Opened "${label}"` });
    } else {
      onDone({ opened: false, note: result.error ?? "It couldn't be opened" });
    }
  }

  return (
    <div className='max-w-md space-y-3 border p-4'>
      <p className='text-xs font-semibold tracking-wider text-muted-foreground uppercase'>
        Open this order window?
      </p>
      <div>
        <p className='font-heading text-lg leading-tight'>{label}</p>
        {tagline && <p className='text-sm text-muted-foreground'>{tagline}</p>}
      </div>
      <div className='space-y-1.5'>
        <p className='text-xs text-muted-foreground'>Shops (tap to change)</p>
        <div className='flex flex-wrap gap-1.5'>
          {shops.map((shop) => {
            const on = selected.includes(shop.id);
            return (
              <button
                key={shop.id}
                type='button'
                aria-pressed={on}
                disabled={opening}
                onClick={() => toggle(shop.id)}
                className={cn(
                  "inline-flex items-center gap-1 border px-2 py-0.5 text-xs transition-colors",
                  on
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-dashed text-muted-foreground hover:text-foreground",
                )}
              >
                <Store className='size-3' /> {shop.name}
              </button>
            );
          })}
        </div>
      </div>
      <p className='flex items-center gap-1 text-xs text-muted-foreground'>
        <Clock className='size-3' />
        {durationMinutes ? `Closes in ${durationMinutes} min` : "No timer"}
      </p>
      <div className='flex gap-2'>
        <Button size='sm' data-card-yes onClick={open} disabled={opening || picked.length === 0}>
          {opening && <Spinner />} Open window
        </Button>
        <Button
          size='sm'
          variant='outline'
          disabled={opening}
          data-card-no
          onClick={() => onDone({ opened: false, note: "The admin cancelled" })}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}

type ClosePart = Extract<Part, { type: "tool-closeOrderWindow" }>;

// closing ends ordering for everyone, so the admin confirms it here
function CloseProposal({
  part,
  onDone,
}: {
  part: ClosePart;
  onDone: (outcome: { closed: boolean; note: string }) => void;
}) {
  const [closing, setClosing] = useState(false);

  if (part.state === "input-streaming") {
    return (
      <p className='flex items-center gap-2 text-sm text-muted-foreground'>
        <Spinner /> {LOOKING_AT[part.type]}
      </p>
    );
  }
  if (part.state === "output-available") {
    return part.output.closed ? (
      <p className='flex flex-wrap items-center gap-2 text-sm'>
        <CircleCheck className='size-4 text-emerald-600' />
        Window closed.
        <Link href='/admin/history' className='text-primary underline-offset-4 hover:underline'>
          Go to history to spin
        </Link>
      </p>
    ) : (
      <p className='flex items-center gap-2 text-sm text-muted-foreground'>
        <CircleX className='size-4' /> Not closed: {part.output.note}
      </p>
    );
  }
  if (part.state !== "input-available") return null;
  const { windowId, label } = part.input;

  async function close() {
    setClosing(true);
    const result = await closeWindowAction(windowId);
    setClosing(false);
    if (result.success) {
      toast.success("Order window closed");
      onDone({ closed: true, note: `Closed "${label}"` });
    } else {
      onDone({ closed: false, note: result.error ?? "It couldn't be closed" });
    }
  }

  return (
    <div className='max-w-md space-y-3 border p-4'>
      <p className='text-xs font-semibold tracking-wider text-muted-foreground uppercase'>
        Close this order window?
      </p>
      <p className='font-heading text-lg leading-tight'>{label}</p>
      <p className='text-sm text-muted-foreground'>
        People won&apos;t be able to place or change orders after this.
      </p>
      <div className='flex gap-2'>
        <Button size='sm' variant='destructive' data-card-yes onClick={close} disabled={closing}>
          {closing && <Spinner />} Close window
        </Button>
        <Button
          size='sm'
          variant='outline'
          disabled={closing}
          data-card-no
          onClick={() => onDone({ closed: false, note: "The admin kept it open" })}
        >
          Keep open
        </Button>
      </div>
    </div>
  );
}

type DeletePart = Extract<Part, { type: "tool-deleteOrderWindow" }>;
type WindowToDelete = Awaited<ReturnType<typeof getWindowToDeleteAction>>;

// deleting can't be undone, so the card shows the window as it is in the
// database (not Snacky's description of it) and the admin confirms
function DeleteProposal({
  part,
  onDone,
}: {
  part: DeletePart;
  onDone: (outcome: { deleted: boolean; note: string }) => void;
}) {
  const windowId = part.state === "input-available" ? part.input.windowId : null;
  const [found, setFound] = useState<{ id: string; result: WindowToDelete } | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!windowId) return;
    let live = true;
    getWindowToDeleteAction(windowId).then((result) => {
      if (live) setFound({ id: windowId, result });
    });
    return () => {
      live = false;
    };
  }, [windowId]);

  if (part.state === "output-available") {
    return part.output.deleted ? (
      <p className='flex items-center gap-2 text-sm'>
        <CircleCheck className='size-4 text-emerald-600' /> Window deleted.
      </p>
    ) : (
      <p className='flex items-center gap-2 text-sm text-muted-foreground'>
        <CircleX className='size-4' /> Not deleted: {part.output.note}
      </p>
    );
  }
  if (!windowId || found?.id !== windowId) {
    return part.state === "input-streaming" || part.state === "input-available" ? (
      <p className='flex items-center gap-2 text-sm text-muted-foreground'>
        <Spinner /> {LOOKING_AT[part.type]}
      </p>
    ) : null;
  }

  const result = found.result;
  if (!result.success) {
    return (
      <div className='max-w-md space-y-3 border p-4'>
        <p className='text-sm text-muted-foreground'>{result.error}</p>
        <Button size='sm' variant='outline' onClick={() => onDone({ deleted: false, note: result.error })}>
          OK
        </Button>
      </div>
    );
  }
  const target = result.data;

  async function remove() {
    setDeleting(true);
    const outcome = await deleteOrderWindowAction(windowId!);
    setDeleting(false);
    if (outcome.success) {
      toast.success("Order window deleted");
      onDone({ deleted: true, note: `Deleted "${target.label}" from ${target.opened}` });
    } else {
      onDone({ deleted: false, note: outcome.error ?? "It couldn't be deleted" });
    }
  }

  return (
    <div className='max-w-md space-y-3 border border-destructive/40 p-4'>
      <p className='text-xs font-semibold tracking-wider text-muted-foreground uppercase'>
        Delete this order window?
      </p>
      <div>
        <p className='font-heading text-lg leading-tight'>{target.label}</p>
        <p className='text-sm text-muted-foreground'>
          Opened {target.opened} · {target.status === "active" ? "open now" : "closed"}
        </p>
      </div>
      <p className='text-sm text-muted-foreground'>
        {target.orders > 0
          ? `Its ${target.orders} order${target.orders === 1 ? "" : "s"} from ${target.people} ${target.people === 1 ? "person" : "people"} go with it. `
          : "It has no orders. "}
        This can&apos;t be undone.
      </p>
      <div className='flex gap-2'>
        <Button size='sm' variant='destructive' data-card-yes onClick={remove} disabled={deleting}>
          {deleting ? <Spinner /> : <Trash2 />} Delete window
        </Button>
        <Button
          size='sm'
          variant='outline'
          disabled={deleting}
          data-card-no
          onClick={() => onDone({ deleted: false, note: "The admin kept it" })}
        >
          Keep it
        </Button>
      </div>
    </div>
  );
}

function AnswerPart({ part }: { part: Part }) {
  if (part.type === "text") return <Answer text={part.text} />;
  if (!part.type.startsWith("tool-") || !("state" in part)) return null;

  if (part.state === "input-streaming" || part.state === "input-available") {
    return (
      <p className='flex items-center gap-2 text-sm text-muted-foreground'>
        <Spinner /> {LOOKING_AT[part.type] ?? "Looking…"}
      </p>
    );
  }
  if (part.state !== "output-available") return null;

  // lookups (people, menu) feed the answer; only totals get a chart
  if (part.type === "tool-spendBreakdown") return <Breakdown result={part.output} />;
  if (part.type === "tool-windowSummary") return <WindowSummary result={part.output} />;
  if (part.type === "tool-windowWinners") {
    return (
      <Bars
        rows={part.output.winners.map((winner) => ({
          label: winner.name,
          value: winner.wins,
          text: `${winner.wins} won · ${winner.paid} paid`,
        }))}
      />
    );
  }
  if (part.type === "tool-orderWindows") {
    return (
      <Bars
        rows={part.output.windows.map((window) => ({
          label: `${window.label} · ${window.opened}`,
          value: window.spend,
          text: `${formatCurrency(window.spend)} · ${window.orders} orders`,
        }))}
      />
    );
  }
  return null;
}

type WindowSummaryResult = Extract<
  Part,
  { type: "tool-windowSummary"; state: "output-available" }
>["output"];

// one window: what to buy per shop, then each person's share
function WindowSummary({ result }: { result: WindowSummaryResult }) {
  if (!result.found) return null;
  const { window } = result;
  const pending = result.orderStatuses.pending ?? 0;

  return (
    <div className='max-w-xl divide-y border text-sm'>
      <div className='flex flex-wrap items-baseline gap-x-2 px-3 py-2'>
        <span className='font-medium'>{window.label}</span>
        <span className='text-xs text-muted-foreground'>{window.opened}</span>
        <span className='ml-auto text-xs text-muted-foreground'>
          {window.status === "active" ? "Open" : "Closed"}
          {window.winner && ` · ${window.winner} collects`}
          {window.winner && (window.paid ? " · paid" : " · not paid")}
        </span>
      </div>

      {result.toBuy.length > 0 && (
        <div className='space-y-1 px-3 py-2'>
          <p className='text-xs font-semibold text-muted-foreground'>To buy</p>
          {result.toBuy.map((shop) => (
            <p key={shop.shop}>
              <span className='font-medium'>{shop.shop}:</span>{" "}
              <span className='text-muted-foreground'>
                {shop.items.map((item) => `${item.quantity}× ${item.name}`).join(", ")}
              </span>
            </p>
          ))}
        </div>
      )}

      {result.shares.length > 0 && (
        <div className='space-y-1 px-3 py-2'>
          <p className='flex justify-between text-xs font-semibold text-muted-foreground'>
            <span>Who owes what</span>
            <span className='tabular-nums'>
              {formatCurrency(result.total)}
              {pending > 0 && ` · ${pending} pending`}
            </span>
          </p>
          <ul className='max-h-56 overflow-y-auto'>
            {result.shares.map((share) => (
              <li key={share.name} className='flex justify-between gap-3 py-0.5'>
                <span className='truncate'>{share.name}</span>
                <span className='tabular-nums'>{formatCurrency(share.amount)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {result.splits.length > 0 && (
        <div className='space-y-1 px-3 py-2'>
          <p className='text-xs font-semibold text-muted-foreground'>Shared</p>
          {result.splits.map((split, index) => (
            <p key={index} className='text-muted-foreground'>
              <span className='text-foreground'>{split.item}</span> · {split.people.join(", ")}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

type BreakdownResult = Extract<Part, { type: "tool-spendBreakdown"; state: "output-available" }>["output"];

function Breakdown({ result }: { result: BreakdownResult }) {
  // a single total reads fine in the answer itself
  if (result.groupBy === "none" || result.rows.length === 0) return null;
  const metric = result.sortBy;
  const format = (row: BreakdownResult["rows"][number]) => {
    if (metric === "quantity") return `${row.quantity} qty`;
    if (metric === "orders") return `${row.orders} orders`;
    if (metric === "people") return `${row.people} people`;
    return formatCurrency(row.spend);
  };

  return (
    <div className='space-y-1'>
      <Bars
        rows={result.rows.map((row) => ({
          label: row.label,
          value: row[metric],
          text: format(row),
        }))}
      />
      {result.truncated && (
        <p className='text-xs text-muted-foreground'>
          Top {result.rows.length} of {result.groups}
        </p>
      )}
    </div>
  );
}

function Bars({ rows }: { rows: { label: string; value: number; text: string }[] }) {
  if (rows.length === 0) return null;
  const max = Math.max(...rows.map((row) => row.value), 1);

  return (
    <ul className='grid max-h-80 max-w-xl gap-2 overflow-y-auto border p-3 text-sm'>
      {rows.map((row, index) => (
        <li key={`${row.label}-${index}`} className='grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-1'>
          <span className='truncate'>{row.label}</span>
          <span className='text-right font-semibold tabular-nums'>{row.text}</span>
          <span aria-hidden className='col-span-2 h-1 bg-muted'>
            <span
              className='block h-full bg-primary'
              style={{ width: `${Math.max(1, (row.value / max) * 100)}%` }}
            />
          </span>
        </li>
      ))}
    </ul>
  );
}

// Snacky answers in short "- " lines with **bold** numbers
function Answer({ text }: { text: string }) {
  const lines = text.split("\n").map((line) => line.trim()).filter(Boolean);
  if (lines.length === 0) return null;

  return (
    <div className='space-y-1 text-sm leading-relaxed'>
      {lines.map((line, index) => {
        const bullet = /^[-*•]\s+/.test(line);
        return (
          <p key={index} className={cn(bullet && "relative pl-4")}>
            {bullet && <span aria-hidden className='absolute left-0 text-primary'>•</span>}
            <SnackyInline text={line.replace(/^[-*•]\s+/, "")} />
          </p>
        );
      })}
    </div>
  );
}
