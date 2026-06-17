import { useState, useCallback, useEffect } from "react"
import {
  // API functions
  createAllocation,
  getAllAllocations,
  getAllocationByHeaderId,
  getAllocationSummary,
  getPendingApprovalLines,
  reviseQuantity,
  getLineRevisionHistory,
  approveLine,
  amendApprovedQuantity,
  cancelLine,
  cancelAllLines,
  getAllCancellations,
  // Types
  type AllocationRow,
  type AllocationSummary,
  type B3Line,
  type B3Cancellation,
  type CreateAllocationRequest,
  type ReviseQuantityRequest,
  type ReviseQuantityResponse,
  type ApproveLineRequest,
  type AmendQuantityRequest,
  type CancelLineRequest,
  type CancelHeaderRequest,
  type ActionResponse,
} from "@/api/binAllocationApi"

// ─────────────────────────────────────────────────────────────
// INTERNAL HELPERS
// ─────────────────────────────────────────────────────────────

function extractErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message
  return "An unexpected error occurred."
}

// ─────────────────────────────────────────────────────────────
// HOOK RETURN TYPE
// ─────────────────────────────────────────────────────────────

export interface UseBinAllocationReturn {
  // ── State ─────────────────────────────────────────────────
  allocations: AllocationRow[]
  selectedAllocation: AllocationRow[]
  summary: AllocationSummary[]
  pendingLines: B3Line[]
  revisionHistory: B3Line[]
  cancellations: B3Cancellation[]

  // ── Loading flags (per operation) ─────────────────────────
  loadingAllocations: boolean
  loadingSelected: boolean
  loadingSummary: boolean
  loadingPending: boolean
  loadingRevisions: boolean
  loadingCancellations: boolean
  submitting: boolean // any POST / PUT in-flight

  // ── Error ─────────────────────────────────────────────────
  error: string | null
  clearError: () => void

  // ── Success message ───────────────────────────────────────
  successMessage: string | null
  clearSuccess: () => void

  // ── READ actions ──────────────────────────────────────────
  fetchAllAllocations: () => Promise<void>
  fetchAllocationByHeaderId: (headerId: number) => Promise<void>
  fetchSummary: () => Promise<void>
  fetchPendingApprovalLines: () => Promise<void>
  fetchRevisionHistory: (originalLineId: number) => Promise<void>
  fetchCancellations: () => Promise<void>

  // ── WRITE actions ─────────────────────────────────────────
  submitCreateAllocation: (
    payload: CreateAllocationRequest
  ) => Promise<number | null>

  submitReviseQuantity: (
    payload: ReviseQuantityRequest
  ) => Promise<ReviseQuantityResponse | null>

  submitApproveLine: (
    payload: ApproveLineRequest
  ) => Promise<ActionResponse | null>

  submitAmendQuantity: (
    payload: AmendQuantityRequest
  ) => Promise<ActionResponse | null>

  submitCancelLine: (
    payload: CancelLineRequest
  ) => Promise<ActionResponse | null>

  submitCancelAllLines: (
    payload: CancelHeaderRequest
  ) => Promise<ActionResponse | null>
}

// ─────────────────────────────────────────────────────────────
// HOOK
// ─────────────────────────────────────────────────────────────

