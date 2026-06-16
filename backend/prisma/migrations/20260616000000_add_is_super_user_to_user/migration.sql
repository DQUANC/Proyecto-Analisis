-- AlterTable
ALTER TABLE "User" ADD COLUMN "isSuperUser" BOOLEAN NOT NULL DEFAULT false;

-- Backfill desde la tabla auxiliar super_users (creada antes por código, fuera de Prisma) y eliminarla
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'super_users') THEN
    UPDATE "User" SET "isSuperUser" = true WHERE id IN (SELECT user_id FROM super_users);
    DROP TABLE super_users;
  END IF;
END $$;
