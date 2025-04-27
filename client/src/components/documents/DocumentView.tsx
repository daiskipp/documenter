import { useState, useRef } from "react";
import { Document } from "@shared/schema";
import { useMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { 
  Clock, 
  Edit, 
  Download, 
  FileDown, 
  FileText
} from "lucide-react";
import { MarkdownRenderer } from "@/components/ui/markdown-renderer";
import DocumentEditor from "./DocumentEditor";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { useToast } from "@/hooks/use-toast";

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
  const [isExporting, setIsExporting] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  // デバッグ用に情報をコンソールに出力
  console.log("DocumentView: document=", document);

  // MarkdownファイルとしてダウンロードVV
  const downloadAsMarkdown = () => {
    if (!document.content) return;
    
    const blob = new Blob([document.content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${document.title || 'document'}.md`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "ダウンロード完了",
      description: "Markdownファイルをダウンロードしました",
    });
  };

  // PDFファイルとしてダウンロード
  const downloadAsPdf = async () => {
    if (!contentRef.current || !document.content) return;
    
    try {
      setIsExporting(true);
      
      // 現在表示されているコンテンツをキャプチャ
      const contentElement = contentRef.current;
      const canvas = await html2canvas(contentElement, {
        scale: 2,
        useCORS: true,
        logging: false,
        allowTaint: true
      });
      
      // PDF作成
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      // ドキュメントタイトルをPDFに追加
      pdf.setFontSize(18);
      pdf.text(document.title, 14, 22);
      
      // 画像として追加
      const imgData = canvas.toDataURL('image/png');
      const imgWidth = 210 - 20; // A4サイズの幅からマージンを引いた値
      const pageHeight = 297;  // A4サイズの高さ
      const imgHeight = canvas.height * imgWidth / canvas.width;
      let heightLeft = imgHeight;
      let position = 30; // タイトルの下にスペースを入れる
      
      // 最初のページに画像を追加
      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= (pageHeight - position);
      
      // 必要に応じて複数ページにわける
      while (heightLeft > 0) {
        position = 0;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 10, position - (pageHeight - 30), imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      // PDFを保存
      pdf.save(`${document.title || 'document'}.pdf`);
      
      toast({
        title: "エクスポート完了",
        description: "PDFファイルをダウンロードしました",
      });
    } catch (error) {
      console.error('PDF export error:', error);
      toast({
        title: "エクスポートエラー",
        description: "PDFの作成中にエラーが発生しました",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

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
          {/* Download dropdown menu */}
          {document.content && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  disabled={isExporting}
                  className="px-3 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm flex items-center cursor-pointer"
                >
                  <Download className="h-4 w-4 mr-1" />
                  <span>ダウンロード</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>エクスポート形式</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={downloadAsMarkdown} className="flex items-center">
                  <FileDown className="h-4 w-4 mr-2" />
                  <span>Markdown (.md)</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={downloadAsPdf} className="flex items-center">
                  <FileText className="h-4 w-4 mr-2" />
                  <span>PDF (.pdf)</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          
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
          <div ref={contentRef} className="pdf-content">
            <MarkdownRenderer content={document.content} />
          </div>
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
