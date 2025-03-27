import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(req: NextRequest) {
  const body = await req.text();

  const filePath = path.resolve(process.cwd(), 'quoridor', 'board-log.txt');

  fs.writeFileSync(filePath, body, { flag: 'a' }); // append to file

  return NextResponse.json({ success: true });
}
