'use client';

import React, { useState } from 'react';
import {
  WinterArcGoalStandard,
  WinterArcPrintStyle,
  computeWinterArcGoalProgress,
} from '@/lib/winter-arc-engine';
import {
  Plus,
  Trash2,
  TrendingUp,
  CheckCircle2,
  Target,
  Edit2,
  Sparkles,
  Zap,
} from 'lucide-react';

interface WinterArcMeasurableGoalsAnalysisProps {
  standards: WinterArcGoalStandard[];
  printStyle?: WinterArcPrintStyle;
  onUpdateGoalCurrent?: (goalId: string, delta: number) => void;
  onSetGoalCurrent?: (goalId: string, value: number) => void;
  onDeleteGoal?: (goalId: string) => void;
  onAddGoal?: (goal: WinterArcGoalStandard) => void;
  onResetGoals?: () => void;
}

export const WinterArcMeasurableGoalsAnalysis: React.FC<WinterArcMeasurableGoalsAnalysisProps> = ({
  standards,
  printStyle = 'blank_paper_pen',
  onUpdateGoalCurrent,
  onSetGoalCurrent,
  onDeleteGoal,
  onAddGoal,
  onResetGoals,
}) => {
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newGoal, setNewGoal] = useState<Partial<WinterArcGoalStandard>>({
    name: '',
    category: 'Physical Training',
    startingBaseline: '',
    targetStandard: '',
    currentStatus: '',
    baselineNum: 0,
    currentNum: 0,
    targetNum: 100,
    unit: 'units',
    notes: '',
  });

  // Calculate overall metrics
  const totalGoals = standards.length;
  const achievedGoals = standards.filter((g) => computeWinterArcGoalProgress(g) >= 100).length;
  const aggregateProgress =
    totalGoals > 0
      ? Math.round(
          standards.reduce((acc, g) => acc + computeWinterArcGoalProgress(g), 0) / totalGoals
        )
      : 0;

  const handleCreateGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoal.name) return;

    const bNum = Number(newGoal.baselineNum) || 0;
    const cNum = Number(newGoal.currentNum) || 0;
    const tNum = Number(newGoal.targetNum) || 100;
    const unit = newGoal.unit || 'units';

    const created: WinterArcGoalStandard = {
      id: `wa-std-${Date.now()}`,
      name: newGoal.name,
      category: (newGoal.category || 'Physical Training') as any,
      startingBaseline: newGoal.startingBaseline || `${bNum} ${unit}`,
      targetStandard: newGoal.targetStandard || `${tNum} ${unit}`,
      currentStatus: newGoal.currentStatus || `${cNum} ${unit}`,
      percentAccomplished: 0,
      baselineNum: bNum,
      currentNum: cNum,
      targetNum: tNum,
      unit: unit,
      notes: newGoal.notes || '',
    };

    created.percentAccomplished = computeWinterArcGoalProgress(created);

    if (onAddGoal) {
      onAddGoal(created);
    }
    setShowAddModal(false);
    setNewGoal({
      name: '',
      category: 'Physical Training',
      startingBaseline: '',
      targetStandard: '',
      currentStatus: '',
      baselineNum: 0,
      currentNum: 0,
      targetNum: 100,
      unit: 'units',
      notes: '',
    });
  };

  return (
    <section className="border-4 border-black bg-white shadow-[6px_6px_0px_#000000] overflow-hidden print:shadow-none print:border-2 print:border-black">
      
      {/* 1. Header Bar with Badge 03 */}
      <div className="border-b-2 border-black bg-[#fafaf8] p-4 flex flex-wrap items-center justify-between gap-3 print:bg-white print:p-2">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 border-2 border-black bg-black text-[#ccff00] flex items-center justify-center font-mono font-black text-sm">
            03
          </div>
          <div>
            <h3 className="font-mono text-sm sm:text-base font-black text-black uppercase tracking-tight flex items-center gap-2">
              <span>MEASURABLE TARGETS &amp; GOALS ANALYSIS (%)</span>
              <span className="text-[10px] bg-[#ccff00] text-black px-1.5 py-0.5 border border-black font-bold hidden sm:inline-block">
                90-DAY PROTOCOL
              </span>
            </h3>
            <div className="font-mono text-[11px] text-zinc-600 font-bold">
              OBJECTIVE FORMULAS: LOG CURRENT METRICS AND TRACK PERCENTAGE PROGRESSION
            </div>
          </div>
        </div>

        {/* Action Controls & Aggregate Stats */}
        <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
          <div className="hidden sm:flex items-center gap-2 bg-white border border-black px-2.5 py-1 text-[11px] font-bold">
            <span>ACHIEVED:</span>
            <span className="font-black text-emerald-800">
              {achievedGoals}/{totalGoals} MET
            </span>
            <span className="text-zinc-300">|</span>
            <span>AVG:</span>
            <span className="font-black text-black">{aggregateProgress}%</span>
          </div>

          <div className="flex items-center gap-1.5 print:hidden">
            <button
              onClick={() => setShowAddModal(true)}
              className="px-3 py-1.5 border-2 border-black bg-[#ccff00] hover:bg-black hover:text-[#ccff00] font-mono text-xs font-black transition-colors cursor-pointer flex items-center gap-1 shadow-[2px_2px_0px_#000000]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Target Goal</span>
            </button>

            {onResetGoals && (
              <button
                onClick={onResetGoals}
                className="px-2.5 py-1.5 border-2 border-black bg-white hover:bg-zinc-100 font-mono text-xs font-bold text-zinc-700 cursor-pointer"
                title="Reset to 6 core standards"
              >
                Reset Core
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. Interactive Data Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse font-mono text-xs min-w-[700px]">
          <thead>
            <tr className="border-b-2 border-black bg-[#f0f0eb] text-black font-black uppercase text-[11px]">
              <th className="p-3 border-r border-black">TARGET METRIC / GOAL</th>
              <th className="p-3 w-36 border-r border-black hidden sm:table-cell">CATEGORY</th>
              <th className="p-3 w-28 border-r border-black text-right">BASELINE</th>
              <th className="p-3 w-44 border-r border-black text-center">CURRENT / LOG</th>
              <th className="p-3 w-28 border-r border-black text-right">TARGET</th>
              <th className="p-3 w-48 border-r border-black">PROGRESS (%)</th>
              <th className="p-3 w-16 text-center print:hidden">DEL</th>
            </tr>
          </thead>

          <tbody className="divide-y border-black">
            {standards.map((goal) => {
              const progress = computeWinterArcGoalProgress(goal);
              const isAchieved = progress >= 100;

              // Compute delta to target if numeric
              let deltaStr = '';
              if (
                goal.targetNum !== undefined &&
                goal.currentNum !== undefined
              ) {
                const diff = Math.round(Math.abs(goal.targetNum - goal.currentNum) * 10) / 10;
                deltaStr = isAchieved ? 'Target achieved' : `${diff} ${goal.unit || ''} to go`;
              } else {
                deltaStr = isAchieved ? 'Target achieved' : `${100 - progress}% remaining`;
              }

              const displayCurrent =
                goal.currentNum !== undefined
                  ? `${goal.currentNum} ${goal.unit || ''}`
                  : goal.currentStatus || 'Tracking';

              const displayBaseline =
                goal.baselineNum !== undefined
                  ? `${goal.baselineNum} ${goal.unit || ''}`
                  : goal.startingBaseline;

              const displayTarget =
                goal.targetNum !== undefined
                  ? `${goal.targetNum} ${goal.unit || ''}`
                  : goal.targetStandard;

              return (
                <tr key={goal.id} className="hover:bg-[#fafaf8] transition-colors">
                  
                  {/* Goal Title & Notes */}
                  <td className="p-3 border-r border-black">
                    <div className="font-black text-black text-[13px]">{goal.name}</div>
                    <div className="text-[10px] text-zinc-500 font-normal">
                      {goal.notes ? goal.notes : `Standard Pillar // 90-Day Benchmark`}
                    </div>
                  </td>

                  {/* Category */}
                  <td className="p-3 border-r border-black hidden sm:table-cell">
                    <span className="border border-black bg-white px-2 py-0.5 text-[10px] font-bold text-zinc-800 inline-block truncate max-w-[130px]">
                      {goal.category}
                    </span>
                  </td>

                  {/* Baseline */}
                  <td className="p-3 border-r border-black text-right font-bold text-zinc-600">
                    {displayBaseline}
                  </td>

                  {/* Current / Log with +/- buttons */}
                  <td className="p-3 border-r border-black text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      {onUpdateGoalCurrent && (
                        <button
                          onClick={() => {
                            const step = (goal.unit === '%' || goal.unit === 'hours' || goal.unit === 'liters') ? 0.5 : 1;
                            onUpdateGoalCurrent(goal.id, -step);
                          }}
                          className="w-6 h-6 border border-black bg-white hover:bg-zinc-100 font-bold flex items-center justify-center cursor-pointer select-none print:hidden shadow-[1px_1px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5"
                          title="Decrease current log"
                        >
                          -
                        </button>
                      )}

                      <span className="font-black text-sm text-black min-w-[65px] px-1 border border-zinc-200 bg-white py-0.5">
                        {displayCurrent}
                      </span>

                      {onUpdateGoalCurrent && (
                        <button
                          onClick={() => {
                            const step = (goal.unit === '%' || goal.unit === 'hours' || goal.unit === 'liters') ? 0.5 : 1;
                            onUpdateGoalCurrent(goal.id, step);
                          }}
                          className="w-6 h-6 border border-black bg-white hover:bg-zinc-100 font-bold flex items-center justify-center cursor-pointer select-none print:hidden shadow-[1px_1px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5"
                          title="Increase current log"
                        >
                          +
                        </button>
                      )}
                    </div>
                  </td>

                  {/* Target Standard */}
                  <td className="p-3 border-r border-black text-right font-bold text-black">
                    {displayTarget}
                  </td>

                  {/* Progress Bar & Percentage */}
                  <td className="p-3 border-r border-black">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] font-bold">
                        <span className={isAchieved ? 'text-emerald-800 font-black' : 'text-black'}>
                          {progress}% {isAchieved ? '✓ MET' : ''}
                        </span>
                        <span className="text-[10px] text-zinc-500">{deltaStr}</span>
                      </div>
                      <div className="w-full bg-zinc-200 h-2.5 border border-black overflow-hidden">
                        <div
                          className={`h-full border-r border-black transition-all duration-300 ${
                            isAchieved ? 'bg-[#ccff00]' : 'bg-black'
                          }`}
                          style={{ width: `${Math.min(100, progress)}%` }}
                        />
                      </div>
                    </div>
                  </td>

                  {/* Delete Action (Hidden in print) */}
                  <td className="p-3 text-center print:hidden">
                    {onDeleteGoal && (
                      <button
                        onClick={() => onDeleteGoal(goal.id)}
                        className="text-zinc-400 hover:text-rose-600 transition-colors cursor-pointer p-1"
                        title="Delete goal"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}

            {standards.length === 0 && (
              <tr>
                <td colSpan={7} className="p-6 text-center text-zinc-500 font-bold">
                  No targets configured. Click &quot;Add Target Goal&quot; to define measurable standards.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 3. Paper Print Specimen Verification Strip at bottom */}
      <div className="border-t-2 border-black bg-[#fafaf8] p-3 font-mono text-xs flex flex-col sm:flex-row items-center justify-between gap-3 print:bg-white print:p-2">
        <div className="text-[11px] text-zinc-700 font-bold">
          <div>MEASURABLE GOALS AUDIT: {achievedGoals} OF {totalGoals} MET ({aggregateProgress}% AVERAGE PROGRESSION)</div>
          <div className="text-zinc-500 text-[10px]">
            Log daily measurements at week close; sign off with black ballpoint pen.
          </div>
        </div>

        <div className="flex items-center gap-4 font-bold text-black text-[11px]">
          <div>
            SIGNATURE:{' '}
            <span className="border-b-2 border-black w-36 inline-block font-black"></span>
          </div>
          <div>
            DATE:{' '}
            <span className="border-b-2 border-black w-24 inline-block font-black"></span>
          </div>
        </div>
      </div>

      {/* 4. Add Target Goal Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg border-4 border-black bg-[#f5f5f0] shadow-[8px_8px_0px_#000000] p-6 space-y-4 font-mono">
            <div className="flex items-center justify-between border-b-2 border-black pb-2">
              <h3 className="text-sm font-black text-black uppercase">
                ADD MEASURABLE TARGET GOAL
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-xs font-black text-zinc-500 hover:text-black cursor-pointer"
              >
                [X]
              </button>
            </div>

            <form onSubmit={handleCreateGoal} className="space-y-3 text-xs">
              <div>
                <label className="block font-black mb-1">TARGET METRIC / GOAL TITLE</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Body Fat % Reduction, 10k Steps, Bench Press 100kg"
                  value={newGoal.name}
                  onChange={(e) => setNewGoal({ ...newGoal, name: e.target.value })}
                  className="w-full p-2 border-2 border-black bg-white font-bold"
                />
              </div>

              <div>
                <label className="block font-black mb-1">CATEGORY</label>
                <select
                  value={newGoal.category}
                  onChange={(e) => setNewGoal({ ...newGoal, category: e.target.value as any })}
                  className="w-full p-2 border-2 border-black bg-white font-bold cursor-pointer"
                >
                  <option value="Body Transformation">Body Transformation</option>
                  <option value="Physical Training">Physical Training</option>
                  <option value="Deep Work / Skill">Deep Work / Skill</option>
                  <option value="Mental Hardness">Mental Hardness</option>
                  <option value="Nutrition / Sleep">Nutrition / Sleep</option>
                </select>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-black mb-1">BASELINE</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={newGoal.baselineNum}
                    onChange={(e) =>
                      setNewGoal({ ...newGoal, baselineNum: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full p-2 border-2 border-black bg-white font-bold"
                  />
                </div>

                <div>
                  <label className="block font-black mb-1">CURRENT</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={newGoal.currentNum}
                    onChange={(e) =>
                      setNewGoal({ ...newGoal, currentNum: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full p-2 border-2 border-black bg-white font-bold"
                  />
                </div>

                <div>
                  <label className="block font-black mb-1">TARGET</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={newGoal.targetNum}
                    onChange={(e) =>
                      setNewGoal({ ...newGoal, targetNum: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full p-2 border-2 border-black bg-white font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-black mb-1">UNIT</label>
                  <input
                    type="text"
                    required
                    placeholder="%, kg, steps, hours, mins, liters"
                    value={newGoal.unit}
                    onChange={(e) => setNewGoal({ ...newGoal, unit: e.target.value })}
                    className="w-full p-2 border-2 border-black bg-white font-bold"
                  />
                </div>

                <div>
                  <label className="block font-black mb-1">NOTES / SPECIFICATION</label>
                  <input
                    type="text"
                    placeholder="e.g. DEXA tested, GPS tracked"
                    value={newGoal.notes}
                    onChange={(e) => setNewGoal({ ...newGoal, notes: e.target.value })}
                    className="w-full p-2 border-2 border-black bg-white font-bold"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border-2 border-black bg-white hover:bg-zinc-100 font-black cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border-2 border-black bg-[#ccff00] hover:bg-black hover:text-[#ccff00] font-black cursor-pointer shadow-[2px_2px_0px_#000000]"
                >
                  Save Target Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </section>
  );
};
