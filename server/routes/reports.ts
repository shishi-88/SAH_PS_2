import { RequestHandler } from "express";
import type { AggregatedGapReport, AggregatedGapReportResponse } from "@shared/api";
import { randomUUID } from "node:crypto";

const reports: Array<AggregatedGapReport & { id: string; receivedAt: string }> = [];

function looksIdentifying(value: unknown): boolean {
  if (typeof value === "string") {
    const lower = value.toLowerCase();
    if (lower.includes("studentid") || lower.includes("roll")) return true;
  }
  if (value && typeof value === "object") {
    return Object.keys(value as object).some((k) =>
      ["name", "studentName", "rollNo", "studentId", "students"].includes(k),
    );
  }
  return false;
}

export const handleAggregatedGaps: RequestHandler = (req, res) => {
  const body = req.body as AggregatedGapReport;
  if (!body || body.schemaVersion !== 1 || !Array.isArray(body.gapTypes)) {
    res.status(400).json({ error: "Expected anonymised AggregatedGapReport." });
    return;
  }
  if (looksIdentifying(body)) {
    res.status(400).json({ error: "Identifying fields are not accepted." });
    return;
  }

  const receivedAt = new Date().toISOString();
  const id = randomUUID();
  reports.unshift({ ...body, id, receivedAt });
  if (reports.length > 50) reports.pop();

  const response: AggregatedGapReportResponse = {
    accepted: true,
    id,
    receivedAt,
  };
  res.status(201).json(response);
};

export const handleListReports: RequestHandler = (_req, res) => {
  res.json({ reports });
};
