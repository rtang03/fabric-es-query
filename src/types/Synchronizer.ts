export type Synchronizer = {
  initialize: () => Promise<any>;
  close: () => any;
};
