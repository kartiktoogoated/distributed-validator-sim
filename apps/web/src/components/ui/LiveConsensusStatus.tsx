import React, { useEffect, useState } from "react";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { CheckCircle2, XCircle } from "lucide-react";

const WS_URL =
  import.meta.env.VITE_AGGREGATOR_WS_URL || "ws://localhost:3000/api/ws";

interface ConsensusPayload {
  url: string;
  consensus: "UP" | "DOWN";
  votes: Array<{ validatorId: number; status: string; weight: number }>;
  timestamp: string;
}

interface LiveConsensusStatusProps {
  compact?: boolean;
}

export default function LiveConsensusStatus({ compact }: LiveConsensusStatusProps) {
  const [statuses, setStatuses] = useState<Record<string, ConsensusPayload>>({});

  useEffect(() => {
    const ws = new WebSocket(WS_URL);
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as ConsensusPayload;
        setStatuses((prev) => ({ ...prev, [data.url]: data }));
      } catch {
        // Ignore invalid messages
      }
    };
    return () => ws.close();
  }, []);

  if (Object.keys(statuses).length === 0) return null;

  if (compact) {
    return (
      <div className="flex flex-wrap gap-2 items-center">
        {Object.entries(statuses).map(([url, payload]) => (
          <Tooltip key={url}>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1 cursor-pointer px-2 py-1 rounded bg-muted/50">
                <span
                  className={`inline-block w-2.5 h-2.5 rounded-full mr-1 ${
                    payload.consensus === "UP" ? "bg-green-500" : "bg-red-500"
                  }`}
                />
                <span className="font-mono text-xs truncate max-w-[90px]">{url}</span>
                <span className="text-xs font-semibold ml-1">
                  {payload.consensus === "UP" ? "Up" : "Down"}
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="top">
              <div className="text-xs">
                <div>
                  <b>Status:</b> {payload.consensus}
                </div>
                <div>
                  <b>Time:</b>{" "}
                  {new Date(payload.timestamp).toLocaleString("en-IN", {
                    timeZone: "Asia/Kolkata",
                    hour12: true,
                  })}
                </div>
                <pre className="mt-1 bg-muted p-1 rounded max-w-xs overflow-x-auto">
                  {JSON.stringify(payload, null, 2)}
                </pre>
              </div>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {Object.entries(statuses).map(([url, payload]) => (
        <Tooltip key={url}>
          <TooltipTrigger asChild>
            <Card className="transition-shadow hover:shadow-lg cursor-pointer">
              <CardHeader className="pb-2 flex-row items-center justify-between">
                <CardTitle className="text-base font-mono truncate max-w-[180px] flex-1">{url}</CardTitle>
                {payload.consensus === "UP" ? (
                  <CheckCircle2 className="text-green-500 ml-2" size={22} />
                ) : (
                  <XCircle className="text-red-500 ml-2" size={22} />
                )}
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`inline-block w-3 h-3 rounded-full ${
                      payload.consensus === "UP" ? "bg-green-500" : "bg-red-500"
                    }`}
                  />
                  <span className="font-semibold text-sm">
                    {payload.consensus === "UP" ? "Up" : "Down"}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">
                  Last consensus:
                  <br />
                  {new Date(payload.timestamp).toLocaleString("en-IN", {
                    timeZone: "Asia/Kolkata",
                    hour12: true,
                  })}
                </div>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent side="top">
            <div className="text-xs">
              <div>
                <b>Status:</b> {payload.consensus}
              </div>
              <div>
                <b>Time:</b>{" "}
                {new Date(payload.timestamp).toLocaleString("en-IN", {
                  timeZone: "Asia/Kolkata",
                  hour12: true,
                })}
              </div>
              <pre className="mt-1 bg-muted p-1 rounded max-w-xs overflow-x-auto">
                {JSON.stringify(payload, null, 2)}
              </pre>
            </div>
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
} 