import * as cors from "@koa/cors";
import * as dotenv from "dotenv";
import * as Koa from "koa";
import * as bodyParser from "koa-bodyparser";
import * as helmet from "koa-helmet";
import * as jwt from "koa-jwt";
import * as PostgressConnectionStringParser from "pg-connection-string";
import "reflect-metadata";
import { createConnection } from "typeorm";
import * as winston from "winston";
import { config } from "./config";
import * as entities from "./entity";
import { includeCurrentUser } from "./middleware/include_current_user";
import { logger } from "./middleware/logging";
import apiRouter from "./routes";

// Load environment variables from .env file, where API keys and passwords are configured
console.log("Loading environmental variables...");
dotenv.config({ path: ".env" });

// Get DB connection options from env variable
const connectionOptions = PostgressConnectionStringParser.parse(config.databaseUrl);

const UNPROTECTED_PATHS = ["/api/sign-in"];

const onDatabaseConnect = async () => {
    console.log("Database successfully connected.");
    new Koa()
        // Provides important security headers to make your app more secure
        .use(helmet())

        // Enable cors with default options
        .use(cors())

        // Logger middleware -> use winston as logger (logging.ts with config)
        .use(logger(winston))

        // Enable bodyParser with default options
        .use(bodyParser())

        // JWT middleware -> below this line routes are only reached if JWT token is valid, secret as env variable
        .use(jwt({ secret: config.jwtSecret, cookie: "token" }).unless({ path: UNPROTECTED_PATHS }))

        // Include current user to ctx
        .use(includeCurrentUser().unless({ path: UNPROTECTED_PATHS }))

        // These routes are protected by the JWT middleware
        // Also includes middleware to respond with "Method Not Allowed - 405".
        .use(apiRouter.routes())
        .listen(config.port);

    console.log(`Server listening at port ${config.port}`);
};

console.log("Connecting to the database...");

// create connection with database
// note that its not active database connection
// TypeORM creates you connection pull to uses connections from pull on your requests
createConnection({
    type: "postgres",
    host: connectionOptions.host,
    port: connectionOptions.port,
    username: connectionOptions.user,
    password: connectionOptions.password,
    database: connectionOptions.database,
    synchronize: true,
    logging: false,
    entities: Object.values(entities),
    extra: {
        ssl: config.dbsslconn, // if not development, will use SSL
    },
})
    .then(onDatabaseConnect)
    .catch(error => console.log("TypeORM connection error: ", error));
