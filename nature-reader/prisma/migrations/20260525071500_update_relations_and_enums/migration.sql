-- Drop existing foreign keys to profiles
ALTER TABLE "posts" DROP CONSTRAINT "posts_user_id_fkey";
ALTER TABLE "comments" DROP CONSTRAINT "comments_user_id_fkey";

-- Alter columns user_id to be nullable (DROP NOT NULL)
ALTER TABLE "posts" ALTER COLUMN "user_id" DROP NOT NULL;
ALTER TABLE "comments" ALTER COLUMN "user_id" DROP NOT NULL;

-- Re-add foreign keys to profiles with ON DELETE SET NULL
ALTER TABLE "posts" ADD CONSTRAINT "posts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "comments" ADD CONSTRAINT "comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Drop column reason from post_reports temporarily to update its enum type
ALTER TABLE "post_reports" DROP COLUMN "reason";

-- Drop the old enum type
DROP TYPE "ReportReason";

-- Recreate the enum type with new values (standard taxonomy from feedback2.md)
CREATE TYPE "ReportReason" AS ENUM ('spam', 'abusive_language', 'violence', 'harassment', 'misleading', 'copyright', 'other');

-- Re-add the column reason with the new enum type
ALTER TABLE "post_reports" ADD COLUMN "reason" "ReportReason" NOT NULL;

-- Add unique index constraint on books (title, author) to prevent semantic duplicates
CREATE UNIQUE INDEX "books_title_author_key" ON "books"("title", "author");

-- Add moderation_note column to post_reports for admin audit logs
ALTER TABLE "post_reports" ADD COLUMN "moderation_note" TEXT;
