import {GraphQLServer} from "graphql-yoga";
import {redis} from "./redis";

import {createTypeormConn} from "./utils/createTypeormConn";
import {confirmEmail} from "./routes/confirmEmail";
import {genSchema} from "./utils/genSchema";
import enVars from "./config/vars";

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
      url: request.protocol + "://" + request.get("host")
    })
  });

  server
    .express
    .get("/confirm/:id.:ext?", confirmEmail);

  await createTypeormConn();
  const app = await server.start({
    port: process.env.NODE_ENV === "test"
      ? 0
      : enVars.devport
  });
  console.log(`Server is running on localhost:${enVars.devport}`);

  return app;
};
