// @flow
type RawData = Array<{
  columns: Array<string>,
  values: Array<Array<any>>
}>;

type SqlMessageEventData = {
  id: number,
  results: RawData
};

type SQLType = {
  Database: (buffer: Uint8Array) => SQLDatabase
};

type SQLDatabase = {
  exec: (query: string) => RawData
};

export type { RawData, SqlMessageEventData, SQLType, SQLDatabase };
