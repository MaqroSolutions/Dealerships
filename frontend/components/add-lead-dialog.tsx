"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createLead } from "@/lib/leads-api"
import { useToast } from "@/hooks/use-toast"

interface AddLeadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function AddLeadDialog({ open, onOpenChange, onSuccess }: AddLeadDialogProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    car_interest: "",
    source: "Manual Entry",
    message: ""
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Validate required fields
      if (!formData.car_interest.trim()) {
        toast({
          title: "Validation Error",
          description: "Car interest is required",
          variant: "destructive"
        })
        setLoading(false)
        return
      }

      // Create lead via API
      // Note: Backend returns { lead_id, status, message }, not the full Lead object
      await createLead({
        name: formData.name.trim() || null,
        email: formData.email.trim() || null,
        phone: formData.phone.trim() || null,
        car_interest: formData.car_interest.trim(),
        source: formData.source,
        message: formData.message.trim() || null,
        user_id: "", // Will be filled by backend from auth token
        created_at: "", // Will be filled by backend
        id: "", // Will be filled by backend
        status: "new", // Default status
        last_contact_at: new Date().toISOString() // Default to now
      } as any)

      toast({
        title: "Success",
        description: "Lead created successfully"
      })

      // Reset form
      setFormData({
        name: "",
        email: "",
        phone: "",
        car_interest: "",
        source: "Manual Entry",
        message: ""
      })

      // Close dialog
      onOpenChange(false)

      // Trigger refresh
      if (onSuccess) {
        onSuccess()
      }
    } catch (error) {
      console.error("Error creating lead:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create lead",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-gray-900 border-gray-800">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-gray-100">Add New Lead</DialogTitle>
            <DialogDescription className="text-gray-400">
              Create a new lead manually. Fill in the available information.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name" className="text-gray-300">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="John Smith"
                className="bg-gray-800 border-gray-700 text-gray-100"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email" className="text-gray-300">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="john.smith@email.com"
                className="bg-gray-800 border-gray-700 text-gray-100"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="phone" className="text-gray-300">Phone</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+1 (555) 123-4567"
                className="bg-gray-800 border-gray-700 text-gray-100"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="car_interest" className="text-gray-300">
                Car Interest <span className="text-red-400">*</span>
              </Label>
              <Input
                id="car_interest"
                value={formData.car_interest}
                onChange={(e) => setFormData({ ...formData, car_interest: e.target.value })}
                placeholder="2024 Toyota Camry"
                required
                className="bg-gray-800 border-gray-700 text-gray-100"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="source" className="text-gray-300">Source</Label>
              <Input
                id="source"
                value={formData.source}
                onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                className="bg-gray-800 border-gray-700 text-gray-100"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="message" className="text-gray-300">Initial Message</Label>
              <Textarea
                id="message"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Customer's initial inquiry or notes..."
                className="bg-gray-800 border-gray-700 text-gray-100 min-h-[100px]"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="border-gray-700 text-gray-300"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? "Creating..." : "Create Lead"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
