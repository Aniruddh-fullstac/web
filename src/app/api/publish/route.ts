import { NextRequest, NextResponse } from "next/server";
import { createReportingSheetFromWorkbook } from "@/lib/googleSheets";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Missing Excel file (field name: file)" },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const { spreadsheetId, spreadsheetUrl } =
      await createReportingSheetFromWorkbook(buffer);

    return NextResponse.json({
      spreadsheetId,
      spreadsheetUrl,
    });
  } catch (error: any) {
    // Log as much context as possible on the server
    console.error("Error in /api/publish:", {
      message: error?.message,
      name: error?.name,
      stack: error?.stack,
      responseData: (error as any)?.response?.data,
      responseStatus: (error as any)?.response?.status,
    });

    return NextResponse.json(
      {
        error: "Failed to publish reporting sheet",
        details: error?.message ?? String(error),
        debug: (error as any)?.response?.data ?? null,
      },
      { status: 500 },
    );
  }
}



