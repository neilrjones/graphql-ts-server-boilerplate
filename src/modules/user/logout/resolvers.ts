import {ResolverMap} from "../../../types/graphql-utils";
// import {createMiddleware} from "../../utils/createMiddleware"; import
// middleware from "../../utils/middleware";
import {removeUserSessions} from "../../../utils/removeUserSessions";
// import {PromiseUtils} from "typeorm"; createMiddleware takes two parameters,
// middlewareFcn, ResolverFcn Current logout only destroys one session.  We
// need to update to destroy all sessions related to this user.
export const resolvers : ResolverMap = {
  Mutation: {
    logout: async(_, __, {session, redis}) => {
      const {userId} = session;
      if (userId) {
        // Purge all user sessions from all devices previously used
        removeUserSessions(userId, redis);
      }
      return false;
    }
  }

};
