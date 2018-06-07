import * as bcrypt from "bcryptjs";
import {ResolverMap} from "../../types/graphql-utils";
import {User} from "../../entity/User";
import {invalidLogin, confirmEmailError} from "./errorMessages";
import {createMiddleware} from "../../utils/createMiddleware";
import middleware from "../../utils/middleware";

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
    login: createMiddleware(middleware, async(_, {email, password} : GQL.ILoginOnMutationArguments, {session}) => {
      const user = await User.findOne({where: {
          email
        }});

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

      const valid = await bcrypt.compare(password, user.password);

      if (!valid) {
        return errorResponse;
      }
      // Login successful. Store the user.id in the redis based session store
      // express-session will not create a cookie for the person that made the request
      // until we update the session object. From this point We can check the session
      // object to see if the user is valid
      session.userId = user.id;
      return null;
    })
  } // Mutation
};
