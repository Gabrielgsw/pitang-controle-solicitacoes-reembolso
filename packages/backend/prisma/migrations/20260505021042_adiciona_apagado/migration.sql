/*
  Warnings:

  - The values [IMAGEM,TEXTO] on the enum `TipoArquivo` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "TipoArquivo_new" AS ENUM ('PDF', 'PNG', 'JPG');
ALTER TABLE "Anexo" ALTER COLUMN "tipoArquivo" TYPE "TipoArquivo_new" USING ("tipoArquivo"::text::"TipoArquivo_new");
ALTER TYPE "TipoArquivo" RENAME TO "TipoArquivo_old";
ALTER TYPE "TipoArquivo_new" RENAME TO "TipoArquivo";
DROP TYPE "public"."TipoArquivo_old";
COMMIT;

-- AlterTable
ALTER TABLE "Anexo" ADD COLUMN     "apagado" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "SolicitacaoReembolso" ADD COLUMN     "apagado" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Usuario" ADD COLUMN     "apagado" BOOLEAN NOT NULL DEFAULT false;
