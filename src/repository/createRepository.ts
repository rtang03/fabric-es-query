import util from 'util';
import Debug from 'debug';
import winston from 'winston';
import { evaluate, submit, submitPrivateData } from '../fabric';
import type { FabricGateway, MessageCenter, QueryDb, Repository, RepoResponse } from '../types';
import { withTimeout } from '../utils';

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
  messageCenter,
  timeoutMs,
}) => {
  const network = fabric.getNetwork();
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
  const fabricOption = { network, logger, messageCenter };

  return {
    /**
     * cmd_append / eventstore:createCommit
     * @param entityName
     * @param id
     * @param events
     * @param isPrivateData
     */
    cmd_append: ({ entityName, id, events }, isPrivateData) =>
      isPrivateData
        ? catchError('privatedata:createCommit', async (fcnName) => {
            // get latest
            const commits = await withTimeout(
              evaluate('privatedata:queryByEntityId', [entityName, id], fabricOption),
              timeoutMs
            );
            const version = Object.keys(commits).length;
            const stringifyEvents = events ? JSON.stringify(events) : null;

            // append
            const result = await withTimeout(
              submit(
                fcnName,
                [entityName, id, version.toString(), stringifyEvents, ''],
                fabricOption
              ),
              timeoutMs
            );

            Debug(`${NS}:${fcnName}`)('result, %O', result);

            return { status: 'ok', data: result };
          })
        : catchError('eventstore:createCommit', async (fcnName) => {
            // get latest
            const commits = await withTimeout(
              evaluate('eventstore:queryByEntityId', [entityName, id], fabricOption),
              timeoutMs
            );
            const version = Object.keys(commits).length;
            const stringifyEvents = events ? JSON.stringify(events) : null;

            // append
            const result = await withTimeout(
              submit(
                fcnName,
                [entityName, id, version.toString(), stringifyEvents, ''],
                fabricOption
              ),
              timeoutMs
            );

            Debug(`${NS}:${fcnName}`)('result, %O', result);

            return { status: 'ok', data: result };
          }),
    /**
     * cmd_create / eventstore:createCommit
     * @param entityName
     * @param id
     * @param events
     * @param version
     * @param isPrivateData
     */
    cmd_create: ({ entityName, id, events, version }, isPrivateData) =>
      isPrivateData
        ? catchError('privatedata:createCommit', async (fcnName) => {
            const stringifyEvents = events ? JSON.stringify(events) : null;
            const result = await withTimeout(
              submitPrivateData(
                fcnName,
                [entityName, id, version.toString()],
                { eventstr: Buffer.from(stringifyEvents) },
                fabricOption
              ),
              timeoutMs
            );

            Debug(`${NS}:${fcnName}`)('result, %O', result);

            return { status: 'ok', data: result };
          })
        : catchError('eventstore:createCommit', async (fcnName) => {
            const stringifyEvents = events ? JSON.stringify(events) : null;
            const result = await withTimeout(
              submit(
                fcnName,
                [entityName, id, version.toString(), stringifyEvents, ''],
                fabricOption
              ),
              timeoutMs
            );

            Debug(`${NS}:${fcnName}`)('result, %O', result);

            return { status: 'ok', data: result };
          }),
    /** cmd_deleteByEntityId / eventstore:deleteByEntityId
     * Delete all commits by entityName, entityId
     * @param entityName
     * @param id
     */
    cmd_deleteByEntityId: async (entityName, id) =>
      catchError('eventstore:deleteByEntityId', async (fcnName) => {
        const result = await withTimeout(
          submit(fcnName, [entityName, id], fabricOption),
          timeoutMs
        );

        Debug(`${NS}:${fcnName}`)('result, %O', result);

        return { status: 'ok', data: Object.values(result) };
      }),
    /**
     * cmd_deleteByEntityIdCommitId / eventstore:deleteByEntityIdCommitId
     * @param id
     * @param entityName
     * @param commitId
     * @param isPrivateData
     */
    cmd_deleteByEntityIdCommitId: (entityName, id, commitId, isPrivateData) =>
      isPrivateData
        ? catchError('privatedata:deleteByEntityIdCommitId', async (fcnName) => {
            const result = await withTimeout(
              submitPrivateData(fcnName, [entityName, id, commitId], null, fabricOption),
              timeoutMs
            );

            Debug(`${NS}:${fcnName}`)('result, %O', result);

            return { status: 'ok', data: Object.values(result) };
          })
        : catchError('eventstore:deleteByEntityIdCommitId', async (fcnName) => {
            const result = await withTimeout(
              submit(fcnName, [entityName, id, commitId], fabricOption),
              timeoutMs
            );

            Debug(`${NS}:${fcnName}`)('result, %O', result);

            return { status: 'ok', data: Object.values(result) };
          }),
    /**
     * cmd_getByEntityName / eventstore:queryByEntityName
     * @param entityName
     * @param isPrivateData
     */
    cmd_getByEntityName: (entityName, isPrivateData) =>
      catchError(
        isPrivateData ? 'privatedata:queryByEntityName' : 'eventstore:queryByEntityName',
        async (fcnName) => {
          const result: unknown = await withTimeout(
            evaluate(fcnName, [entityName], fabricOption),
            timeoutMs
          );

          Debug(`${NS}:${fcnName}`)('result, %O', result);

          return { status: 'ok', data: Object.values(result) };
        }
      ),
    /**
     * cmd_getByEntityNameEntityId / eventstore:queryByEntityId
     * @param entityName
     * @param id
     * @param isPrivateData
     */
    cmd_getByEntityNameEntityId: (entityName, id, isPrivateData) =>
      catchError(
        isPrivateData ? 'privatedata:queryByEntityName' : 'eventstore:queryByEntityId',
        async (fcnName) => {
          const result = await withTimeout(
            evaluate(fcnName, [entityName, id], fabricOption),
            timeoutMs
          );

          Debug(`${NS}:${fcnName}`)('result, %O', result);

          return { status: 'ok', data: Object.values(result) };
        }
      ),
    /**
     * cmd_getByEntityNameEntityIdCommitId / eventstore:queryByEntityIdCommitId
     * @param entityName
     * @param id
     * @param commitId
     * @param isPrivateData
     */
    cmd_getByEntityNameEntityIdCommitId: (entityName, id, commitId, isPrivateData) =>
      catchError(
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
      ),
    /**
     * query_getByEntityName
     * @param entityName
     * @param take
     * @param skip
     * @param orderBy
     * @param sort
     */
    query_getByEntityName: ({ entityName, take, skip, orderBy, sort }) =>
      catchError('query_getByEntityName', async (fcnName) => {
        const result = await withTimeout(
          queryDb.findCommit({ entityName, orderBy, skip, sort, take }),
          timeoutMs
        );

        Debug(`${NS}:${fcnName}`)('result, %O', result);

        return { status: 'ok', data: result };
      }),
    /**
     * query_getByEntityNameEntityId
     * @param entityName
     * @param entityId
     * @param take
     * @param skip
     * @param orderBy
     * @param sort
     */
    query_getByEntityNameEntityId: ({ entityName, entityId, take, skip, orderBy, sort }) =>
      catchError('query_getByEntityNameEntityId', async (fcnName) => {
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
      }),
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
    }) =>
      catchError('query_getByEntityNameEntityIdCommitId', async (fcnName) => {
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
      }),
    /**
     * query_cascadeDeleteByEntityName
     * mainly used for dev/test
     * @param entityName
     * @param entityId
     */
    query_cascadeDelete: (entityName, entityId) =>
      catchError('query_cascadeDeleteByEntityName', async (fcnName) => {
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

          return result;
        }

        Debug(`${NS}:${fcnName}`)('integrity check result, %O', result);

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
      }),
  };
};
