import { google } from "googleapis";
import * as XLSX from "xlsx";

type OverviewRow = {
  Platform: string;
  Date: Date | string | null;
  Followers: number | null;
  TotalImpressions: number | null;
  Reach: number | null;
  EngagementRate: number | null;
  VideoViews: number | null;
};

type ReachRow = {
  Platform: string;
  Date: Date | string | null;
  ProfileName: string | null;
  Post: string | null;
  Reach: number | null;
  OrganicReach: number | null;
  PaidReach: number | null;
  ViralReach: number | null;
};

type ViewsRow = {
  Platform: string;
  Date: Date | string | null;
  ProfileName: string | null;
  Post: string | null;
  Views: number | null;
  VideoViews: number | null;
  WatchTimeMinutes: number | null;
};

type ImpressionsRow = {
  Platform: string;
  Date: Date | string | null;
  ProfileName: string | null;
  Post: string | null;
  TotalImpressions: number | null;
  OrganicImpressions: number | null;
  PaidImpressions: number | null;
  ViralImpressions: number | null;
  Month: string | null;
};

type EngagementRow = {
  Platform: string;
  Date: Date | string | null;
  ProfileName: string | null;
  Post: string | null;
  Likes: number | null;
  Comments: number | null;
  Saves: number | null;
  Shares: number | null;
  EngagementRate: number | null;
  NetSentimentScore: number | null;
};

const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];

function getAuthClient() {
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;

  if (!clientEmail || !privateKey) {
    throw new Error(
      "GOOGLE_SERVICE_ACCOUNT_EMAIL or GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY is not set",
    );
  }

  const jwt = new google.auth.JWT({
    email: clientEmail,
    key: privateKey.replace(/\\n/g, "\n"),
    scopes: SCOPES,
  });

  return jwt;
}

function getNumber(row: any, keys: string[]): number | null {
  for (const key of keys) {
    const v = row[key];
    if (typeof v === "number") return v;
  }
  return null;
}

function getString(row: any, keys: string[]): string | null {
  for (const key of keys) {
    const v = row[key];
    if (typeof v === "string" && v.trim()) return v;
  }
  return null;
}

function readSheet(workbook: XLSX.WorkBook, name: string): any[] {
  const sheet = workbook.Sheets[name];
  if (!sheet) return [];
  return XLSX.utils.sheet_to_json(sheet, { defval: null });
}

function buildOverview(workbook: XLSX.WorkBook): OverviewRow[] {
  const rows: OverviewRow[] = [];

  const configs = [
    {
      platform: "Facebook",
      sheetName: "Facebook",
      dateKey: "Date",
      followersKeys: ["Followers", "Fans"],
      impressionsKeys: ["Total Impressions", "Impressions"],
      reachKeys: ["Reach"],
      engagementRateKeys: [] as string[],
      videoViewsKeys: ["Video Views"],
    },
    {
      platform: "Instagram",
      sheetName: "Instagram",
      dateKey: "Date",
      followersKeys: ["Followers"],
      impressionsKeys: ["Total Impressions", "Impressions"],
      reachKeys: ["Reach"],
      engagementRateKeys: ["Engagement Rate (Shares + Saves)"],
      videoViewsKeys: ["Post Video Views", "Views"],
    },
    {
      platform: "Youtube",
      sheetName: "Youtube",
      dateKey: "Date",
      followersKeys: ["Followers Count"],
      impressionsKeys: [],
      reachKeys: [],
      engagementRateKeys: [],
      videoViewsKeys: ["videoViews", "Video Views"],
    },
  ];

  for (const cfg of configs) {
    const data = readSheet(workbook, cfg.sheetName);
    for (const row of data) {
      rows.push({
        Platform: cfg.platform,
        Date: row[cfg.dateKey] ?? null,
        Followers: getNumber(row, cfg.followersKeys),
        TotalImpressions: getNumber(row, cfg.impressionsKeys),
        Reach: getNumber(row, cfg.reachKeys),
        EngagementRate: getNumber(row, cfg.engagementRateKeys),
        VideoViews: getNumber(row, cfg.videoViewsKeys),
      });
    }
  }

  return rows;
}

