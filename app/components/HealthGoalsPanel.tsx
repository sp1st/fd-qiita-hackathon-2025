import React, { useState, useEffect } from 'react';
// import { useAuth } from '../contexts/AuthContext';

interface HealthGoal {
  id: number;
  patientId: number;
  goalType: string;
  targetValue: string;
  currentValue?: string;
  unit: string;
  timeframe: string;
  status: 'active' | 'completed' | 'paused' | 'cancelled';
  startDate: string;
  targetDate?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

const HealthGoalsPanel: React.FC = () => {
  // const { user } = useAuth();
  const [goals, setGoals] = useState<HealthGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newGoal, setNewGoal] = useState({
    goalType: '',
    targetValue: '',
    unit: '',
    timeframe: 'daily',
    targetDate: '',
  });

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('accessToken');
      if (!token) {
        setError('認証が必要です');
        return;
      }

      const response = await fetch('/api/smartwatch/goals', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const result = await response.json() as { data: HealthGoal[] };
        setGoals(result.data || []);
      } else {
        setError('健康目標の取得に失敗しました');
      }
    } catch (err) {
      console.error('Error fetching goals:', err);
      setError('健康目標の取得中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const addGoal = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setError('認証が必要です');
        return;
      }

      const response = await fetch('/api/smartwatch/goals', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newGoal),
      });

      if (response.ok) {
        setShowAddForm(false);
        setNewGoal({
          goalType: '',
          targetValue: '',
          unit: '',
          timeframe: 'daily',
          targetDate: '',
        });
        fetchGoals();
      } else {
        setError('健康目標の保存に失敗しました');
      }
    } catch (err) {
      console.error('Error adding goal:', err);
      setError('健康目標の保存中にエラーが発生しました');
    }
  };

  const getGoalTypeDisplay = (goalType: string) => {
    const typeMap: Record<string, string> = {
      exercise: '運動',
      sleep: '睡眠',
      weight: '体重',
      blood_pressure: '血圧',
      steps: '歩数',
      heart_rate: '心拍数',
      calories: 'カロリー',
    };
    return typeMap[goalType] || goalType;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusDisplay = (status: string) => {
    const statusMap: Record<string, string> = {
      active: '進行中',
      completed: '完了',
      paused: '一時停止',
      cancelled: 'キャンセル',
    };
    return statusMap[status] || status;
  };

  const getTimeframeDisplay = (timeframe: string) => {
    const timeframeMap: Record<string, string> = {
      daily: '日次',
      weekly: '週次',
      monthly: '月次',
    };
    return timeframeMap[timeframe] || timeframe;
  };

  const calculateProgress = (goal: HealthGoal) => {
    if (!goal.currentValue || !goal.targetValue) {
      return 0;
    }
    
    const current = parseFloat(goal.currentValue);
    const target = parseFloat(goal.targetValue);
    
    if (target === 0) {
      return 0;
    }
    
    const progress = (current / target) * 100;
    return Math.min(Math.max(progress, 0), 100);
  };

  const renderGoalCard = (goal: HealthGoal) => {
    const progress = calculateProgress(goal);
    
    return (
      <div key={goal.id} className="bg-white rounded-lg shadow p-6 mb-4">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold">
              {getGoalTypeDisplay(goal.goalType)}
            </h3>
            <p className="text-gray-600">
              目標: {goal.targetValue} {goal.unit} ({getTimeframeDisplay(goal.timeframe)})
            </p>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(goal.status)}`}>
            {getStatusDisplay(goal.status)}
          </span>
        </div>

        {goal.currentValue && (
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>現在値: {goal.currentValue} {goal.unit}</span>
              <span>{progress.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        )}

        <div className="text-sm text-gray-500">
          <p>開始日: {new Date(goal.startDate).toLocaleDateString('ja-JP')}</p>
          {goal.targetDate && (
            <p>目標日: {new Date(goal.targetDate).toLocaleDateString('ja-JP')}</p>
          )}
          {goal.completedAt && (
            <p>完了日: {new Date(goal.completedAt).toLocaleDateString('ja-JP')}</p>
          )}
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
        <h2 className="text-xl font-semibold">健康目標</h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
        >
          {showAddForm ? 'キャンセル' : '目標を追加'}
        </button>
      </div>

      {/* 目標追加フォーム */}
      {showAddForm && (
        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-medium mb-4">新しい健康目標</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                目標タイプ
              </label>
              <select
                value={newGoal.goalType}
                onChange={(e) => setNewGoal({ ...newGoal, goalType: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">選択してください</option>
                <option value="exercise">運動</option>
                <option value="sleep">睡眠</option>
                <option value="weight">体重</option>
                <option value="blood_pressure">血圧</option>
                <option value="steps">歩数</option>
                <option value="heart_rate">心拍数</option>
                <option value="calories">カロリー</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                目標値
              </label>
              <input
                type="text"
                value={newGoal.targetValue}
                onChange={(e) => setNewGoal({ ...newGoal, targetValue: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="例: 10000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                単位
              </label>
              <input
                type="text"
                value={newGoal.unit}
                onChange={(e) => setNewGoal({ ...newGoal, unit: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="例: 歩、kg、分"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                期間
              </label>
              <select
                value={newGoal.timeframe}
                onChange={(e) => setNewGoal({ ...newGoal, timeframe: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="daily">日次</option>
                <option value="weekly">週次</option>
                <option value="monthly">月次</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                目標日（任意）
              </label>
              <input
                type="date"
                value={newGoal.targetDate}
                onChange={(e) => setNewGoal({ ...newGoal, targetDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end space-x-2">
            <button
              onClick={() => setShowAddForm(false)}
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors"
            >
              キャンセル
            </button>
            <button
              onClick={addGoal}
              disabled={!newGoal.goalType || !newGoal.targetValue || !newGoal.unit}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              追加
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {goals.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">健康目標がありません</p>
          <p className="text-sm text-gray-400 mt-2">
            「目標を追加」ボタンをクリックして新しい目標を設定してください
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {goals.map(renderGoalCard)}
        </div>
      )}
    </div>
  );
};

export default HealthGoalsPanel; 