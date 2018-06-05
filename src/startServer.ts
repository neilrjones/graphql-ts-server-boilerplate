import {GraphQLServer} from "graphql-yoga";
import * as session from "express-session";
import * as connectRedis from "connect-redis";

import {redis} from "./redis";

import {createTypeormConn} from "./utils/createTypeormConn";
import {confirmEmail} from "./routes/confirmEmail";
import {genSchema} from "./utils/genSchema";
import enVars from "./config/vars";

const {secret, devport} = enVars;
const RedisStore = connectRedis(session);

// {   dbport,   secret,   env,   // secret2,   // callbackUrl, } = enVars;
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
      session: request.session
    })
  });
  //
  // enable CORS - Cross Origin Resource Sharing
  //
  // server   .express   .use((req, res, next) => {     let oneof = false;
  // const allowedOrigins = [       'http://localdev:8081',
  // 'http://localhost:8081',       'http://localhost:3000',
  // 'http://localhost:3001',       'http://127.0.0.1:8081',
  // 'http://127.0.0.1:3000',       'http://127.0.0.1:3001',
  // 'http://10.0.2.2:8081',       'http://10.0.2.15:8081',
  // 'http://10.0.2.2:8081'     ];     // console.log('Request header is: ',
  // req.headers.origin);     res.header('Access-Control-Allow-Origin', '*');
  // if (allowedOrigins.indexOf(req.headers.origin) > -1) {
  // res.header('Access-Control-Allow-Origin', req.headers.origin);       oneof =
  // true;     }     if (req.headers['access-control-request-method']) {
  // res.header('Access-Control-Allow-Methods',
  // req.headers['access-control-request-method']);       oneof = true;     }
  // if (req.headers['access-control-request-headers']) {
  // res.header('Access-Control-Allow-Headers',
  // req.headers['access-control-request-headers']);       oneof = true;     }
  // if (oneof) {       res.header('Access-Control-Max-Age', 60 * 60 * 24 * 365);
  //    }     // intercept OPTIONS method     if (oneof && req.method ==
  // 'OPTIONS') {       res.send(200);     } else {       next();     }   });
  //
  // End Hack for COR testing on localhost
  //
  server
    .express
    .use(session({
      store: new RedisStore({client: redis as any}),
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
    origin: "http://localhost:3000"
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
