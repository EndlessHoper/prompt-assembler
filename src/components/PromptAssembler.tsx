
import React, { useState } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { FileText, Folder, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";

interface PromptItem {
  id: string;
  content: string;
  type: "text" | "file";
  fileName?: string;
}

export const PromptAssembler = () => {
  const [items, setItems] = useState<PromptItem[]>([]);
  const [text, setText] = useState("");
  const { toast } = useToast();

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const newItems = Array.from(items);
    const [reorderedItem] = newItems.splice(result.source.index, 1);
    newItems.splice(result.destination.index, 0, reorderedItem);

    setItems(newItems);
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

  const addText = () => {
    if (!text.trim()) return;
    setItems([
      ...items,
      {
        id: Math.random().toString(),
        content: text,
        type: "text",
      },
    ]);
    setText("");
  };

  const removeItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id));
  };

  const exportPrompt = () => {
    const prompt = items.map((item) => item.content).join("\n\n");
    
    // Copy to clipboard
    navigator.clipboard.writeText(prompt).then(
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

    // Download as .txt file
    const blob = new Blob([prompt], { type: "text/plain" });
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

          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="prompt-items">
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="min-h-[400px] bg-gray-50 rounded-lg p-4"
                >
                  <Textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Write your prompt here..."
                    className="min-h-[200px] mb-4 bg-white"
                  />
                  {items.map((item, index) => (
                    <Draggable key={item.id} draggableId={item.id} index={index}>
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className="mb-2"
                        >
                          {item.type === "file" && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex items-center gap-2 bg-white hover:bg-gray-100"
                              onClick={() => removeItem(item.id)}
                            >
                              <FileText className="h-4 w-4 text-promptcraft-500" />
                              {item.fileName}
                              <X className="h-3 w-3 ml-2" />
                            </Button>
                          )}
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </Card>

        {items.length > 0 && (
          <Button onClick={exportPrompt} className="mt-4">
            Export Prompt
          </Button>
        )}
      </div>
    </div>
  );
};