export function useBinAllocation(): UseBinAllocationReturn {
  // ── State ─────────────────────────────────────────────────
  const [allocations, setAllocations] = useState<AllocationRow[]>([])
  const [selectedAllocation, setSelectedAllocation] = useState<AllocationRow[]>(
    []
  )
  const [summary, setSummary] = useState<AllocationSummary[]>([])
  const [pendingLines, setPendingLines] = useState<B3Line[]>([])
  const [revisionHistory, setRevisionHistory] = useState<B3Line[]>([])
  const [cancellations, setCancellations] = useState<B3Cancellation[]>([])

  // ── Loading flags ─────────────────────────────────────────
  const [loadingAllocations, setLoadingAllocations] = useState(false)
  const [loadingSelected, setLoadingSelected] = useState(false)
  const [loadingSummary, setLoadingSummary] = useState(false)
  const [loadingPending, setLoadingPending] = useState(false)
  const [loadingRevisions, setLoadingRevisions] = useState(false)
  const [loadingCancellations, setLoadingCancellations] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // ── Feedback ──────────────────────────────────────────────
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const clearError = useCallback(() => setError(null), [])
  const clearSuccess = useCallback(() => setSuccessMessage(null), [])

  // ─────────────────────────────────────────────────────────
  // READ ACTIONS
  // ─────────────────────────────────────────────────────────

  const fetchAllAllocations = useCallback(async () => {
    setLoadingAllocations(true)
    setError(null)
    try {
      const data = await getAllAllocations()
      setAllocations(data)
    } catch (err) {
      setError(extractErrorMessage(err))
    } finally {
      setLoadingAllocations(false)
    }
  }, [])

  const fetchAllocationByHeaderId = useCallback(async (headerId: number) => {
    setLoadingSelected(true)
    setError(null)
    try {
      const data = await getAllocationByHeaderId(headerId)
      setSelectedAllocation(data)
    } catch (err) {
      setError(extractErrorMessage(err))
    } finally {
      setLoadingSelected(false)
    }
  }, [])

  const fetchSummary = useCallback(async () => {
    setLoadingSummary(true)
    setError(null)
    try {
      const data = await getAllocationSummary()
      setSummary(data)
    } catch (err) {
      setError(extractErrorMessage(err))
    } finally {
      setLoadingSummary(false)
    }
  }, [])

  const fetchPendingApprovalLines = useCallback(async () => {
    setLoadingPending(true)
    setError(null)
    try {
      const data = await getPendingApprovalLines()
      setPendingLines(data)
    } catch (err) {
      setError(extractErrorMessage(err))
    } finally {
      setLoadingPending(false)
    }
  }, [])

  const fetchRevisionHistory = useCallback(async (originalLineId: number) => {
    setLoadingRevisions(true)
    setError(null)
    try {
      const data = await getLineRevisionHistory(originalLineId)
      setRevisionHistory(data)
    } catch (err) {
      setError(extractErrorMessage(err))
    } finally {
      setLoadingRevisions(false)
    }
  }, [])

  const fetchCancellations = useCallback(async () => {
    setLoadingCancellations(true)
    setError(null)
    try {
      const data = await getAllCancellations()
      setCancellations(data)
    } catch (err) {
      setError(extractErrorMessage(err))
    } finally {
      setLoadingCancellations(false)
    }
  }, [])

  // ─────────────────────────────────────────────────────────
  // WRITE ACTIONS
  // ─────────────────────────────────────────────────────────

  /**
   * Create allocation (header + multiple lines).
   * Returns new headerId on success, null on failure.
   * Auto-refreshes allocations list after success.
   */
  const submitCreateAllocation = useCallback(
    async (payload: CreateAllocationRequest): Promise<number | null> => {
      setSubmitting(true)
      setError(null)
      setSuccessMessage(null)
      try {
        const res = await createAllocation(payload)
        setSuccessMessage("Bin allocation created successfully.")
        // Refresh list so new entry appears immediately
        const updated = await getAllAllocations()
        setAllocations(updated)
        return res.headerId
      } catch (err) {
        setError(extractErrorMessage(err))
        return null
      } finally {
        setSubmitting(false)
      }
    },
    []
  )

  /**
   * Revise quantity for a line (creates new revision row).
   * Returns ReviseQuantityResponse on success, null on failure.
   * Auto-refreshes pending lines after success.
   */
  const submitReviseQuantity = useCallback(
    async (
      payload: ReviseQuantityRequest
    ): Promise<ReviseQuantityResponse | null> => {
      setSubmitting(true)
      setError(null)
      setSuccessMessage(null)
      try {
        const res = await reviseQuantity(payload)
        setSuccessMessage(`Revision created. New line ID: ${res.newLineId}`)
        // Refresh pending lines since the new revision needs re-approval
        const pending = await getPendingApprovalLines()
        setPendingLines(pending)
        return res
      } catch (err) {
        setError(extractErrorMessage(err))
        return null
      } finally {
        setSubmitting(false)
      }
    },
    []
  )

  /**
   * HOD approves a pending line.
   * Auto-refreshes pending lines after success.
   */
  const submitApproveLine = useCallback(
    async (payload: ApproveLineRequest): Promise<ActionResponse | null> => {
      setSubmitting(true)
      setError(null)
      setSuccessMessage(null)
      try {
        const res = await approveLine(payload)
        setSuccessMessage(res.message)
        // Remove approved line from pending list immediately
        setPendingLines((prev) =>
          prev.filter((l) => l.lineId !== payload.lineId)
        )
        // Also refresh full allocations so approvalFlag reflects in the list
        const updated = await getAllAllocations()
        setAllocations(updated)
        return res
      } catch (err) {
        setError(extractErrorMessage(err))
        return null
      } finally {
        setSubmitting(false)
      }
    },
    []
  )

  /**
   * HOD amends an already-approved quantity.
   * Auto-refreshes allocations after success.
   */
  const submitAmendQuantity = useCallback(
    async (payload: AmendQuantityRequest): Promise<ActionResponse | null> => {
      setSubmitting(true)
      setError(null)
      setSuccessMessage(null)
      try {
        const res = await amendApprovedQuantity(payload)
        setSuccessMessage(res.message)
        const updated = await getAllAllocations()
        setAllocations(updated)
        return res
      } catch (err) {
        setError(extractErrorMessage(err))
        return null
      } finally {
        setSubmitting(false)
      }
    },
    []
  )

  /**
   * Cancel a single allocation line.
   * Auto-refreshes allocations and cancellations after success.
   */
  const submitCancelLine = useCallback(
    async (payload: CancelLineRequest): Promise<ActionResponse | null> => {
      setSubmitting(true)
      setError(null)
      setSuccessMessage(null)
      try {
        const res = await cancelLine(payload)
        setSuccessMessage(res.message)
        // Optimistically mark line as closed in state
        setAllocations((prev) =>
          prev.map((row) =>
            row.lineId === payload.lineId ? { ...row, closureFlag: "Y" } : row
          )
        )
        // Refresh cancellations list
        const updated = await getAllCancellations()
        setCancellations(updated)
        return res
      } catch (err) {
        setError(extractErrorMessage(err))
        return null
      } finally {
        setSubmitting(false)
      }
    },
    []
  )

  /**
   * Cancel all open lines under a header.
   * Auto-refreshes allocations and cancellations after success.
   */
  const submitCancelAllLines = useCallback(
    async (payload: CancelHeaderRequest): Promise<ActionResponse | null> => {
      setSubmitting(true)
      setError(null)
      setSuccessMessage(null)
      try {
        const res = await cancelAllLines(payload)
        setSuccessMessage(res.message)
        // Optimistically mark all lines for this header as closed
        setAllocations((prev) =>
          prev.map((row) =>
            row.headerId === payload.headerId
              ? { ...row, closureFlag: "Y" }
              : row
          )
        )
        const updated = await getAllCancellations()
        setCancellations(updated)
        return res
      } catch (err) {
        setError(extractErrorMessage(err))
        return null
      } finally {
        setSubmitting(false)
      }
    },
    []
  )

  // ─────────────────────────────────────────────────────────
  // AUTO-FETCH ON MOUNT
  // ─────────────────────────────────────────────────────────

  useEffect(() => {
    fetchAllAllocations()
    fetchSummary()
    fetchPendingApprovalLines()
  }, [fetchAllAllocations, fetchSummary, fetchPendingApprovalLines])

  // ─────────────────────────────────────────────────────────
  // RETURN
  // ─────────────────────────────────────────────────────────

  return {
    // State
    allocations,
    selectedAllocation,
    summary,
    pendingLines,
    revisionHistory,
    cancellations,

    // Loading flags
    loadingAllocations,
    loadingSelected,
    loadingSummary,
    loadingPending,
    loadingRevisions,
    loadingCancellations,
    submitting,

    // Feedback
    error,
    clearError,
    successMessage,
    clearSuccess,

    // Read actions
    fetchAllAllocations,
    fetchAllocationByHeaderId,
    fetchSummary,
    fetchPendingApprovalLines,
    fetchRevisionHistory,
    fetchCancellations,

    // Write actions
    submitCreateAllocation,
    submitReviseQuantity,
    submitApproveLine,
    submitAmendQuantity,
    submitCancelLine,
    submitCancelAllLines,
  }
}
