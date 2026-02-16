-- Backfill publication_status for existing signals
UPDATE signals
SET publication_status = 'pending'
WHERE publication_status IS NULL;

-- Verify update
SELECT COUNT(*) as total,
       COUNT(CASE WHEN publication_status IS NOT NULL THEN 1 END) as with_status
FROM signals;
