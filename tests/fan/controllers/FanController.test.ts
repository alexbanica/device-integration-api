import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { FanController } from '../../../src/fan/controllers/FanController';
import { FanServiceInterface } from '../../../src/fan/services/FanServiceInterface';
import { FanStateDto } from '../../../src/fan/dtos/FanStateDto';

class FanServiceStub implements FanServiceInterface {
  public resetCallCount = 0;
  public shouldResetFail = false;
  public resetError = new Error('reset failed');

  private readonly state = new FanStateDto();

  public async start(): Promise<void> {}

  public async stop(): Promise<void> {}

  public async rotate(): Promise<void> {}

  public async setSpeed(_speed: number): Promise<void> {}

  public getState(): FanStateDto {
    return this.state;
  }

  public async reset(): Promise<void> {
    this.resetCallCount += 1;
    if (this.shouldResetFail) {
      throw this.resetError;
    }
  }
}

interface MockResponse {
  statusCode?: number;
  body: string;
  status: (code: number) => MockResponse;
  send: (body?: unknown) => MockResponse;
}

type RouteHandle = (req: unknown, res: MockResponse, next?: () => void) => void;

function getResetRouteHandle(app: express.Express): RouteHandle {
  const router = (app as { _router?: { stack?: unknown[] } })._router;
  const layer = router?.stack?.find((entry: unknown) => {
    const route = (entry as { route?: { path?: string; methods?: Record<string, boolean> } })
      .route;
    return (
      route?.path === '/api/v1/fan/reset' &&
      route?.methods?.post === true
    );
  }) as {
    route?: { stack?: Array<{ handle: RouteHandle }> };
  } | undefined;

  if (!layer || !layer.route || !layer.route.stack?.length) {
    throw new Error('reset route handler not found');
  }

  return layer.route.stack[0].handle;
}

function postReset(
  app: express.Express,
  body: unknown = undefined,
): Promise<{ status: number; body: string }> {
  const handle = getResetRouteHandle(app);
  let sendCompleted: (response: MockResponse) => void = () => {};
  const sendCompletion = new Promise<MockResponse>((resolve) => {
    sendCompleted = resolve;
  });
  const response: MockResponse = {
    body: '',
    status(code) {
      this.statusCode = code;
      return this;
    },
    send(bodyValue) {
      this.body =
        bodyValue === undefined
          ? ''
          : typeof bodyValue === 'string'
            ? bodyValue
            : JSON.stringify(bodyValue);
      sendCompleted(this);
      return this;
    },
  };

  const request = {
    body,
  };

  return Promise.resolve(
    handle(request as Record<string, unknown>, response, () => undefined),
  )
    .then(() => sendCompletion)
    .then((resolvedResponse) => ({
      status: resolvedResponse.statusCode ?? 200,
      body: resolvedResponse.body,
    }));
}

test('reset success returns 202 and empty body', async () => {
  const app = express();
  const service = new FanServiceStub();
  new FanController(app, service);

  const response = await postReset(app);

  assert.equal(response.status, 202);
  assert.equal(response.body, '');
  assert.equal(service.resetCallCount, 1);
});

test('reset ignores request body', async () => {
  const app = express();
  const service = new FanServiceStub();
  new FanController(app, service);

  const response = await postReset(
    app,
    JSON.stringify({ unexpected: 'body', should: 'be ignored' }),
  );

  assert.equal(response.status, 202);
  assert.equal(response.body, '');
  assert.equal(service.resetCallCount, 1);
});

test('reset failure returns 500 with ErrorResponse', async () => {
  const app = express();
  const service = new FanServiceStub();
  service.shouldResetFail = true;
  new FanController(app, service);

  const response = await postReset(app);
  const responseBody = JSON.parse(response.body);

  assert.equal(response.status, 500);
  assert.equal(responseBody.message, 'reset failed');
  assert.equal(typeof responseBody.timestamp, 'string');
  assert.equal(service.resetCallCount, 1);
});
