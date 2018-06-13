import {Redis} from "ioredis";
import {removeUserSessions} from "./removeUserSessions";
import {User} from "../entity/User";

export const forgotPasswordLockAccount = async(userId : string, redis : Redis) => {
    // ForgotPasswordLink Should only last 20 minutes - OWASP Lock account - Don't
    // let them login - Add column to database
    await User.update({
        id: userId
    }, {forgotPasswordLocked: true});
    // Lock account as soon as the forgotpasswordLink email is sent

    await removeUserSessions(userId, redis);
};