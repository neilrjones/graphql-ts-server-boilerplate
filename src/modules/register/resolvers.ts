import * as bcrypt from "bcryptjs";
import * as yup from "yup";
import {ResolverMap} from "../../types/graphql-utils";
import {User} from "../../entity/User";
import {formatYupError} from "../../utils/formatYupError";
import {
  duplicateEmail,
  emailNotLongEnough,
  invalidEmail,
  passwordNotLongEnough,
  passwordWrongFormat,
  isRequired
} from "./errorMessages";
import {createConfirmEmailLink} from "../../utils/createConfirmEmailLink";
import {sendmail} from "../../utils/APIFcns";

const passwordReg = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])(?=.{8,})/;

// const passwordReg = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])/;
const schema = yup
  .object()
  .shape({
    email: yup
      .string()
      .required(isRequired)
      .min(3, emailNotLongEnough)
      .max(255)
      .email(invalidEmail),
    password: yup
      .string()
      .required(isRequired)
      .min(8, passwordNotLongEnough)
      .max(255)
      .matches(passwordReg, passwordWrongFormat)
  });

export const resolvers : ResolverMap = {
  Query: {
    bye: () => "bye"
  },
  Mutation: {
    register: async(_, args : GQL.IRegisterOnMutationArguments, {redis, url}) => {
      try {
        await schema.validate(args, {abortEarly: false});
      } catch (err) {
        return formatYupError(err);
      }

      const {email, password} = args;

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

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = User.create({email, password: hashedPassword});

      await user.save();
      sendmail(email, (await createConfirmEmailLink(url, user.id, redis)));
      // if (process.env.NODE_ENV !== 'test') {   sendmail(email, (await
      // createConfirmEmailLink(url, user.id, redis))); }
      return null;
    }
  }
};
