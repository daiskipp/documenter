import { useState } from "react";
import { Document } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MarkdownRenderer } from "@/components/ui/markdown-renderer";
import { useMobile } from "@/hooks/use-mobile";

interface DocumentEditorProps {
  document: Document;
  previewMode: boolean;
  setPreviewMode: (preview: boolean) => void;
  onSave: (document: Document) => void;
  onCancel: () => void;
}

export default function DocumentEditor({
  document,
  previewMode,
  setPreviewMode,
  onSave,
  onCancel
}: DocumentEditorProps) {
  const isMobile = useMobile();
  const { toast } = useToast();
  const [title, setTitle] = useState(document.title);
  const [content, setContent] = useState(document.content || "");

  // Document update mutation
  const updateDocumentMutation = useMutation({
    mutationFn: async (data: { title: string; content: string }) => {
      const res = await fetch(`/api/documents/${document.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include'
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error("API Error:", errorText);
        throw new Error('ドキュメントの更新に失敗しました');
      }
      
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "ドキュメントを更新しました",
        description: "ドキュメントが正常に保存されました",
      });
      
      if (data && data.document) {
        onSave(data.document);
      } else {
        console.error("Invalid response data:", data);
        toast({
          title: "エラー",
          description: "予期しないレスポンス形式です",
          variant: "destructive"
        });
      }
    },
    onError: (error) => {
      console.error("Mutation error:", error);
      toast({
        title: "更新に失敗しました",
        description: error instanceof Error ? error.message : "不明なエラーが発生しました",
        variant: "destructive"
      });
    }
  });

  const handleSave = () => {
    if (!title.trim()) {
      toast({
        title: "タイトルを入力してください",
        variant: "destructive"
      });
      return;
    }
    
    updateDocumentMutation.mutate({ title, content });
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-white p-4">
      {/* Editor toolbar */}
      <div className="mb-4 flex justify-between items-center">
        <Input 
          type="text" 
          value={title} 
          onChange={(e) => setTitle(e.target.value)} 
          placeholder="タイトルを入力" 
          className="flex-1 mr-4 text-xl font-bold border-b-2 border-gray-300 focus:border-primary-500 focus:outline-none py-1"
        />
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            onClick={onCancel} 
            className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm"
          >
            キャンセル
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={updateDocumentMutation.isPending}
            className="px-3 py-1.5 bg-[#10b981] text-white rounded-md hover:bg-opacity-90 text-sm flex items-center"
          >
            <svg className="h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>{updateDocumentMutation.isPending ? "保存中..." : "保存"}</span>
          </Button>
        </div>
      </div>

      {/* Edit mode toggle (for mobile) */}
      {isMobile && (
        <div className="md:hidden flex mb-3 bg-gray-100 rounded-md p-1">
          <Button 
            onClick={() => setPreviewMode(false)} 
            variant={!previewMode ? "secondary" : "ghost"}
            className="flex-1 py-1 rounded-md text-sm font-medium"
          >
            編集
          </Button>
          <Button 
            onClick={() => setPreviewMode(true)} 
            variant={previewMode ? "secondary" : "ghost"}
            className="flex-1 py-1 rounded-md text-sm font-medium"
          >
            プレビュー
          </Button>
        </div>
      )}

      {/* Editor and preview */}
      <div 
        className={`flex-1 flex ${isMobile ? 'flex-col' : 'flex-row'} border border-gray-200 rounded-md overflow-hidden ${
          previewMode && isMobile ? 'preview-only' : 
          !previewMode && isMobile ? 'edit-only' : ''
        }`}
      >
        {/* Editor */}
        <div className={`${isMobile ? (previewMode ? 'hidden' : 'flex-1') : 'w-1/2'} overflow-y-auto`}>
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="マークダウンでコンテンツを入力..."
            className="w-full h-full p-4 resize-none border-none rounded-none font-mono focus:outline-none"
          />
        </div>
        
        {/* Preview */}
        <div className={`${isMobile ? (!previewMode ? 'hidden' : 'flex-1') : 'w-1/2'} overflow-y-auto bg-gray-50 p-4`}>
          <MarkdownRenderer content={content} />
        </div>
      </div>
    </div>
  );
}
