-- The application code has always assumed a `read` boolean column on
-- notifications (for the unread badge count, the notifications list, and
-- markNotificationsRead), but the live table never had one — every query
-- touching it was silently failing (errors were logged but swallowed,
-- defaulting counts to 0 and lists to empty). The app also assumed a
-- `recipient_id` column; the real column is `user_id` (fixed in app code,
-- not here, since renaming a live column is riskier than adding one).
--
-- This just adds the missing column the app already expects, defaulting
-- every existing row to unread (false) since we have no way to know which
-- historical notifications were actually seen.

alter table public.notifications
  add column if not exists read boolean not null default false;

create index if not exists notifications_user_id_read_idx
  on public.notifications(user_id, read);
