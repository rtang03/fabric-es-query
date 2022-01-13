export const withTimeout: <T>(
  promise: Promise<T>,
  ms: number,
  timeoutError?: Error
) => Promise<T> = <T>(promise, ms, timeoutError) => {
  timeoutError = timeoutError || new Error('timeout');
  // create a promise that rejects in milliseconds
  const timeout = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(timeoutError);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    }, ms);
  });

  // returns a race between timeout and the passed promise
  return Promise.race<T>([promise, timeout]);
};
