import { useMemo } from 'react';
import * as Diff from 'diff';

interface DiffViewProps {
  oldText: string;
  newText: string;
  splitView?: boolean;
}

/**
 * テキストの差分を表示するコンポーネント
 */
export default function DiffView({ oldText, newText, splitView = false }: DiffViewProps) {
  // 差分を計算
  const diffResult = useMemo(() => {
    return Diff.diffLines(oldText, newText);
  }, [oldText, newText]);

  // インラインビュー（単一ビュー）のレンダリング
  if (!splitView) {
    return (
      <div className="bg-gray-50 rounded-md p-4 border border-gray-200 overflow-x-auto font-mono text-sm">
        <pre className="whitespace-pre-wrap">
          {diffResult.map((part, index) => {
            // 追加されたテキスト
            if (part.added) {
              return (
                <span key={index} className="bg-green-100 text-green-800">
                  {part.value.split('\n').map((line, i, arr) => (
                    i === arr.length - 1 && line === '' ? null : 
                    <span key={i} className="block">
                      + {line}
                    </span>
                  ))}
                </span>
              );
            }
            
            // 削除されたテキスト
            if (part.removed) {
              return (
                <span key={index} className="bg-red-100 text-red-800">
                  {part.value.split('\n').map((line, i, arr) => (
                    i === arr.length - 1 && line === '' ? null : 
                    <span key={i} className="block">
                      - {line}
                    </span>
                  ))}
                </span>
              );
            }
            
            // 変更がないテキスト
            return (
              <span key={index} className="text-gray-700">
                {part.value.split('\n').map((line, i, arr) => (
                  i === arr.length - 1 && line === '' ? null : 
                  <span key={i} className="block">
                    &nbsp; {line}
                  </span>
                ))}
              </span>
            );
          })}
        </pre>
      </div>
    );
  }

  // スプリットビュー（2列表示）のレンダリング
  const oldLines: string[] = [];
  const newLines: string[] = [];
  
  diffResult.forEach(part => {
    if (part.removed) {
      // 削除された行は左側に表示
      oldLines.push(...part.value.split('\n').filter(line => line !== ''));
    } else if (part.added) {
      // 追加された行は右側に表示
      newLines.push(...part.value.split('\n').filter(line => line !== ''));
    } else {
      // 変更がない行は両方に表示
      const lines = part.value.split('\n').filter(line => line !== '');
      oldLines.push(...lines);
      newLines.push(...lines);
    }
  });

  // 左右の行数を揃える（空行を挿入）
  const maxLines = Math.max(oldLines.length, newLines.length);
  for (let i = oldLines.length; i < maxLines; i++) {
    oldLines.push('');
  }
  for (let i = newLines.length; i < maxLines; i++) {
    newLines.push('');
  }

  return (
    <div className="grid grid-cols-2 gap-4 bg-gray-50 rounded-md p-4 border border-gray-200 overflow-x-auto font-mono text-sm">
      {/* 左側（旧バージョン） */}
      <div className="border-r border-gray-300 pr-4">
        <div className="font-bold mb-2 text-gray-700">旧バージョン</div>
        <pre className="whitespace-pre-wrap">
          {oldLines.map((line, index) => {
            const isRemoved = !newLines[index] || line !== newLines[index];
            return (
              <div key={index} className={`${isRemoved ? 'bg-red-100 text-red-800' : 'text-gray-700'}`}>
                {line}
              </div>
            );
          })}
        </pre>
      </div>
      
      {/* 右側（新バージョン） */}
      <div className="pl-4">
        <div className="font-bold mb-2 text-gray-700">新バージョン</div>
        <pre className="whitespace-pre-wrap">
          {newLines.map((line, index) => {
            const isAdded = !oldLines[index] || line !== oldLines[index];
            return (
              <div key={index} className={`${isAdded ? 'bg-green-100 text-green-800' : 'text-gray-700'}`}>
                {line}
              </div>
            );
          })}
        </pre>
      </div>
    </div>
  );
}