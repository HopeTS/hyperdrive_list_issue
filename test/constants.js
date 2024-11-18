import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);

/** Root directory of test folder */
export const TEST_ROOT_DIR = path.dirname(__filename);
/** Base directory for all mock data */
export const TEST_MOCK_DATA_DIR = `${TEST_ROOT_DIR}/d`;
/** Directory to store all generated corestores */
export const CORESTORE_DIR = `${TEST_MOCK_DATA_DIR}/c`;
/** Directory to store all generated localdrives */
export const LD_DIR = `${TEST_MOCK_DATA_DIR}/l`;
