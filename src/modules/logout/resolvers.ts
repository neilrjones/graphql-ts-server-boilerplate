import {ResolverMap} from "../../types/graphql-utils";
// import {createMiddleware} from "../../utils/createMiddleware"; import
// middleware from "../../utils/middleware";
import enVars from '../../config/vars';
// import {PromiseUtils} from "typeorm";
const {userSessionPrefix, redisSessionPrefix} = enVars;

// createMiddleware takes two parameters, middlewareFcn, ResolverFcn Current
// logout only destroys one session.  We need to update to destroy all sessions
// related to this user.
export const resolvers : ResolverMap = {
  Query: {
    dummy: () => "dummy"
  },
  Mutation: {
    logout: async(_, __, {session, redis}) => {
      const {userId} = session;
      if (userId) {
        // Get a list of session ids that the user has regardless of device
        const sessionIDs = await redis.lrange(`${userSessionPrefix}${userId}`, 0, -1);
        const promises = []
        // Now loop through and delete each session id
        // tslint:disable-next-line:prefer-for-of
        for (let i = 0; i < sessionIDs.length; i++) {
          promises.push(redis.del(`${redisSessionPrefix}${sessionIDs[i]}`));
        }
        await Promise.all(promises);
        return true;
      }
      return false;
    }
  }

};
