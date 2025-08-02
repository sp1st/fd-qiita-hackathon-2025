/**
 * WebRTCシグナリング用Durable Object
 * 各ビデオセッションごとにインスタンスが作成され、
 * 参加者間のシグナリングメッセージを中継する
 */

export interface SignalingMessage {
  type: 'join' | 'offer' | 'answer' | 'ice-candidate' | 'leave' | 'error' | 'participant-update' | 'ping' | 'pong';
  userId: string;
  targetUserId?: string;
  data?: any;
  timestamp?: number;
}

export interface Participant {
  userId: string;
  userType: 'patient' | 'worker';
  role?: 'doctor' | 'operator' | 'admin';
  joinedAt: number;
}

export class SignalingRoom {
  private _state: DurableObjectState;
  private _env: unknown;
  private sessions: Map<WebSocket, Participant> = new Map();
  private participants: Map<string, Participant> = new Map();

  constructor(_state: DurableObjectState, _env: any) {

    this._state = _state;

    this._env = _env;
  }

  // WebSocketリクエストを処理
  async fetch(request: Request): Promise<Response> {
    try {
      console.log('🔄 SignalingRoom.fetch() 呼び出し');
      
      // WebSocketアップグレードの確認
      const upgradeHeader = request.headers.get('Upgrade');
      if (!upgradeHeader || upgradeHeader !== 'websocket') {
        console.log('❌ WebSocketアップグレードヘッダーがありません:', upgradeHeader);
        return new Response('Expected WebSocket', { status: 426 });
      }

      // WebSocketペアを作成
      const pair = new WebSocketPair();
      const [client, server] = Object.values(pair);

      // サーバー側のWebSocketを受け入れ
      server.accept();

      // ユーザー情報の取得（URLパラメータから）
      const url = new URL(request.url);
      const userId = url.searchParams.get('userId');
      const userType = url.searchParams.get('userType') as 'patient' | 'worker';
      const role = url.searchParams.get('role') as 'doctor' | 'operator' | 'admin' | undefined;

      console.log('👤 ユーザー情報:', { userId, userType, role });

      if (!userId || !userType) {
        console.log('❌ ユーザー情報が不足:', { userId, userType });
        server.close(1008, 'Missing user information');
        return new Response(null, { status: 101, webSocket: client });
      }

      // 参加者情報を作成
      const participant: Participant = {
        userId,
        userType,
        role,
        joinedAt: Date.now()
      };

      // セッションとパーティシパントを登録
      this.sessions.set(server, participant);
      this.participants.set(userId, participant);

      console.log('✅ 参加者登録完了:', userId, '現在の参加者数:', this.participants.size);

      // 既存の参加者に新規参加を通知
      this.broadcast({
        type: 'join',
        userId,
        data: {
          participant,
          participants: Array.from(this.participants.values())
        }
      }, server);

      // 新規参加者に現在の参加者リストを送信
      server.send(JSON.stringify({
        type: 'participant-update',
        data: {
          participants: Array.from(this.participants.values())
        }
      }));

      // メッセージハンドラー
      server.addEventListener('message', async (event) => {
        try {
          const message: SignalingMessage = JSON.parse(event.data as string);
          message.userId = userId; // 送信者IDを確実に設定
          message.timestamp = Date.now();

          console.log('📨 メッセージ受信:', message.type, 'from:', userId);
          await this.handleMessage(message, server);
        } catch (error) {
          console.error('❌ メッセージ処理エラー:', error);
          server.send(JSON.stringify({
            type: 'error',
            data: { message: 'Invalid message format' }
          }));
        }
      });

      // 切断ハンドラー
      server.addEventListener('close', () => {
        const participant = this.sessions.get(server);
        if (participant) {
          console.log('👋 参加者退出:', participant.userId);
          this.sessions.delete(server);
          this.participants.delete(participant.userId);

          // 他の参加者に退出を通知
          this.broadcast({
            type: 'leave',
            userId: participant.userId,
            data: {
              participants: Array.from(this.participants.values())
            }
          });
        }
      });

      // エラーハンドラー
      server.addEventListener('error', (event) => {
        console.error('❌ WebSocketエラー:', event);
        const participant = this.sessions.get(server);
        if (participant) {
          console.log('🧹 エラーによる参加者削除:', participant.userId);
          this.sessions.delete(server);
          this.participants.delete(participant.userId);
        }
      });

      console.log('✅ WebSocket接続確立完了');
      return new Response(null, { status: 101, webSocket: client });
      
    } catch (error) {
      console.error('❌ SignalingRoom.fetch() エラー:', error);
      return new Response('Internal Server Error', { status: 500 });
    }
  }

