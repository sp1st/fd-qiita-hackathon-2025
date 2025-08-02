import React, { useState, useEffect } from 'react';
// import { useAuth } from '../contexts/AuthContext';

interface SmartwatchData {
  exercise?: {
    type?: string;
    duration?: number;
    frequency?: number;
    intensity?: string;
    caloriesBurned?: number;
  };
  sleep?: {
    duration?: number;
    quality?: string;
    deepSleep?: number;
    lightSleep?: number;
    remSleep?: number;
  };
  activity?: {
    steps?: number;
    distance?: number;
    activeMinutes?: number;
    caloriesBurned?: number;
  };
  vitals?: {
    heartRate?: number;
    bloodPressure?: {
      systolic?: number;
      diastolic?: number;
    };
    temperature?: number;
    oxygenSaturation?: number;
  };
  otherMetrics?: {
    stressLevel?: number;
    caloriesConsumed?: number;
    weight?: number;
    bodyFatPercentage?: number;
  };
}

interface SmartwatchDataRecord {
  id: number;
  patientId: number;
  deviceType: string;
  deviceId?: string;
  dataType: string;
  data: string;
  recordedAt: string;
  syncedAt: string;
  createdAt: string;
}

const SmartwatchDataPanel: React.FC = () => {
  // const { user } = useAuth();
  const [smartwatchData, setSmartwatchData] = useState<SmartwatchDataRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [dataType, setDataType] = useState<string>('');

  useEffect(() => {
    fetchSmartwatchData();
  }, [selectedDate, dataType]);

  const fetchSmartwatchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('accessToken');
      if (!token) {
        setError('認証が必要です');
        return;
      }

      let url = '/api/smartwatch/data';
      const params = new URLSearchParams();
      if (selectedDate) {
        params.append('startDate', selectedDate);
        params.append('endDate', selectedDate);
      }
      if (dataType) {
        params.append('dataType', dataType);
      }
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const result = await response.json() as { data: SmartwatchDataRecord[] };
        setSmartwatchData(result.data || []);
      } else {
        setError('データの取得に失敗しました');
      }
    } catch (err) {
      console.error('Error fetching smartwatch data:', err);
      setError('データの取得中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const generateDummyData = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setError('認証が必要です');
        return;
      }

      const response = await fetch('/api/smartwatch/dummy-data', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          deviceType: 'fitbit',
          dataType: 'comprehensive',
        }),
      });

      if (response.ok) {
        fetchSmartwatchData(); // データを再取得
      } else {
        setError('ダミーデータの生成に失敗しました');
      }
    } catch (err) {
      console.error('Error generating dummy data:', err);
      setError('ダミーデータの生成中にエラーが発生しました');
    }
  };

  const renderDataCard = (record: SmartwatchDataRecord) => {
    const data: SmartwatchData = JSON.parse(record.data);
    
    return (
      <div key={record.id} className="bg-white rounded-lg shadow p-6 mb-4">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold">
              {new Date(record.recordedAt).toLocaleDateString('ja-JP')} {new Date(record.recordedAt).toLocaleTimeString('ja-JP')}
            </h3>
            <p className="text-gray-600">デバイス: {record.deviceType} ({record.dataType})</p>
          </div>
          <span className="text-sm text-gray-500">
            {new Date(record.syncedAt).toLocaleString('ja-JP')}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* 運動データ */}
          {data.exercise && (
            <div className="bg-blue-50 p-4 rounded">
              <h4 className="font-medium text-blue-800 mb-2">運動データ</h4>
              <div className="space-y-1 text-sm">
                {data.exercise.type && <p>種類: {data.exercise.type}</p>}
                {data.exercise.duration && <p>時間: {data.exercise.duration}分</p>}
                {data.exercise.intensity && <p>強度: {data.exercise.intensity}</p>}
                {data.exercise.caloriesBurned && <p>消費カロリー: {data.exercise.caloriesBurned}kcal</p>}
              </div>
            </div>
          )}

          {/* 睡眠データ */}
          {data.sleep && (
            <div className="bg-purple-50 p-4 rounded">
              <h4 className="font-medium text-purple-800 mb-2">睡眠データ</h4>
              <div className="space-y-1 text-sm">
                {data.sleep.duration && <p>睡眠時間: {data.sleep.duration}時間</p>}
                {data.sleep.quality && <p>睡眠の質: {data.sleep.quality}/5</p>}
                {data.sleep.deepSleep && <p>深い睡眠: {data.sleep.deepSleep}分</p>}
                {data.sleep.lightSleep && <p>浅い睡眠: {data.sleep.lightSleep}分</p>}
                {data.sleep.remSleep && <p>REM睡眠: {data.sleep.remSleep}分</p>}
              </div>
            </div>
          )}

          {/* 活動データ */}
          {data.activity && (
            <div className="bg-green-50 p-4 rounded">
              <h4 className="font-medium text-green-800 mb-2">活動データ</h4>
              <div className="space-y-1 text-sm">
                {data.activity.steps && <p>歩数: {data.activity.steps.toLocaleString()}歩</p>}
                {data.activity.distance && <p>距離: {data.activity.distance}km</p>}
                {data.activity.activeMinutes && <p>アクティブ時間: {data.activity.activeMinutes}分</p>}
                {data.activity.caloriesBurned && <p>消費カロリー: {data.activity.caloriesBurned}kcal</p>}
              </div>
            </div>
          )}

          {/* バイタルデータ */}
          {data.vitals && (
            <div className="bg-red-50 p-4 rounded">
              <h4 className="font-medium text-red-800 mb-2">バイタルデータ</h4>
              <div className="space-y-1 text-sm">
                {data.vitals.heartRate && <p>心拍数: {data.vitals.heartRate}bpm</p>}
                {data.vitals.bloodPressure && (
                  <p>血圧: {data.vitals.bloodPressure.systolic}/{data.vitals.bloodPressure.diastolic}mmHg</p>
                )}
                {data.vitals.temperature && <p>体温: {data.vitals.temperature}°C</p>}
                {data.vitals.oxygenSaturation && <p>血中酸素飽和度: {data.vitals.oxygenSaturation}%</p>}
              </div>
            </div>
          )}

          {/* その他の指標 */}
          {data.otherMetrics && (
            <div className="bg-yellow-50 p-4 rounded">
              <h4 className="font-medium text-yellow-800 mb-2">その他の指標</h4>
              <div className="space-y-1 text-sm">
                {data.otherMetrics.stressLevel && <p>ストレスレベル: {data.otherMetrics.stressLevel}/10</p>}
                {data.otherMetrics.caloriesConsumed && <p>摂取カロリー: {data.otherMetrics.caloriesConsumed}kcal</p>}
                {data.otherMetrics.weight && <p>体重: {data.otherMetrics.weight}kg</p>}
                {data.otherMetrics.bodyFatPercentage && <p>体脂肪率: {data.otherMetrics.bodyFatPercentage}%</p>}
              </div>
            </div>
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
        <h2 className="text-xl font-semibold">スマートウォッチデータ</h2>
        <button
          onClick={generateDummyData}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
        >
          ダミーデータ生成
        </button>
      </div>

      {/* フィルター */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            日付
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            データタイプ
          </label>
          <select
            value={dataType}
            onChange={(e) => setDataType(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">すべて</option>
            <option value="exercise">運動</option>
            <option value="sleep">睡眠</option>
            <option value="activity">活動</option>
            <option value="vitals">バイタル</option>
            <option value="comprehensive">総合</option>
          </select>
        </div>
        <div className="flex items-end">
          <button
            onClick={() => {
              setSelectedDate('');
              setDataType('');
            }}
            className="w-full bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors"
          >
            フィルタークリア
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {smartwatchData.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">スマートウォッチデータがありません</p>
          <p className="text-sm text-gray-400 mt-2">
            ダミーデータ生成ボタンをクリックしてテストデータを作成してください
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {smartwatchData.map(renderDataCard)}
        </div>
      )}
    </div>
  );
};

export default SmartwatchDataPanel; 