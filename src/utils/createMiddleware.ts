import {GrapQLMiddlewareFunc, Resolver} from "../types/graphql-utils";
console.log("Inside createMiddleware");
// This is a higher order middleware function that calls a middleware function,
// and the corresponding resolver function and returns a regular resolver
export const createMiddleware = (middlewareFunc : GrapQLMiddlewareFunc, resolverFunc : Resolver) => (parent : any, args : any, context : any, info : any) => middlewareFunc(resolverFunc, parent, args, context, info)