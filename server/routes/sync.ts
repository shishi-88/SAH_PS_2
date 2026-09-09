import type { Request, Response } from "express";
import { centralStore } from "../db/central-store";
import type { BatchSyncRequest, BatchSyncResponse, SyncOperationResult } from "../../shared/api";

export function handleBatchSync(req: Request, res: Response) {
  const body = req.body as BatchSyncRequest;
  const operations = body.operations || [];
  const clientId = body.clientId || "client_default";
  const results: SyncOperationResult[] = [];

  for (const op of operations) {
    const result = centralStore.processSyncOperation(op, clientId);
    results.push(result);
  }

  const response: BatchSyncResponse = {
    success: true,
    processedCount: results.length,
    results,
    timestamp: new Date().toISOString(),
  };

  res.status(200).json(response);
}

export function handleGetSyncLogs(_req: Request, res: Response) {
  const logs = centralStore.getSyncLogs();
  res.json({ data: logs, count: logs.length });
}
