import * as yup from "yup";
import {ResolverMap} from "../../../types/graphql-utils";
import {User} from "../../../entity/User";
import {formatYupError} from "../../../utils/formatYupError";
import {duplicateEmail, emailNotLongEnough, invalidEmail, isRequired} from "./errorMessages";
import {createConfirmEmailLink} from "../../../utils/createConfirmEmailLink";
import {sendmail} from "../../../utils/APIFcns";
import {createMiddleware} from "../../../utils/createMiddleware";
import middleware from "../../../utils/middleware";
import {registerPasswordValidation} from "../../../utils/yupSchemas";

const schema = yup
  .object()
  .shape({
    email: yup
      .string()
      .required(isRequired)
      .min(3, emailNotLongEnough)
      .max(255)
      .email(invalidEmail),
    password: registerPasswordValidation
  });

export const resolvers : ResolverMap = {
  Mutation: {
    register: createMiddleware(middleware, async(_, args : GQL.IRegisterOnMutationArguments, {redis, url}) => {
      // First validate that the args are ok using yup
      try {
        await schema.validate(args, {abortEarly: false});
      } catch (err) {
        return formatYupError(err);
      }

      const {email, password} = args;
      // next check for duplicate user
      const userAlreadyExists = await User.findOne({where: {
          email
        }, select: ["id"]});

      if (userAlreadyExists) {
        return [
          {
            path: "email",
            message: duplicateEmail
          }
        ];
      }

      // Now create user
      const user = User.create({email, password});

      await user.save();
      // sendmail(email, (await createConfirmEmailLink(url, user.id, redis)));
      if (process.env.NODE_ENV === 'production') {
        sendmail(email, (await createConfirmEmailLink(url, user.id, redis)));
      }
      return null;
    })
  }
};
