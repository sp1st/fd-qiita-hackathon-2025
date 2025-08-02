import React, { useState, useEffect } from 'react';
// import { useAuth } from '../contexts/AuthContext';

interface AIFeedback {
  messageType: string;
  content: string;
  tone: string;
  priority: string;
  targetMetrics?: string[];
}

interface AIFeedbackRecord {
  id: number;
  patientId: number;
  feedbackData: string;
  triggerType: string;
  triggerData?: string;
  isRead: boolean;
  isActioned: boolean;
  scheduledFor?: string;
  sentAt?: string;
  createdAt: string;
}

const AIFeedbackPanel: React.FC = () => {
  // const { user } = useAuth();
  const [feedbacks, setFeedbacks] = useState<AIFeedbackRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  useEffect(() => {
    fetchFeedbacks();
  }, [showUnreadOnly]);

  const fetchFeedbacks = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('accessToken');
      if (!token) {
        setError('認証が必要です');
        return;
      }

      const url = showUnreadOnly ? '/api/smartwatch/feedback/unread' : '/api/smartwatch/feedback';
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const result = await response.json() as { data: AIFeedbackRecord[] };
        setFeedbacks(result.data || []);
      } else {
        setError('フィードバックの取得に失敗しました');
      }
    } catch (err) {
      console.error('Error fetching feedbacks:', err);
      setError('フィードバックの取得中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (feedbackId: number) => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setError('認証が必要です');
        return;
      }

      const response = await fetch(`/api/smartwatch/feedback/${feedbackId}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        fetchFeedbacks(); // リストを再取得
      } else {
        setError('フィードバックの既読化に失敗しました');
      }
    } catch (err) {
      console.error('Error marking feedback as read:', err);
      setError('フィードバックの既読化中にエラーが発生しました');
    }
  };

  const generateFeedback = async (triggerType: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setError('認証が必要です');
        return;
      }

      const response = await fetch('/api/smartwatch/feedback/generate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          triggerType,
          triggerData: { timestamp: new Date().toISOString() },
        }),
      });

      if (response.ok) {
        fetchFeedbacks(); // リストを再取得
      } else {
        setError('フィードバックの生成に失敗しました');
      }
    } catch (err) {
      console.error('Error generating feedback:', err);
      setError('フィードバックの生成中にエラーが発生しました');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getMessageTypeIcon = (messageType: string) => {
    switch (messageType) {
      case 'motivation':
        return '💪';
      case 'reminder':
        return '⏰';
      case 'achievement':
        return '🎉';
      case 'suggestion':
        return '💡';
      default:
        return '📝';
    }
  };

  const getToneColor = (tone: string) => {
    switch (tone) {
      case 'encouraging':
        return 'text-blue-600';
      case 'informative':
        return 'text-green-600';
      case 'gentle':
        return 'text-purple-600';
      case 'direct':
        return 'text-orange-600';
      default:
        return 'text-gray-600';
    }
  };

  const renderFeedbackCard = (feedback: AIFeedbackRecord) => {
    const feedbackData: AIFeedback = JSON.parse(feedback.feedbackData);
    
    return (
      <div key={feedback.id} className={`bg-white rounded-lg shadow p-6 mb-4 ${!feedback.isRead ? 'border-l-4 border-blue-500' : ''}`}>
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{getMessageTypeIcon(feedbackData.messageType)}</span>
            <div>
              <h3 className="text-lg font-semibold capitalize">
                {feedbackData.messageType}
              </h3>
              <p className="text-sm text-gray-500">
                {new Date(feedback.createdAt).toLocaleString('ja-JP')}
              </p>
            </div>
          </div>
          <div className="flex space-x-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(feedbackData.priority)}`}>
              {feedbackData.priority}
            </span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getToneColor(feedbackData.tone)}`}>
              {feedbackData.tone}
            </span>
          </div>
        </div>

        <div className="mb-4">
          <p className="text-gray-700 leading-relaxed">{feedbackData.content}</p>
        </div>

        {feedbackData.targetMetrics && feedbackData.targetMetrics.length > 0 && (
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">対象指標:</p>
            <div className="flex flex-wrap gap-2">
              {feedbackData.targetMetrics.map((metric, index) => (
                <span key={index} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                  {metric}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-500">
            <p>トリガー: {feedback.triggerType}</p>
            {feedback.scheduledFor && (
              <p>予定時刻: {new Date(feedback.scheduledFor).toLocaleString('ja-JP')}</p>
            )}
          </div>
          <div className="flex space-x-2">
            {!feedback.isRead && (
              <button
                onClick={() => markAsRead(feedback.id)}
                className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition-colors"
              >
                既読にする
              </button>
            )}
            <span className={`px-2 py-1 rounded text-xs ${feedback.isRead ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
              {feedback.isRead ? '既読' : '未読'}
            </span>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">AIフィードバック</h2>
        <div className="flex space-x-2">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={showUnreadOnly}
              onChange={(e) => setShowUnreadOnly(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm text-gray-700">未読のみ表示</span>
          </label>
        </div>
      </div>

      {/* フィードバック生成ボタン */}
      <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-2">
        <button
          onClick={() => generateFeedback('daily')}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors text-sm"
        >
          日次フィードバック
        </button>
        <button
          onClick={() => generateFeedback('weekly')}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-colors text-sm"
        >
          週次フィードバック
        </button>
        <button
          onClick={() => generateFeedback('achievement')}
          className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition-colors text-sm"
        >
          達成フィードバック
        </button>
        <button
          onClick={() => generateFeedback('reminder')}
          className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700 transition-colors text-sm"
        >
          リマインダー
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {feedbacks.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">AIフィードバックがありません</p>
          <p className="text-sm text-gray-400 mt-2">
            上記のボタンをクリックしてフィードバックを生成してください
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {feedbacks.map(renderFeedbackCard)}
        </div>
      )}
    </div>
  );
};

export default AIFeedbackPanel; 