import {GraphQLServer} from "graphql-yoga";
import * as session from "express-session";
import * as connectRedis from "connect-redis";
import "reflect-metadata";

import "dotenv/config";

import {redis} from "./redis";

import {createTypeormConn} from "./utils/createTypeormConn";
import {confirmEmail} from "./routes/confirmEmail";
import {genSchema} from "./utils/genSchema";
import enVars from "./config/vars";

const {secret, devport, frontEndHost, redisSessionPrefix} = enVars;
const RedisStore = connectRedis(session);

// startServer is used for starting the Graphql & database servers in
// development/testing/production modes. Convert startServer into an exported
// object that can be called from Jest for testing purposes.  Each test will
// startup and shutdown the test server pass a context to GraphQLServer that
// includes the redis object and the requesting url which will be used to
// generate a confirm email link by the resolver
export const startServer = async() => {
  const server = new GraphQLServer({
    schema: genSchema(),
    context: ({request}) => ({
      redis,
      url: request.protocol + "://" + request.get("host"),
      session: request.session,
      req: request
    })
  });

  server
    .express
    .use(session({
      store: new RedisStore({client: redis as any, prefix: redisSessionPrefix}),
      name: "nrjid",
      secret,
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days
      }
    }));

  const cors = {
    credentials: true,
    origin: process.env.NODE_ENV === "test"
      ? "*"
      : frontEndHost
  };
  server
    .express
    .get("/confirm/:id.:ext?", confirmEmail);

  await createTypeormConn();
  const app = await server.start({
    cors,
    port: process.env.NODE_ENV === "test"
      ? 0
      : devport
  });
  console.log(`Server is running on localhost:${devport}`);

  return app;
};
