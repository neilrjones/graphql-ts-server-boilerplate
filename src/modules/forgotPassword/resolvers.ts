import * as bcrypt from "bcryptjs"
import * as yup from 'yup';
import {ResolverMap} from "../../types/graphql-utils";
import {createMiddleware} from "../../utils/createMiddleware";
import middleware from "../../utils/middleware";
import enVars from '../../config/vars';
import {forgotPasswordLockAccount} from "../../utils/forgotPasswordLockAccount";
import {createForgetPasswordLink} from "../../utils/createForgetPasswordLink";
import {User} from "../../entity/User";
import {userNotFoundError, expiredKeyError} from "./errorMessages";

import {registerPasswordValidation} from '../../utils/yupSchemas';
import {formatYupError} from '../../utils/formatYupError';
const {forgotPasswordPrefix} = enVars;

const schema = yup
  .object()
  .shape({newPassword: registerPasswordValidation});

// ForgotPasswordLink Should only last 20 minutes - OWASP Lock account as soon
// as the forgotpasswordLink email is sent Lock account - Don't let them login
// and Need to add front-end url in createForgetPasswordLink below
export const resolvers : ResolverMap = {
  Query: {
    byelogout: () => "bye"
  },
  Mutation: {
    sendForgotPasswordEmail: createMiddleware(middleware, async(_, {email} : GQL.ISendForgotPasswordEmailOnMutationArguments, {redis}) => {
      // @todo - revisit logic since anyone might be able to lockout another
      const user = await User.findOne({where: {
          email
        }});
      if (!user) {
        return [
          {
            path: "email",
            message: userNotFoundError
          }
        ]
      }
      // Lock the account
      await forgotPasswordLockAccount(user.id, redis);
      // @todo add front-end url in createForgetPasswordLink below const url = await
      // createForgetPasswordLink("", user.id, redis);
      await createForgetPasswordLink("", user.id, redis);
      // @todo Send email with url to user
      return true;
    }), // end sendForgotPasswordEmail
    forgotPasswordChange: createMiddleware(middleware, async(_, {newPassword, key} : GQL.IForgotPasswordChangeOnMutationArguments, {redis}) => {

      const redisKey = `${forgotPasswordPrefix}${key}`;
      // First verify key is valid. If no user found then key not valid
      const userId = await redis.get(redisKey);
      if (!userId) {
        return [
          {
            path: "key",
            message: expiredKeyError
          }
        ]
      }
      // Next verify that the password is good
      try {
        await schema.validate({
          newPassword
        }, {abortEarly: false});
      } catch (err) {
        return formatYupError(err);
      }

      const hpassword = await bcrypt.hash(newPassword, 10);
      const promises = [];
      // Now change password with a valid password and it should work
      promises.push(User.update({
        id: userId
      }, {
        forgotPasswordLocked: false,
        password: hpassword
      }));
      // delete the key so that the forgotpassword link is now invalid
      promises.push(redis.del(redisKey));
      await Promise.all(promises);
      return null;
    }) // callback
  } // End Mutation
};
