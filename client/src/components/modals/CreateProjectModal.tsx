import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Project } from "@shared/schema";

interface CreateProjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProjectCreated: (project: Project) => void;
}

export default function CreateProjectModal({
  open,
  onOpenChange,
  onProjectCreated
}: CreateProjectModalProps) {
  const { toast } = useToast();
  const [projectName, setProjectName] = useState("");

  // Create project mutation
  const createProjectMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
        credentials: 'include'
      });
      
      if (!res.ok) {
        throw new Error('プロジェクトの作成に失敗しました');
      }
      
      return res.json();
    },
    onSuccess: (data) => {
      // Reset form
      setProjectName("");
      
      // Invalidate projects query
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      
      // Close modal
      onOpenChange(false);
      
      // Call success callback
      onProjectCreated(data.project);
      
      // Show success toast
      toast({
        title: "プロジェクトを作成しました",
        description: `プロジェクト「${data.project.name}」を作成しました`,
      });
    },
    onError: (error) => {
      toast({
        title: "作成に失敗しました",
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
    
    createProjectMutation.mutate(projectName);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>新しいプロジェクトを作成</DialogTitle>
          <DialogDescription>
            プロジェクト名を入力して作成してください。
          </DialogDescription>
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
              disabled={!projectName.trim() || createProjectMutation.isPending}
            >
              {createProjectMutation.isPending ? "作成中..." : "作成"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
