import {GraphQLServer} from "graphql-yoga";
import * as session from "express-session";
import * as connectRedis from "connect-redis";
import "reflect-metadata";
import * as RateLimit from 'express-rate-limit';
import * as RateLimitRedisStore from 'rate-limit-redis';
import "dotenv/config";
import * as passport from 'passport';

import {redis} from "./redis";
import twitter from './config/passport';
import {createTypeormConn} from "./testUtils/createTypeormConn";
import {confirmEmail} from "./routes/confirmEmail";
import {genSchema} from "./utils/genSchema";
import enVars from "./config/vars";
import {Connection} from "typeorm";

const {secret, devport, frontEndHost, redisSessionPrefix} = enVars;
const RedisStore = connectRedis(session);

// startServer is used for starting the Graphql & database servers in
// development/testing/production modes. Convert startServer into an exported
// object that can be called from Jest for testing purposes.  Each test will
// startup and shutdown the test server pass a context to GraphQLServer that
// includes the redis object and the requesting url which will be used to
// generate a confirm email link by the resolver
export const startServer = async() => {
  // Purge the Redis cache before each test
  if (process.env.NODE_ENV === "test") {
    await redis.flushall();
  }
  const server = new GraphQLServer({
    schema: genSchema(),
    context: ({request}) => ({
      redis,
      url: request.protocol + "://" + request.get("host"),
      session: request.session,
      req: request
    })
  });

  // RateLimit is a security middleware that limits the number of requests by IP
  // address.
  server
    .express
    .use(new RateLimit({
      store: new RateLimitRedisStore({client: redis as any}),
      windowMs: 15 *1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
      delayMs: 0 // disable delaying - full speed until the max limit is reached
    }));

  server
    .express
    .use(session({
      store: new RedisStore({client: redis as any, prefix: redisSessionPrefix}),
      name: "nrjid",
      secret: secret as string,
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
  let connection : Connection;
  // Purge the database before each test eslint-disable-next-line
  // prefer-conditional-expression
  if (process.env.NODE_ENV === "test") { // tslint:disable-line
    connection = await createTypeormConn(true);
  } else {
    connection = await createTypeormConn();

  }
  // Twitter auth middleware
  await twitter(connection);

  // Initialize Passport
  server
    .express
    .use(passport.initialize());

  server
    .express
    .get('/auth/twitter', passport.authenticate('twitter')); // use twitter strategy

  server
    .express
  // .get('/auth/twitter/callback', passport.authenticate('twitter', {session:
  // false}), (req, res) => {
    .get('/auth/twitter/callback', passport.authenticate('twitter', {session: false}), (req, res) => {
      // save userId in redis
      (req.session as any).userId = (req.user as any).id; // cast as any
      // @todo redirect to the front-end login page
      res.redirect('/');
    });

  const app = await server.start({
    cors,
    port: process.env.NODE_ENV === "test"
      ? 0
      : devport
  });
  console.log(`Server is running on localhost:${devport}`);

  return app;
};
