import { useState } from 'react'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useDataStore, useUiStore } from '@/lib/store'
import type { CatalogItem } from '@/lib/types'

export function RequestDrawer({
  item,
  open,
  onOpenChange,
  source,
}: {
  item: CatalogItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
  source: 'catalog' | 'portal'
}) {
  const addTicket = useDataStore((s) => s.addTicket)
  const currentUserId = useUiStore((s) => s.currentUserId)
  const navigate = useNavigate()
  const [values, setValues] = useState<Record<string, string>>({})
  const [errors, setErrors] = useState<Record<string, boolean>>({})

  if (!item) return null

  function handleSubmit() {
    if (!item) return
    const nextErrors: Record<string, boolean> = {}
    item.fields.forEach((field) => {
      if (field.required && !values[field.label]?.trim()) nextErrors[field.label] = true
    })
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }
    const detailLines = item.fields.map((f) => `${f.label}: ${values[f.label] ?? '—'}`).join('\n')
    const id = addTicket({
      type: 'request',
      subject: item.title,
      description: `Service request: ${item.title}\n\n${detailLines}`,
      priority: item.defaultPriority,
      category: item.category,
      requesterId: currentUserId,
      source,
    })
    toast.success(`Request submitted — ${id}`, { description: `${item.title} · ${item.fulfillmentEstimate}` })
    setValues({})
    setErrors({})
    onOpenChange(false)
    if (source === 'catalog') navigate(`/tickets/${id}`)
  }

  function handleClose(next: boolean) {
    if (!next) {
      setValues({})
      setErrors({})
    }
    onOpenChange(next)
  }

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent className="flex w-full flex-col gap-0 sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="font-heading">{item.title}</SheetTitle>
          <SheetDescription>
            {item.description} · Typical fulfillment: {item.fulfillmentEstimate}.
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 space-y-5 overflow-y-auto px-4 py-2">
          {item.fields.map((field) => (
            <div key={field.label} className="space-y-1.5">
              <Label htmlFor={field.label}>
                {field.label}
                {field.required ? <span className="ml-0.5 text-destructive">*</span> : null}
              </Label>
              {field.type === 'select' ? (
                <Select
                  value={values[field.label] ?? ''}
                  onValueChange={(v) => setValues((prev) => ({ ...prev, [field.label]: v }))}
                >
                  <SelectTrigger id={field.label} aria-invalid={errors[field.label]}>
                    <SelectValue placeholder="Select an option" />
                  </SelectTrigger>
                  <SelectContent>
                    {field.options?.map((opt) => (
                      <SelectItem key={opt} value={opt}>
                        {opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : field.type === 'textarea' ? (
                <Textarea
                  id={field.label}
                  value={values[field.label] ?? ''}
                  aria-invalid={errors[field.label]}
                  onChange={(e) => setValues((prev) => ({ ...prev, [field.label]: e.target.value }))}
                  placeholder="Add details…"
                />
              ) : (
                <Input
                  id={field.label}
                  value={values[field.label] ?? ''}
                  aria-invalid={errors[field.label]}
                  onChange={(e) => setValues((prev) => ({ ...prev, [field.label]: e.target.value }))}
                />
              )}
              {errors[field.label] ? <p className="text-xs text-destructive">This field is required.</p> : null}
            </div>
          ))}
        </div>
        <SheetFooter className="flex-row justify-end gap-2">
          <Button variant="ghost" onClick={() => handleClose(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Submit request</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
