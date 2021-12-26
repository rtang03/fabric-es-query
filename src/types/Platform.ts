export type Platform = {
  initialize: () => Promise<void>;
  diagnose?: () => Promise<void>;
  repair?: () => Promise<void>;
  reset?: () => Promise<void>;
  syncStart?: () => Promise<void>;
  persisteance?: () => Promise<void>;
};
