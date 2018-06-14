import * as bcrypt from "bcryptjs";
import {ResolverMap} from "../../types/graphql-utils";
import {User} from "../../entity/User";
import {invalidLogin, confirmEmailError, forgotPasswordLockedError} from "./errorMessages";
import {createMiddleware} from "../../utils/createMiddleware";
import middleware from "../../utils/middleware";
import enVars from '../../config/vars';

const {userSessionPrefix} = enVars;
const errorResponse = [
  {
    path: "email",
    message: invalidLogin
  }
];

export const resolvers : ResolverMap = {
  Query: {
    bye2: () => "bye"
  },
  Mutation: {
    login: createMiddleware(middleware, async(_, {email, password} : GQL.ILoginOnMutationArguments, {session, redis, req}) => {
      const user = await User.findOne({where: {
          email
        }});
      // @TODO - Count the number of login attempts by user and lock account if too
      // many.  Implement in redis and lock for x minutes or implement in database
      // column.  Send email if too many attempts.
      if (!user) {
        return errorResponse;
      }

      if (!user.confirmed) {
        return [
          {
            path: "email",
            message: confirmEmailError
          }
        ];
      }
      if (user.forgotPasswordLocked) {
        return [
          {
            path: "email",
            message: forgotPasswordLockedError
          }
        ];
      }
      if (user.password) {

        const valid = await bcrypt.compare(password, user.password);

        if (!valid) {
          return errorResponse;
        }
      }
      // Login successful. Store the user.id in the redis based session store
      // express-session will not create a cookie for the person that made the request
      // until we update the session object. From this point We can check the session
      // object to see if the user is valid
      session.userId = user.id;
      if (req.sessionID) {
        // create a list of session ids for the user for multi session logout
        await redis.lpush(`${userSessionPrefix}${user.id}`, req.sessionID)

      }
      return null;
    })
  } // Mutation
};