function buildReach(workbook: XLSX.WorkBook): ReachRow[] {
  const rows: ReachRow[] = [];

  const mainConfigs = [
    { platform: "Facebook", sheetName: "Facebook", dateKey: "Date" },
    { platform: "Instagram", sheetName: "Instagram", dateKey: "Date" },
    { platform: "Youtube", sheetName: "Youtube", dateKey: "Date" },
  ] as const;

  for (const cfg of mainConfigs) {
    const data = readSheet(workbook, cfg.sheetName);
    for (const row of data) {
      rows.push({
        Platform: cfg.platform,
        Date: row[cfg.dateKey] ?? null,
        ProfileName: getString(row, ["Profile Name"]),
        Post: null,
        Reach: getNumber(row, ["Reach"]),
        OrganicReach: getNumber(row, ["Organic Reach"]),
        PaidReach: getNumber(row, ["Paid Reach"]),
        ViralReach: getNumber(row, ["Viral Reach"]),
      });
    }
  }

  const postConfigs = [
    { platform: "Facebook", sheetName: "facebook_post" },
    { platform: "Instagram", sheetName: "instagram_post" },
    { platform: "Youtube", sheetName: "youtube_post" },
  ] as const;

  for (const cfg of postConfigs) {
    const data = readSheet(workbook, cfg.sheetName);
    for (const row of data) {
      rows.push({
        Platform: cfg.platform,
        Date: row["Created Time (UTC)"] ?? null,
        ProfileName: getString(row, ["Profile Name"]),
        Post: getString(row, ["Perma Link", "Text"]),
        Reach: getNumber(row, ["Reach"]),
        OrganicReach: getNumber(row, ["Organic Reach"]),
        PaidReach: getNumber(row, ["Paid Reach"]),
        ViralReach: getNumber(row, ["Viral Reach"]),
      });
    }
  }

  return rows;
}

function buildViews(workbook: XLSX.WorkBook): ViewsRow[] {
  const rows: ViewsRow[] = [];

  const mainConfigs = [
    { platform: "Facebook", sheetName: "Facebook", dateKey: "Date" },
    { platform: "Instagram", sheetName: "Instagram", dateKey: "Date" },
    { platform: "Youtube", sheetName: "Youtube", dateKey: "Date" },
  ] as const;

  for (const cfg of mainConfigs) {
    const data = readSheet(workbook, cfg.sheetName);
    for (const row of data) {
      rows.push({
        Platform: cfg.platform,
        Date: row[cfg.dateKey] ?? null,
        ProfileName: getString(row, ["Profile Name"]),
        Post: null,
        Views: getNumber(row, ["Views"]),
        VideoViews: getNumber(row, ["Video Views", "Post Video Views", "videoViews"]),
        WatchTimeMinutes: getNumber(row, ["Estimated Minutes Watched"]),
      });
    }
  }

  const postConfigs = [
    { platform: "Facebook", sheetName: "facebook_post" },
    { platform: "Instagram", sheetName: "instagram_post" },
    { platform: "Youtube", sheetName: "youtube_post" },
  ] as const;

  for (const cfg of postConfigs) {
    const data = readSheet(workbook, cfg.sheetName);
    for (const row of data) {
      rows.push({
        Platform: cfg.platform,
        Date: row["Created Time (UTC)"] ?? null,
        ProfileName: getString(row, ["Profile Name"]),
        Post: getString(row, ["Perma Link", "Text"]),
        Views: getNumber(row, ["Views"]),
        VideoViews: getNumber(row, ["Video Views"]),
        WatchTimeMinutes: getNumber(row, ["Estimated Minutes Watched"]),
      });
    }
  }

  const calculations = readSheet(workbook, "Calculations");
  for (const row of calculations) {
    rows.push({
      Platform: "All",
      Date: null,
      ProfileName: null,
      Post: null,
      Views: null,
      VideoViews: getNumber(row, ["SUM of Post Video Views_1"]),
      WatchTimeMinutes: null,
    });
  }

  const instaSource = readSheet(workbook, "Instagram_Source");
  for (const row of instaSource) {
    rows.push({
      Platform: "Instagram",
      Date: null,
      ProfileName: null,
      Post: null,
      Views: getNumber(row, ["Video Views"]),
      VideoViews: getNumber(row, ["SUM of Post Video Views"]),
      WatchTimeMinutes: null,
    });
  }

  return rows;
}

