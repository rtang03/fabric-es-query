/**
 * @ignore
 */
export const waitSecond = async (second: number) => {
  const timer = new Promise<void>((done) => {
    setTimeout(() => done(), second * 1000);
  });

  await timer;
};
