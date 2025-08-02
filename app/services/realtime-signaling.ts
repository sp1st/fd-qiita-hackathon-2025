/**
 * Cloudflare Realtime シグナリングサービス
 * WebRTC接続のためのシグナリング処理を管理
 */

export type SignalingEventType =
  | 'join'
  | 'offer'
  | 'answer'
  | 'ice-candidate'
  | 'leave'
  | 'error'
  | 'participant-update'
  | 'ping'
  | 'pong'
  | 'connected'
  | 'echo';

export interface SignalingMessage {
  type: SignalingEventType;
  userId: string;
  targetUserId?: string;
  data?: any;
  timestamp?: number;
  participants?: string[];
}

export interface SignalingCallbacks {
  onOffer?: (_offer: RTCSessionDescriptionInit) => void;
  onAnswer?: (_answer: RTCSessionDescriptionInit) => void;
  onIceCandidate?: (_candidate: RTCIceCandidate) => void;
  onParticipantJoined?: (_participantId: string) => void;
  onParticipantLeft?: (_participantId: string) => void;
  onParticipantUpdate?: (_participants: any[]) => void;
  onError?: (_error: Error) => void;
  onConnectionStateChange?: (_state: 'connecting' | 'connected' | 'disconnected' | 'error') => void;
}

export class RealtimeSignalingService {
  private ws: WebSocket | null = null;
  private sessionId: string;
  private userId: string;
  private callbacks: SignalingCallbacks;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;

  constructor(sessionId: string, userId: string, callbacks: SignalingCallbacks) {
    this.sessionId = sessionId;
    this.userId = userId;
    this.callbacks = callbacks;
  }

