import { useEffect, useState, type ChangeEvent } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

type RevocModalProps = {
  isOpen: boolean
  isPending: boolean
  onClose: () => void
  onSubmit: (comments: string) => void
}

function RevocModal({ isOpen, isPending, onClose, onSubmit }: RevocModalProps) {
  const [comments, setComments] = useState("")

  useEffect(() => {
    if (isOpen) {
      setComments("")
    }
  }, [isOpen])

  const handleRevoke = () => {
    onSubmit(comments.trim())
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl! sm:max-w-2xl!">
        <DialogHeader>
          <DialogTitle>Revoke Access Request</DialogTitle>
          <DialogDescription>
            Provide a brief reason for revoking access before confirming.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <Field label="Revocation Comments">
            <Textarea
              className="min-h-32"
              placeholder="Add your revocation comments..."
              value={comments}
              onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
                setComments(event.target.value)
              }
            />
          </Field>
        </div>

        <div className="flex justify-end gap-3 border-t pt-4">
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleRevoke}
            disabled={isPending || !comments.trim()}
          >
            {isPending ? "Processing..." : "Confirm Revocation"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function Field({
  children,
  label,
}: {
  children: React.ReactNode
  label: string
}) {
  return (
    <div className="space-y-2">
      <Label className="text-xs font-semibold">{label}</Label>
      {children}
    </div>
  )
}

export default RevocModal
