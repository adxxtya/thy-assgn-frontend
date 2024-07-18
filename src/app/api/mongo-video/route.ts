import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, GridFSBucket } from 'mongodb';

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
  console.log('mongo-video route hit');

  try {
    const client = await clientPromise;
    const db = client.db('videos');

    const range = req.headers.get('range');
    if (!range) {
      console.log('Range header not found');
      return NextResponse.json('Requires Range header', { status: 400 });
    }
    console.log(`Range: ${range}`);

    const video = await db.collection('fs.files').findOne({});
    if (!video) {
      console.log('No video found in MongoDB');
      return NextResponse.json('No video uploaded!', { status: 404 });
    }
    console.log('Video found in MongoDB');

    const videoSize = video.length;
    console.log(`Video Size: ${videoSize}`);

    const matches = range.match(/bytes=(\d+)-(\d*)/);
    if (!matches) {
      console.log('Invalid Range format');
      return NextResponse.json('Range not satisfiable', { status: 416 });
    }

    const start = parseInt(matches[1]!, 10);
    const end = matches[2] ? parseInt(matches[2], 10) : videoSize - 1;

    if (start >= videoSize || start > end) {
      console.log(`Start (${start}) or End (${end}) exceeds video size (${videoSize})`);
      return NextResponse.json('Range not satisfiable', { status: 416 });
    }

    const contentLength = end - start + 1;
    const headers = {
      "Content-Range": `bytes ${start}-${end}/${videoSize}`,
      "Accept-Ranges": "bytes",
      "Content-Length": `${contentLength}`,
      "Content-Type": "video/mp4",
    };

    console.log(`Headers: ${JSON.stringify(headers)}`);

    const bucket = new GridFSBucket(db);
    const downloadStream = bucket.openDownloadStream(video._id, { start });

    return downloadStream

  } catch (error: any) {
    console.error('Error in mongo-video route:', error);
    return NextResponse.json({ error: error.message }, {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
