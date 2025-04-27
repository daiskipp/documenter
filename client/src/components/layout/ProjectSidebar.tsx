import { useMobile } from "@/hooks/use-mobile";
import { Project } from "@shared/schema";
import { Plus, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface ProjectSidebarProps {
  projects: Project[];
  currentProject: Project | null;
  isLoading: boolean;
  sidebarOpen: boolean;
  onSelectProject: (project: Project) => void;
  onCreateProject: () => void;
  onProjectAction: (project: Project, action: 'edit' | 'delete') => void;
}

export default function ProjectSidebar({
  projects,
  currentProject,
  isLoading,
  sidebarOpen,
  onSelectProject,
  onCreateProject,
  onProjectAction
}: ProjectSidebarProps) {
  const isMobile = useMobile();

  if (!sidebarOpen) {
    return null;
  }

  return (
    <div 
      className="w-64 bg-white border-r border-gray-200 overflow-y-auto flex-shrink-0"
      onClick={(e) => {
        // Prevent clicks inside the sidebar from closing it on mobile
        if (isMobile) {
          e.stopPropagation();
        }
      }}
    >
      <div className="p-4 flex justify-between items-center border-b border-gray-200">
        <h2 className="text-lg font-medium text-gray-900">プロジェクト</h2>
        <Button 
          onClick={onCreateProject}
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
              <Skeleton className="h-6 w-full" />
            </li>
          ))
        ) : projects.length > 0 ? (
          // Project list
          projects.map((project) => (
            <li key={project.id}>
              <div 
                className={`px-4 py-2 flex justify-between items-center hover:bg-gray-50 cursor-pointer ${
                  currentProject?.id === project.id ? 'bg-primary-50 text-primary-600' : ''
                }`}
              >
                <span 
                  className="truncate"
                  onClick={() => onSelectProject(project)}
                >
                  {project.name}
                </span>
                <Button
                  onClick={() => onProjectAction(project, 'edit')}
                  variant="ghost"
                  size="icon"
                  className="text-gray-400 hover:text-gray-500"
                >
                  <MoreHorizontal className="h-5 w-5" />
                  
                  {/* Project actions dropdown (simplified for this implementation) */}
                  <div 
                    className="hidden absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none"
                  >
                    <button 
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                      onClick={(e) => {
                        e.stopPropagation();
                        onProjectAction(project, 'edit');
                      }}
                    >
                      プロジェクト名を編集
                    </button>
                    <button 
                      className="block px-4 py-2 text-sm text-red-600 hover:bg-gray-100 w-full text-left"
                      onClick={(e) => {
                        e.stopPropagation();
                        onProjectAction(project, 'delete');
                      }}
                    >
                      プロジェクトを削除
                    </button>
                  </div>
                </Button>
              </div>
            </li>
          ))
        ) : (
          // Empty state
          <li className="px-4 py-2 text-gray-500 text-sm">
            プロジェクトがありません。新しいプロジェクトを作成してください。
          </li>
        )}
      </ul>
    </div>
  );
}