  // メッセージ処理
  private async handleMessage(message: SignalingMessage, sender: WebSocket) {
    try {
      console.log('📨 Durable Object メッセージ処理:', message.type, 'from:', message.userId);

      switch (message.type) {
        case 'offer':
          console.log('📤 オファー中継:', message.userId, '→', message.targetUserId || 'broadcast');
          if (message.targetUserId) {
            this.sendToUser(message.targetUserId, message);
          } else {
            this.broadcast(message, sender);
          }
          break;

        case 'answer':
          console.log('📤 アンサー中継:', message.userId, '→', message.targetUserId || 'broadcast');
          if (message.targetUserId) {
            this.sendToUser(message.targetUserId, message);
          } else {
            this.broadcast(message, sender);
          }
          break;

        case 'ice-candidate':
          console.log('🧊 ICE候補中継:', message.userId, '→', message.targetUserId || 'broadcast');
          if (message.targetUserId) {
            this.sendToUser(message.targetUserId, message);
          } else {
            this.broadcast(message, sender);
          }
          break;

        case 'ping':
          console.log('💓 ハートビート受信:', message.userId);
          // ハートビート応答を送信者に返す
          sender.send(JSON.stringify({
            type: 'pong',
            userId: 'server',
            timestamp: Date.now()
          }));
          break;

        case 'pong':
          console.log('💓 ハートビート応答受信:', message.userId);
          break;

        default:
          console.log('📤 その他のメッセージ中継:', message.type, 'from:', message.userId);
          this.broadcast(message, sender);
          break;
      }
    } catch (error) {
      console.error('❌ Durable Object メッセージ処理エラー:', error);
      sender.send(JSON.stringify({
        type: 'error',
        data: { message: 'Message processing failed' }
      }));
    }
  }

  // 特定のユーザーにメッセージを送信
  private sendToUser(targetUserId: string, message: SignalingMessage) {
    console.log('📤 特定ユーザーに送信:', targetUserId, 'message:', message.type);
    
    for (const [ws, participant] of this.sessions) {
      if (participant.userId === targetUserId && ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(JSON.stringify(message));
          console.log('✅ メッセージ送信成功:', message.type, '→', targetUserId);
          return;
        } catch (error) {
          console.error('❌ メッセージ送信エラー:', error);
        }
      }
    }
    console.log('⚠️ ターゲットユーザーが見つかりません:', targetUserId);
  }

  // 全参加者にメッセージをブロードキャスト（特定のWebSocketを除く）
  private broadcast(message: SignalingMessage, excludeWs?: WebSocket) {
    console.log('📤 ブロードキャスト送信:', message.type, '参加者数:', this.sessions.size);
    
    const messageStr = JSON.stringify(message);
    let sentCount = 0;

    for (const [ws, participant] of this.sessions) {
      if (ws !== excludeWs && ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(messageStr);
          sentCount++;
          console.log('✅ ブロードキャスト送信成功:', message.type, '→', participant.userId);
        } catch (error) {
          console.error('❌ ブロードキャスト送信エラー:', error, 'to:', participant.userId);
        }
      }
    }

    console.log('📊 ブロードキャスト結果:', message.type, '送信先:', sentCount, '人');
  }

  // 状態の永続化（必要に応じて実装）
  async alarm() {
    // 定期的なクリーンアップやヘルスチェックを実装可能
    const now = Date.now();
    const timeout = 30 * 60 * 1000; // 30分

    // 長時間接続のない参加者をクリーンアップ
    for (const [userId, participant] of this.participants) {
      if (now - participant.joinedAt > timeout) {
        // WebSocketが生きているか確認
        let isActive = false;
        for (const [ws, p] of this.sessions) {
          if (p.userId === userId && ws.readyState === WebSocket.OPEN) {
            isActive = true;
            break;
          }
        }

        if (!isActive) {
          this.participants.delete(userId);
        }
      }
    }
  }
}
