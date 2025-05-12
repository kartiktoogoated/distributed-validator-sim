-- AlterTable
CREATE SEQUENCE validator_id_seq;
ALTER TABLE "Validator" ALTER COLUMN "id" SET DEFAULT nextval('validator_id_seq');
ALTER SEQUENCE validator_id_seq OWNED BY "Validator"."id";
