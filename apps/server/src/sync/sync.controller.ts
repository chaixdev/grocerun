import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  UseGuards,
  Req,
  Res,
  HttpCode,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { SyncService, SyncCollection } from './sync.service';
import { SseBroadcastService } from './sse-broadcast.service';
import { AuthGuard, JwtPayload } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { SyncCheckpoint, PushRow } from './sync.types';

@Controller('sync')
@UseGuards(AuthGuard)
export class SyncController {
  constructor(
    private readonly syncService: SyncService,
    private readonly sseBroadcast: SseBroadcastService,
  ) {}

  // ---------------------------------------------------------------------------
  // Pull: GET /sync/:collection/pull?updatedAt=<iso>&id=<id>&batchSize=<n>
  // ---------------------------------------------------------------------------

  @Get(':collection/pull')
  async pull(
    @Param('collection') collection: string,
    @Query('updatedAt') updatedAt: string | undefined,
    @Query('id') id: string | undefined,
    @Query('batchSize') batchSize: string | undefined,
    @CurrentUser() user: JwtPayload,
  ) {
    const checkpoint: SyncCheckpoint | null =
      updatedAt && id ? { updatedAt, id } : null;

    return this.syncService.pull(
      collection as SyncCollection,
      checkpoint,
      batchSize ? parseInt(batchSize, 10) : 100,
      user.userId!,
    );
  }

  // ---------------------------------------------------------------------------
  // Push: POST /sync/:collection/push
  // Body: PushRow[]
  // Response: conflicting master states (empty = all accepted)
  // ---------------------------------------------------------------------------

  @Post(':collection/push')
  @HttpCode(200)
  async push(
    @Param('collection') collection: string,
    @Body() rows: PushRow[],
    @CurrentUser() user: JwtPayload,
  ) {
    const conflicts = await this.syncService.push(
      collection as SyncCollection,
      rows,
      user.userId!,
      user.sub,
    );

    if (rows.length > 0) {
      const memberIds = await this.syncService.getHouseholdMemberIds(
        collection as SyncCollection,
        rows,
      );
      this.sseBroadcast.notifyChanged(
        memberIds.length > 0 ? memberIds : [user.userId!],
        { collections: [collection], reason: `${collection}.push` },
        user.userId!,
      );
    }

    return conflicts;
  }

  // ---------------------------------------------------------------------------
  // Stream: GET /sync/:collection/stream  (Server-Sent Events)
  //
  // RxDB uses SSE to receive real-time push notifications of changes.
  // We emit a synthetic RESYNC event immediately — a simple, correct
  // implementation that tells RxDB to re-pull. Real-time push (e.g. via
  // WebSockets or database triggers) can be layered on later.
  //
  // The SSE connection is kept alive with periodic heartbeats so the client
  // doesn't time out and close the connection prematurely.
  // ---------------------------------------------------------------------------

  @Get('stream')
  unscopedStream(
    @Req() req: Request,
    @Res() res: Response,
  ) {
    return this.openStream(req, res);
  }

  @Get(':collection/stream')
  stream(
    @Param('collection') collection: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    return this.openStream(req, res);
  }

  private openStream(req: Request, res: Response) {
    const userId = req.user.userId!;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering
    res.flushHeaders();

    // Send an initial RESYNC so the client does a fresh pull on connect.
    // Named event format: the client does addEventListener('RESYNC', ...).
    res.write(`event: RESYNC\ndata: {}\n\n`);

    // Register this connection for broadcast notifications.
    const unregister = this.sseBroadcast.register(userId, res);

    // Heartbeat every 15s to keep the connection alive through proxies/load balancers
    const heartbeat = setInterval(() => {
      res.write(': heartbeat\n\n');
    }, 15000);

    // Clean up when client disconnects
    res.on('close', () => {
      unregister();
      clearInterval(heartbeat);
      res.end();
    });
  }
}
