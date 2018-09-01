import * as dotenv from "dotenv";

dotenv.config({ path: ".env" });

export interface IConfig {
    port: number;
    debugLogging: boolean;
    DbSslConn: boolean;
    jwtSecret: string;
    databaseUrl: string;
}

const { DB_USERNAME, DB_PASSWORD, DB_NAME, DB_URL, DB_PORT } = process.env;
const databaseUrl = `postgres://${DB_USERNAME}:${DB_PASSWORD}@${DB_URL}:${DB_PORT}/${DB_NAME}`;

const config = {
    port: process.env.PORT || 3000,
    debugLogging: process.env.NODE_ENV == "development",
    dbsslconn: process.env.NODE_ENV != "development",
    jwtSecret: process.env.JWT_SECRET || "your-secret-whatever",
    databaseUrl,
};

export { config };

