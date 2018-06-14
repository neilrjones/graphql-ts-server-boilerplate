import {GraphQLServer} from "graphql-yoga";
import * as session from "express-session";
import * as connectRedis from "connect-redis";
import "reflect-metadata";
import * as RateLimit from 'express-rate-limit';
import * as RateLimitRedisStore from 'rate-limit-redis';
import "dotenv/config";
import * as passport from 'passport';
import {Strategy as TwitterStrategy} from 'passport-twitter';

import {redis} from "./redis";

import {createTypeormConn} from "./utils/createTypeormConn";
import {confirmEmail} from "./routes/confirmEmail";
import {genSchema} from "./utils/genSchema";
import enVars from "./config/vars";
import {User} from "./entity/User";

const {
  secret,
  devport,
  frontEndHost,
  redisSessionPrefix,
  twitter_callback,
  twitter_consumer_key,
  twitter_consumer_secret
} = enVars;
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

  const connection = await createTypeormConn();

  passport.use(new TwitterStrategy({
    consumerKey: twitter_consumer_key as string, consumerSecret: twitter_consumer_secret as string, callbackURL: twitter_callback as string, includeEmail: true
    // }, async(token, tokenSecret, profile, cb) => {
  }, async(_, __, profile, cb) => {
    const {id, emails} = profile; // destructure and extract first email
    // Build the initial query based on if they have a witterId
    const query = connection
      .getRepository(User)
      .createQueryBuilder("user")
      .where(`user.twitterId = :id`, {id});
    let email : string | null = null;
    if (emails) {
      // See if email already in our database
      email = emails[0].value;
      // Update the query with email if found
      query.orWhere("user.email = :email", {email})

    }
    let user = await query.getOne();
    if (!user) { // Only twitterId ... create user
      user = await User
        .create({
        // There will not be a password associated with it since twitter did the
        // authentication.  So we have to modify our registration process to accept null
        // passwords and null emails addresses
        twitterId: id,
        email
      })
        .save();
    } else if (!user.twitterId) {
      // Merge account We found user by email ... no twitterId
      user.twitterId = id;
      user.save(); // Update the user record to add his/her twitterId

    } else {
      // we have a twitter login
    }
    return cb(null, {id: user.id}); // passed to the twitter callback fcn below
  }));

  // Initialize Passport
  server
    .express
    .use(passport.initialize());

  // Authenticate Requests
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
