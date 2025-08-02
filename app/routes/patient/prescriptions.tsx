import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { getAuthToken } from '../../utils/auth';

export function meta() {
  return [
    { title: '処方箋履歴 - オンライン診療システム' },
    { name: 'description', content: '患者の処方箋履歴' },
  ];
}

interface Prescription {
  id: number;
  issuedAt: string;
  doctorName: string;
  status: string;
  medications: Array<{
    name: string;
    quantity: string;
    dosage: string;
    instructions?: string;
  }>;
  pharmacyNotes?: string;
}

export default function PatientPrescriptions() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [_isLoading, setIsLoading] = useState(true);
  const [_error, setError] = useState('');

  useEffect(() => {
    const fetchPrescriptions = async () => {
      const token = getAuthToken();
      if (!token) {
        setError('認証エラー: ログインしてください');
        return;
      }

      try {
        const response = await fetch('/api/patient/prescriptions', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json() as { prescriptions: Prescription[] };
          setPrescriptions(data.prescriptions || []);
        } else {
          setError('処方箋の取得に失敗しました');
        }
      } catch (err) {
        console.error('Error fetching prescriptions:', err);
        setError('処方箋の取得中にエラーが発生しました');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPrescriptions();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">処方箋履歴</h1>
        
        {prescriptions.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <p className="text-gray-500">処方箋の履歴がありません</p>
          </div>
        ) : (
          <div className="space-y-4">
            {prescriptions.map((prescription: any) => (
              <div key={prescription.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">
                      処方日: {new Date(prescription.issuedAt).toLocaleDateString('ja-JP')}
                    </h3>
                    <p className="text-gray-600">医師: {prescription.doctorName}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm ${
                    prescription.status === 'issued' ? 'bg-green-100 text-green-800' :
                    prescription.status === 'dispensed' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {prescription.status === 'issued' ? '発行済み' :
                     prescription.status === 'dispensed' ? '調剤済み' :
                     prescription.status}
                  </span>
                </div>
                
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-2">処方薬</h4>
                  <div className="space-y-2">
                    {prescription.medications.map((med: any, index: number) => (
                      <div key={index} className="bg-gray-50 p-3 rounded">
                        <div className="flex justify-between">
                          <span className="font-medium">{med.name}</span>
                          <span className="text-gray-600">{med.quantity}</span>
                        </div>
                        <p className="text-sm text-gray-600">{med.dosage}</p>
                        {med.instructions && (
                          <p className="text-sm text-gray-500 mt-1">{med.instructions}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                
                {prescription.pharmacyNotes && (
                  <div className="mt-4 p-3 bg-yellow-50 rounded">
                    <p className="text-sm">薬局への注意事項: {prescription.pharmacyNotes}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        
        <div className="mt-8">
          <Link
            to="/patient"
            className="text-blue-600 hover:text-blue-800"
          >
            ← ホームに戻る
          </Link>
        </div>
      </div>
    </div>
  );
}