function buildImpressions(workbook: XLSX.WorkBook): ImpressionsRow[] {
  const rows: ImpressionsRow[] = [];

  const mainConfigs = [
    { platform: "Facebook", sheetName: "Facebook", dateKey: "Date" },
    { platform: "Instagram", sheetName: "Instagram", dateKey: "Date" },
  ] as const;

  for (const cfg of mainConfigs) {
    const data = readSheet(workbook, cfg.sheetName);
    for (const row of data) {
      rows.push({
        Platform: cfg.platform,
        Date: row[cfg.dateKey] ?? null,
        ProfileName: getString(row, ["Profile Name"]),
        Post: null,
        TotalImpressions: getNumber(row, ["Total Impressions", "Impressions"]),
        OrganicImpressions: getNumber(row, ["Organic Impressions"]),
        PaidImpressions: getNumber(row, ["Paid Impressions"]),
        ViralImpressions: getNumber(row, ["Viral Impressions"]),
        Month: null,
      });
    }
  }

  const calculations = readSheet(workbook, "Calculations");
  for (const row of calculations) {
    rows.push({
      Platform: "All",
      Date: null,
      ProfileName: null,
      Post: null,
      TotalImpressions: getNumber(row, ["SUM of Total Impressions_1"]),
      OrganicImpressions: null,
      PaidImpressions: null,
      ViralImpressions: null,
      Month: getString(row, ["Month_1", "Month"]),
    });
  }

  const instaSource = readSheet(workbook, "Instagram_Source");
  for (const row of instaSource) {
    rows.push({
      Platform: "Instagram",
      Date: null,
      ProfileName: null,
      Post: null,
      TotalImpressions: null,
      OrganicImpressions: null,
      PaidImpressions: null,
      ViralImpressions: null,
      Month: getString(row, ["Month_1", "Month"]),
    });
  }

  return rows;
}

function buildEngagement(workbook: XLSX.WorkBook): EngagementRow[] {
  const rows: EngagementRow[] = [];

  const mainConfigs = [
    { platform: "Facebook", sheetName: "Facebook", dateKey: "Date" },
    { platform: "Instagram", sheetName: "Instagram", dateKey: "Date" },
    { platform: "Youtube", sheetName: "Youtube", dateKey: "Date" },
  ] as const;

  for (const cfg of mainConfigs) {
    const data = readSheet(workbook, cfg.sheetName);
    for (const row of data) {
      rows.push({
        Platform: cfg.platform,
        Date: row[cfg.dateKey] ?? null,
        ProfileName: getString(row, ["Profile Name"]),
        Post: null,
        Likes: getNumber(row, ["Likes"]),
        Comments: getNumber(row, ["Comments"]),
        Saves: getNumber(row, ["Saves"]),
        Shares: getNumber(row, ["Shares"]),
        EngagementRate: getNumber(row, ["Engagement Rate (Shares + Saves)"]),
        NetSentimentScore: getNumber(row, ["Net Sentiment Score"]),
      });
    }
  }

  const postConfigs = [
    { platform: "Facebook", sheetName: "facebook_post" },
    { platform: "Instagram", sheetName: "instagram_post" },
    { platform: "Youtube", sheetName: "youtube_post" },
  ] as const;

  for (const cfg of postConfigs) {
    const data = readSheet(workbook, cfg.sheetName);
    for (const row of data) {
      rows.push({
        Platform: cfg.platform,
        Date: row["Created Time (UTC)"] ?? null,
        ProfileName: getString(row, ["Profile Name"]),
        Post: getString(row, ["Perma Link", "Text"]),
        Likes: getNumber(row, ["Likes", "Video Likes"]),
        Comments: getNumber(row, ["Comments", "Video Comments"]),
        Saves: getNumber(row, ["Saves"]),
        Shares: getNumber(row, ["Shares"]),
        EngagementRate: null,
        NetSentimentScore: getNumber(row, ["Net Sentiment Score", "Net Sentiment Score_1"]),
      });
    }
  }

  return rows;
}

