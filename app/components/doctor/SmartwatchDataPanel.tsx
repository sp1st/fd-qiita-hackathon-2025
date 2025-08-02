import { useState } from 'react';

interface SmartwatchData {
  patientId: number;
  date: string;
  exercise: {
    type: string;
    duration: number; // 分
    frequency: number; // 週あたり
    intensity: 'low' | 'medium' | 'high';
    dailyActivity: number; // 歩数
  };
  sleep: {
    quality: 'poor' | 'fair' | 'good' | 'excellent';
    duration: number; // 時間
    deepSleep: number; // 時間
    lightSleep: number; // 時間
  };
  vitalSigns: {
    bloodPressure: {
      systolic: number; // 収縮期血圧
      diastolic: number; // 拡張期血圧
    };
    heartRate: {
      resting: number;
      average: number;
      max: number;
    };
  };
  aiFeedback: {
    summary: string;
    recommendations: string[];
    riskLevel: 'low' | 'medium' | 'high';
  };
}

interface SmartwatchDataPanelProps {
  patientId: number;
  patientName: string;
}

export function SmartwatchDataPanel({ patientId, patientName }: SmartwatchDataPanelProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'exercise' | 'sleep' | 'vitals' | 'ai'>('overview');

  // ダミーデータ
  const smartwatchData: SmartwatchData = {
    patientId,
    date: new Date().toISOString().split('T')[0],
    exercise: {
      type: 'ウォーキング',
      duration: 30,
      frequency: 5,
      intensity: 'medium',
      dailyActivity: 8500,
    },
    sleep: {
      quality: 'good',
      duration: 7.5,
      deepSleep: 2.0,
      lightSleep: 5.5,
    },
    vitalSigns: {
      bloodPressure: {
        systolic: 125,
        diastolic: 80,
      },
      heartRate: {
        resting: 65,
        average: 72,
        max: 140,
      },
    },
    aiFeedback: {
      summary: '運動習慣が良好で、睡眠も十分取れています。血圧は正常範囲内です。',
      recommendations: [
        '現在の運動習慣を継続してください',
        '睡眠時間を8時間に延長することを検討してください',
        '血圧の定期的なモニタリングを継続してください',
      ],
      riskLevel: 'low',
    },
  };

  const getIntensityLabel = (intensity: string) => {
    switch (intensity) {
      case 'low': return '低強度';
      case 'medium': return '中強度';
      case 'high': return '高強度';
      default: return '不明';
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

  const tabs = [
    { id: 'overview' as const, name: '概要', icon: '📊' },
    { id: 'exercise' as const, name: '運動', icon: '🏃' },
    { id: 'sleep' as const, name: '睡眠', icon: '😴' },
    { id: 'vitals' as const, name: 'バイタル', icon: '❤️' },
    { id: 'ai' as const, name: 'AI分析', icon: '🤖' },
  ];

  return (
    <div className="bg-white rounded-lg shadow">
      {/* ヘッダー */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {patientName}さんのスマートウォッチデータ
            </h3>
            <p className="text-sm text-gray-500">
              最終更新: {new Date(smartwatchData.date).toLocaleDateString('ja-JP')}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-500">データソース:</span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              Fitbit
            </span>
          </div>
        </div>
      </div>

      {/* タブナビゲーション */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-3 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <span className="text-lg">{tab.icon}</span>
                <span>{tab.name}</span>
              </div>
            </button>
          ))}
        </nav>
      </div>

      {/* タブコンテンツ */}
      <div className="p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* 概要カード */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="bg-blue-100 rounded-lg p-2">
                    <span className="text-xl">🏃</span>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-blue-900">運動</p>
                    <p className="text-lg font-semibold text-blue-700">
                      {smartwatchData.exercise.dailyActivity.toLocaleString()}歩
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="bg-green-100 rounded-lg p-2">
                    <span className="text-xl">😴</span>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-green-900">睡眠</p>
                    <p className="text-lg font-semibold text-green-700">
                      {smartwatchData.sleep.duration}時間
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-red-50 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="bg-red-100 rounded-lg p-2">
                    <span className="text-xl">❤️</span>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-red-900">血圧</p>
                    <p className="text-lg font-semibold text-red-700">
                      {smartwatchData.vitalSigns.bloodPressure.systolic}/{smartwatchData.vitalSigns.bloodPressure.diastolic}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* AI分析サマリー */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">AI分析サマリー</h4>
              <p className="text-sm text-gray-700">{smartwatchData.aiFeedback.summary}</p>
              <div className="mt-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRiskLevelColor(smartwatchData.aiFeedback.riskLevel)}`}>
                  リスクレベル: {smartwatchData.aiFeedback.riskLevel === 'low' ? '低' : smartwatchData.aiFeedback.riskLevel === 'medium' ? '中' : '高'}
                </span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'exercise' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">運動データ</h4>
                <dl className="space-y-2">
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-500">運動種類</dt>
                    <dd className="text-sm font-medium">{smartwatchData.exercise.type}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-500">運動時間</dt>
                    <dd className="text-sm font-medium">{smartwatchData.exercise.duration}分</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-500">頻度</dt>
                    <dd className="text-sm font-medium">週{smartwatchData.exercise.frequency}回</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-500">強度</dt>
                    <dd className="text-sm font-medium">{getIntensityLabel(smartwatchData.exercise.intensity)}</dd>
                  </div>
                </dl>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">活動量</h4>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">
                    {smartwatchData.exercise.dailyActivity.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-500">歩数/日</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'sleep' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">睡眠データ</h4>
                <dl className="space-y-2">
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-500">総睡眠時間</dt>
                    <dd className="text-sm font-medium">{smartwatchData.sleep.duration}時間</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-500">深い睡眠</dt>
                    <dd className="text-sm font-medium">{smartwatchData.sleep.deepSleep}時間</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-500">浅い睡眠</dt>
                    <dd className="text-sm font-medium">{smartwatchData.sleep.lightSleep}時間</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-500">睡眠の質</dt>
                    <dd className="text-sm font-medium">{getSleepQualityLabel(smartwatchData.sleep.quality)}</dd>
                  </div>
                </dl>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">睡眠分析</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">深い睡眠率</span>
                    <span className="text-sm font-medium">
                      {Math.round((smartwatchData.sleep.deepSleep / smartwatchData.sleep.duration) * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${(smartwatchData.sleep.deepSleep / smartwatchData.sleep.duration) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'vitals' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">血圧</h4>
                <div className="text-center">
                  <div className="text-3xl font-bold text-red-600">
                    {smartwatchData.vitalSigns.bloodPressure.systolic}/{smartwatchData.vitalSigns.bloodPressure.diastolic}
                  </div>
                  <div className="text-sm text-gray-500">mmHg</div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">心拍数</h4>
                <dl className="space-y-2">
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-500">安静時</dt>
                    <dd className="text-sm font-medium">{smartwatchData.vitalSigns.heartRate.resting} bpm</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-500">平均</dt>
                    <dd className="text-sm font-medium">{smartwatchData.vitalSigns.heartRate.average} bpm</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm text-gray-500">最大</dt>
                    <dd className="text-sm font-medium">{smartwatchData.vitalSigns.heartRate.max} bpm</dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'ai' && (
          <div className="space-y-4">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">AI分析結果</h4>
              <p className="text-sm text-gray-700 mb-4">{smartwatchData.aiFeedback.summary}</p>
              
              <div className="mb-4">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRiskLevelColor(smartwatchData.aiFeedback.riskLevel)}`}>
                  リスクレベル: {smartwatchData.aiFeedback.riskLevel === 'low' ? '低' : smartwatchData.aiFeedback.riskLevel === 'medium' ? '中' : '高'}
                </span>
              </div>

              <div>
                <h5 className="text-sm font-medium text-gray-900 mb-2">推奨事項</h5>
                <ul className="space-y-1">
                  {smartwatchData.aiFeedback.recommendations.map((recommendation, index) => (
                    <li key={index} className="text-sm text-gray-700 flex items-start">
                      <span className="text-blue-500 mr-2">•</span>
                      {recommendation}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 