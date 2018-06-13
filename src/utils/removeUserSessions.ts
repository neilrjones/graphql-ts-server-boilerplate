import enVars from '../config/vars';
import {Redis} from "ioredis";
// import {PromiseUtils} from "typeorm";
const {userSessionPrefix, redisSessionPrefix} = enVars;
export const removeUserSessions = async(userId : string, redis : Redis) => {
    // Get a list of session ids that the user has regardless of device
    const sessionIDs = await redis.lrange(`${userSessionPrefix}${userId}`, 0, -1);
    const promises = [] // run promises in parallel
    // Now loop through and delete each session id
    // tslint:disable-next-line:prefer-for-of
    for (let i = 0; i < sessionIDs.length; i++) {
        promises.push(redis.del(`${redisSessionPrefix}${sessionIDs[i]}`));
    }
    await Promise.all(promises);
    return true;
};