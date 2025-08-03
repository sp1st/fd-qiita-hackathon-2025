import { useState, useEffect } from 'react';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Chart.jsの登録
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

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

interface SmartwatchDataPanelProps {
  patientId: number;
  patientName: string;
}

export function SmartwatchDataPanel({ patientId, patientName }: SmartwatchDataPanelProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'exercise' | 'sleep' | 'vitals' | 'ai' | 'plan'>('overview');
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
          await fetchAIAnalysis(result.data);
        } else {
          console.log('API failed, using local dummy data');
          const localDummyData = generateLocalDummyData();
          setWeeklyData(localDummyData);
          await fetchAIAnalysis(localDummyData);
        }
      } catch (error) {
        console.error('データ取得エラー:', error);
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

  const getIntensityLabel = (intensity: string) => {
    switch (intensity) {
      case '低': return '低強度';
      case '中': return '中強度';
      case '高': return '高強度';
      default: return intensity;
    }
  };

  const getSleepQualityLabel = (quality: string) => {
    switch (quality) {
      case 'poor': return '不良';
      case 'fair': return '普通';
      case 'good': return '良好';
      case 'excellent': return '優秀';
      default: return '不明';
    }
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

  // グラフデータの準備
  const stepsChartData = {
    labels: weeklyData?.activity.map(d => d.date.slice(5)) || [],
    datasets: [{
      label: '歩数',
      data: weeklyData?.activity.map(d => d.steps) || [],
      borderColor: 'rgb(75, 192, 192)',
      backgroundColor: 'rgba(75, 192, 192, 0.2)',
      tension: 0.1,
    }],
  };

  const sleepChartData = {
    labels: weeklyData?.sleep.map(d => d.date.slice(5)) || [],
    datasets: [{
      label: '睡眠時間',
      data: weeklyData?.sleep.map(d => d.duration) || [],
      borderColor: 'rgb(255, 99, 132)',
      backgroundColor: 'rgba(255, 99, 132, 0.2)',
      tension: 0.1,
    }],
  };

  const bloodPressureChartData = {
    labels: weeklyData?.vitals.map(d => d.date.slice(5)) || [],
    datasets: [
      {
        label: '収縮期血圧',
        data: weeklyData?.vitals.map(d => d.bloodPressure.systolic) || [],
        borderColor: 'rgb(255, 159, 64)',
        backgroundColor: 'rgba(255, 159, 64, 0.2)',
        tension: 0.1,
      },
      {
        label: '拡張期血圧',
        data: weeklyData?.vitals.map(d => d.bloodPressure.diastolic) || [],
        borderColor: 'rgb(153, 102, 255)',
        backgroundColor: 'rgba(153, 102, 255, 0.2)',
        tension: 0.1,
      },
    ],
  };

  const exerciseChartData = {
    labels: weeklyData?.exercise.map(d => d.date.slice(5)) || [],
    datasets: [{
      label: '運動時間（分）',
      data: weeklyData?.exercise.map(d => d.duration) || [],
      backgroundColor: 'rgba(54, 162, 235, 0.8)',
    }],
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
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
        <nav className="-mb-px flex space-x-8 px-6">
          {[
            { id: 'overview', label: '概要' },
            { id: 'exercise', label: '運動' },
            { id: 'sleep', label: '睡眠' },
            { id: 'vitals', label: 'バイタル' },
            { id: 'ai', label: 'AI分析' },
            { id: 'plan', label: '療養計画' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
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
                  {weeklyData?.activity.reduce((sum, day) => sum + day.steps, 0) / selectedDays}
                </div>
                <div className="text-sm text-blue-600">平均歩数</div>
              </div>
              
              <div className="bg-green-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-green-700">
                  {weeklyData?.sleep.reduce((sum, day) => sum + day.duration, 0) / selectedDays}
                </div>
                <div className="text-sm text-green-600">平均睡眠時間</div>
              </div>
              
              <div className="bg-purple-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-purple-700">
                  {weeklyData?.exercise.filter(day => day.duration > 0).length}
                </div>
                <div className="text-sm text-purple-600">運動日数</div>
              </div>
              
              <div className="bg-orange-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-orange-700">
                  {weeklyData?.vitals.reduce((sum, day) => sum + day.heartRate, 0) / selectedDays}
                </div>
                <div className="text-sm text-orange-600">平均心拍数</div>
              </div>
            </div>

            {/* 歩数グラフ */}
            <div className="bg-white border rounded-lg p-4">
              <h4 className="text-lg font-medium text-gray-900 mb-4">歩数推移</h4>
              <div className="h-64">
                <Line data={stepsChartData} options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      beginAtZero: true,
                    },
                  },
                }} />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'exercise' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">運動データ</h3>
            
            {/* 運動グラフ */}
            <div className="bg-white border rounded-lg p-4">
              <h4 className="text-lg font-medium text-gray-900 mb-4">運動時間推移</h4>
              <div className="h-64">
                <Bar data={exerciseChartData} options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      beginAtZero: true,
                    },
                  },
                }} />
              </div>
            </div>

            {/* 運動詳細テーブル */}
            <div className="bg-white border rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h4 className="text-lg font-medium text-gray-900">運動詳細</h4>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">日付</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">運動種別</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">時間（分）</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">強度</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">消費カロリー</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {weeklyData?.exercise.map((day, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{day.date}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{day.type}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{day.duration}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{getIntensityLabel(day.intensity)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{day.caloriesBurned}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'sleep' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">睡眠データ</h3>
            
            {/* 睡眠グラフ */}
            <div className="bg-white border rounded-lg p-4">
              <h4 className="text-lg font-medium text-gray-900 mb-4">睡眠時間推移</h4>
              <div className="h-64">
                <Line data={sleepChartData} options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      beginAtZero: true,
                      max: 10,
                    },
                  },
                }} />
              </div>
            </div>

            {/* 睡眠詳細テーブル */}
            <div className="bg-white border rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h4 className="text-lg font-medium text-gray-900">睡眠詳細</h4>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">日付</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">睡眠時間</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">睡眠品質</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">深い睡眠</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">浅い睡眠</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">REM睡眠</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {weeklyData?.sleep.map((day, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{day.date}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{day.duration.toFixed(1)}時間</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{getSleepQualityLabel(day.quality)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{day.deepSleep.toFixed(1)}時間</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{day.lightSleep.toFixed(1)}時間</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{day.remSleep.toFixed(1)}時間</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'vitals' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">バイタルデータ</h3>
            
            {/* 血圧グラフ */}
            <div className="bg-white border rounded-lg p-4">
              <h4 className="text-lg font-medium text-gray-900 mb-4">血圧推移</h4>
              <div className="h-64">
                <Line data={bloodPressureChartData} options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      beginAtZero: true,
                    },
                  },
                }} />
              </div>
            </div>

            {/* バイタル詳細テーブル */}
            <div className="bg-white border rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h4 className="text-lg font-medium text-gray-900">バイタル詳細</h4>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">日付</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">心拍数</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">収縮期血圧</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">拡張期血圧</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">体温</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SpO2</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {weeklyData?.vitals.map((day, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{day.date}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{day.heartRate}回/分</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{day.bloodPressure.systolic}mmHg</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{day.bloodPressure.diastolic}mmHg</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{day.temperature.toFixed(1)}°C</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{day.oxygenSaturation}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'ai' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">AI分析</h3>
            
            {loadingAnalysis ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600">AI分析中...</span>
              </div>
            ) : aiAnalysis ? (
              <div className="space-y-6">
                {/* リスクレベル */}
                <div className="bg-white border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-lg font-medium text-gray-900">リスクレベル</h4>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRiskLevelColor(aiAnalysis.riskLevel)}`}>
                      {aiAnalysis.riskLevel === 'low' ? '低リスク' : aiAnalysis.riskLevel === 'medium' ? '中リスク' : '高リスク'}
                    </span>
                  </div>
                </div>

                {/* AI要約 */}
                <div className="bg-white border rounded-lg p-4">
                  <h4 className="text-lg font-medium text-gray-900 mb-3">AI要約</h4>
                  <p className="text-gray-700 leading-relaxed">{aiAnalysis.summary}</p>
                </div>

                {/* トレンド分析 */}
                <div className="bg-white border rounded-lg p-4">
                  <h4 className="text-lg font-medium text-gray-900 mb-3">トレンド分析</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <span className="text-sm font-medium text-gray-700">運動</span>
                      <span className={`text-sm font-medium ${getTrendColor(aiAnalysis.trends.exercise)}`}>
                        {aiAnalysis.trends.exercise}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <span className="text-sm font-medium text-gray-700">睡眠</span>
                      <span className={`text-sm font-medium ${getTrendColor(aiAnalysis.trends.sleep)}`}>
                        {aiAnalysis.trends.sleep}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <span className="text-sm font-medium text-gray-700">活動量</span>
                      <span className={`text-sm font-medium ${getTrendColor(aiAnalysis.trends.activity)}`}>
                        {aiAnalysis.trends.activity}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <span className="text-sm font-medium text-gray-700">バイタル</span>
                      <span className={`text-sm font-medium ${getTrendColor(aiAnalysis.trends.vitals)}`}>
                        {aiAnalysis.trends.vitals}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 推奨事項 */}
                <div className="bg-white border rounded-lg p-4">
                  <h4 className="text-lg font-medium text-gray-900 mb-3">推奨事項</h4>
                  <ul className="space-y-2">
                    {aiAnalysis.recommendations.map((recommendation, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-blue-600 mr-2">•</span>
                        <span className="text-gray-700">{recommendation}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                AI分析データがありません
              </div>
            )}
          </div>
        )}
        {activeTab === 'plan' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">療養計画</h3>
          </div>
        )}
      </div>
    </div>
  );
} 