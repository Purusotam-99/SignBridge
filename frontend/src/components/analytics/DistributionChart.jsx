// Purpose: Prediction distribution bar chart visualization using Recharts
import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { BarChart3, AlertCircle } from 'lucide-react';
import Card from '../common/Card';
import { SUPPORTED_LETTERS } from '../../config/constants';

export default function DistributionChart({
  classReport = null,
  isPending = false
}) {
  const chartData = SUPPORTED_LETTERS.map((cls) => {
    const stats = (classReport && (classReport[cls] || classReport[`Sign ${cls}`])) || null;
    return {
      name: `Sign ${cls}`,
      Precision: stats ? Math.round(((stats.precision ?? 0)) * 100) : 0,
      Recall: stats ? Math.round(((stats.recall ?? 0)) * 100) : 0,
      F1: stats ? Math.round(((stats['f1-score'] ?? stats.f1 ?? stats.f1_score ?? 0)) * 100) : 0
    };
  });

  const hasData = Boolean(classReport && Object.keys(classReport).length > 0);

  return (
    <Card
      title="Class Performance Distribution"
      subtitle="Precision, Recall, and F1-Score per category (A, B, C)"
      icon={<BarChart3 className="w-4 h-4 text-slate-600" />}
      bodyClassName="p-4 sm:p-5"
    >
      {isPending || !hasData ? (
        <div className="flex flex-col items-center justify-center py-8 text-center bg-slate-50/70 border border-dashed border-slate-200 rounded-xl p-6">
          <AlertCircle className="w-6 h-6 text-amber-500 mb-2" />
          <h4 className="text-sm font-semibold text-slate-800">Evaluation pending</h4>
          <p className="text-xs text-slate-500 max-w-xs mt-1">
            Performance charts will appear once evaluation metrics are generated from verified test data.
          </p>
        </div>
      ) : (
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: '#64748b' }}
                axisLine={{ stroke: '#e2e8f0' }}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fontSize: 11, fill: '#64748b' }}
                axisLine={{ stroke: '#e2e8f0' }}
                unit="%"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderColor: '#e2e8f0',
                  borderRadius: '8px',
                  fontSize: '12px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                }}
                formatter={(val) => [`${val}%`, '']}
              />
              <Legend
                wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
              />
              <Bar dataKey="Precision" fill="#6366f1" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Recall" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
              <Bar dataKey="F1" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}
