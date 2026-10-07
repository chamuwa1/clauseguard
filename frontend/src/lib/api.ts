const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function analyzeContract(
  file: File,
  jurisdiction: string
): Promise<Response> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("jurisdiction", jurisdiction);

  return fetch(`${API_URL}/analyze`, {
    method: "POST",
    body: formData,
  });
}

export async function getAnalysis(analysisId: string): Promise<Response> {
  return fetch(`${API_URL}/results/${analysisId}`);
}
