import {ResolverMap} from "../../../types/graphql-utils";
import {User} from "../../../entity/User";
import {createMiddleware} from "../../../utils/createMiddleware";
import middleware from "../../../utils/middleware";

// createMiddleware takes two parameters, middlewareFcn, ResolverFcn
export const resolvers : ResolverMap = {
  Query: {
    me: createMiddleware(middleware, (_, __, {session}) => User.findOne({
      where: {
        id: session.userId
      }
    }))
  }
};
