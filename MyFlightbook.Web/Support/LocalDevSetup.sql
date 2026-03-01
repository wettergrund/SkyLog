-- ============================================================
-- Local dev setup script
-- Run AFTER importing MinimalDB-2026-01-29.sql
-- ============================================================

USE logbook;

-- ── 1. Set encryption keys (required for token/sharing to work) ──────────
-- These are dev-only dummy values; never use these in production.
UPDATE localconfig SET keyValue = 'DevSharedDataKey-ChangeMe-32chars!!' WHERE keyName = 'SharedDataEncryptorKey';
UPDATE localconfig SET keyValue = 'DevUserAccessKey-ChangeMe-32chars!' WHERE keyName = 'UserAccessEncryptorKey';
UPDATE localconfig SET keyValue = 'DevPeerReqKey-ChangeMe-32chars!!!!' WHERE keyName = 'PeerRequestEncryptorKey';
UPDATE localconfig SET keyValue = 'DevWebAccessKey-ChangeMe-32chars!!' WHERE keyName = 'WebAccessEncryptorKey';
-- Must be a valid hex string (even number of 0-9 A-F chars) — HexToByte parses it byte-by-byte
UPDATE localconfig SET keyValue = '0102030405060708090A0B0C0D0E0F1011121314' WHERE keyName = 'UserPasswordHashKey';

-- ── 2. Set image directories (local paths) ───────────────────────────────
-- Leave empty to use the default relative path under the web root.
-- Or set to absolute paths if you want images stored elsewhere.
UPDATE localconfig SET keyValue = '' WHERE keyName = 'FlightsPixDir';
UPDATE localconfig SET keyValue = '' WHERE keyName = 'AircraftPixDir';
UPDATE localconfig SET keyValue = '' WHERE keyName = 'TelemetryDir';
UPDATE localconfig SET keyValue = '' WHERE keyName = 'EndorsementsPixDir';
UPDATE localconfig SET keyValue = '' WHERE keyName = 'BasicMedDir';

-- Keep UseAWSS3 empty so the app uses local disk for images
UPDATE localconfig SET keyValue = '' WHERE keyName = 'UseAWSS3';

-- ── 3. Verify ────────────────────────────────────────────────────────────
SELECT keyName, CASE WHEN keyValue = '' THEN '(empty)' ELSE '(set)' END AS status
FROM localconfig
ORDER BY keyName;
