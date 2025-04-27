import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Project } from "@shared/schema";

interface EditProjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project;
  onProjectUpdated: (project: Project) => void;
}

export default function EditProjectModal({
  open,
  onOpenChange,
  project,
  onProjectUpdated
}: EditProjectModalProps) {
  const { toast } = useToast();
  const [projectName, setProjectName] = useState(project.name);

  // Update name when project changes
  useEffect(() => {
    setProjectName(project.name);
  }, [project]);

  // Update project mutation
  const updateProjectMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
        credentials: 'include'
      });
      
      if (!res.ok) {
        throw new Error('プロジェクトの更新に失敗しました');
      }
      
      return res.json();
    },
    onSuccess: (data) => {
      // Invalidate projects query
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      
      // Close modal
      onOpenChange(false);
      
      // Call success callback
      onProjectUpdated(data.project);
      
      // Show success toast
      toast({
        title: "プロジェクトを更新しました",
        description: `プロジェクト名を「${data.project.name}」に変更しました`,
      });
    },
    onError: (error) => {
      toast({
        title: "更新に失敗しました",
        description: error instanceof Error ? error.message : "不明なエラーが発生しました",
        variant: "destructive"
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim()) {
      toast({
        title: "プロジェクト名を入力してください",
        variant: "destructive"
      });
      return;
    }
    
    updateProjectMutation.mutate(projectName);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>プロジェクト名を編集</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="mt-2">
            <Input 
              type="text" 
              value={projectName} 
              onChange={(e) => setProjectName(e.target.value)} 
              placeholder="プロジェクト名" 
              className="w-full"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSubmit(e);
                }
              }}
            />
          </div>

          <DialogFooter className="mt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
            >
              キャンセル
            </Button>
            <Button 
              type="submit" 
              disabled={!projectName.trim() || updateProjectMutation.isPending}
            >
              {updateProjectMutation.isPending ? "更新中..." : "更新"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
