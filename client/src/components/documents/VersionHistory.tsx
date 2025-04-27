import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Document, Version } from "@shared/schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { MarkdownRenderer } from "@/components/ui/markdown-renderer";
import { RefreshCw, Trash2, GitCompare, FileText } from "lucide-react";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DiffView from "./DiffView";

interface VersionHistoryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: Document;
  onVersionRestored: (document: Document) => void;
}

export default function VersionHistory({
  open,
  onOpenChange,
  document,
  onVersionRestored
}: VersionHistoryProps) {
  const { toast } = useToast();
  const [selectedVersion, setSelectedVersion] = useState<Version | null>(null);
  const [versionToDelete, setVersionToDelete] = useState<Version | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'content' | 'diff'>('content');

  // Fetch versions
  const { data, isLoading } = useQuery<{ versions: Version[] }>({
    queryKey: [`/api/documents/${document.id}/versions`],
    enabled: open,
  });
  
  const versions = data?.versions || [];

  // Select the latest version by default
  useEffect(() => {
    if (versions.length > 0 && !selectedVersion) {
      setSelectedVersion(versions[0]);
    }
  }, [versions, selectedVersion]);

  // Restore version mutation
  const restoreVersionMutation = useMutation({
    mutationFn: async (versionContent: string) => {
      const res = await fetch(`/api/documents/${document.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: versionContent }),
        credentials: 'include'
      });
      
      if (!res.ok) {
        throw new Error('バージョンの復元に失敗しました');
      }
      
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "バージョンを復元しました",
        description: "ドキュメントが過去のバージョンに復元されました",
      });
      
      onVersionRestored(data.document);
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: "復元に失敗しました",
        description: error instanceof Error ? error.message : "不明なエラーが発生しました",
        variant: "destructive"
      });
    }
  });

  // 削除のためのMutation
  const queryClient = useQueryClient();
  const deleteVersionMutation = useMutation({
    mutationFn: async (versionId: number) => {
      const res = await fetch(`/api/versions/${versionId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      if (!res.ok) {
        throw new Error('バージョンの削除に失敗しました');
      }
      
      return versionId;
    },
    onSuccess: () => {
      toast({
        title: "バージョンを削除しました",
        description: "選択したバージョンが正常に削除されました",
      });
      
      // キャッシュを無効化して再取得
      queryClient.invalidateQueries({ 
        queryKey: [`/api/documents/${document.id}/versions`] 
      });
      
      // 削除したバージョンが選択中だった場合、選択を解除
      if (versionToDelete?.id === selectedVersion?.id) {
        setSelectedVersion(null);
      }
      
      setVersionToDelete(null);
      setConfirmDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "削除に失敗しました",
        description: error instanceof Error ? error.message : "不明なエラーが発生しました",
        variant: "destructive"
      });
      setConfirmDialogOpen(false);
    }
  });

  const handleRestore = () => {
    if (selectedVersion) {
      restoreVersionMutation.mutate(selectedVersion.content);
    }
  };
  
  const handleDeleteClick = (version: Version) => {
    setVersionToDelete(version);
    setConfirmDialogOpen(true);
  };
  
  const handleConfirmDelete = () => {
    if (versionToDelete) {
      deleteVersionMutation.mutate(versionToDelete.id);
    }
  };

  return (
    <>
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>バージョンを削除</AlertDialogTitle>
            <AlertDialogDescription>
              このバージョンを削除しますか？この操作は元に戻せません。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setVersionToDelete(null)}>キャンセル</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete}
              className="bg-red-500 hover:bg-red-600 focus:ring-red-500"
              disabled={deleteVersionMutation.isPending}
            >
              {deleteVersionMutation.isPending ? "削除中..." : "削除"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-3xl h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>バージョン履歴: {document.title}</DialogTitle>
          </DialogHeader>
          
          <div className="grid grid-cols-12 gap-4 flex-1 overflow-hidden">
            {/* Versions list */}
            <div className="col-span-4 border-r border-gray-200 pr-4 overflow-y-auto">
              {isLoading ? (
                // Loading skeletons
                Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="mb-2">
                    <Skeleton className="h-12 w-full" />
                  </div>
                ))
              ) : versions.length > 0 ? (
                <ul>
                  {versions.map((version: Version, index: number) => (
                    <li key={version.id} className="relative group">
                      <button 
                        onClick={() => setSelectedVersion(version)}
                        className={`w-full text-left px-3 py-2 border-l-2 ${
                          selectedVersion?.id === version.id 
                            ? 'bg-primary-50 border-primary-500' 
                            : 'border-transparent hover:bg-gray-50'
                        } flex flex-col mb-1 rounded-r-md transition-colors`}
                      >
                        <span className="font-medium text-sm">バージョン {versions.length - index}</span>
                        <span className="text-xs text-gray-500">{formatDate(version.created_at)}</span>
                      </button>
                      
                      {/* 削除ボタン - バージョンが1つ以上ある場合のみ表示 */}
                      {versions.length > 1 && (
                        <span
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClick(version);
                          }}
                          className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity p-1 rounded-full cursor-pointer"
                          title="このバージョンを削除"
                        >
                          <Trash2 className="h-4 w-4" />
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="px-3 py-2 text-gray-500 text-sm">
                  バージョン履歴がありません。
                </div>
              )}
            </div>
            
            {/* Version content */}
            <div className="col-span-8 pl-4 overflow-y-auto">
              {selectedVersion ? (
                <>
                  <div className="mb-4 flex justify-between items-center">
                    {/* 表示モード切り替えタブ */}
                    <Tabs 
                      defaultValue="content" 
                      value={viewMode} 
                      onValueChange={(value) => setViewMode(value as 'content' | 'diff')}
                      className="w-[300px]"
                    >
                      <TabsList>
                        <TabsTrigger value="content" className="flex items-center">
                          <FileText className="h-4 w-4 mr-1" />
                          コンテンツ
                        </TabsTrigger>
                        <TabsTrigger value="diff" className="flex items-center">
                          <GitCompare className="h-4 w-4 mr-1" />
                          変更差分
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>

                    {/* 復元ボタン - 現在のコンテンツと異なる場合のみ表示 */}
                    {document.content !== selectedVersion.content && (
                      <Button 
                        onClick={handleRestore}
                        disabled={restoreVersionMutation.isPending}
                        className="px-3 py-1.5 bg-[#8b5cf6] text-white rounded-md hover:bg-opacity-90 text-sm flex items-center"
                      >
                        <RefreshCw className="h-4 w-4 mr-1" />
                        <span>
                          {restoreVersionMutation.isPending ? "復元中..." : "このバージョンを復元"}
                        </span>
                      </Button>
                    )}
                  </div>

                  {/* コンテンツ表示 or 差分表示 */}
                  {viewMode === 'content' ? (
                    <MarkdownRenderer content={selectedVersion.content} />
                  ) : (
                    <DiffView 
                      oldText={document.content || ''}
                      newText={selectedVersion.content || ''}
                      splitView={true}
                    />
                  )}
                </>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  左側のリストからバージョンを選択してください。
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              閉じる
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}