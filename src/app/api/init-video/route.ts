/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-var-requires */
import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, GridFSBucket } from 'mongodb';
import fs from 'fs';
import path from 'path';

const url = process.env.DATABASE_URL;
let clientPromise: Promise<MongoClient>;

if (!url) {
  console.error('MONGODB_URI is not defined'); // Debug log
} else {
  clientPromise = MongoClient.connect(url)
    .then((client) => {
      console.log('Connected to MongoDB'); // Debug log
      return client;
    })
    .catch((error) => {
      console.error('Error connecting to MongoDB:', error); // Debug log
      throw error;
    });
}

export async function GET(req: NextRequest) {
  console.log('init-video route hit'); // Debug log

  try {
    const client = await clientPromise;
    const db = client.db('videos');
    const bucket = new GridFSBucket(db);

    const videoUploadStream = bucket.openUploadStream('bigbuck');
    console.log('Opened GridFS upload stream'); // Debug log

    const videoPath = path.join(process.cwd(), 'public/bigbuck.mp4');
    console.log(`Video path: ${videoPath}`); // Debug log

    const videoReadStream = fs.createReadStream(videoPath);
    console.log('Created read stream for video'); // Debug log

    videoReadStream.pipe(videoUploadStream);

    videoUploadStream.on('finish', () => {
      console.log('Video upload complete'); // Debug log
    });

    return new NextResponse('Done...', { status: 200 });
  } catch (error: any) {
    console.error('Error in init-video route:', error); // Debug log
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
