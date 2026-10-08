import { NextRequest, NextResponse } from "next/server";
import { SimulationRequestSchema, SimulationResultSchema } from "@/lib/schema";
import mockData from "@/lib/mock/simulate.json";
import { simulate } from "@/lib/ai/simulate";
import { FALLBACK_SIMULATION_RESULT } from "@/lib/fallback/result";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  let body: unknown;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      {
        error: {
          code: "INVALID_REQUEST",
          message: "Malformed JSON in request body",
          details: ["Failed to parse JSON payload"],
        },
      },
      { status: 400 }
    );
  }

  const parsed = SimulationRequestSchema.safeParse(body);
  if (!parsed.success) {
    const details = parsed.error.issues.map(
      (issue) => `${issue.path.join(".") || "root"}: ${issue.message}`
    );
    return NextResponse.json(
      {
        error: {
          code: "INVALID_REQUEST",
          message: "Validation failed for simulation request",
          details,
        },
      },
      { status: 400 }
    );
  }

  // MOCK MODE
  const useMock = process.env.USE_MOCK === "true";
  if (useMock) {
    const validatedMock = SimulationResultSchema.parse(mockData);
    return NextResponse.json(
      { paths: validatedMock.paths },
      {
        status: 200,
        headers: {
          "X-CareerX-Source": "mock",
        },
      }
    );
  }

  // AI MODE
  try {
    const { result, source } = await simulate(parsed.data);
    return NextResponse.json(
      { paths: result.paths },
      {
        status: 200,
        headers: {
          "X-CareerX-Source": source,
        },
      }
    );
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : "Unknown error";
    console.error(`[CareerX Route] Unexpected error during simulation: ${errorMsg}`);
    return NextResponse.json(
      { paths: FALLBACK_SIMULATION_RESULT.paths },
      {
        status: 200,
        headers: {
          "X-CareerX-Source": "fallback",
        },
      }
    );
  }
}

function methodNotAllowed() {
  return NextResponse.json(
    {
      error: {
        code: "METHOD_NOT_ALLOWED",
        message: "Only POST requests are supported",
      },
    },
    { status: 405, headers: { Allow: "POST" } }
  );
}

export async function GET() {
  return methodNotAllowed();
}

export async function PUT() {
  return methodNotAllowed();
}

export async function DELETE() {
  return methodNotAllowed();
}

export async function PATCH() {
  return methodNotAllowed();
}
