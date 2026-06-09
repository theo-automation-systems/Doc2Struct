export const ACCEPTED_FILE_EXTENSIONS = [
  ".pdf",
  ".txt",
  ".docx",
  ".xlsx",
  ".doc",
  ".xls",
] as const;

export const ACCEPTED_FILE_ACCEPT = ACCEPTED_FILE_EXTENSIONS.join(",");

export const ACCEPTED_FILE_LABEL = "PDF, DOCX, XLSX, TXT";

export function isAcceptedFile(file: File): boolean {
  const name = file.name.toLowerCase();
  return ACCEPTED_FILE_EXTENSIONS.some((ext) => name.endsWith(ext));
}

export function unsupportedFileMessage(fileNames: string[]): string {
  if (fileNames.length === 1) {
    return `"${fileNames[0]}" is not supported. Please upload ${ACCEPTED_FILE_LABEL} only.`;
  }
  return `${fileNames.length} files are not supported (${fileNames.join(", ")}). Please upload ${ACCEPTED_FILE_LABEL} only.`;
}
