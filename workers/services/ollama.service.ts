import type { LibSQLDatabase } from 'drizzle-orm/libsql';
import type { DrizzleD1Database } from 'drizzle-orm/d1';

type Database = LibSQLDatabase | DrizzleD1Database<any>;

export interface WeeklySmartwatchData {
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

export interface AIAnalysis {
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

export class OllamaService {
  // スマートウォッチデータの要約・分析
  static async analyzeSmartwatchData(data: WeeklySmartwatchData): Promise<AIAnalysis> {
    // TODO: 実際のOllama API連携
    // 現在はダミーの分析結果を返す
    
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
  }
  
  // 期間指定可能なダミーデータ生成
  static generateWeeklyDummyData(days: number = 7): WeeklySmartwatchData {
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
    
    for (let i = days - 1; i >= 0; i--) {
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
  }
} 