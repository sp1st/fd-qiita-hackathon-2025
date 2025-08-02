import { useState, useEffect } from 'react';
import { useParams } from 'react-router';
import { useAuth } from '~/contexts/AuthContext';
import { Header } from '~/components/common/Header';
import { Loading } from '~/components/common/Loading';
import { ErrorMessage } from '~/components/common/ErrorMessage';

interface Message {
  id: number;
  content: string;
  sender: 'patient' | 'support';
  timestamp: string;
}

export default function SupportChatPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || user.userType !== 'patient') {
      return;
    }

    // 初期メッセージを設定
    setMessages([
      {
        id: 1,
        content: 'サポートチャットにようこそ！何かお困りのことがございましたら、お気軽にお声かけください。',
        sender: 'support',
        timestamp: new Date().toISOString(),
      },
    ]);
    setLoading(false);
  }, [user]);

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    const message: Message = {
      id: Date.now(),
      content: newMessage,
      sender: 'patient',
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, message]);
    setNewMessage('');

    // 自動返信（実際の実装ではWebSocketを使用）
    setTimeout(() => {
      const reply: Message = {
        id: Date.now() + 1,
        content: 'メッセージを承りました。担当者が確認いたします。',
        sender: 'support',
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, reply]);
    }, 1000);
  };

  if (loading) {
    return <Loading />;
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-xl font-semibold text-gray-900">サポートチャット</h1>
            <p className="mt-1 text-sm text-gray-600">予約ID: {id}</p>
          </div>

          {/* メッセージエリア */}
          <div className="h-96 overflow-y-auto p-6 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'patient' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.sender === 'patient'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-900'
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                  <p className="text-xs mt-1 opacity-75">
                    {new Date(message.timestamp).toLocaleTimeString('ja-JP')}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* メッセージ入力エリア */}
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex space-x-4">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="メッセージを入力..."
                className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleSendMessage}
                disabled={!newMessage.trim()}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                送信
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 