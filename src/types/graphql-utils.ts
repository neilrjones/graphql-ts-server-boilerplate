import {Redis} from "ioredis";
export interface Context {
  redis : Redis;
  url : string;
  session : Session;
  req : Express.Request;
}
export interface Session extends Express.Session {
  userId?: string;
}

export type Resolver = (parent : any, args : any, context : Context, info : any) => any;
export type GrapQLMiddlewareFunc = (resolver : Resolver, parent : any, args : any, context : Context, info : any) => any;

export interface ResolverMap {
  [key : string] : {
    [key : string]: Resolver;
  };
}
