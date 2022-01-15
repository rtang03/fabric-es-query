import { Network } from 'fabric-network';
import winston from 'winston';
import { MessageCenter } from '../../types';

export type FabricOption = {
  network?: Network;
  nonDiscoveryNetwork: Network;
  logger?: winston.Logger;
  messageCenter?: MessageCenter;
};
