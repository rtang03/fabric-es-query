export type EntityRepo<TEntity = any> = {
  loadAllData?: any;
  removeAllData?: any;
  upsert: (payload: { entityName: string; entityId: string; blocknum: number }) => Promise<TEntity>;
  findById?: (id: string) => Promise<TEntity>;
};
