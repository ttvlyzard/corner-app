import { NextResponse } from "next/server";

export function apiRoute<T extends (req: Request, ctx: any) => Promise<Response>>(handler: T) {
  return async (req: Request, ctx: any) => {
    try {
      return await handler(req, ctx);
    } catch (err) {
      console.error("API route error:", err);
      return NextResponse.json(
        { error: err instanceof Error ? err.message : "Unexpected server error" },
        { status: 500 }
      );
    }
  };
}
