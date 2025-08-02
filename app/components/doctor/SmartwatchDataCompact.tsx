import { useState } from 'react';

interface SmartwatchData {
  patientId: number;
  date: string;
  exercise: {
    dailyActivity: number; // 歩数
  };
  sleep: {
    duration: number; // 時間
    quality: 'poor' | 'fair' | 'good' | 'excellent';
  };
  vitalSigns: {
    bloodPressure: {
      systolic: number;
      diastolic: number;
    };
    heartRate: {
      resting: number;
    };
  };
  aiFeedback: {
    summary: string;
    riskLevel: 'low' | 'medium' | 'high';
  };
}

interface SmartwatchDataCompactProps {
  patientId: number;
  patientName: string;
}

export function SmartwatchDataCompact({ patientId, patientName }: SmartwatchDataCompactProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // ダミーデータ
  const smartwatchData: SmartwatchData = {
    patientId,
    date: new Date().toISOString().split('T')[0],
    exercise: {
      dailyActivity: 8500,
    },
    sleep: {
      duration: 7.5,
      quality: 'good',
    },
    vitalSigns: {
      bloodPressure: {
        systolic: 125,
        diastolic: 80,
      },
      heartRate: {
        resting: 65,
      },
    },
    aiFeedback: {
      summary: '運動習慣が良好で、睡眠も十分取れています。血圧は正常範囲内です。',
      riskLevel: 'low',
    },
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

  return (
    <div className="space-y-3">
      {/* 概要カード */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-blue-50 rounded-lg p-3 text-center">
          <div className="text-lg font-bold text-blue-700">
            {smartwatchData.exercise.dailyActivity.toLocaleString()}
          </div>
          <div className="text-xs text-blue-600">歩数</div>
        </div>

        <div className="bg-green-50 rounded-lg p-3 text-center">
          <div className="text-lg font-bold text-green-700">
            {smartwatchData.sleep.duration}
          </div>
          <div className="text-xs text-green-600">睡眠時間</div>
        </div>

        <div className="bg-red-50 rounded-lg p-3 text-center">
          <div className="text-lg font-bold text-red-700">
            {smartwatchData.vitalSigns.bloodPressure.systolic}/{smartwatchData.vitalSigns.bloodPressure.diastolic}
          </div>
          <div className="text-xs text-red-600">血圧</div>
        </div>
      </div>

      {/* リスクレベル */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">AI分析:</span>
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getRiskLevelColor(smartwatchData.aiFeedback.riskLevel)}`}>
          リスク: {smartwatchData.aiFeedback.riskLevel === 'low' ? '低' : smartwatchData.aiFeedback.riskLevel === 'medium' ? '中' : '高'}
        </span>
      </div>

      {/* 詳細表示ボタン */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full text-xs text-blue-600 hover:text-blue-700 flex items-center justify-center gap-1"
      >
        {isExpanded ? '詳細を隠す' : '詳細を表示'}
        <svg
          className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* 詳細情報 */}
      {isExpanded && (
        <div className="space-y-3 pt-3 border-t border-gray-200">
          <div className="text-xs text-gray-700">
            <div className="font-medium mb-1">睡眠の質:</div>
            <div className="text-gray-600">{getSleepQualityLabel(smartwatchData.sleep.quality)}</div>
          </div>

          <div className="text-xs text-gray-700">
            <div className="font-medium mb-1">安静時心拍数:</div>
            <div className="text-gray-600">{smartwatchData.vitalSigns.heartRate.resting} bpm</div>
          </div>

          <div className="text-xs text-gray-700">
            <div className="font-medium mb-1">AI分析サマリー:</div>
            <div className="text-gray-600">{smartwatchData.aiFeedback.summary}</div>
          </div>

          <div className="text-xs text-gray-500">
            最終更新: {new Date(smartwatchData.date).toLocaleDateString('ja-JP')}
          </div>
        </div>
      )}
    </div>
  );
} 