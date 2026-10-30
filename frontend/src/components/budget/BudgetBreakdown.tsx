import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Wallet,
  AlertTriangle,
  Users,
  CheckCircle2,
  Info,
  DollarSign
} from 'lucide-react';
import { BudgetSummary } from '../../types';
import { formatCurrency } from '../../utils/formatters';

interface BudgetBreakdownProps {
  budget: BudgetSummary;
}

const CATEGORY_COLORS: Record<string, string> = {
  Accommodation: '#10b981', // emerald
  Food: '#f59e0b',          // amber
  Transportation: '#a855f7',// purple
  Activities: '#06b6d4',    // cyan
  Miscellaneous: '#64748b', // slate
};

export const BudgetBreakdown: React.FC<BudgetBreakdownProps> = ({ budget }) => {
  const chartData = Object.entries(budget.categories || {})
    .filter(([_, cat]) => cat.estimated_cost > 0)
    .map(([name, cat]) => ({
      name,
      value: cat.estimated_cost,
      percentage: cat.percentage_of_total,
      color: CATEGORY_COLORS[name] || '#94a3b8',
    }));

  const budgetUsedPercentage =
    budget.planned_budget > 0
      ? Math.min(100, Math.round((budget.total_estimated_cost / budget.planned_budget) * 100))
      : 100;

  return (
    <div className="space-y-6">
      {/* Over-budget Warning Banner */}
      {budget.is_over_budget && (
        <div className="p-4 sm:p-5 rounded-2xl bg-rose-950/40 border border-rose-500/40 text-rose-200 flex items-start gap-3 animate-in fade-in">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-sm text-white">Estimated Expenses Exceed Budget</h4>
            {budget.warnings.map((w, idx) => (
              <p key={idx} className="text-xs text-rose-300 leading-relaxed">
                {w}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Primary 4 Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="glass-card rounded-2xl p-4 sm:p-5 border border-slate-800">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Planned Budget
          </span>
          <span className="text-lg sm:text-xl font-bold text-white">
            {formatCurrency(budget.planned_budget, budget.currency)}
          </span>
          <span className="text-[11px] text-slate-500 block mt-1">User target</span>
        </div>

        <div className="glass-card rounded-2xl p-4 sm:p-5 border border-slate-800">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Estimated Total
          </span>
          <span
            className={`text-lg sm:text-xl font-bold ${
              budget.is_over_budget ? 'text-rose-400' : 'text-amber-400'
            }`}
          >
            {formatCurrency(budget.total_estimated_cost, budget.currency)}
          </span>
          <span className="text-[11px] text-slate-500 block mt-1">Authoritative sum</span>
        </div>

        <div className="glass-card rounded-2xl p-4 sm:p-5 border border-slate-800">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            {budget.is_over_budget ? 'Over Budget' : 'Remaining'}
          </span>
          <span
            className={`text-lg sm:text-xl font-bold ${
              budget.is_over_budget ? 'text-rose-400' : 'text-emerald-400'
            }`}
          >
            {budget.is_over_budget
              ? `+${formatCurrency(budget.over_budget_amount, budget.currency)}`
              : formatCurrency(budget.remaining_budget, budget.currency)}
          </span>
          <span className="text-[11px] text-slate-500 block mt-1">
            {budget.is_over_budget ? 'Exceeds budget limit' : 'Under planned limit'}
          </span>
        </div>

        <div className="glass-card rounded-2xl p-4 sm:p-5 border border-slate-800">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Cost Per Traveler
          </span>
          <span className="text-lg sm:text-xl font-bold text-cyan-300">
            {formatCurrency(budget.cost_per_traveler, budget.currency)}
          </span>
          <span className="text-[11px] text-slate-500 block mt-1">
            For {budget.traveler_count} {budget.traveler_count === 1 ? 'person' : 'people'}
          </span>
        </div>
      </div>

      {/* Progress Bar of Budget Utilization */}
      <div className="glass-card rounded-2xl p-5 border border-slate-800 space-y-2">
        <div className="flex items-center justify-between text-xs font-medium">
          <span className="text-slate-300">Budget Utilization</span>
          <span className={budget.is_over_budget ? 'text-rose-400 font-bold' : 'text-slate-300'}>
            {formatCurrency(budget.total_estimated_cost, budget.currency)} of{' '}
            {formatCurrency(budget.planned_budget, budget.currency)} ({budgetUsedPercentage}%)
          </span>
        </div>
        <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              budget.is_over_budget
                ? 'bg-rose-500'
                : budgetUsedPercentage > 85
                ? 'bg-amber-500'
                : 'bg-emerald-500'
            }`}
            style={{ width: `${Math.min(100, budgetUsedPercentage)}%` }}
          />
        </div>
      </div>

      {/* Categories Breakdown & Chart Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category Table */}
        <div className="lg:col-span-2 glass-card rounded-2xl p-6 border border-slate-800">
          <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
            Category Breakdown
          </h4>
          <div className="space-y-3">
            {Object.entries(budget.categories || {}).map(([catName, cat]) => {
              const color = CATEGORY_COLORS[catName] || '#94a3b8';
              return (
                <div
                  key={catName}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: color }}
                    />
                    <div>
                      <span className="font-semibold text-slate-200 block">{catName}</span>
                      <span className="text-[10px] text-slate-500">
                        {cat.item_count} {cat.item_count === 1 ? 'item' : 'items'}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-bold text-white block">
                      {formatCurrency(cat.estimated_cost, budget.currency)}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {cat.percentage_of_total.toFixed(1)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Visual Chart */}
        <div className="glass-card rounded-2xl p-6 border border-slate-800 flex flex-col items-center justify-center">
          <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-2 self-start">
            Visual Allocation
          </h4>
          {chartData.length > 0 ? (
            <div className="w-full h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any) => [formatCurrency(Number(value), budget.currency), 'Estimated']}
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '0.75rem',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-56 flex items-center justify-center text-xs text-slate-500">
              No estimated expenses yet
            </div>
          )}

          <p className="text-[11px] text-slate-500 text-center leading-tight mt-2 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>Deterministic backend calculations</span>
          </p>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 text-[11px] text-slate-400 leading-relaxed">
        {budget.disclaimer}
      </div>
    </div>
  );
};
