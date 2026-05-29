import { memo } from "react";
import type { DetailSectionConfig } from "./types";

interface DynamicDetailCellRendererProps {
  data: Record<string, any>;
  sections?: DetailSectionConfig[];
}

export const DynamicDetailCellRenderer = memo(({ data, sections = [] }: DynamicDetailCellRendererProps) => {
  if (!sections || sections.length === 0) {
    return (
      <div className="p-4 text-xs italic text-muted-foreground bg-muted/20 border rounded-md">
        No dynamic sub-sections are configured for this resource block view.
      </div>
    );
  }

  return (
    <div className="p-5 bg-slate-50/60 dark:bg-slate-900/40 border-y space-y-4 text-sm select-text">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sections.map((section, idx) => {
          const subObject = data[section.objectKey];
          if (!subObject || typeof subObject !== "object") return null;

          return (
            <div key={idx} className="space-y-2 border-r last:border-none border-slate-200 dark:border-slate-800 pr-4">
              <h4 className="font-bold text-xs text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-2">
                {section.title}
              </h4>
              <div className="space-y-1.5 text-xs font-mono text-slate-600 dark:text-slate-300">
                {Object.entries(subObject).map(([key, value]) => {
                  // Eliminate sensitive or internal system structural properties automatically
                  if (section.hiddenFields?.includes(key)) return null;

                  return (
                    <p key={key} className="truncate" title={`${key}: ${String(value)}`}>
                      <span className="font-semibold text-slate-900 dark:text-slate-100">{key}:</span>{" "}
                      {value !== null && value !== undefined ? String(value) : <span className="text-slate-400">null</span>}
                    </p>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});

DynamicDetailCellRenderer.displayName = "DynamicDetailCellRenderer";
