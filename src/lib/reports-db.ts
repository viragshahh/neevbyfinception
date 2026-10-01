import { randomUUID } from "crypto";
import { REPORTS_BUCKET, supabase } from "./supabase";

export type ReportType = "industry_report" | "monthly_review";

export interface IndustryReport {
  id: string;
  title: string;
  sector: string;
  summary: string;
  date: string;
  authors: string;
  fileName: string;
  fileUrl: string;
  fileSizeBytes: number;
  uploadedAt: string;
  type: ReportType;
}

interface ReportRow {
  id: string;
  title: string;
  sector: string;
  summary: string;
  date: string;
  authors: string;
  file_name: string;
  file_url: string;
  file_size_bytes: number;
  uploaded_at: string;
  type: string;
}

function fromRow(row: ReportRow): IndustryReport {
  return {
    id: row.id,
    title: row.title,
    sector: row.sector,
    summary: row.summary,
    date: row.date,
    authors: row.authors,
    fileName: row.file_name,
    fileUrl: row.file_url,
    fileSizeBytes: row.file_size_bytes,
    uploadedAt: row.uploaded_at,
    type: row.type === "monthly_review" ? "monthly_review" : "industry_report",
  };
}

export async function listReports(): Promise<IndustryReport[]> {
  const { data, error } = await supabase
    .from("reports")
    .select("*")
    .order("date", { ascending: false })
    .order("uploaded_at", { ascending: false });

  if (error) throw new Error(`Failed to list reports: ${error.message}`);
  return (data as ReportRow[]).map(fromRow);
}

let bucketReady: Promise<void> | null = null;

function ensureBucket(): Promise<void> {
  if (!bucketReady) {
    bucketReady = (async () => {
      const { data: buckets, error } = await supabase.storage.listBuckets();
      if (error) throw new Error(`Failed to list storage buckets: ${error.message}`);
      if (buckets.some((b) => b.name === REPORTS_BUCKET)) return;

      const { error: createError } = await supabase.storage.createBucket(REPORTS_BUCKET, {
        public: true,
        fileSizeLimit: "25MB",
        allowedMimeTypes: ["application/pdf"],
      });
      if (createError) throw new Error(`Failed to create storage bucket: ${createError.message}`);
    })().catch((err) => {
      bucketReady = null;
      throw err;
    });
  }
  return bucketReady;
}

export async function uploadReportFile(
  file: File
): Promise<{ fileName: string; fileUrl: string }> {
  await ensureBucket();

  const safeBase =
    file.name
      .toLowerCase()
      .replace(/\.pdf$/, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-+|-+$)/g, "")
      .slice(0, 60) || "report";
  const fileName = `${Date.now()}-${safeBase}.pdf`;

  const { error } = await supabase.storage
    .from(REPORTS_BUCKET)
    .upload(fileName, file, { contentType: "application/pdf" });
  if (error) throw new Error(`Failed to upload PDF: ${error.message}`);

  const { data } = supabase.storage.from(REPORTS_BUCKET).getPublicUrl(fileName);
  return { fileName, fileUrl: data.publicUrl };
}

export async function addReport(
  input: Omit<IndustryReport, "id" | "uploadedAt">
): Promise<IndustryReport> {
  const row = {
    id: randomUUID(),
    title: input.title,
    sector: input.sector,
    summary: input.summary,
    date: input.date,
    authors: input.authors,
    file_name: input.fileName,
    file_url: input.fileUrl,
    file_size_bytes: input.fileSizeBytes,
    uploaded_at: new Date().toISOString(),
    type: input.type,
  };

  const { data, error } = await supabase.from("reports").insert(row).select().single();
  if (error) throw new Error(`Failed to save report: ${error.message}`);
  return fromRow(data as ReportRow);
}

export async function deleteReport(id: string): Promise<boolean> {
  const { data: existing, error: fetchError } = await supabase
    .from("reports")
    .select("file_name")
    .eq("id", id)
    .maybeSingle();
  if (fetchError) throw new Error(`Failed to look up report: ${fetchError.message}`);
  if (!existing) return false;

  const { error: deleteError } = await supabase.from("reports").delete().eq("id", id);
  if (deleteError) throw new Error(`Failed to delete report: ${deleteError.message}`);

  await supabase.storage.from(REPORTS_BUCKET).remove([existing.file_name]);
  return true;
}
