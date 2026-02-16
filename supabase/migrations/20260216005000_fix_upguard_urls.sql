-- Remove signals with malformed UpGuard URLs
-- These are duplicate/broken links that should be cleaned up
-- Instead of fixing them, we delete them since they're not valid sources

DELETE FROM signals
WHERE source_url LIKE '%upguard.comnews%'
   OR source_url LIKE '%upguard.combreaches%';

-- Verify the cleanup
SELECT COUNT(*) as remaining_signals FROM signals;
