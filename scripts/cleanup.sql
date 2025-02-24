-- Drop all foreign key constraints first
ALTER TABLE IF EXISTS "milestone_updates" DROP CONSTRAINT IF EXISTS "FK_milestone_updates_milestone";
ALTER TABLE IF EXISTS "milestone_updates" DROP CONSTRAINT IF EXISTS "FK_milestone_updates_contract";
ALTER TABLE IF EXISTS "milestone_updates" DROP CONSTRAINT IF EXISTS "FK_9014c95c55f2eeac4007f398598";
ALTER TABLE IF EXISTS "milestones" DROP CONSTRAINT IF EXISTS "FK_milestones_contract";
ALTER TABLE IF EXISTS "contracts" DROP CONSTRAINT IF EXISTS "FK_contracts_rfp";
ALTER TABLE IF EXISTS "contracts" DROP CONSTRAINT IF EXISTS "FK_contracts_vendor";
ALTER TABLE IF EXISTS "contracts" DROP CONSTRAINT IF EXISTS "FK_5c3066bc3ec3f547c4ab0ae04b3";
ALTER TABLE IF EXISTS "bids" DROP CONSTRAINT IF EXISTS "FK_bids_rfp";
ALTER TABLE IF EXISTS "bids" DROP CONSTRAINT IF EXISTS "FK_bids_vendor";
ALTER TABLE IF EXISTS "rfps" DROP CONSTRAINT IF EXISTS "FK_rfps_category";
ALTER TABLE IF EXISTS "rfps" DROP CONSTRAINT IF EXISTS "FK_rfps_createdBy";
ALTER TABLE IF EXISTS "rfps" DROP CONSTRAINT IF EXISTS "FK_e646fa8cfb276fef5883a18b101";
ALTER TABLE IF EXISTS "rfps" DROP CONSTRAINT IF EXISTS "FK_b5bed400c9a9a11f04cdffb0c1d";

-- Drop tables
DROP TABLE IF EXISTS "milestone_updates" CASCADE;
DROP TABLE IF EXISTS "milestones" CASCADE;
DROP TABLE IF EXISTS "contracts" CASCADE;
DROP TABLE IF EXISTS "bids" CASCADE;
DROP TABLE IF EXISTS "rfps" CASCADE;
DROP TABLE IF EXISTS "rfp_categories" CASCADE;
DROP TABLE IF EXISTS "users" CASCADE;
DROP TABLE IF EXISTS "migrations" CASCADE;
DROP SEQUENCE IF EXISTS "migrations_id_seq" CASCADE;

-- Drop enum types
DROP TYPE IF EXISTS "bids_status_enum" CASCADE;
DROP TYPE IF EXISTS "contracts_status_enum" CASCADE;
DROP TYPE IF EXISTS "milestone_updates_status_enum" CASCADE;
DROP TYPE IF EXISTS "milestones_status_enum" CASCADE;
DROP TYPE IF EXISTS "rfps_status_enum" CASCADE;
DROP TYPE IF EXISTS "users_role_enum" CASCADE;

-- Drop extensions (optional, comment out if you want to keep the extension)
-- DROP EXTENSION IF EXISTS "uuid-ossp" CASCADE; 