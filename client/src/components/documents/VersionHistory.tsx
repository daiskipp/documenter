import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Document, Version } from "@shared/schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { MarkdownRenderer } from "@/components/ui/markdown-renderer";
import { RefreshCw } from "lucide-react";

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

  // Fetch versions
  const { data, isLoading } = useQuery({
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

  const handleRestore = () => {
    if (selectedVersion) {
      restoreVersionMutation.mutate(selectedVersion.content);
    }
  };

  return (
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
                {versions.map((version, index) => (
                  <li key={version.id}>
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
                {document.content !== selectedVersion.content && (
                  <div className="mb-4 flex justify-end">
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
                  </div>
                )}
                <MarkdownRenderer content={selectedVersion.content} />
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
  );
}
