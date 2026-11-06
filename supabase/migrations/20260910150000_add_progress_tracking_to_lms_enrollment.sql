-- lib/actions/learn.ts (fetchLesson, markLessonComplete) has always selected/updated
-- `progress` and `last_lesson_id` on lms_courses_enrollment, but those columns were
-- never actually added to the table — every such query silently failed (error was
-- never checked), so enrollment always resolved to null on the lesson page, which
-- redirected learners straight back to the course page instead of playing the lesson.
--
-- last_lesson_id is a flattened outline position ("<sectionIndex>-<lessonIndex>"),
-- not a foreign key to a real lessons table, since lessons live inside the
-- course_outline JSON rather than their own rows.

alter table lms_courses_enrollment
    add column if not exists progress integer not null default 0,
    add column if not exists last_lesson_id text;
