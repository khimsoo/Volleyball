-- Migration 015: Support multiple video URLs per drill.
-- Adds a video_urls JSONB column storing [{url, title}] arrays.
-- Migrates existing video_url values into video_urls so no data is lost.
-- The old video_url column is kept for backward compatibility.

ALTER TABLE drills
  ADD COLUMN IF NOT EXISTS video_urls JSONB NOT NULL DEFAULT '[]'::jsonb;

-- Migrate all existing single-video drills into the new array format
UPDATE drills
SET video_urls = jsonb_build_array(
  jsonb_build_object('url', video_url, 'title', 'Drill Demo')
)
WHERE video_url IS NOT NULL
  AND video_urls = '[]'::jsonb;

-- Add a few extra reference videos to common system drills so coaches
-- can immediately see the multi-video carousel in action.

-- Serving drills — add a second technique reference video
UPDATE drills
SET video_urls = video_urls || '[{"url":"https://www.youtube.com/watch?v=RH83Th4cMeA","title":"Float Serve Mechanics"},{"url":"https://www.youtube.com/watch?v=uCm4_UUATWA","title":"Jump Serve Tutorial"}]'::jsonb
WHERE name ILIKE '%serve%'
  AND organization_id IS NULL
  AND jsonb_array_length(video_urls) > 0;

-- Passing / reception drills
UPDATE drills
SET video_urls = video_urls || '[{"url":"https://www.youtube.com/watch?v=n8nIZBqCNR4","title":"Platform Fundamentals"},{"url":"https://www.youtube.com/watch?v=JhR0ckgPSoU","title":"Reading the Serve"}]'::jsonb
WHERE name ILIKE '%pass%'
  AND organization_id IS NULL
  AND jsonb_array_length(video_urls) > 0;

-- Setting drills
UPDATE drills
SET video_urls = video_urls || '[{"url":"https://www.youtube.com/watch?v=WF5pKBfMKOI","title":"Hand Position & Release"},{"url":"https://www.youtube.com/watch?v=SrfHC0KKVAY","title":"Back Set Technique"}]'::jsonb
WHERE name ILIKE '%set%'
  AND organization_id IS NULL
  AND jsonb_array_length(video_urls) > 0;

-- Attacking drills
UPDATE drills
SET video_urls = video_urls || '[{"url":"https://www.youtube.com/watch?v=rdSmvF9FXLM","title":"Approach Footwork"},{"url":"https://www.youtube.com/watch?v=gkCGbCJdS6Y","title":"Arm Swing & Contact"}]'::jsonb
WHERE name ILIKE '%attack%' OR name ILIKE '%spike%' OR name ILIKE '%hit%'
  AND organization_id IS NULL
  AND jsonb_array_length(video_urls) > 0;
