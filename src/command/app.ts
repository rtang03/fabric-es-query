import express from 'express';
import { createNewCommitHook } from './createNewCommitHook';

const app = express();

app.use(createNewCommitHook(null));

app.listen(3000);
