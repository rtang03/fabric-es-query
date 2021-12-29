export type Platform = {
  initialize: () => Promise<boolean>;
  check?: () => Promise<void>;
  repair?: () => Promise<void>;
  reset?: () => Promise<void>;
  syncStart?: () => Promise<void>;
  persisteance?: () => Promise<void>;
};
