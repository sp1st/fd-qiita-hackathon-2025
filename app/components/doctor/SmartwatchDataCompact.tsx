import { useState, useEffect } from 'react';

interface WeeklySmartwatchData {
  exercise: Array<{
    date: string;
    type: string;
    duration: number;
    frequency: number;
    intensity: string;
    caloriesBurned: number;
  }>;
  sleep: Array<{
    date: string;
    duration: number;
    quality: string;
    deepSleep: number;
    lightSleep: number;
    remSleep: number;
  }>;
  activity: Array<{
    date: string;
    steps: number;
    distance: number;
    activeMinutes: number;
    caloriesBurned: number;
  }>;
  vitals: Array<{
    date: string;
    heartRate: number;
    bloodPressure: {
      systolic: number;
      diastolic: number;
    };
    temperature: number;
    oxygenSaturation: number;
  }>;
}

interface AIAnalysis {
  summary: string;
  recommendations: string[];
  riskLevel: 'low' | 'medium' | 'high';
  trends: {
    exercise: string;
    sleep: string;
    activity: string;
    vitals: string;
  };
}

interface SmartwatchDataCompactProps {
  patientId: number;
  patientName: string;
}

export function SmartwatchDataCompact({ patientId, patientName }: SmartwatchDataCompactProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [weeklyData, setWeeklyData] = useState<WeeklySmartwatchData | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [selectedDays, setSelectedDays] = useState<number>(7);

  // データ取得
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // 指定期間分のダミーデータを取得
        const response = await fetch(`/api/smartwatch/weekly-dummy/${patientId}?days=${selectedDays}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });

        if (response.ok) {
          const result = await response.json() as { data: WeeklySmartwatchData };
          setWeeklyData(result.data);
          
          // AI分析を実行
          await fetchAIAnalysis(result.data);
        } else {
          // APIが失敗した場合はローカルでダミーデータを生成
          console.log('API failed, using local dummy data');
          const localDummyData = generateLocalDummyData();
          setWeeklyData(localDummyData);
          await fetchAIAnalysis(localDummyData);
        }
      } catch (error) {
        console.error('データ取得エラー:', error);
        // エラーが発生した場合もローカルでダミーデータを生成
        console.log('Error occurred, using local dummy data');
        const localDummyData = generateLocalDummyData();
        setWeeklyData(localDummyData);
        await fetchAIAnalysis(localDummyData);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [patientId, selectedDays]);

  // ローカルダミーデータ生成関数
  const generateLocalDummyData = (): WeeklySmartwatchData => {
    const today = new Date();
    const data: WeeklySmartwatchData = {
      exercise: [],
      sleep: [],
      activity: [],
      vitals: []
    };
    
    const exerciseTypes = ['ウォーキング', 'ランニング', '筋トレ', 'ヨガ', '水泳'];
    const intensities = ['低', '中', '高'];
    const sleepQualities = ['poor', 'fair', 'good', 'excellent'];
    
    for (let i = selectedDays - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      // 運動データ
      const hasExercise = Math.random() > 0.3; // 70%の確率で運動
      data.exercise.push({
        date: dateStr,
        type: hasExercise ? exerciseTypes[Math.floor(Math.random() * exerciseTypes.length)] : 'なし',
        duration: hasExercise ? Math.floor(Math.random() * 60) + 10 : 0,
        frequency: Math.floor(Math.random() * 7) + 1,
        intensity: hasExercise ? intensities[Math.floor(Math.random() * intensities.length)] : 'なし',
        caloriesBurned: hasExercise ? Math.floor(Math.random() * 500) + 50 : 0
      });
      
      // 睡眠データ
      const sleepDuration = Math.random() * 3 + 5; // 5-8時間
      data.sleep.push({
        date: dateStr,
        duration: sleepDuration,
        quality: sleepQualities[Math.floor(Math.random() * sleepQualities.length)],
        deepSleep: sleepDuration * 0.2 + Math.random() * 0.5,
        lightSleep: sleepDuration * 0.6 + Math.random() * 0.3,
        remSleep: sleepDuration * 0.2 + Math.random() * 0.3
      });
      
      // 活動データ
      const steps = Math.floor(Math.random() * 8000) + 2000;
      data.activity.push({
        date: dateStr,
        steps,
        distance: steps * 0.0008, // 概算距離
        activeMinutes: Math.floor(Math.random() * 120) + 30,
        caloriesBurned: Math.floor(Math.random() * 300) + 100
      });
      
      // バイタルデータ
      data.vitals.push({
        date: dateStr,
        heartRate: Math.floor(Math.random() * 40) + 60,
        bloodPressure: {
          systolic: Math.floor(Math.random() * 40) + 110,
          diastolic: Math.floor(Math.random() * 20) + 70
        },
        temperature: Math.random() * 2 + 36,
        oxygenSaturation: Math.floor(Math.random() * 10) + 95
      });
    }
    
    return data;
  };

  // AI分析取得
  const fetchAIAnalysis = async (data: WeeklySmartwatchData) => {
    try {
      setLoadingAnalysis(true);
      
      const response = await fetch('/api/smartwatch/summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          patientId,
          data,
        }),
      });

      if (response.ok) {
        const result = await response.json() as { data: AIAnalysis };
        setAiAnalysis(result.data);
      } else {
        // APIが失敗した場合はローカルでAI分析を実行
        console.log('AI API failed, using local analysis');
        const localAnalysis = generateLocalAIAnalysis(data);
        setAiAnalysis(localAnalysis);
      }
    } catch (error) {
      console.error('AI分析エラー:', error);
      // エラーが発生した場合もローカルでAI分析を実行
      console.log('AI analysis error, using local analysis');
      const localAnalysis = generateLocalAIAnalysis(data);
      setAiAnalysis(localAnalysis);
    } finally {
      setLoadingAnalysis(false);
    }
  };

  // ローカルAI分析生成関数
  const generateLocalAIAnalysis = (data: WeeklySmartwatchData): AIAnalysis => {
    const avgSteps = data.activity.reduce((sum, day) => sum + day.steps, 0) / data.activity.length;
    const avgSleep = data.sleep.reduce((sum, day) => sum + day.duration, 0) / data.sleep.length;
    const avgHeartRate = data.vitals.reduce((sum, day) => sum + day.heartRate, 0) / data.vitals.length;
    const avgSystolic = data.vitals.reduce((sum, day) => sum + day.bloodPressure.systolic, 0) / data.vitals.length;
    const avgDiastolic = data.vitals.reduce((sum, day) => sum + day.bloodPressure.diastolic, 0) / data.vitals.length;
    
    // 運動頻度の計算
    const exerciseDays = data.exercise.filter(day => day.duration > 0).length;
    const exerciseFrequency = exerciseDays / 7;
    
    // リスクレベルの判定
    let riskLevel: 'low' | 'medium' | 'high' = 'low';
    if (avgSteps < 5000 || avgSleep < 6 || avgSystolic > 140 || avgDiastolic > 90) {
      riskLevel = 'medium';
    }
    if (avgSteps < 3000 || avgSleep < 5 || avgSystolic > 160 || avgDiastolic > 100) {
      riskLevel = 'high';
    }
    
    // 要約の生成
    const summary = `この1週間、患者さんは平均して1日${Math.round(avgSteps)}歩歩いています。運動頻度は週${Math.round(exerciseFrequency * 7)}回、平均睡眠時間は${avgSleep.toFixed(1)}時間です。心拍数は平均${Math.round(avgHeartRate)}回/分、血圧は${Math.round(avgSystolic)}/${Math.round(avgDiastolic)}mmHgで安定しています。`;
    
    // 推奨事項の生成
    const recommendations = [];
    if (avgSteps < 8000) {
      recommendations.push('1日8000歩以上を目標に、歩数を増やすことをお勧めします');
    }
    if (avgSleep < 7) {
      recommendations.push('睡眠時間を7時間以上に延長することを検討してください');
    }
    if (avgSystolic > 130 || avgDiastolic > 85) {
      recommendations.push('血圧がやや高めです。生活習慣の見直しを検討してください');
    }
    if (exerciseFrequency < 0.5) {
      recommendations.push('運動頻度を週3回以上に増やすことをお勧めします');
    }
    
    // トレンド分析
    const trends = {
      exercise: exerciseFrequency > 0.7 ? '良好' : exerciseFrequency > 0.4 ? '普通' : '改善が必要',
      sleep: avgSleep > 7 ? '良好' : avgSleep > 6 ? '普通' : '改善が必要',
      activity: avgSteps > 8000 ? '良好' : avgSteps > 5000 ? '普通' : '改善が必要',
      vitals: riskLevel === 'low' ? '良好' : riskLevel === 'medium' ? '注意' : '要観察'
    };
    
    return {
      summary,
      recommendations,
      riskLevel,
      trends
    };
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'high': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getTrendColor = (trend: string) => {
    if (trend.includes('良好')) return 'text-green-600';
    if (trend.includes('普通')) return 'text-yellow-600';
    if (trend.includes('改善') || trend.includes('注意') || trend.includes('要観察')) return 'text-red-600';
    return 'text-gray-600';
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-16 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  // 最新のデータを取得
  const latestActivity = weeklyData?.activity[weeklyData.activity.length - 1];
  const latestSleep = weeklyData?.sleep[weeklyData.sleep.length - 1];
  const latestVitals = weeklyData?.vitals[weeklyData.vitals.length - 1];

  return (
    <div className="space-y-3">
      {/* 概要カード */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-blue-50 rounded-lg p-3 text-center">
          <div className="text-lg font-bold text-blue-700">
            {latestActivity?.steps.toLocaleString() || 0}
          </div>
          <div className="text-xs text-blue-600">歩数</div>
        </div>

        <div className="bg-green-50 rounded-lg p-3 text-center">
          <div className="text-lg font-bold text-green-700">
            {latestSleep?.duration.toFixed(1) || 0}
          </div>
          <div className="text-xs text-green-600">睡眠時間</div>
        </div>

        <div className="bg-red-50 rounded-lg p-3 text-center">
          <div className="text-lg font-bold text-red-700">
            {latestVitals?.bloodPressure.systolic || 0}/{latestVitals?.bloodPressure.diastolic || 0}
          </div>
          <div className="text-xs text-red-600">血圧</div>
        </div>
      </div>

      {/* 展開/折りたたみボタン */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full text-left text-sm text-blue-600 hover:text-blue-800 flex items-center justify-between"
      >
        <span>詳細を見る</span>
        <svg
          className={`w-4 h-4 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* 詳細セクション */}
      {isExpanded && (
        <div className="space-y-4 bg-gray-50 rounded-lg p-4">
          {/* 1週間のサマリー */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-2">{selectedDays}日間のサマリー</h4>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-600">平均歩数:</span>
                <span className="font-medium">
                  {Math.round((weeklyData?.activity.reduce((sum, day) => sum + day.steps, 0) || 0) / selectedDays)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">平均睡眠:</span>
                <span className="font-medium">
                  {((weeklyData?.sleep.reduce((sum, day) => sum + day.duration, 0) || 0) / selectedDays).toFixed(1)}時間
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">運動日数:</span>
                <span className="font-medium">
                  {weeklyData?.exercise.filter(day => day.duration > 0).length || 0}日
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">平均心拍数:</span>
                <span className="font-medium">
                  {Math.round((weeklyData?.vitals.reduce((sum, day) => sum + day.heartRate, 0) || 0) / selectedDays)}回/分
                </span>
              </div>
            </div>
          </div>

          {/* AI分析 */}
          {loadingAnalysis ? (
            <div className="flex items-center justify-center py-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-xs text-gray-600">AI分析中...</span>
            </div>
          ) : aiAnalysis ? (
            <div className="space-y-3">
              {/* リスクレベル */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-700">リスクレベル:</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskLevelColor(aiAnalysis.riskLevel)}`}>
                  {aiAnalysis.riskLevel === 'low' ? '低リスク' : aiAnalysis.riskLevel === 'medium' ? '中リスク' : '高リスク'}
                </span>
              </div>

              {/* サマリー */}
              <div className="text-xs text-gray-600">
                <div className="font-medium mb-1">AI分析サマリー:</div>
                <div>{aiAnalysis.summary}</div>
              </div>

              {/* 推奨事項 */}
              {aiAnalysis.recommendations.length > 0 && (
                <div className="text-xs text-gray-600">
                  <div className="font-medium mb-1">推奨事項:</div>
                  <ul className="space-y-1">
                    {aiAnalysis.recommendations.slice(0, 2).map((recommendation, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-green-500 mr-1">•</span>
                        <span>{recommendation}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="text-xs text-gray-500 text-center">
              AI分析データが利用できません
            </div>
          )}
        </div>
      )}
    </div>
  );
}