function rowsToValues<T extends Record<string, any>>(
  rows: T[],
  columns: (keyof T)[],
): (string | number | null)[][] {
  return rows.map((row) =>
    columns.map((c) => {
      const v: any = row[c];
      if (v instanceof Date) return v.toISOString();
      return v ?? null;
    }),
  );
}

export async function createReportingSheetFromWorkbook(buffer: Buffer): Promise<{
  spreadsheetId: string;
  spreadsheetUrl: string;
}> {
  const auth = getAuthClient();
  const sheets = google.sheets({ version: "v4", auth });

  const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });

  const overview = buildOverview(workbook);
  const reach = buildReach(workbook);
  const views = buildViews(workbook);
  const impressions = buildImpressions(workbook);
  const engagement = buildEngagement(workbook);

  const resource = {
    properties: {
      title: "Looker Social Reporting (Fevicryl)",
    },
    sheets: [
      { properties: { title: "Overview" } },
      { properties: { title: "Reach" } },
      { properties: { title: "Views" } },
      { properties: { title: "Impressions" } },
      { properties: { title: "Engagement" } },
    ],
  };

  const createRes = await sheets.spreadsheets.create({
    requestBody: resource as any,
  });

  const spreadsheetId = createRes.data.spreadsheetId!;
  const spreadsheetUrl = createRes.data.spreadsheetsUrl ?? createRes.data.spreadsheetUrl!;

  const writeTab = async <T extends Record<string, any>>(
    title: string,
    rows: T[],
    columns: (keyof T)[],
  ) => {
    const headerRow = columns as string[];
    const valueRows = rowsToValues(rows, columns);

    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `${title}!A1`,
      valueInputOption: "RAW",
      requestBody: {
        values: [headerRow, ...valueRows],
      },
    });
  };

  await writeTab("Overview", overview, [
    "Platform",
    "Date",
    "Followers",
    "TotalImpressions",
    "Reach",
    "EngagementRate",
    "VideoViews",
  ]);

  await writeTab("Reach", reach, [
    "Platform",
    "Date",
    "ProfileName",
    "Post",
    "Reach",
    "OrganicReach",
    "PaidReach",
    "ViralReach",
  ]);

  await writeTab("Views", views, [
    "Platform",
    "Date",
    "ProfileName",
    "Post",
    "Views",
    "VideoViews",
    "WatchTimeMinutes",
  ]);

  await writeTab("Impressions", impressions, [
    "Platform",
    "Date",
    "ProfileName",
    "Post",
    "TotalImpressions",
    "OrganicImpressions",
    "PaidImpressions",
    "ViralImpressions",
    "Month",
  ]);

  await writeTab("Engagement", engagement, [
    "Platform",
    "Date",
    "ProfileName",
    "Post",
    "Likes",
    "Comments",
    "Saves",
    "Shares",
    "EngagementRate",
    "NetSentimentScore",
  ]);

  return { spreadsheetId, spreadsheetUrl };
}

