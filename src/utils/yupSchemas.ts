import * as yup from "yup";

import {passwordNotLongEnough, passwordWrongFormat, isRequired} from "../modules/user/register/errorMessages";

const passwordReg = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])(?=.{8,})/;

// const passwordReg = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])/;
export const registerPasswordValidation = yup
    .string()
    .required(isRequired)
    .min(8, passwordNotLongEnough)
    .max(255)
    .matches(passwordReg, passwordWrongFormat)