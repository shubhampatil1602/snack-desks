"use client";

import { useEffect, useImperativeHandle, useState } from "react";
import { Extension, mergeAttributes } from "@tiptap/core";
import Document from "@tiptap/extension-document";
import Mention from "@tiptap/extension-mention";
import Paragraph from "@tiptap/extension-paragraph";
import Text from "@tiptap/extension-text";
import { Placeholder } from "@tiptap/extensions";
import { PluginKey } from "@tiptap/pm/state";
import { EditorContent, useEditor, type Editor, type Range } from "@tiptap/react";
import type { SuggestionKeyDownProps, SuggestionOptions, SuggestionProps } from "@tiptap/suggestion";

import type { SnackyMenuItem } from "@/modules/snacky/order-draft";

export type SnackyPick = { id: string; label: string; detail: string | null; item?: SnackyMenuItem };

// what the list under the box shows while "/" or "@" is open
export type SnackySuggest = {
  kind: "menu" | "person";
  picks: SnackyPick[];
  highlight: number;
  // nothing else typed, so a menu pick goes straight into the draft
  alone: boolean;
  pick: (index: number) => void;
};

export type SnackyInputHandle = {
  clear: () => void;
  submit: () => void;
  // focus with a "/" at the end, for the page-wide shortcut
  openMenu: () => void;
};

type Person = { id: string; name: string; email?: string | null };

type Live = {
  menu: SnackyMenuItem[];
  people: Person[];
  canShare: boolean;
  placeholder: string;
  onSubmit: (text: string) => void;
  onPickAlone: (item: SnackyMenuItem) => void;
  onSuggest: (suggest: SnackySuggest | null) => void;
};

// the editor is made once, so its callbacks read the latest props from here
class LiveProps {
  constructor(public current: Live) {}
  set(next: Live) {
    this.current = next;
  }
}

const MAX_WORDS = 4;

// items whose first word matches come first; the more words match, the higher
function rank<T>(items: T[], text: (item: T) => string, query: string) {
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length > MAX_WORDS) return [];
  if (words.length === 0) return items.slice(0, 8);
  return items
    .map((item) => {
      const haystack = text(item).toLowerCase();
      return { item, score: words.filter((word) => haystack.includes(word)).length, first: haystack.includes(words[0]) };
    })
    .filter((row) => row.first)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .map((row) => row.item);
}

// The order box's text field: plain words, with "/" for menu items and "@"
// for people turned into chips. Enter sends; the chips read as their names.
export function SnackyInput({
  ref,
  menu,
  people,
  canShare,
  disabled,
  placeholder,
  onSubmit,
  onPickAlone,
  onSuggest,
  onEmptyChange,
}: {
  ref: React.Ref<SnackyInputHandle>;
  menu: SnackyMenuItem[];
  people: Person[];
  canShare: boolean;
  disabled: boolean;
  placeholder: string;
  onSubmit: (text: string) => void;
  onPickAlone: (item: SnackyMenuItem) => void;
  onSuggest: (suggest: SnackySuggest | null) => void;
  onEmptyChange: (empty: boolean) => void;
}) {
  const [latest] = useState(
    () => new LiveProps({ menu, people, canShare, placeholder, onSubmit, onPickAlone, onSuggest }),
  );
  useEffect(() => {
    latest.set({ menu, people, canShare, placeholder, onSubmit, onPickAlone, onSuggest });
  });

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      Document.extend({ content: "paragraph" }),
      Paragraph,
      Text,
      Placeholder.configure({ placeholder: () => latest.current.placeholder }),
      Mention.configure({
        // the chip shows just the name; Snacky reads the name too
        renderText: ({ node }) => node.attrs.label ?? "",
        renderHTML: ({ node, options }) => [
          "span",
          mergeAttributes(options.HTMLAttributes, {
            class:
              node.attrs.mentionSuggestionChar === "@"
                ? "rounded-sm bg-primary/10 px-0.5 font-medium text-foreground underline decoration-primary/40 underline-offset-2 cursor-pointer"
                : "rounded-sm bg-primary/15 px-0.5 font-medium text-foreground cursor-pointer",
          }),
          node.attrs.label ?? "",
        ],
        suggestions: [
          suggestion("menu", "/", latest),
          suggestion("person", "@", latest),
        ],
      }),
      // after the suggestion lists, so an open list gets Enter first
      Extension.create({
        name: "snackySubmit",
        priority: 50,
        addKeyboardShortcuts() {
          return {
            Enter: ({ editor }) => {
              latest.current.onSubmit(editor.getText().trim());
              return true;
            },
            "Shift-Enter": () => true,
          };
        },
      }),
    ],
    editorProps: {
      attributes: {
        "aria-label": "Tell Snacky your order",
        role: "textbox",
        class:
          "max-h-32 min-h-9 overflow-y-auto px-1 py-2 text-base leading-5 break-words whitespace-pre-wrap outline-none sm:text-sm " +
          "[&_.is-editor-empty]:before:pointer-events-none [&_.is-editor-empty]:before:float-left [&_.is-editor-empty]:before:h-0 " +
          "[&_.is-editor-empty]:before:text-muted-foreground [&_.is-editor-empty]:before:content-[attr(data-placeholder)]",
      },
      // a click on a chip turns it back into "/name" so the list opens to swap it
      handleClickOn: (view, _pos, node, nodePos) => {
        if (node.type.name !== "mention") return false;
        const text = `${node.attrs.mentionSuggestionChar}${node.attrs.label}`;
        const tr = view.state.tr.insertText(text, nodePos, nodePos + node.nodeSize);
        view.dispatch(tr);
        return true;
      },
    },
    onUpdate: ({ editor }) => onEmptyChange(editor.isEmpty),
  });

  useEffect(() => {
    editor?.setEditable(!disabled);
  }, [editor, disabled]);

  // the placeholder is drawn from a decoration; nudge it when the text changes
  useEffect(() => {
    if (editor && editor.isEmpty) editor.view.dispatch(editor.state.tr);
  }, [editor, placeholder]);

  useImperativeHandle(
    ref,
    () => ({
      clear: () => {
        editor?.commands.clearContent(true);
      },
      submit: () => {
        if (editor) latest.current.onSubmit(editor.getText().trim());
      },
      openMenu: () => {
        if (!editor) return;
        editor.chain().focus("end").insertContent(editor.isEmpty ? "/" : " /").run();
      },
    }),
    [editor, latest],
  );

  return <EditorContent editor={editor} className='min-w-0 flex-1' />;
}

