-- Add Moderation Workflow Fields to Signals Table
-- Enables content approval/rejection workflow with publication status tracking

-- Add publication status column
ALTER TABLE signals
ADD COLUMN publication_status TEXT DEFAULT 'pending'
CHECK (publication_status IN ('pending', 'approved', 'rejected', 'archived'));

-- Add rejection reason (for rejected signals)
ALTER TABLE signals
ADD COLUMN rejection_reason TEXT
CHECK (rejection_reason IN ('ad', 'irrelevant', 'bad_content', NULL));

-- Add timestamps for moderation
ALTER TABLE signals
ADD COLUMN approved_at TIMESTAMPTZ;

ALTER TABLE signals
ADD COLUMN rejected_at TIMESTAMPTZ;

ALTER TABLE signals
ADD COLUMN retracted_at TIMESTAMPTZ;

-- Add approved_by to track which admin approved it (optional, using metadata for now)
-- Can be extended: ADD COLUMN approved_by UUID REFERENCES users(id) ON DELETE SET NULL;

-- Create indexes for moderation queries
CREATE INDEX idx_signals_publication_status ON signals(publication_status);
CREATE INDEX idx_signals_approved_at ON signals(approved_at DESC);
CREATE INDEX idx_signals_rejected_at ON signals(rejected_at DESC);
CREATE INDEX idx_signals_is_featured ON signals(is_featured) WHERE is_featured = true;

-- Drop existing RLS policies (we're keeping them disabled for dev)
-- Ensure new columns don't break existing queries by providing defaults
