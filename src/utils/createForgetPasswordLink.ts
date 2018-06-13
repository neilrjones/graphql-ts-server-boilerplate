import {v4} from "uuid";
import {Redis} from "ioredis";
import enVars from '../config/vars';

const {forgotPasswordPrefix} = enVars;
// http://localhost:4000 https://my-site.com => https://my-site.com/confirm/<id>
export const createForgetPasswordLink = async(url : string, userId : string, redis : Redis) => {
    const id = v4();
    await redis.set(`${forgotPasswordPrefix}${id}`, userId, "ex", 60 * 60 * 24);
    return `${url}/change-password/${id}`; // Grab Id and send as key
};
