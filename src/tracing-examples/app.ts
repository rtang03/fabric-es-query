import api from '@opentelemetry/api';
import axios from 'axios';
import express from 'express';
import fetch from 'isomorphic-unfetch';
import { addTraceId } from './tracing';

// import { countAllRequests } from './monitoring';
const PORT = process.env.PORT || '8080';
const app = express();

// metric - simple visit counts
// app.use(countAllRequests());

const getCrudController = () => {
  const router = express.Router();
  const resources = [];
  router.get('/', (req, res) => {

    res.send(resources);
  });
  router.post('/', (req, res) => {
    resources.push(req.body);
    return res.status(201).send(req.body);
  });
  return router;
};

const authMiddleware = (req, res, next) => {
  const { authorization } = req.headers;
  if (authorization && authorization.includes('secret_token')) {
    next();
  } else {
    res.sendStatus(401);
  }
};

app.use(express.json());
app.use(addTraceId);
app.get('/health', (req, res) => res.status(200).send('HEALTHY')); // endpoint that is called by framework/cluster
app.get('/run_test', async (req, res) => {
  // Calls another endpoint of the same API, somewhat mimicing an external API call
  const currentSpan = api.trace.getSpan(api.context.active());
  const { traceId } = currentSpan.spanContext();
  console.log(`traceid: ${traceId}`);
  console.log(`Jaeger URL: http://localhost:16686/trace/${traceId}`);

  currentSpan.addEvent('Added post');
  currentSpan.setAttribute('Date', `${new Date()}`);

  const createdCat = await fetch(`http://localhost:${PORT}/cats`, {
    method: 'POST',
    body: JSON.stringify({
      name: 'Tom',
      friends: ['Jerry'],
    }),
    headers: {
      Authorization: 'secret_token',
    },
  });

  return res.status(201).send('ok');
  // return res.status(201).send(createdCat.data);
});
app.use('/cats', authMiddleware, getCrudController());

app.listen(PORT, () => {
  console.log(`Listening on http://localhost:${PORT}`);
});
