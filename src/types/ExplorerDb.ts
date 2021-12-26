export type ExplorerDb = {
  connect: () => Promise<any>;
  disconnect?: () => void;
};
