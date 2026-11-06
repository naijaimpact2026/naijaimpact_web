-- Video thumbnails were saved with Supabase image-transform params
-- (?width=…&height=…&quality=…). Transforms aren't enabled on this project, so
-- those URLs return 400 ("querystring/width must be integer"). The plain object
-- URLs work; store those instead.
UPDATE public.post_medias
SET thumbnail_url = split_part(thumbnail_url, '?', 1)
WHERE thumbnail_url LIKE '%/storage/v1/object/public/%?%'
  AND thumbnail_url ~ '[?&](width|height|quality|resize)=';
