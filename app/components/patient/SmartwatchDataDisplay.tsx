import { useState, useEffect } from 'react';

interface WeeklySmartwatchData {
  exercise: Array<{
    date: string;
    type: string;
    duration: number;
    intensity: 'low' | 'medium' | 'high';
    calories: number;
  }>;
  sleep: Array<{
    date: string;
    duration: number;
    quality: 'poor' | 'fair' | 'good' | 'excellent';
    deepSleep: number;
    lightSleep: number;
    remSleep: number;
  }>;
  activity: Array<{
    date: string;
    steps: number;
    distance: number;
    calories: number;
    activeMinutes: number;
  }>;
  vitals: Array<{
    date: string;
    heartRate: number;
    bloodPressureSystolic: number;
    bloodPressureDiastolic: number;
    oxygenSaturation: number;
  }>;
}

interface AIAnalysis {
  summary: string;
  recommendations: string[];
  riskLevel: 'low' | 'medium' | 'high';
  trends: {
    exercise: 'increasing' | 'stable' | 'decreasing';
    sleep: 'increasing' | 'stable' | 'decreasing';
    activity: 'increasing' | 'stable' | 'decreasing';
  };
}

interface SmartwatchDataDisplayProps {
  patientId: number;
}

export function SmartwatchDataDisplay({ patientId }: SmartwatchDataDisplayProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'exercise' | 'sleep' | 'activity' | 'vitals' | 'ai'>('overview');
  const [weeklyData, setWeeklyData] = useState<WeeklySmartwatchData | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDays, setSelectedDays] = useState<number>(7);

  // データ取得
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/smartwatch/weekly-dummy/${patientId}?days=${selectedDays}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        });
        if (response.ok) {
          const result = await response.json() as { data: WeeklySmartwatchData };
          setWeeklyData(result.data);
          await fetchAIAnalysis(result.data);
        } else {
          console.log('API failed, using local dummy data');
          const localDummyData = generateLocalDummyData();
          setWeeklyData(localDummyData);
          await fetchAIAnalysis(localDummyData);
        }
      } catch (error) {
        console.error('データ取得エラー:', error);
        const localDummyData = generateLocalDummyData();
        setWeeklyData(localDummyData);
        await fetchAIAnalysis(localDummyData);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [patientId, selectedDays]);

  // AI分析取得
  const fetchAIAnalysis = async (data: WeeklySmartwatchData) => {
    try {
      const response = await fetch('/api/smartwatch/summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ data }),
      });
      if (response.ok) {
        const result = await response.json() as { data: AIAnalysis };
        setAiAnalysis(result.data);
      } else {
        const localAnalysis = generateLocalAIAnalysis(data);
        setAiAnalysis(localAnalysis);
      }
    } catch (error) {
      console.error('AI分析エラー:', error);
      const localAnalysis = generateLocalAIAnalysis(weeklyData!);
      setAiAnalysis(localAnalysis);
    }
  };

  // ローカルダミーデータ生成関数
  const generateLocalDummyData = (): WeeklySmartwatchData => {
    const today = new Date();
    const data: WeeklySmartwatchData = {
      exercise: [],
      sleep: [],
      activity: [],
      vitals: [],
    };

    for (let i = selectedDays - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      // 運動データ
      const exerciseTypes = ['ウォーキング', 'ランニング', 'サイクリング', '筋トレ', 'ヨガ'];
      const exerciseType = exerciseTypes[Math.floor(Math.random() * exerciseTypes.length)];
      const exerciseDuration = Math.floor(Math.random() * 60) + 15;
      const exerciseIntensity = ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as 'low' | 'medium' | 'high';
      const exerciseCalories = Math.floor(exerciseDuration * (exerciseIntensity === 'high' ? 8 : exerciseIntensity === 'medium' ? 6 : 4));

      data.exercise.push({
        date: dateStr,
        type: exerciseType,
        duration: exerciseDuration,
        intensity: exerciseIntensity,
        calories: exerciseCalories,
      });

      // 睡眠データ
      const sleepDuration = (Math.random() * 3 + 5).toFixed(1);
      const sleepQuality = ['poor', 'fair', 'good', 'excellent'][Math.floor(Math.random() * 4)] as 'poor' | 'fair' | 'good' | 'excellent';
      const deepSleep = Math.floor(Math.random() * 60) + 30;
      const lightSleep = Math.floor(Math.random() * 120) + 60;
      const remSleep = Math.floor(Math.random() * 90) + 45;

      data.sleep.push({
        date: dateStr,
        duration: parseFloat(sleepDuration),
        quality: sleepQuality,
        deepSleep,
        lightSleep,
        remSleep,
      });

      // 活動データ
      const steps = Math.floor(Math.random() * 8000) + 2000;
      const distance = (steps * 0.0008).toFixed(2);
      const activityCalories = Math.floor(steps * 0.04);
      const activeMinutes = Math.floor(Math.random() * 60) + 10;

      data.activity.push({
        date: dateStr,
        steps,
        distance: parseFloat(distance),
        calories: activityCalories,
        activeMinutes,
      });

      // バイタルデータ
      const heartRate = Math.floor(Math.random() * 40) + 60;
      const bloodPressureSystolic = Math.floor(Math.random() * 40) + 110;
      const bloodPressureDiastolic = Math.floor(Math.random() * 20) + 70;
      const oxygenSaturation = (Math.random() * 5 + 95).toFixed(1);

      data.vitals.push({
        date: dateStr,
        heartRate,
        bloodPressureSystolic,
        bloodPressureDiastolic,
        oxygenSaturation: parseFloat(oxygenSaturation),
      });
    }

    return data;
  };

  // ローカルAI分析生成関数
  const generateLocalAIAnalysis = (data: WeeklySmartwatchData): AIAnalysis => {
    const avgSteps = data.activity.reduce((sum, day) => sum + day.steps, 0) / data.activity.length;
    const avgSleep = data.sleep.reduce((sum, day) => sum + day.duration, 0) / data.sleep.length;
    const exerciseDays = data.exercise.filter(day => day.duration > 0).length;

    let summary = '';
    let riskLevel: 'low' | 'medium' | 'high' = 'low';
    let recommendations: string[] = [];

    if (avgSteps < 5000) {
      summary = '歩数が少なめです。もう少し活動量を増やすことをお勧めします。';
      recommendations.push('1日8000歩を目標に歩数を増やしましょう');
      riskLevel = 'medium';
    } else if (avgSteps > 10000) {
      summary = '素晴らしい活動量です！この調子で継続してください。';
      recommendations.push('現在の活動量を維持しましょう');
    } else {
      summary = '適度な活動量です。さらなる改善の余地があります。';
      recommendations.push('1日10000歩を目標にしましょう');
    }

    if (avgSleep < 6) {
      summary += '睡眠時間が短めです。';
      recommendations.push('7-8時間の睡眠を心がけましょう');
      riskLevel = riskLevel === 'low' ? 'medium' : 'high';
    } else if (avgSleep > 9) {
      summary += '睡眠時間が長めです。';
      recommendations.push('適切な睡眠時間（7-8時間）を心がけましょう');
    } else {
      summary += '適切な睡眠時間です。';
    }

    if (exerciseDays < 3) {
      summary += '運動頻度を増やすことをお勧めします。';
      recommendations.push('週3回以上の運動を心がけましょう');
      riskLevel = riskLevel === 'low' ? 'medium' : 'high';
    } else {
      summary += '良い運動習慣が身についています。';
    }

    const trends = {
      exercise: 'stable' as const,
      sleep: 'stable' as const,
      activity: 'stable' as const,
    };

    return { summary, recommendations, riskLevel, trends };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">データを読み込み中...</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* 期間選択 */}
      <div className="px-6 pt-4 pb-2 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-700">期間:</label>
            <select
              value={selectedDays}
              onChange={(e) => setSelectedDays(parseInt(e.target.value))}
              className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={7}>1週間</option>
              <option value={14}>2週間</option>
              <option value={30}>1ヶ月</option>
              <option value={90}>3ヶ月</option>
            </select>
          </div>
          <div className="text-sm text-gray-500">
            {selectedDays}日間のデータを表示中
          </div>
        </div>
      </div>

      {/* タブナビゲーション */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6">
          {[
            { id: 'overview', name: '概要', icon: '📊' },
            { id: 'exercise', name: '運動', icon: '🏃‍♂️' },
            { id: 'sleep', name: '睡眠', icon: '😴' },
            { id: 'activity', name: '活動', icon: '🚶‍♂️' },
            { id: 'vitals', name: 'バイタル', icon: '❤️' },
            { id: 'ai', name: 'AI分析', icon: '🤖' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.name}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* タブコンテンツ */}
      <div className="p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">{selectedDays}日間の健康データ概要</h3>
            
            {/* サマリーカード */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-blue-700">
                  {Math.round((weeklyData?.activity.reduce((sum, day) => sum + day.steps, 0) || 0) / selectedDays)}
                </div>
                <div className="text-sm text-blue-600">平均歩数</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-green-700">
                  {((weeklyData?.sleep.reduce((sum, day) => sum + day.duration, 0) || 0) / selectedDays).toFixed(1)}
                </div>
                <div className="text-sm text-green-600">平均睡眠時間</div>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-purple-700">
                  {weeklyData?.exercise.filter(day => day.duration > 0).length || 0}
                </div>
                <div className="text-sm text-purple-600">運動日数</div>
              </div>
              <div className="bg-orange-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-orange-700">
                  {Math.round((weeklyData?.vitals.reduce((sum, day) => sum + day.heartRate, 0) || 0) / selectedDays)}
                </div>
                <div className="text-sm text-orange-600">平均心拍数</div>
              </div>
            </div>

            {/* データテーブル */}
            <div className="bg-gray-50 rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">日付</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">歩数</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">睡眠時間</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">運動</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">心拍数</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {weeklyData?.activity.map((day, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{day.date}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{day.steps.toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {weeklyData?.sleep[index]?.duration.toFixed(1)}時間
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {weeklyData?.exercise[index]?.duration || 0}分
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {weeklyData?.vitals[index]?.heartRate}回/分
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'ai' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">AI分析結果</h3>
            
            {aiAnalysis ? (
              <div className="space-y-6">
                {/* リスクレベル */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-gray-900">健康リスクレベル</h4>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      aiAnalysis.riskLevel === 'low' ? 'text-green-600 bg-green-100' : 
                      aiAnalysis.riskLevel === 'medium' ? 'text-yellow-600 bg-yellow-100' : 
                      'text-red-600 bg-red-100'
                    }`}>
                      {aiAnalysis.riskLevel === 'low' ? '低リスク' : aiAnalysis.riskLevel === 'medium' ? '中リスク' : '高リスク'}
                    </span>
                  </div>
                </div>

                {/* サマリー */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">AI分析サマリー</h4>
                  <p className="text-gray-700">{aiAnalysis.summary}</p>
                </div>

                {/* 推奨事項 */}
                <div className="bg-green-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">推奨事項</h4>
                  <ul className="space-y-2">
                    {aiAnalysis.recommendations.map((recommendation, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-green-500 mr-2">•</span>
                        <span className="text-gray-700">{recommendation}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500">
                AI分析データが利用できません
              </div>
            )}
          </div>
        )}

        {(activeTab === 'exercise' || activeTab === 'sleep' || activeTab === 'activity' || activeTab === 'vitals') && (
          <div className="text-center text-gray-500 py-8">
            {activeTab === 'exercise' && '運動データの詳細表示機能は現在開発中です。'}
            {activeTab === 'sleep' && '睡眠データの詳細表示機能は現在開発中です。'}
            {activeTab === 'activity' && '活動データの詳細表示機能は現在開発中です。'}
            {activeTab === 'vitals' && 'バイタルデータの詳細表示機能は現在開発中です。'}
          </div>
        )}
      </div>
    </div>
  );
} 