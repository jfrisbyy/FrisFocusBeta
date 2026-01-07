import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Highlight from "@tiptap/extension-highlight";
import TextAlign from "@tiptap/extension-text-align";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  List,
  ListOrdered,
  CheckSquare,
  Heading1,
  Heading2,
  Heading3,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Highlighter,
  Type,
  Minus,
  Quote,
} from "lucide-react";
import { cn } from "@/lib/utils";

const TEXT_COLORS = [
  { name: "Default", value: "" },
  { name: "Red", value: "#ef4444" },
  { name: "Orange", value: "#f97316" },
  { name: "Yellow", value: "#eab308" },
  { name: "Green", value: "#22c55e" },
  { name: "Blue", value: "#3b82f6" },
  { name: "Purple", value: "#8b5cf6" },
  { name: "Pink", value: "#ec4899" },
];

const HIGHLIGHT_COLORS = [
  { name: "Yellow", value: "#fef08a" },
  { name: "Green", value: "#bbf7d0" },
  { name: "Blue", value: "#bfdbfe" },
  { name: "Pink", value: "#fbcfe8" },
  { name: "Orange", value: "#fed7aa" },
];

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
}

export function RichTextEditor({
  content,
  onChange,
  placeholder = "Start writing...",
  className,
  minHeight = "150px",
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Underline,
      TextStyle,
      Color,
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Highlight.configure({
        multicolor: true,
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: cn(
          "prose prose-sm dark:prose-invert max-w-none focus:outline-none",
          "min-h-[var(--editor-min-height)]"
        ),
        style: `--editor-min-height: ${minHeight}`,
      },
    },
  });

  if (!editor) {
    return null;
  }

  return (
    <div className={cn("border rounded-md overflow-hidden", className)}>
      <div className="flex flex-wrap items-center gap-0.5 p-1 border-b bg-muted/30">
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className={cn("h-7 w-7", editor.isActive("bold") && "bg-accent")}
          onClick={() => editor.chain().focus().toggleBold().run()}
          data-testid="editor-bold"
        >
          <Bold className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className={cn("h-7 w-7", editor.isActive("italic") && "bg-accent")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          data-testid="editor-italic"
        >
          <Italic className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className={cn("h-7 w-7", editor.isActive("underline") && "bg-accent")}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          data-testid="editor-underline"
        >
          <UnderlineIcon className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className={cn("h-7 w-7", editor.isActive("strike") && "bg-accent")}
          onClick={() => editor.chain().focus().toggleStrike().run()}
          data-testid="editor-strike"
        >
          <Strikethrough className="h-3.5 w-3.5" />
        </Button>

        <div className="w-px h-5 bg-border mx-1" />

        <Button
          type="button"
          size="icon"
          variant="ghost"
          className={cn("h-7 w-7", editor.isActive("heading", { level: 1 }) && "bg-accent")}
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          data-testid="editor-h1"
        >
          <Heading1 className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className={cn("h-7 w-7", editor.isActive("heading", { level: 2 }) && "bg-accent")}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          data-testid="editor-h2"
        >
          <Heading2 className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className={cn("h-7 w-7", editor.isActive("heading", { level: 3 }) && "bg-accent")}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          data-testid="editor-h3"
        >
          <Heading3 className="h-3.5 w-3.5" />
        </Button>

        <div className="w-px h-5 bg-border mx-1" />

        <Button
          type="button"
          size="icon"
          variant="ghost"
          className={cn("h-7 w-7", editor.isActive("bulletList") && "bg-accent")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          data-testid="editor-bullet-list"
        >
          <List className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className={cn("h-7 w-7", editor.isActive("orderedList") && "bg-accent")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          data-testid="editor-ordered-list"
        >
          <ListOrdered className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className={cn("h-7 w-7", editor.isActive("taskList") && "bg-accent")}
          onClick={() => editor.chain().focus().toggleTaskList().run()}
          data-testid="editor-task-list"
        >
          <CheckSquare className="h-3.5 w-3.5" />
        </Button>

        <div className="w-px h-5 bg-border mx-1" />

        <Button
          type="button"
          size="icon"
          variant="ghost"
          className={cn("h-7 w-7", editor.isActive({ textAlign: "left" }) && "bg-accent")}
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
          data-testid="editor-align-left"
        >
          <AlignLeft className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className={cn("h-7 w-7", editor.isActive({ textAlign: "center" }) && "bg-accent")}
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
          data-testid="editor-align-center"
        >
          <AlignCenter className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className={cn("h-7 w-7", editor.isActive({ textAlign: "right" }) && "bg-accent")}
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
          data-testid="editor-align-right"
        >
          <AlignRight className="h-3.5 w-3.5" />
        </Button>

        <div className="w-px h-5 bg-border mx-1" />

        <Button
          type="button"
          size="icon"
          variant="ghost"
          className={cn("h-7 w-7", editor.isActive("blockquote") && "bg-accent")}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          data-testid="editor-blockquote"
        >
          <Quote className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="h-7 w-7"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          data-testid="editor-hr"
        >
          <Minus className="h-3.5 w-3.5" />
        </Button>

        <div className="w-px h-5 bg-border mx-1" />

        <Popover>
          <PopoverTrigger asChild>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              data-testid="editor-text-color"
            >
              <Type className="h-3.5 w-3.5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2" align="start">
            <div className="grid grid-cols-4 gap-1">
              {TEXT_COLORS.map((color) => (
                <button
                  key={color.name}
                  type="button"
                  className={cn(
                    "w-6 h-6 rounded border flex items-center justify-center text-xs font-bold",
                    color.value === "" && "bg-foreground text-background"
                  )}
                  style={color.value ? { color: color.value, borderColor: color.value } : {}}
                  onClick={() => {
                    if (color.value) {
                      editor.chain().focus().setColor(color.value).run();
                    } else {
                      editor.chain().focus().unsetColor().run();
                    }
                  }}
                  title={color.name}
                  data-testid={`editor-color-${color.name.toLowerCase()}`}
                >
                  A
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className={cn("h-7 w-7", editor.isActive("highlight") && "bg-accent")}
              data-testid="editor-highlight"
            >
              <Highlighter className="h-3.5 w-3.5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2" align="start">
            <div className="flex gap-1">
              {HIGHLIGHT_COLORS.map((color) => (
                <button
                  key={color.name}
                  type="button"
                  className="w-6 h-6 rounded border"
                  style={{ backgroundColor: color.value }}
                  onClick={() => editor.chain().focus().toggleHighlight({ color: color.value }).run()}
                  title={color.name}
                  data-testid={`editor-highlight-${color.name.toLowerCase()}`}
                />
              ))}
              <button
                type="button"
                className="w-6 h-6 rounded border bg-background text-xs"
                onClick={() => editor.chain().focus().unsetHighlight().run()}
                title="Remove highlight"
                data-testid="editor-highlight-remove"
              >
                X
              </button>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <EditorContent 
        editor={editor} 
        className="p-3"
        data-testid="editor-content"
      />
    </div>
  );
}

export function RichTextViewer({ content, className }: { content: string; className?: string }) {
  return (
    <div 
      className={cn(
        "prose prose-sm dark:prose-invert max-w-none",
        "[&_ul[data-type='taskList']]:list-none [&_ul[data-type='taskList']]:pl-0",
        "[&_ul[data-type='taskList']_li]:flex [&_ul[data-type='taskList']_li]:gap-2 [&_ul[data-type='taskList']_li]:items-start",
        "[&_ul[data-type='taskList']_li_label]:flex [&_ul[data-type='taskList']_li_label]:items-center",
        "[&_ul[data-type='taskList']_li_input]:mt-0.5",
        className
      )}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}
