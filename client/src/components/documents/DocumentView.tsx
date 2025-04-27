import { useState } from "react";
import { Document } from "@shared/schema";
import { useMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Clock, Edit } from "lucide-react";
import { MarkdownRenderer } from "@/components/ui/markdown-renderer";
import DocumentEditor from "./DocumentEditor";

interface DocumentViewProps {
  document: Document;
  onShowVersionHistory: () => void;
  onDocumentUpdated: (document: Document) => void;
}

export default function DocumentView({
  document,
  onShowVersionHistory,
  onDocumentUpdated
}: DocumentViewProps) {
  const isMobile = useMobile();
  const [editMode, setEditMode] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  
  // デバッグ用に情報をコンソールに出力
  console.log("DocumentView: document=", document);

  if (editMode) {
    return (
      <DocumentEditor 
        document={document}
        previewMode={previewMode}
        setPreviewMode={setPreviewMode}
        onSave={(updatedDoc) => {
          onDocumentUpdated(updatedDoc);
          setEditMode(false);
        }}
        onCancel={() => setEditMode(false)}
      />
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-white p-4 relative z-10">
      {/* Document actions */}
      <div className="mb-4 flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-900">{document.title}</h1>
        <div className="flex space-x-2 z-20">
          <Button
            onClick={onShowVersionHistory}
            className="px-3 py-1.5 bg-[#8b5cf6] text-white rounded-md hover:bg-opacity-90 text-sm flex items-center cursor-pointer"
          >
            <Clock className="h-4 w-4 mr-1" />
            <span>履歴</span>
          </Button>
          <Button
            onClick={() => {
              console.log("Edit button clicked");
              setEditMode(true);
            }}
            className="px-3 py-1.5 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm flex items-center cursor-pointer"
          >
            <Edit className="h-4 w-4 mr-1" />
            <span>編集</span>
          </Button>
        </div>
      </div>

      {/* Document content */}
      <div className="flex-1 overflow-y-auto">
        {document.content ? (
          <MarkdownRenderer content={document.content} />
        ) : (
          <div className="flex-1 flex items-center justify-center flex-col text-gray-500">
            <svg className="h-16 w-16 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p>コンテンツがありません。「編集」ボタンをクリックして内容を作成してください。</p>
          </div>
        )}
      </div>
    </div>
  );
}
