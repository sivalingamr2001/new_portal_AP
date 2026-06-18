import { useNavigate } from 'react-router-dom';
import { FulfillmentTrackerTable } from '@/components/fulfillment/FulfillmentTrackerTable';
import { useFulFilment } from '@/components/fulfillment/hooks/useFullfilement';
import React, { useCallback } from 'react';

export const FulfillmentScreen: React.FC = () => {
  const {
    groupedHeaders,
    loadingRecords,
    selectedRecord,
    loadingSingle,
    closeEditModal,
    refreshRecords
  } = useFulFilment();

  const navigate = useNavigate();
  const handleEditClick = useCallback((headerId: number) => {
    navigate(`/fulfillment/edit/${headerId}`);
  }, [navigate]);

  // Metrics extraction for top indicators dashboard
  const metrics = React.useMemo(() => {
    let req = 0, app = 0, linesCount = 0;
    groupedHeaders.forEach(h => {
      req += h.totalRequested;
      app += h.totalApproved;
      linesCount += h.lines.length;
    });
    return { linesCount, req, app, unallocated: req - app };
  }, [groupedHeaders]);

  return (
    <div className="w-full min-h-screen bg-slate-100 p-4 font-sans text-xs text-slate-700 antialiased">
      {/* Visual KPI Header Grid Section */}
      <div className="grid grid-cols-4 gap-4 mb-4">
        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
          <div className="text-slate-400 font-semibold uppercase text-[10px]">Total Order Items</div>
          <div className="text-lg font-bold text-slate-800 mt-1">{metrics.linesCount} lines</div>
        </div>
        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
          <div className="text-slate-400 font-semibold uppercase text-[10px]">Requested Quantities</div>
          <div className="text-lg font-bold text-slate-800 mt-1">{metrics.req.toLocaleString()}</div>
        </div>
        <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
          <div className="text-slate-400 font-semibold uppercase text-[10px]">Allocated Approved</div>
          <div className="text-lg font-bold text-green-600 mt-1">{metrics.app.toLocaleString()}</div>
        </div>
        <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg shadow-xs">
          <div className="text-amber-700 font-semibold uppercase text-[10px]">Unallocated Pipeline</div>
          <div className="text-lg font-bold text-amber-800 mt-1">{metrics.unallocated.toLocaleString()}</div>
        </div>
      </div>

      {/* Primary Shared Table System View Container */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        {loadingRecords ? (
          <div className="p-12 text-center text-slate-400 animate-pulse font-medium">Downloading record stream pipeline...</div>
        ) : (
          <FulfillmentTrackerTable headers={groupedHeaders} onEditClick={handleEditClick} />
        )}
      </div>

      {/* Dynamic Overlay Edit Mutation Modal Drawer Context */}
      {selectedRecord && (
        <div></div>
      )}
    </div>
  );
};
