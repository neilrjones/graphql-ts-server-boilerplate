import {getConnectionOptions, createConnection} from "typeorm";

// ResetDB is a flag that determines if the database is purged and recreated
// before a test. export const createTypeormConn = async(resetDB : boolean =
// false) => {
export const createTypeormConn = async(resetDB : boolean = false) => {
  const connectionOptions = await getConnectionOptions(process.env.NODE_ENV);
  return createConnection({
    ...connectionOptions,
    name: "default",
    synchronize: resetDB,
    dropSchema: resetDB
  });
};
