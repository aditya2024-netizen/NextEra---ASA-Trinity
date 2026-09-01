import app from '../server';

export default function handler(req: any, res: any) {
  try {
    return app(req, res);
  } catch (err: any) {
    console.error('[API Error]:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
}
