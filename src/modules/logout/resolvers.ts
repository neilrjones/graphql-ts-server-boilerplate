import {ResolverMap} from "../../types/graphql-utils";
import {createMiddleware} from "../../utils/createMiddleware";
import middleware from "../../utils/middleware";

// createMiddleware takes two parameters, middlewareFcn, ResolverFcn
export const resolvers : ResolverMap = {
  Query: {
    dummy: () => "dummy"
  },
  Mutation: {
    logout: createMiddleware(middleware, (_, __, {session}) => new Promise((res) => session.destroy((err) => {
      if (err) {

        console.log('====================================');
        console.log(err);
        console.log('====================================');
      }
      res(true);
    })))
  }
};
