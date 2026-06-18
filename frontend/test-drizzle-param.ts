import { sql } from "drizzle-orm";
import { PgDialect } from "drizzle-orm/pg-core";

const dialect = new PgDialect();
const parsed = { limit: 10 };

const param = sql.param(parsed.limit)

console.log("type:", typeof param, param);
