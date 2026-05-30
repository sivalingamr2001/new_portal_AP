'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronRight, Database, Folder } from 'lucide-react';

export interface FolderNode {
  id: string;
  name: string;
  path: string;
  driveName: string;
  children?: FolderNode[];
}

interface FolderNavigatorProps {
  folders: FolderNode[];
  onPathSelect: (path: string) => void;
  maxDepth?: number;
  initialPath?: string;
}

function sanitizeUNCPath(rawPath?: string): string {
  if (!rawPath) return '';
  let sanitized = rawPath.replace(/\//g, '\\');
  sanitized = sanitized.replace(/\s*\\\s*/g, '\\');
  if (sanitized.startsWith('\\') && !sanitized.startsWith('\\\\')) {
    sanitized = '\\' + sanitized;
  }
  return sanitized.trim();
}

export function FolderNavigator({
  folders,
  onPathSelect,
  maxDepth = 4,
  initialPath = '',
}: FolderNavigatorProps) {
  const [pathStack, setPathStack] = useState<FolderNode[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentLevel, setCurrentLevel] = useState<FolderNode[]>(folders);

  // Synchronize and auto-populate state when an existing item path is loaded
  useEffect(() => {
    if (!initialPath || !folders || folders.length === 0) {
      setPathStack([]);
      setCurrentLevel(folders);
      return;
    }

    const sanitizedInitial = sanitizeUNCPath(initialPath).toLowerCase();
    const reconstructedStack: FolderNode[] = [];
    let searchLevel: FolderNode[] | undefined = folders;
    let currentMatchFound = true;

    // Traverse the folder tree hierarchy to match the saved path segments
    while (currentMatchFound && searchLevel && searchLevel.length > 0) {
      currentMatchFound = false;
      for (const node of searchLevel) {
        const sanitizedNodePath = sanitizeUNCPath(node.path).toLowerCase();
        
        // Exact match found: add to stack and terminate traversal loop
        if (sanitizedInitial === sanitizedNodePath) {
          reconstructedStack.push(node);
          searchLevel = [];
          currentMatchFound = true;
          break;
        } 
        // Parent node match found: add to stack and step down into children branches
        else if (sanitizedInitial.startsWith(sanitizedNodePath + '\\')) {
          reconstructedStack.push(node);
          searchLevel = node.children;
          currentMatchFound = true;
          break;
        }
      }
    }

    if (reconstructedStack.length > 0) {
      setPathStack(reconstructedStack);
      const lastNode = reconstructedStack[reconstructedStack.length - 1];
      
      if (
        lastNode.children &&
        lastNode.children.length > 0 &&
        reconstructedStack.length < maxDepth
      ) {
        setCurrentLevel(lastNode.children);
      } else {
        setCurrentLevel([]);
      }
    } else {
      setPathStack([]);
      setCurrentLevel(folders);
    }
  }, [initialPath, folders, maxDepth]);

  const handleFolderSelect = (folder: FolderNode) => {
    const newStack = [...pathStack, folder];
    setPathStack(newStack);
    onPathSelect(sanitizeUNCPath(folder.path));

    if (
      folder.children &&
      folder.children.length > 0 &&
      newStack.length < maxDepth
    ) {
      setCurrentLevel(folder.children);
    } else {
      setCurrentLevel([]);
    }
    setSearchTerm('');
  };

  const handleGoBack = () => {
    if (pathStack.length === 0) {
      setCurrentLevel(folders);
      onPathSelect('');
    } else {
      const newStack = pathStack.slice(0, -1);
      setPathStack(newStack);

      if (newStack.length === 0) {
        setCurrentLevel(folders);
        onPathSelect('');
      } else {
        const lastFolder = newStack[newStack.length - 1];
        if (lastFolder.children) {
          setCurrentLevel(lastFolder.children);
          onPathSelect(sanitizeUNCPath(lastFolder.path));
        } else {
          setCurrentLevel([]);
          onPathSelect(sanitizeUNCPath(lastFolder.path));
        }
      }
    }
    setSearchTerm('');
  };

  const normalizedSearch = searchTerm?.toLowerCase() ?? ''
  const filteredFolders = currentLevel.filter((folder) => {
    const folderName = folder.name?.toLowerCase() ?? ''
    const driveName = folder.driveName?.toLowerCase() ?? ''
    return folderName.includes(normalizedSearch) || driveName.includes(normalizedSearch)
  })

  const currentSelection = pathStack[pathStack.length - 1];
  const breadcrumbDrivePrefix = sanitizeUNCPath(
    currentSelection?.driveName ?? '',
  );
  const remainingFoldersPath = pathStack.map((f) => f.name).join(' \\ ');

  const fullBreadcrumbDisplay = remainingFoldersPath
    ? `${breadcrumbDrivePrefix} \\ ${remainingFoldersPath}`
    : breadcrumbDrivePrefix;

  return (
    <div className="space-y-3 rounded-lg border border-border bg-card p-4">
      <div className="flex w-full flex-col gap-1.5 text-xs font-medium text-muted-foreground">
        <span className="shrink-0">Folder Path:</span>
        {pathStack.length > 0 ? (
          <div className="flex w-full items-start gap-1.5 rounded bg-secondary/30 p-2 text-foreground">
            <Database className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
            <span className="whitespace-normal break-all font-mono text-xs font-medium leading-relaxed text-primary">
              {fullBreadcrumbDisplay}
            </span>
          </div>
        ) : (
          <span className="text-muted-foreground/60 italic">
            None selected
          </span>
        )}
      </div>

      <Input
        placeholder="Search folders or drives..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="h-8 text-xs"
      />

      <div className="max-h-40 space-y-1 overflow-y-auto rounded border border-border/50 bg-background p-2">
        {pathStack.length > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleGoBack}
            className="w-full justify-start text-xs font-semibold text-muted-foreground hover:text-foreground"
          >
            ← Back
          </Button>
        )}

        {filteredFolders.length === 0 ? (
          <div className="p-2 text-center text-xs text-muted-foreground">
            {searchTerm ? 'No matches found' : 'No folder listings available'}
          </div>
        ) : (
          filteredFolders.map((folder, index) => {
            const isAtRootLevel = pathStack.length === 0;
            const sanitizedDriveLabel = sanitizeUNCPath(folder.driveName ?? '');
            const folderKey =
              folder.id || `${folder.driveName ?? 'unknown'}\\${folder.name ?? 'unknown'}-${index}`;

            return (
              <Button
                key={folderKey}
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleFolderSelect(folder)}
                className="group/item w-full justify-start text-xs"
                disabled={
                  pathStack.length >= maxDepth && !folder.children?.length
                }
              >
                {isAtRootLevel ? (
                  <Database className="mr-2 h-3.5 w-3.5 shrink-0 transition-transform text-emerald-500 group-hover/item:scale-105" />
                ) : (
                  <Folder className="mr-2 h-3.5 w-3.5 shrink-0 transition-transform text-primary group-hover/item:scale-105" />
                )}

                <span className="flex-1 truncate text-left">
                  {folder.name}{' '}
                  {isAtRootLevel && (
                    <span className="ml-1.5 font-mono text-[10px] font-normal text-muted-foreground">
                      ({sanitizedDriveLabel})
                    </span>
                  )}
                </span>

                {folder.children &&
                  folder.children.length > 0 &&
                  pathStack.length < maxDepth && (
                    <ChevronRight className="ml-auto h-3 w-3 shrink-0 text-muted-foreground" />
                  )}
              </Button>
            );
          })
        )}
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          Level {pathStack.length} of {maxDepth}
        </span>
        {currentSelection && (
          <span className="max-w-62.5 truncate rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
            Drive Name: {sanitizeUNCPath(currentSelection.driveName)}
          </span>
        )}
      </div>
    </div>
  );
}