import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useMobile } from "@/hooks/use-mobile";
import Header from "@/components/layout/Header";
import ProjectSidebar from "@/components/layout/ProjectSidebar";
import DocumentsList from "@/components/layout/DocumentsList";
import DocumentView from "@/components/documents/DocumentView";
import CreateProjectModal from "@/components/modals/CreateProjectModal";
import EditProjectModal from "@/components/modals/EditProjectModal";
import ConfirmDeleteModal from "@/components/modals/ConfirmDeleteModal";
import VersionHistory from "@/components/documents/VersionHistory";
import { useToast } from "@/hooks/use-toast";
import { Project, Document } from "@shared/schema";
import { FileText, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  const isMobile = useMobile();
  const { toast } = useToast();
  
  // State management
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentProject, setCurrentProject] = useState<Project | null>(null);
  const [currentDocument, setCurrentDocument] = useState<Document | null>(null);
  
  // Modal states
  const [showCreateProjectModal, setShowCreateProjectModal] = useState(false);
  const [showEditProjectModal, setShowEditProjectModal] = useState(false);
  const [showDeleteProjectModal, setShowDeleteProjectModal] = useState(false);
  const [showDeleteDocumentModal, setShowDeleteDocumentModal] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  
  // Project being worked on in modals
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [activeDocument, setActiveDocument] = useState<Document | null>(null);

  // Queries
  const { data: projectsData, isLoading: isLoadingProjects } = useQuery<{ projects: Project[] }>({
    queryKey: ['/api/projects'],
  });
  
  const projects = projectsData?.projects || [];

  // Documents query is dependent on selected project
  const { data: documentsData, isLoading: isLoadingDocuments } = useQuery<{ documents: Document[] }>({
    queryKey: [`/api/projects/${currentProject?.id || 0}/documents`],
    enabled: !!currentProject,
  });
  
  const documents = documentsData?.documents || [];

  // Delete project mutation
  const deleteProjectMutation = useMutation({
    mutationFn: async (projectId: number) => {
      await fetch(`/api/projects/${projectId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      toast({
        title: "プロジェクトを削除しました",
        description: `プロジェクト「${activeProject?.name}」を削除しました`,
      });
      
      // Reset selection if needed
      if (currentProject?.id === activeProject?.id) {
        setCurrentProject(null);
        setCurrentDocument(null);
      }
      
      setShowDeleteProjectModal(false);
      setActiveProject(null);
    },
    onError: (error) => {
      toast({
        title: "削除に失敗しました",
        description: error instanceof Error ? error.message : "不明なエラーが発生しました",
        variant: "destructive"
      });
    }
  });

  // Delete document mutation
  const deleteDocumentMutation = useMutation({
    mutationFn: async (documentId: number) => {
      await fetch(`/api/documents/${documentId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
    },
    onSuccess: () => {
      if (currentProject) {
        queryClient.invalidateQueries({ queryKey: [`/api/projects/${currentProject.id}/documents`] });
      }
      
      toast({
        title: "ドキュメントを削除しました",
        description: `ドキュメント「${activeDocument?.title}」を削除しました`,
      });
      
      // Reset document selection if needed
      if (currentDocument?.id === activeDocument?.id) {
        setCurrentDocument(null);
      }
      
      setShowDeleteDocumentModal(false);
      setActiveDocument(null);
    },
    onError: (error) => {
      toast({
        title: "削除に失敗しました",
        description: error instanceof Error ? error.message : "不明なエラーが発生しました",
        variant: "destructive"
      });
    }
  });

  // Event handlers
  const handleSelectProject = (project: Project) => {
    setCurrentProject(project);
    setCurrentDocument(null);
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  const handleSelectDocument = (document: Document) => {
    setCurrentDocument(document);
  };

  const handleDeleteProject = () => {
    if (activeProject) {
      deleteProjectMutation.mutate(activeProject.id);
    }
  };

  const handleDeleteDocument = () => {
    if (activeDocument) {
      deleteDocumentMutation.mutate(activeDocument.id);
    }
  };

  // Handle project actions
  const handleProjectActions = (project: Project, action: 'edit' | 'delete') => {
    setActiveProject(project);
    if (action === 'edit') {
      setShowEditProjectModal(true);
    } else if (action === 'delete') {
      setShowDeleteProjectModal(true);
    }
  };

  // Handle document actions
  const handleDocumentActions = (document: Document, action: 'edit' | 'delete' | 'history') => {
    setActiveDocument(document);
    
    if (action === 'edit') {
      setCurrentDocument(document);
    } else if (action === 'delete') {
      setShowDeleteDocumentModal(true);
    } else if (action === 'history') {
      setShowVersionHistory(true);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen flex flex-col">
      <Header 
        sidebarOpen={sidebarOpen} 
        setSidebarOpen={setSidebarOpen}
        projects={projects}
        currentProject={currentProject}
        isLoading={isLoadingProjects}
        onSelectProject={handleSelectProject}
        onCreateProject={() => setShowCreateProjectModal(true)}
        onProjectAction={handleProjectActions}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - モバイル版のみ表示 */}
        {isMobile && (
          <ProjectSidebar 
            projects={projects}
            currentProject={currentProject}
            isLoading={isLoadingProjects}
            sidebarOpen={sidebarOpen} 
            onSelectProject={handleSelectProject}
            onCreateProject={() => setShowCreateProjectModal(true)}
            onProjectAction={handleProjectActions}
          />
        )}

        {/* Main content area */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Document list */}
          {currentProject && (
            <DocumentsList 
              projectName={currentProject.name}
              documents={documents}
              currentDocument={currentDocument}
              isLoading={isLoadingDocuments}
              onSelectDocument={handleSelectDocument}
              onCreateDocument={() => {
                // Create a new empty document
                queryClient.fetchQuery({
                  queryKey: ['/api/documents/new'],
                  queryFn: async () => {
                    const res = await fetch('/api/documents', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        project_id: currentProject.id,
                        title: '新しいドキュメント',
                        content: ''
                      }),
                      credentials: 'include'
                    });
                    
                    if (!res.ok) {
                      throw new Error('ドキュメントの作成に失敗しました');
                    }
                    
                    const data = await res.json();
                    
                    // Invalidate documents query to refresh the list
                    queryClient.invalidateQueries({ queryKey: [`/api/projects/${currentProject.id}/documents`] });
                    
                    // Select the new document
                    setCurrentDocument(data.document);
                    
                    return data;
                  }
                });
              }}
              onDocumentAction={handleDocumentActions}
            />
          )}

          {/* Document view/editor */}
          {currentDocument ? (
            <DocumentView 
              document={currentDocument} 
              onShowVersionHistory={() => {
                setActiveDocument(currentDocument);
                setShowVersionHistory(true);
              }}
              onDocumentUpdated={(updatedDoc) => {
                // Update the current document
                setCurrentDocument(updatedDoc);
                
                // Refresh the documents list
                if (currentProject) {
                  queryClient.invalidateQueries({ queryKey: [`/api/projects/${currentProject.id}/documents`] });
                }
              }}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center flex-col text-gray-500 p-4">
              {currentProject ? (
                <>
                  <FileText className="h-16 w-16 mb-4 text-gray-300" />
                  <p>ドキュメントが選択されていません。左側のリストからドキュメントを選択するか、新しいドキュメントを作成してください。</p>
                </>
              ) : (
                <>
                  <FileText className="h-20 w-20 mb-6 text-primary-300" />
                  <h2 className="text-xl font-medium text-gray-900 mb-2">ドキュメント管理アプリへようこそ</h2>
                  <p className="mb-4 text-center max-w-md">画面上部のドロップダウンメニューからプロジェクトを選択するか、「新規プロジェクト」ボタンをクリックして新しいプロジェクトを作成してください。</p>
                  <Button 
                    onClick={() => setShowCreateProjectModal(true)}
                    className="px-4 py-2 flex items-center"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    <span>新しいプロジェクトを作成</span>
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showCreateProjectModal && (
        <CreateProjectModal 
          open={showCreateProjectModal}
          onOpenChange={setShowCreateProjectModal}
          onProjectCreated={(newProject) => {
            setCurrentProject(newProject);
          }}
        />
      )}

      {showEditProjectModal && activeProject && (
        <EditProjectModal 
          open={showEditProjectModal}
          onOpenChange={setShowEditProjectModal}
          project={activeProject}
          onProjectUpdated={(updatedProject) => {
            // If this is the current project, update it
            if (currentProject?.id === updatedProject.id) {
              setCurrentProject(updatedProject);
            }
          }}
        />
      )}

      {showDeleteProjectModal && activeProject && (
        <ConfirmDeleteModal 
          open={showDeleteProjectModal}
          onOpenChange={setShowDeleteProjectModal}
          title="プロジェクトを削除"
          description={`プロジェクト「${activeProject.name}」とそのすべてのドキュメントを削除します。この操作は取り消せません。`}
          onConfirm={handleDeleteProject}
          isDeleting={deleteProjectMutation.isPending}
        />
      )}

      {showDeleteDocumentModal && activeDocument && (
        <ConfirmDeleteModal 
          open={showDeleteDocumentModal}
          onOpenChange={setShowDeleteDocumentModal}
          title="ドキュメントを削除"
          description={`ドキュメント「${activeDocument.title}」とそのすべてのバージョン履歴を削除します。この操作は取り消せません。`}
          onConfirm={handleDeleteDocument}
          isDeleting={deleteDocumentMutation.isPending}
        />
      )}

      {showVersionHistory && activeDocument && (
        <VersionHistory 
          open={showVersionHistory}
          onOpenChange={setShowVersionHistory}
          document={activeDocument}
          onVersionRestored={(updatedDoc) => {
            // Update the current document if it's the one being viewed
            if (currentDocument?.id === updatedDoc.id) {
              setCurrentDocument(updatedDoc);
            }
            
            // Refresh the documents list
            if (currentProject) {
              queryClient.invalidateQueries({ queryKey: [`/api/projects/${currentProject.id}/documents`] });
            }
          }}
        />
      )}
    </div>
  );
}
