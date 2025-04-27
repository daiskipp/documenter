import { File, Plus, FolderPlus, PenSquare, Trash2 } from "lucide-react";
import { Project } from "@shared/schema";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface HeaderProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  projects: Project[];
  currentProject: Project | null;
  isLoading: boolean;
  onSelectProject: (project: Project) => void;
  onCreateProject: () => void;
  onProjectAction: (project: Project, action: 'edit' | 'delete') => void;
}

export default function Header({ 
  sidebarOpen, 
  setSidebarOpen,
  projects,
  currentProject,
  isLoading,
  onSelectProject,
  onCreateProject,
  onProjectAction
}: HeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-6">
            <div className="flex-shrink-0 flex items-center">
              <File className="h-8 w-8 text-primary-600" />
              <span className="ml-2 text-xl font-semibold text-gray-900">ドキュメント管理アプリ</span>
            </div>
            
            {/* Project Selector */}
            <div className="hidden md:flex items-center">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="border-dashed text-left justify-start w-[240px]">
                    <span className="truncate">
                      {currentProject ? currentProject.name : "プロジェクトを選択"}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[240px]">
                  <DropdownMenuLabel>プロジェクト</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    {projects.length > 0 ? (
                      projects.map((project) => (
                        <DropdownMenuItem
                          key={project.id}
                          className={`flex items-center justify-between ${
                            currentProject?.id === project.id ? "bg-primary-50" : ""
                          }`}
                          onClick={() => onSelectProject(project)}
                        >
                          <span className="truncate">{project.name}</span>
                          <div className="ml-auto flex items-center">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-gray-400 hover:text-gray-700"
                              onClick={(e) => {
                                e.stopPropagation();
                                onProjectAction(project, "edit");
                              }}
                            >
                              <PenSquare className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-gray-400 hover:text-red-500"
                              onClick={(e) => {
                                e.stopPropagation();
                                onProjectAction(project, "delete");
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </DropdownMenuItem>
                      ))
                    ) : (
                      <div className="px-2 py-1.5 text-sm text-gray-500">
                        プロジェクトがありません
                      </div>
                    )}
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={onCreateProject} className="text-primary-600">
                    <FolderPlus className="mr-2 h-4 w-4" />
                    <span>新規プロジェクト作成</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Create Project Button (Desktop) */}
            <Button
              onClick={onCreateProject}
              className="hidden md:flex items-center"
              size="sm"
            >
              <Plus className="mr-1 h-4 w-4" />
              <span>新規プロジェクト</span>
            </Button>
            
            {/* Mobile menu button */}
            <div className="md:hidden">
              <button 
                onClick={() => setSidebarOpen(!sidebarOpen)} 
                type="button" 
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
              >
                <span className="sr-only">メニューを開く</span>
                <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
