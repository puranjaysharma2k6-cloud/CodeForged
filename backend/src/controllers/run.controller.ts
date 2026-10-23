
import type { Request, Response } from 'express';
import axios from 'axios';

const JUDGE0_URL = process.env.JUDGE0_URL ?? 'http://localhost:2358';

const LANGUAGE_ID_MAP: Record<string, number> = {
  cpp:        54,   
  cpp17:      54,
  cpp20:      54,
  java:       62,
  python:     71,   
  python3:    71,
  javascript: 63,
  go:         60,
  rust:       73,
  kotlin:     78,
};

export async function runCode(req: Request, res: Response): Promise<void> {
  const { sourceCode, language, stdin = '' } = req.body as {
    sourceCode?: string;
    language?:  string;
    stdin?:     string;
  };

  if (!sourceCode || typeof sourceCode !== 'string') {
    res.status(400).json({ error: 'sourceCode is required' });
    return;
  }

  const languageId = LANGUAGE_ID_MAP[language ?? 'python'];
  if (!languageId) {
    res.status(400).json({ error: `Unsupported language: ${language}` });
    return;
  }

  try {

    const { data } = await axios.post(
      `${JUDGE0_URL}/submissions?base64_encoded=false&wait=true`,
      {
        source_code:  sourceCode,
        language_id:  languageId,
        stdin:        stdin,
   
        enable_per_process_and_thread_time_limit:   true,
        enable_per_process_and_thread_memory_limit: true,
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 15_000,
      },
    );

    res.status(200).json({
      stdout:          data.stdout         ?? null,
      stderr:          data.stderr         ?? null,
      compile_output:  data.compile_output ?? null,
      time:            data.time           ?? null,  
      memory:          data.memory         ?? null,  
      status:          data.status?.description ?? 'Unknown',
    });
  } catch (err: any) {
    const msg = err.response?.data?.error ?? err.message ?? 'Judge0 request failed';
    console.error('[run] judge0 error:', msg);
    res.status(502).json({ error: msg });
  }
}
