
import React, { useState, useRef, useCallback } from "react";
import { FileText, Folder, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

interface PromptItem {
  id: string;
  content: string;
  type: "text" | "file";
  fileName?: string;
}

export const PromptAssembler = () => {
  const [items, setItems] = useState<PromptItem[]>([]);
  const [text, setText] = useState("");
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [commandPosition, setCommandPosition] = useState({ top: 0, left: 0 });
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setText(newText);

    // Check if we should show the command menu
    const lastChar = newText[e.target.selectionStart - 1];
    if (lastChar === "@") {
      const rect = e.target.getBoundingClientRect();
      const position = e.target.selectionStart;
      const textBeforeCursor = newText.substring(0, position);
      const lines = textBeforeCursor.split("\n");
      const currentLineNumber = lines.length - 1;
      const currentLineLength = lines[lines.length - 1].length;

      // Approximate position calculation
      const lineHeight = 20; // Approximate line height in pixels
      const charWidth = 8; // Approximate character width in pixels
      
      setCommandPosition({
        top: rect.top + (currentLineNumber * lineHeight),
        left: rect.left + (currentLineLength * charWidth),
      });
      setIsCommandOpen(true);
    } else {
      setIsCommandOpen(false);
    }
  };

  const insertFileReference = (file: PromptItem) => {
    if (!textareaRef.current) return;

    const cursorPosition = textareaRef.current.selectionStart;
    const textBeforeCursor = text.substring(0, cursorPosition - 1); // Remove the @
    const textAfterCursor = text.substring(cursorPosition);
    
    setText(`${textBeforeCursor}[FILE:${file.fileName}]${textAfterCursor}`);
    setIsCommandOpen(false);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setItems([
        ...items,
        {
          id: Math.random().toString(),
          content,
          type: "file",
          fileName: file.name,
        },
      ]);
    };
    reader.readAsText(file);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isCommandOpen) {
      if (e.key === "Escape") {
        e.preventDefault();
        setIsCommandOpen(false);
      }
    }
  };

  const exportPrompt = () => {
    // Replace file references with actual content
    let finalPrompt = text;
    items.forEach(item => {
      const placeholder = `[FILE:${item.fileName}]`;
      finalPrompt = finalPrompt.replace(placeholder, item.content);
    });
    
    navigator.clipboard.writeText(finalPrompt).then(
      () => {
        toast({
          title: "Prompt copied!",
          description: "The assembled prompt has been copied to your clipboard.",
        });
      },
      (err) => {
        toast({
          title: "Failed to copy",
          description: "Please try again or use the downloaded file.",
          variant: "destructive",
        });
        console.error("Failed to copy:", err);
      }
    );

    const blob = new Blob([finalPrompt], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "assembled-prompt.txt";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-promptcraft-900 mb-2">PromptCraft</h1>
        <p className="text-gray-600">Assemble your perfect prompt</p>
      </div>

      <div className="grid gap-6 mb-6">
        <Card className="p-4">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="outline" asChild>
              <label className="cursor-pointer">
                <input
                  type="file"
                  onChange={handleFileUpload}
                  className="hidden"
                  accept=".txt,.md,.json"
                />
                <FileText className="mr-2 h-4 w-4" />
                Upload File
              </label>
            </Button>
            <Button variant="outline">
              <Folder className="mr-2 h-4 w-4" />
              Connect GitHub
            </Button>
          </div>

          <div className="relative">
            <Textarea
              ref={textareaRef}
              value={text}
              onChange={handleTextChange}
              onKeyDown={handleKeyDown}
              placeholder="Write your prompt here... Use @ to mention files"
              className="min-h-[400px] mb-4 bg-white font-mono"
              style={{
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word'
              }}
            />
            
            {isCommandOpen && items.length > 0 && (
              <div 
                className="absolute z-50"
                style={{
                  top: commandPosition.top + 24,
                  left: commandPosition.left,
                }}
              >
                <Command className="rounded-lg border shadow-md">
                  <CommandInput placeholder="Search files..." autoFocus />
                  <CommandList>
                    <CommandEmpty>No files found.</CommandEmpty>
                    <CommandGroup heading="Files">
                      {items.map((item) => (
                        <CommandItem
                          key={item.id}
                          onSelect={() => insertFileReference(item)}
                          className="flex items-center gap-2"
                        >
                          <FileText className="h-4 w-4" />
                          {item.fileName}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </div>
            )}
          </div>

          <style>{`
            .font-mono [FILE\\:] {
              background-color: #e5e7eb;
              padding: 2px 6px;
              border-radius: 4px;
              font-family: ui-monospace, monospace;
              white-space: nowrap;
            }
          `}</style>
        </Card>

        {text.length > 0 && (
          <Button onClick={exportPrompt} className="mt-4">
            Export Prompt
          </Button>
        )}
      </div>
    </div>
  );
};