// one trigger: "/" for the menu, "@" for people
function suggestion(
  kind: "menu" | "person",
  char: string,
  latest: LiveProps,
): Omit<SuggestionOptions, "editor"> {
  return {
    char,
    pluginKey: new PluginKey(`snacky-${kind}`),
    allowSpaces: true,
    allow: () => kind === "menu" || latest.current.canShare,
    items: ({ query }): SnackyPick[] =>
      kind === "menu"
        ? rank(latest.current.menu, (item) => `${item.name} ${item.shop ?? ""}`, query).map((item) => ({
            id: item.menuItemId,
            label: item.name,
            detail: item.shop,
            item,
          }))
        : rank(latest.current.people, (person) => `${person.name} ${person.email ?? ""}`, query).map(
            (person) => ({ id: person.id, label: person.name, detail: person.email ?? null }),
          ),
    command: ({ editor, range, props }: { editor: Editor; range: Range; props: SnackyPick }) => {
      // "/samosa" with nothing else typed goes straight into the draft
      if (props.item && isAlone(editor, range)) {
        latest.current.onPickAlone(props.item);
        editor.commands.clearContent(true);
        return;
      }
      const after = editor.state.doc.textBetween(range.to, Math.min(range.to + 1, editor.state.doc.content.size));
      editor
        .chain()
        .focus()
        .insertContentAt(range, [
          { type: "mention", attrs: { id: props.id, label: props.label, mentionSuggestionChar: char } },
          ...(after.startsWith(" ") ? [] : [{ type: "text", text: " " }]),
        ])
        .run();
    },
    render: () => {
      let current: SuggestionProps<SnackyPick, SnackyPick> | null = null;
      let highlight = 0;

      const show = () => {
        if (!current) return latest.current.onSuggest(null);
        const props = current;
        latest.current.onSuggest(
          props.items.length === 0 && !(kind === "menu" && isAlone(props.editor, props.range))
            ? null
            : {
                kind,
                picks: props.items,
                highlight,
                alone: kind === "menu" && isAlone(props.editor, props.range),
                pick: (index) => {
                  const choice = props.items[index];
                  if (choice) props.command(choice);
                },
              },
        );
      };

      return {
        onStart: (props: SuggestionProps<SnackyPick, SnackyPick>) => {
          current = props;
          highlight = 0;
          show();
        },
        onUpdate: (props: SuggestionProps<SnackyPick, SnackyPick>) => {
          current = props;
          highlight = 0;
          show();
        },
        onExit: () => {
          current = null;
          latest.current.onSuggest(null);
        },
        onKeyDown: ({ event }: SuggestionKeyDownProps) => {
          const items = current?.items ?? [];
          if (items.length === 0) return false;
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            highlight = (highlight + (event.key === "ArrowDown" ? 1 : -1) + items.length) % items.length;
            show();
            return true;
          }
          if (event.key === "Enter" || event.key === "Tab") {
            current?.command(items[Math.min(highlight, items.length - 1)]);
            return true;
          }
          return false;
        },
      };
    },
  };
}

// true when the "/" being typed is the only thing in the box
function isAlone(editor: Editor, range: { from: number; to: number }) {
  const { doc } = editor.state;
  return (
    doc.textBetween(0, range.from, " ", " ").trim() === "" &&
    doc.textBetween(range.to, doc.content.size, " ", " ").trim() === ""
  );
}