  /**
   * シグナリングサーバーに接続
   */
  async connect(token: string): Promise<void> {
    console.log('🌐 シグナリング接続開始 - sessionId:', this.sessionId, 'userId:', this.userId);

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const hostname = window.location.hostname;
    const port = window.location.port;
    
    // ローカル開発環境ではポート番号を必ず含める
    const host = port ? `${hostname}:${port}` : hostname;
    const url = `${protocol}//${host}/api/ws/simple/${this.sessionId}?userId=${this.userId}&token=${token}`;

    console.log('🔗 WebSocket接続URL:', url);
    console.log('📍 接続情報:', { protocol, hostname, port, host });

    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(url);

        this.ws.onopen = () => {
          console.log('✅ WebSocket connected - SessionId:', this.sessionId);
          this.callbacks?.onConnectionStateChange?.('connected');
          this.reconnectAttempts = 0; // 接続成功時にリセット
          this.startHeartbeat();
          resolve();
        };

        this.ws.onmessage = (event) => {
          console.log('📨 WebSocketメッセージ受信:', event.data);
          this.handleMessage(event.data);
        };

        this.ws.onerror = (error) => {
          console.error('❌ WebSocket error:', error);
          this.callbacks.onError?.(new Error('WebSocket connection error'));
          this.callbacks.onConnectionStateChange?.('error');
          reject(new Error('WebSocket connection failed'));
        };

        this.ws.onclose = (event) => {
          console.info('🔌 WebSocket disconnected - code:', event.code, 'reason:', event.reason);
          this.callbacks.onConnectionStateChange?.('disconnected');
          this.stopHeartbeat();
          
          // 正常な切断でない場合のみ再接続を試行
          if (event.code !== 1000) {
            this.attemptReconnect(token);
          }
        };

      } catch (error) {
        console.error('❌ WebSocket接続作成エラー:', error);
        reject(error);
      }
    });
  }

  /**
   * WebSocket URLを構築
   */
  private buildWebSocketUrl(token: string): string {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    // シンプルなWebSocketエンドポイントを使用（デモ用）
    return `${protocol}//${host}/api/ws/simple/${this.sessionId}?userId=${this.userId}&token=${token}`;
  }

  /**
   * メッセージを処理
   */
  private handleMessage(data: string): void {
    try {
      const message: SignalingMessage = JSON.parse(data);

      // 自分のメッセージは無視（joinとleave以外）
      if (message.userId === this.userId && message.type !== 'join' && message.type !== 'leave') {
        return;
      }

      switch (message.type) {
        case 'connected':
          console.log('✅ WebSocket接続確認:', message);
          // 接続確認メッセージを受信したら、参加者リストを更新
          if (message.participants) {
            this.callbacks.onParticipantUpdate?.(message.participants);
          }
          break;

        case 'offer':
          console.log('📤 オファー受信:', message);
          this.callbacks.onOffer?.(message.data);
          break;

        case 'answer':
          console.log('📤 アンサー受信:', message);
          this.callbacks.onAnswer?.(message.data);
          break;

        case 'ice-candidate':
          console.log('🧊 ICE候補受信:', message);
          this.callbacks.onIceCandidate?.(new RTCIceCandidate(message.data));
          break;

        case 'join':
          console.log('👋 参加者参加:', message);
          if (message.data?.participant) {
            this.callbacks.onParticipantJoined?.(message.userId);
          }
          if (message.data?.participants) {
            this.callbacks.onParticipantUpdate?.(message.data.participants);
          }
          break;

        case 'leave':
          console.log('👋 参加者退出:', message);
          this.callbacks.onParticipantLeft?.(message.userId);
          if (message.data?.participants) {
            this.callbacks.onParticipantUpdate?.(message.data.participants);
          }
          break;

        case 'participant-update':
          console.log('👥 参加者リスト更新:', message);
          if (message.data?.participants) {
            this.callbacks.onParticipantUpdate?.(message.data.participants);
          }
          break;

        case 'error':
          console.error('❌ シグナリングエラー:', message);
          this.callbacks.onError?.(new Error(message.data?.message || 'Unknown error'));
          break;

        case 'ping':
          console.log('💓 ハートビート受信');
          // Heartbeat - respond with pong
          this.sendMessage({
            type: 'pong',
            userId: this.userId,
            timestamp: Date.now()
          });
          break;

        case 'pong':
          console.log('💓 ハートビート応答受信');
          break;

        case 'echo':
          console.log('🔄 エコーメッセージ受信:', message);
          // テスト用のエコーメッセージは無視
          break;

        default:
          console.warn('⚠️ 未知のメッセージタイプ:', message.type, message);
      }
    } catch (error) {
      console.error('❌ メッセージ解析エラー:', error);
    }
  }

  /**
   * オファーを送信
   */
  async sendOffer(offer: RTCSessionDescriptionInit, targetUserId?: string): Promise<void> {
    await this.sendMessage({
      type: 'offer',
      userId: this.userId,
      targetUserId,
      data: offer
    });
  }

  /**
   * アンサーを送信
   */
  async sendAnswer(answer: RTCSessionDescriptionInit, targetUserId?: string): Promise<void> {
    await this.sendMessage({
      type: 'answer',
      userId: this.userId,
      targetUserId,
      data: answer
    });
  }

  /**
   * ICE候補を送信
   */
  async sendIceCandidate(candidate: RTCIceCandidate, targetUserId?: string): Promise<void> {
    await this.sendMessage({
      type: 'ice-candidate',
      userId: this.userId,
      targetUserId,
      data: candidate.toJSON()
    });
  }

  /**
   * メッセージを送信
   */
  private async sendMessage(message: SignalingMessage): Promise<void> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error('❌ WebSocketが接続されていません。readyState:', this.ws?.readyState);
      throw new Error('WebSocket is not connected');
    }

    try {
      const messageStr = JSON.stringify(message);
      console.log('📤 メッセージ送信:', message.type, 'to:', message.targetUserId || 'broadcast');
      this.ws.send(messageStr);
    } catch (error) {
      console.error('❌ メッセージ送信エラー:', error);
      throw new Error('Failed to send message');
    }
  }

  /**
   * 再接続を試行
   */
  private attemptReconnect(token: string): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ 最大再接続試行回数に達しました:', this.maxReconnectAttempts);
      this.callbacks.onError?.(new Error('Failed to reconnect to signaling server'));
      return;
    }

    this.reconnectAttempts++;
    console.log(`🔄 再接続試行 (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
    this.callbacks.onConnectionStateChange?.('connecting');

    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1); // 指数バックオフ
    console.log(`⏰ ${delay}ms後に再接続を試行`);

    setTimeout(() => {
      console.log('🔄 再接続開始...');
      this.connect(token).catch(error => {
        console.error('❌ 再接続失敗:', error);
        // 再接続が失敗した場合、再度試行
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.attemptReconnect(token);
        }
      });
    }, delay);
  }

  /**
   * ハートビートを開始
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000); // 30秒ごと
  }

  /**
   * ハートビートを停止
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * 接続を切断
   */
  disconnect(): void {
    this.stopHeartbeat();

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * 接続状態を取得
   */
  get isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}
