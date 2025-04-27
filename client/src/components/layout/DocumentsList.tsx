import { Document } from "@shared/schema";
import { Plus, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface DocumentsListProps {
  projectName: string;
  documents: Document[];
  currentDocument: Document | null;
  isLoading: boolean;
  onSelectDocument: (document: Document) => void;
  onCreateDocument: () => void;
  onDocumentAction: (document: Document, action: 'edit' | 'delete' | 'history') => void;
}

export default function DocumentsList({
  projectName,
  documents,
  currentDocument,
  isLoading,
  onSelectDocument,
  onCreateDocument,
  onDocumentAction
}: DocumentsListProps) {
  return (
    <div className="md:w-72 border-r border-gray-200 bg-white overflow-y-auto">
      <div className="p-4 flex justify-between items-center border-b border-gray-200">
        <h2 className="text-lg font-medium text-gray-900 truncate">{projectName}</h2>
        <Button 
          onClick={onCreateDocument}
          variant="ghost" 
          size="icon" 
          className="rounded-full p-1 text-primary-600 hover:bg-primary-50"
        >
          <Plus className="h-6 w-6" />
        </Button>
      </div>
      
      <ul className="py-2">
        {isLoading ? (
          // Loading skeletons
          Array.from({ length: 3 }).map((_, index) => (
            <li key={index} className="px-4 py-2">
              <div className="flex flex-col gap-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </li>
          ))
        ) : documents.length > 0 ? (
          // Documents list
          documents.map((document) => (
            <li key={document.id}>
              <div 
                className={`px-4 py-2 flex justify-between items-center hover:bg-gray-50 cursor-pointer ${
                  currentDocument?.id === document.id ? 'bg-primary-50 text-primary-600' : ''
                }`}
              >
                <div 
                  className="flex-1 min-w-0"
                  onClick={() => onSelectDocument(document)}
                >
                  <p className="text-sm font-medium truncate">{document.title}</p>
                  <p className="text-xs text-gray-500 truncate">
                    {formatDate(document.updated_at)}
                  </p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-gray-400 hover:text-gray-500"
                    >
                      <MoreHorizontal className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onDocumentAction(document, 'edit')}>
                      ドキュメントを編集
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onDocumentAction(document, 'history')}>
                      履歴を表示
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => onDocumentAction(document, 'delete')}
                      className="text-red-500"
                    >
                      ドキュメントを削除
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </li>
          ))
        ) : (
          // Empty state
          <li className="px-4 py-2 text-gray-500 text-sm">
            ドキュメントがありません。新しいドキュメントを作成してください。
          </li>
        )}
      </ul>
    </div>
  );
}
