-- Add edit_request field to pending_approvals table for EDIT functionality
-- This field stores the edit request from salespeople when they want to modify RAG responses

ALTER TABLE public.pending_approvals 
ADD COLUMN edit_request text;

-- Add 'editing' status to the status check constraint
ALTER TABLE public.pending_approvals 
DROP CONSTRAINT pending_approvals_status_check;

ALTER TABLE public.pending_approvals 
ADD CONSTRAINT pending_approvals_status_check 
CHECK (status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text, 'expired'::text, 'editing'::text]));

-- Add comment for the new field
COMMENT ON COLUMN public.pending_approvals.edit_request IS 'Stores the edit request from salesperson when they want to modify the generated response';
