import { Hono } from 'hono';
import type { Env } from '../types/env';

const wsSimpleApp = new Hono<{ Bindings: Env }>();

// Durable Objectsを使用するWebSocket実装
wsSimpleApp.get('/simple/:sessionId', async (c) => {
  try {
    // CORS対応
    c.header('Access-Control-Allow-Origin', '*');
    c.header('Access-Control-Allow-Headers', '*');
    
    const sessionId = c.req.param('sessionId');
    const userId = c.req.query('userId') || `user-${Date.now()}`;
    const token = c.req.query('token');

    console.log('🔗 WebSocket接続リクエスト:', {
      sessionId,
      userId,
      hasToken: !!token
    });

    // WebSocketアップグレードチェック
    const upgradeHeader = c.req.header('Upgrade');
    if (upgradeHeader !== 'websocket') {
      console.log('❌ WebSocketアップグレードヘッダーがありません:', upgradeHeader);
      return c.text('Expected WebSocket', 426);
    }

    // Durable Objectのインスタンスを取得
    const id = c.env.SIGNALING_ROOM.idFromName(sessionId);
    const stub = c.env.SIGNALING_ROOM.get(id);

    console.log('✅ Durable Object ID生成:', id.toString());

    // URLにユーザー情報を追加してDurable Objectに転送
    const url = new URL(c.req.url);
    url.searchParams.set('userId', userId);
    url.searchParams.set('userType', 'patient'); // デフォルトはpatient
    if (token) {
      url.searchParams.set('token', token);
    }
    
    const newRequest = new Request(url.toString(), c.req.raw);
    
    console.log('🔄 Durable Objectに転送:', url.toString());
    
    // リクエストをDurable Objectに転送
    const response = await stub.fetch(newRequest);
    
    console.log('✅ Durable Object応答:', response.status, response.statusText);
    
    return response;
    
  } catch (error) {
    console.error('❌ WebSocket接続エラー:', error);
    return c.json({
      error: 'WebSocket connection failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, 500);
  }
});

// ヘルスチェックエンドポイントを追加
wsSimpleApp.get('/health', (c) => {
  return c.json({ 
    status: 'ok', 
    message: 'WebSocket endpoint is working'
  });
});

export { wsSimpleApp };