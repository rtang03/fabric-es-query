import util from 'util';
import Debug from 'debug';
import validator from 'validator';
import winston from 'winston';
import { evaluate, type FabricOption, submit, submitPrivateData } from '../fabric';
import { KIND, MSG } from '../message';
import type { FabricGateway, MessageCenter, QueryDb, Repository, RepoResponse } from '../types';
import { withTimeout } from '../utils';
import { ERROR } from './constants';

export type CreateRepositoryOption = {
  fabric: FabricGateway;
  queryDb: QueryDb;
  logger: winston.Logger;
  messageCenter?: MessageCenter;
  timeoutMs: number;
};

export const createRepository: (option: CreateRepositoryOption) => Repository = ({
  fabric,
  queryDb,
  logger,
  messageCenter: mCenter,
  timeoutMs,
}) => {
  const network = fabric.getNetwork();
  const nonDiscoveryNetwork = fabric.getNonDiscoveryNetwork();
  const NS = 'repo';

  logger.info('Preparing repository');
  logger.info(`fabric: ${!!fabric}`);
  logger.info(`queryDb: ${queryDb.isConnected()}`);
  logger.info(`request timeout (ms): ${timeoutMs}`);

  const catchError = async (me: string, fcn: (fcnName?: string) => Promise<RepoResponse>) => {
    try {
      return await fcn(me);
    } catch (error) {
      logger.error(`fail to ${me} : `, error);

      return { status: 'error', message: error.message, error };
    }
  };
  const fabricOption: FabricOption = {
    network,
    nonDiscoveryNetwork,
    logger,
    messageCenter: mCenter,
  };

  /**
   * addTimestamp
   * @param eventsInput
   */
  const addTimestamp = (eventsInput) =>
    eventsInput.map((event) => ({
      type: event.type,
      payload: {
        ...event.payload,
        timestamp: Math.round(new Date().getTime()),
      },
    }));

  return {
    /**
     * cmd_append / eventstore:createCommit
     * @param entityName
     * @param id
     * @param events
     * @param isPrivateData
     */
    cmd_append: ({ entityName, id, events }, isPrivateData) => {
      if (!validator.isAlphanumeric(entityName))
        return Promise.reject(new Error(ERROR.ALPHA_NUMERIC_REQUIRED));

      if (!validator.isAlphanumeric(id))
        return Promise.reject(new Error(ERROR.ALPHA_NUMERIC_REQUIRED));

      const stringifyEvents = ~~events.length ? JSON.stringify(addTimestamp(events)) : '[]';

      return catchError('createCommit', async (fcnName) => {
        const commits = isPrivateData
          ? await withTimeout(
              evaluate('privatedata:queryByEntityId', [entityName, id], fabricOption),
              timeoutMs
            )
          : await withTimeout(
              evaluate('eventstore:queryByEntityId', [entityName, id], fabricOption),
              timeoutMs
            );
        const version = Object.keys(commits).length;
        const result = isPrivateData
          ? await withTimeout(
              submitPrivateData(
                `privatedata:${fcnName}`,
                [entityName, id, version.toString()],
                { eventstr: Buffer.from(stringifyEvents) },
                fabricOption
              ),
              timeoutMs
            )
          : await withTimeout(
              submit(
                `eventstore:${fcnName}`,
                [entityName, id, version.toString(), stringifyEvents, ''],
                fabricOption
              ),
              timeoutMs
            );

        Debug(`${NS}:${fcnName}`)('result, %O', result);

        return result.error
          ? { status: 'error', ...result }
          : { status: 'ok', data: Object.values(result)?.[0] };
      });
    },
    /**
     * cmd_create / eventstore:createCommit
     * @param entityName
     * @param id
     * @param events
     * @param version
     * @param isPrivateData
     */
    cmd_create: ({ entityName, id, events, version }, isPrivateData) => {
      if (!validator.isAlphanumeric(entityName))
        return Promise.reject(new Error(ERROR.ALPHA_NUMERIC_REQUIRED));

      if (!validator.isAlphanumeric(id))
        return Promise.reject(new Error(ERROR.ALPHA_NUMERIC_REQUIRED));

      if (!Number.isInteger(version)) return Promise.reject(new Error(ERROR.INTEGER_REQUIRED));

      const stringifyEvents = ~~events.length ? JSON.stringify(addTimestamp(events)) : '[]';

      Debug(`${NS}:cmd_create`)('events: %s', stringifyEvents);

      return catchError('createCommit', async (fcnName) => {
        const result = isPrivateData
          ? await withTimeout(
              submitPrivateData(
                `privatedata:${fcnName}`,
                [entityName, id, version.toString()],
                { eventstr: Buffer.from(stringifyEvents) },
                fabricOption
              ),
              timeoutMs
            )
          : await withTimeout(
              submit(
                `eventstore:${fcnName}`,
                [entityName, id, version.toString(), stringifyEvents, ''],
                fabricOption
              ),
              timeoutMs
            );

        Debug(`${NS}:${fcnName}`)('result, %O', result);

        return result.error
          ? { status: 'error', ...result }
          : { status: 'ok', data: Object.values(result)?.[0] };
      });
    },
    /** cmd_deleteByEntityId / eventstore:deleteByEntityId
     * Delete all commits by entityName, entityId
     * @param entityName
     * @param id
     */
    cmd_deleteByEntityId: async (entityName, id) => {
      if (!validator.isAlphanumeric(entityName))
        return Promise.reject(new Error(ERROR.ALPHA_NUMERIC_REQUIRED));

      if (!validator.isAlphanumeric(id))
        return Promise.reject(new Error(ERROR.ALPHA_NUMERIC_REQUIRED));

      const me = 'cmd_deleteByEntityId';
      const broadcast = false;
      const save = true;

      return catchError('eventstore:deleteByEntityId', async (fcnName) => {
        const result = await withTimeout(
          submit(fcnName, [entityName, id], fabricOption),
          timeoutMs
        );

        Debug(`${NS}:${fcnName}`)('result, %O', result);

        if (result?.status === 'SUCCESS') {
          logger.info(util.format('%s, %j', me, result));

          return { status: 'ok' };
        } else {
          logger.error(util.format('%s, %j', me, result));

          mCenter?.notify({
            kind: KIND.ERROR,
            title: MSG.SUBMIT_ERROR,
            desc: me,
            broadcast,
            save,
          });

          return {
            status: 'error',
            message: `fail to ${me}: entityName ${entityName} entityId ${id}`,
          };
        }
      });
    },
    /**
     * cmd_deleteByEntityIdCommitId / eventstore:deleteByEntityIdCommitId
     * @param id
     * @param entityName
     * @param commitId
     * @param isPrivateData
     */
    cmd_deleteByEntityIdCommitId: (entityName, id, commitId, isPrivateData) => {
      if (!validator.isAlphanumeric(entityName))
        return Promise.reject(new Error(ERROR.ALPHA_NUMERIC_REQUIRED));

      if (!validator.isAlphanumeric(id))
        return Promise.reject(new Error(ERROR.ALPHA_NUMERIC_REQUIRED));

      if (!validator.isNumeric(commitId))
        return Promise.reject(new Error(ERROR.ALPHA_NUMERIC_REQUIRED));

      const me = 'cmd_deleteByEntityIdCommitId';
      const broadcast = false;
      const save = true;

      return catchError('deleteByEntityIdCommitId', async (fcnName) => {
        const result = isPrivateData
          ? await withTimeout(
              submitPrivateData(
                `privatedata:${fcnName}`,
                [entityName, id, commitId],
                null,
                fabricOption
              ),
              timeoutMs
            )
          : await withTimeout(
              submit(`eventstore:${fcnName}`, [entityName, id, commitId], fabricOption),
              timeoutMs
            );

        Debug(`${NS}:${fcnName}`)('result, %O', result);

        if (result?.status === 'SUCCESS') {
          logger.info(util.format('%s, %j', me, result));

          return { status: 'ok' };
        } else {
          logger.error(util.format('%s, %j', me, result));

          mCenter?.notify({
            kind: KIND.ERROR,
            title: MSG.SUBMIT_ERROR,
            desc: me,
            broadcast,
            save,
          });

          return {
            status: 'error',
            message: `fail to ${me}: entityName ${entityName} entityId ${id} commitId ${commitId}`,
          };
        }
      });
    },
    /**
     * cmd_getByEntityName / eventstore:queryByEntityName
     * @param entityName
     * @param isPrivateData
     */
    cmd_getByEntityName: (entityName, isPrivateData) => {
      return catchError(
        isPrivateData ? 'privatedata:queryByEntityName' : 'eventstore:queryByEntityName',
        async (fcnName) => {
          const result: unknown = await withTimeout(
            evaluate(fcnName, [entityName], fabricOption),
            timeoutMs
          );

          Debug(`${NS}:${fcnName}`)('result, %O', result);

          return { status: 'ok', data: Object.values(result) };
        }
      );
    },
    /**
     * cmd_getByEntityNameEntityId / eventstore:queryByEntityId
     * @param entityName
     * @param id
     * @param isPrivateData
     */
    cmd_getByEntityNameEntityId: (entityName, id, isPrivateData) => {
      return catchError(
        isPrivateData ? 'privatedata:queryByEntityId' : 'eventstore:queryByEntityId',
        async (fcnName) => {
          const result = await withTimeout(
            evaluate(fcnName, [entityName, id], fabricOption),
            timeoutMs
          );

          Debug(`${NS}:${fcnName}`)('result, %O', result);

          return { status: 'ok', data: Object.values(result) };
        }
      );
    },
    /**
     * cmd_getByEntityNameEntityIdCommitId / eventstore:queryByEntityIdCommitId
     * @param entityName
     * @param id
     * @param commitId
     * @param isPrivateData
     */
    cmd_getByEntityNameEntityIdCommitId: (entityName, id, commitId, isPrivateData) => {
      return catchError(
        isPrivateData
          ? 'privatedata:queryByEntityIdCommitId'
          : 'eventstore:queryByEntityIdCommitId',
        async (fcnName) => {
          const result = await withTimeout(
            evaluate(fcnName, [entityName, id, commitId], fabricOption),
            timeoutMs
          );

          Debug(`${NS}:${fcnName}`)('result, %O', result);

          return { status: 'ok', data: Object.values(result) };
        }
      );
    },
    /**
     * query_getByEntityName
     * @param entityName
     * @param take
     * @param skip
     * @param orderBy
     * @param sort
     */
    query_getByEntityName: ({ entityName, take, skip, orderBy, sort }) => {
      return catchError('query_getByEntityName', async (fcnName) => {
        const result = await withTimeout(
          queryDb.findCommit({ entityName, orderBy, skip, sort, take }),
          timeoutMs
        );

        Debug(`${NS}:${fcnName}`)('result, %O', result);

        return { status: 'ok', data: result };
      });
    },
    /**
     * query_getByEntityNameEntityId
     * @param entityName
     * @param entityId
     * @param take
     * @param skip
     * @param orderBy
     * @param sort
     */
    query_getByEntityNameEntityId: ({ entityName, entityId, take, skip, orderBy, sort }) => {
      return catchError('query_getByEntityNameEntityId', async (fcnName) => {
        const result = await withTimeout(
          queryDb.findCommit({
            entityName,
            id: entityId,
            orderBy,
            skip,
            sort,
            take,
          }),
          timeoutMs
        );

        Debug(`${NS}:${fcnName}`)('result, %O', result);

        return { status: 'ok', data: result };
      });
    },
    /**
     * query_getByEntityNameEntityIdCommitId
     * @param entityName
     * @param entityId
     * @param commitId
     * @param take
     * @param skip
     * @param orderBy
     * @param sort
     */
    query_getByEntityNameEntityIdCommitId: ({
      entityName,
      entityId,
      commitId,
      take,
      skip,
      orderBy,
      sort,
    }) => {
      return catchError('query_getByEntityNameEntityIdCommitId', async (fcnName) => {
        const result = await withTimeout(
          queryDb.findCommit({
            entityName,
            id: entityId,
            commitId,
            orderBy,
            skip,
            sort,
            take,
          }),
          timeoutMs
        );

        Debug(`${NS}:${fcnName}`)('result, %O', result);

        return { status: 'ok', data: result };
      });
    },
    /**
     * query_cascadeDeleteByEntityName
     * mainly used for dev/test
     * @param entityName
     * @param entityId
     */
    query_cascadeDelete: (entityName, entityId) => {
      return catchError('query_cascadeDeleteByEntityName', async (fcnName) => {
        // step 1: find corresponding commits
        const query = {
          entityName,
          orderBy: 'blocknum' as any,
          sort: 'ASC' as any,
        };
        entityId && (query['entityId'] = entityId);

        const commits = await queryDb.findCommit(query);

        Debug(`${NS}:${fcnName}`)('commits, %O', commits);

        if (commits.total === 0) return { status: 'ok', message: 'no record found' };

        // step 2: integrity check
        const blockNums = commits.items.map(({ blocknum }) => blocknum);
        let data = [];
        let error = [];
        let result;

        for (const blocknum of blockNums) {
          const isOk = await queryDb.checkIntegrity(blocknum);
          if (isOk) data.push(blocknum);
          else error.push(blocknum);
        }

        if (!~~error.length) {
          result = { status: 'error', message: 'integrity check', data, error };

          logger.error(util.format('integrity check, %j', result));

          Debug(`${NS}:${fcnName}`)('integrity check result, %O', result);

          return result;
        }

        // step 3: perform cascaded deletions
        data = [];
        error = [];

        for await (const blocknum of blockNums) {
          const isDeleted = await queryDb.cascadedDeleteByBlocknum(blocknum);

          if (isDeleted) data.push(blocknum);
          else error.push(blocknum);
        }

        const status = ~~error.length ? 'ok' : 'error';

        result = { status, message: 'perform cascaded deletions', data, error };

        Debug(`${NS}:${fcnName}`)('cascaded deletions result, %O', result);

        return result;
      });
    },
  };
};
