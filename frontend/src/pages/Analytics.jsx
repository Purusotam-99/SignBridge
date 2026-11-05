// Purpose: Model Analytics page displaying evaluation metrics, confusion matrix, and distribution chart
import React, { useState, useEffect } from 'react';
import { Award, Target, Crosshair, CheckCircle2, RefreshCw } from 'lucide-react';
import PageContainer from '../components/layout/PageContainer';
import MetricCard from '../components/analytics/MetricCard';
import ConfusionMatrix from '../components/analytics/ConfusionMatrix';
import DistributionChart from '../components/analytics/DistributionChart';
import HistoryList from '../components/recognition/HistoryList';
import IconButton from '../components/common/IconButton';
import { getMetrics } from '../api/client';

export default function Analytics() {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const data = await getMetrics();
      setMetrics(data);
    } catch {
      setMetrics({ available: false });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  // Strict check: if unavailable or empty, isPending is true. NEVER fabricate numbers.
  const isAvailable = Boolean(metrics?.available && typeof metrics?.accuracy === 'number');
  const isPending = !isAvailable;

  const formatPct = (val) => {
    if (typeof val !== 'number') return '--';
    return `${Math.round(val * 1000) / 10}%`;
  };

  return (
    <PageContainer
      titleBlock={
        <div>
          <span className="text-[10px] font-bold tracking-widest text-indigo-600 uppercase bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full">
            MODEL METRICS
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-1">
            Machine Learning Evaluation Analytics
          </h1>
          <p className="text-xs text-slate-500">
            Offline test set benchmarks for the SignBridge Random Forest ISL classifier.
          </p>
        </div>
      }
      action={
        <IconButton
          icon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
          label="Refresh"
          variant="secondary"
          size="sm"
          onClick={fetchMetrics}
          disabled={loading}
          ariaLabel="Refresh evaluation metrics"
        />
      }
    >
      <div className="space-y-6">
        {/* Top 4 KPI Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Accuracy"
            value={formatPct(metrics?.accuracy)}
            description="Overall correct classification rate"
            icon={<Award className="w-4 h-4 text-emerald-600" />}
            isPending={isPending}
          />
          <MetricCard
            title="Macro Precision"
            value={formatPct(metrics?.macro_precision)}
            description="Average exactness across classes"
            icon={<Target className="w-4 h-4 text-indigo-600" />}
            isPending={isPending}
          />
          <MetricCard
            title="Macro Recall"
            value={formatPct(metrics?.macro_recall)}
            description="Average sensitivity across signs"
            icon={<Crosshair className="w-4 h-4 text-sky-600" />}
            isPending={isPending}
          />
          <MetricCard
            title="Macro F1-Score"
            value={formatPct(metrics?.macro_f1)}
            description="Harmonic balance of precision & recall"
            icon={<CheckCircle2 className="w-4 h-4 text-purple-600" />}
            isPending={isPending}
          />
        </div>

        {/* Confusion Matrix and Distribution Chart Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          <div className="lg:col-span-6">
            <ConfusionMatrix
              matrix={metrics?.confusion_matrix}
              labels={metrics?.classes || metrics?.labels}
              isPending={isPending}
            />
          </div>

          <div className="lg:col-span-6">
            <DistributionChart
              classReport={metrics?.classification_report}
              isPending={isPending}
            />
          </div>
        </div>

        {/* Recognition History Table/List */}
        <div className="w-full">
          <HistoryList />
        </div>
      </div>
    </PageContainer>
  );
}
