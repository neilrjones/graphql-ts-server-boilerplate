import {Redis} from "ioredis";

export interface Header {
  contentType : string,
  accept : string,
  contentLength : string,
  userAgent : string,
  acceptEncoding : string,
  connection : string,
  host : string

}
export interface Session extends Express.Session {
  userId?: string;
}

export type Resolver = (parent : any, args : any, context : {
  redis: Redis;
  url: string;
  session: Session;
  header?: Header;
}, info : any) => any;
export type GrapQLMiddlewareFunc = (resolver : Resolver, parent : any, args : any, context : {
  redis: Redis;
  url: string;
  session: Session;
  header?: Header;
}, info : any) => any;

export interface ResolverMap {
  [key : string] : {
    [key : string]: Resolver;
  };
}
