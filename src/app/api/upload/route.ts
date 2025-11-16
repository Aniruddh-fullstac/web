import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";

export async function POST(req: NextRequest) {
  return NextResponse.json(
    {
      error:
        "This endpoint is no longer used. Please upload your Excel directly on the /dashboard page.",
    },
    { status: 410 },
  );
}