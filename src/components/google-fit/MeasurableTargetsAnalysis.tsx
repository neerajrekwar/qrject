'use client';

import React, { useState, useMemo } from 'react';
import {
  PersonaType,
  DailySummaryMetric,
  PersonaProfile,
} from '@/lib/google-fit/types';
import {
  PRESET_PERSONAS,
  analyze3MeasurableTargets,
} from '@/lib/google-fit/targets-engine';
import {
  Activity,
  HeartPulse,
  Scale,
  Award,
  Zap,
  Info,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Briefcase,
  Dumbbell,
  Compass,
  Sliders,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface MeasurableTargetsAnalysisProps {
  currentMetric: DailySummaryMetric;
}

export const MeasurableTargetsAnalysis: React.FC<MeasurableTargetsAnalysisProps> = ({
  currentMetric,
}) => {
  const [selectedPersona, setSelectedPersona] = useState<PersonaType>('OFFICE_WORKER');
  const [showFineTune, setShowFineTune] = useState<boolean>(false);
  const [customStepGoal, setCustomStepGoal] = useState<number | null>(null);
  const [customWeightGoal, setCustomWeightGoal] = useState<number | null>(null);

  const activePersona: PersonaProfile = PRESET_PERSONAS[selectedPersona];

  // Compute 3 Measurable Targets Analysis
  const analysis = useMemo(() => {
    const overrides: Partial<PersonaProfile['targets']> = {};
    if (customStepGoal !== null) overrides.targetStepsDaily = customStepGoal;
    if (customWeightGoal !== null) overrides.targetWeightKg = customWeightGoal;

    return analyze3MeasurableTargets(currentMetric, selectedPersona, overrides);
  }, [currentMetric, selectedPersona, customStepGoal, customWeightGoal]);

  const handleSelectPersona = (type: PersonaType) => {
    setSelectedPersona(type);
    setCustomStepGoal(null);
    setCustomWeightGoal(null);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Optimal':
      case 'Optimal Rate':
      case 'Elite Tier':
        return 'bg-[#ccff00] text-black border-black';
      case 'On Track':
      case 'High Adherence':
        return 'bg-emerald-100 text-emerald-900 border-emerald-500';
      case 'Under Target':
      case 'Moderate Progress':
      case 'Moderate':
        return 'bg-amber-100 text-amber-900 border-amber-500';
      case 'Sedentary Risk':
      case 'Deviation Warning':
      case 'Stage 2':
      case 'Stressed / Elevated':
      case 'Needs Attention':
        return 'bg-rose-100 text-rose-900 border-rose-500';
      default:
        return 'bg-zinc-100 text-zinc-800 border-zinc-400';
    }
  };

  return (
    <section className="bg-white border-4 border-black p-5 sm:p-6 shadow-[6px_6px_0px_#000000] font-mono">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-2 border-black pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-black text-[#ccff00] text-[10px] font-black uppercase px-2 py-0.5 tracking-wider">
              Clinical & Biometric Engine
            </span>
            <span className="text-xs text-zinc-500 font-bold">Google Fit Synchronized</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-black flex items-center gap-2">
            <Award className="w-6 h-6 text-black" />
            3 Measurable Targets & Goals Analysis (%)
          </h2>
          <p className="text-xs text-zinc-600 mt-1 max-w-2xl font-sans font-medium">
            Bi-directional telemetry evaluated against personalized physiological baselines. Tracks volume adherence,
            mass trajectory rates, and arterial recovery readiness.
          </p>
        </div>

        {/* Overall Composite Fitness Index */}
        <div className="bg-zinc-50 border-2 border-black p-3 min-w-[200px] text-center shadow-[3px_3px_0px_#000000]">
          <div className="text-[11px] font-bold text-zinc-600 uppercase">Composite Health Score</div>
          <div className="flex items-baseline justify-center gap-1.5 my-0.5">
            <span className="text-3xl font-black text-black">{analysis.compositeFitnessIndex}%</span>
            <span
              className={`text-[10px] font-black uppercase px-1.5 py-0.5 border ${getStatusBadge(
                analysis.overallRating
              )}`}
            >
              {analysis.overallRating}
            </span>
          </div>
          {/* Composite Mini Bar */}
          <div className="w-full bg-zinc-200 h-2 border border-black overflow-hidden mt-1">
            <div
              className="bg-[#ccff00] h-full transition-all duration-500"
              style={{ width: `${Math.min(100, analysis.compositeFitnessIndex)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Preset Persona Selector Tabs */}
      <div className="mt-5">
        <div className="text-xs font-bold text-zinc-700 uppercase mb-2 flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-black" />
          Select Calibrated Persona Preset:
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
          {/* 1. Athlete */}
          <button
            onClick={() => handleSelectPersona('ATHLETE')}
            className={`p-3 border-2 text-left transition-all ${
              selectedPersona === 'ATHLETE'
                ? 'border-black bg-black text-[#ccff00] shadow-[3px_3px_0px_#ccff00]'
                : 'border-zinc-300 bg-zinc-50 text-zinc-800 hover:border-black hover:bg-zinc-100'
            }`}
          >
            <div className="flex items-center gap-2 font-black text-xs uppercase mb-1">
              <Compass className="w-4 h-4" />
              <span>Athlete / Runner</span>
            </div>
            <p className="text-[11px] opacity-80 line-clamp-2">
              15K steps/day • High VO2 engine • Rest BP &lt; 115 mmHg
            </p>
          </button>

          {/* 2. Gym Bulk */}
          <button
            onClick={() => handleSelectPersona('GYM_BULK')}
            className={`p-3 border-2 text-left transition-all ${
              selectedPersona === 'GYM_BULK'
                ? 'border-black bg-black text-[#ccff00] shadow-[3px_3px_0px_#ccff00]'
                : 'border-zinc-300 bg-zinc-50 text-zinc-800 hover:border-black hover:bg-zinc-100'
            }`}
          >
            <div className="flex items-center gap-2 font-black text-xs uppercase mb-1">
              <Dumbbell className="w-4 h-4" />
              <span>Gym Bulk Guy</span>
            </div>
            <p className="text-[11px] opacity-80 line-clamp-2">
              8.5K steps/day • +0.3kg/wk surplus • Heavy lifting BP check
            </p>
          </button>

          {/* 3. 9-to-5 Office */}
          <button
            onClick={() => handleSelectPersona('OFFICE_WORKER')}
            className={`p-3 border-2 text-left transition-all ${
              selectedPersona === 'OFFICE_WORKER'
                ? 'border-black bg-black text-[#ccff00] shadow-[3px_3px_0px_#ccff00]'
                : 'border-zinc-300 bg-zinc-50 text-zinc-800 hover:border-black hover:bg-zinc-100'
            }`}
          >
            <div className="flex items-center gap-2 font-black text-xs uppercase mb-1">
              <Briefcase className="w-4 h-4" />
              <span>9-to-5 Office Person</span>
            </div>
            <p className="text-[11px] opacity-80 line-clamp-2">
              8K steps/day • Anti-sedentary reset • Work stress BP &lt; 120
            </p>
          </button>

          {/* 4. Metabolic Shred */}
          <button
            onClick={() => handleSelectPersona('FAT_LOSS_SHRED')}
            className={`p-3 border-2 text-left transition-all ${
              selectedPersona === 'FAT_LOSS_SHRED'
                ? 'border-black bg-black text-[#ccff00] shadow-[3px_3px_0px_#ccff00]'
                : 'border-zinc-300 bg-zinc-50 text-zinc-800 hover:border-black hover:bg-zinc-100'
            }`}
          >
            <div className="flex items-center gap-2 font-black text-xs uppercase mb-1">
              <Flame className="w-4 h-4" />
              <span>Metabolic Shred</span>
            </div>
            <p className="text-[11px] opacity-80 line-clamp-2">
              12.5K steps/day • -0.6kg/wk deficit • Lean mass sparing
            </p>
          </button>
        </div>
      </div>

      {/* Selected Persona Summary Card */}
      <div className="mt-4 bg-zinc-100 border-2 border-black p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-black uppercase text-black text-sm">{activePersona.title}</span>
            <span className="bg-black text-[#ccff00] px-2 py-0.5 text-[10px] font-bold">
              {activePersona.tagline}
            </span>
          </div>
          <p className="text-zinc-600 mt-1 max-w-3xl font-sans text-xs leading-relaxed">
            {activePersona.description}
          </p>
        </div>

        <button
          onClick={() => setShowFineTune(!showFineTune)}
          className="flex items-center gap-1 text-[11px] font-bold uppercase border border-black bg-white px-2.5 py-1 hover:bg-zinc-200 transition-colors shrink-0 shadow-[1px_1px_0px_#000000]"
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>{showFineTune ? 'Close Customizer' : 'Fine-Tune Targets'}</span>
          {showFineTune ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>

      {/* Optional Fine-Tune Collapsible */}
      {showFineTune && (
        <div className="mt-3 bg-zinc-50 border-2 border-dashed border-black p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-bold text-black uppercase mb-1">
              Custom Daily Step Goal ({customStepGoal ?? activePersona.targets.targetStepsDaily} steps)
            </label>
            <input
              type="range"
              min="4000"
              max="25000"
              step="500"
              value={customStepGoal ?? activePersona.targets.targetStepsDaily}
              onChange={(e) => setCustomStepGoal(parseInt(e.target.value, 10))}
              className="w-full accent-black cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-zinc-500 mt-1">
              <span>4,000 steps</span>
              <span>15,000 steps</span>
              <span>25,000 steps</span>
            </div>
          </div>

          <div>
            <label className="block font-bold text-black uppercase mb-1">
              Custom Target Weight ({customWeightGoal ?? activePersona.targets.targetWeightKg} kg)
            </label>
            <input
              type="range"
              min="50"
              max="120"
              step="0.5"
              value={customWeightGoal ?? activePersona.targets.targetWeightKg}
              onChange={(e) => setCustomWeightGoal(parseFloat(e.target.value))}
              className="w-full accent-black cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-zinc-500 mt-1">
              <span>50 kg</span>
              <span>85 kg</span>
              <span>120 kg</span>
            </div>
          </div>
        </div>
      )}

      {/* 3 MEASURABLE TARGETS GRID */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* ================================================================= */}
        {/* TARGET 1: CARDIOVASCULAR & DAILY MOVEMENT VOLUME (%) */}
        {/* ================================================================= */}
        <div className="bg-zinc-50 border-2 border-black p-4 flex flex-col justify-between shadow-[4px_4px_0px_#000000]">
          <div>
            {/* Header */}
            <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-zinc-300">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-black text-[#ccff00] flex items-center justify-center border border-black font-black text-xs">
                  01
                </div>
                <div>
                  <div className="text-[10px] font-bold text-zinc-500 uppercase">Measurable Target 1</div>
                  <h3 className="text-xs font-black uppercase text-black">Movement & Step Volume</h3>
                </div>
              </div>
              <span
                className={`text-[10px] font-black uppercase px-2 py-0.5 border ${getStatusBadge(
                  analysis.movementTarget.status
                )}`}
              >
                {analysis.movementTarget.status}
              </span>
            </div>

            {/* Percentage & Big Value */}
            <div className="my-4">
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-black text-black">
                  {analysis.movementTarget.completionPercentage}%
                </span>
                <span className="text-xs font-bold text-zinc-600">
                  {analysis.movementTarget.currentSteps.toLocaleString()} /{' '}
                  {analysis.movementTarget.targetSteps.toLocaleString()} steps
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-zinc-200 h-3 border border-black overflow-hidden mt-1.5">
                <div
                  className={`h-full transition-all duration-500 ${
                    analysis.movementTarget.completionPercentage >= 100
                      ? 'bg-[#ccff00]'
                      : analysis.movementTarget.completionPercentage >= 75
                      ? 'bg-emerald-400'
                      : 'bg-amber-400'
                  }`}
                  style={{ width: `${Math.min(100, analysis.movementTarget.completionPercentage)}%` }}
                />
              </div>
            </div>

            {/* Sub-metrics */}
            <div className="bg-white border border-black p-2.5 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-zinc-600 font-medium">Daily Active Minutes:</span>
                <span className="font-bold text-black">{analysis.movementTarget.activeMinutes} mins</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-600 font-medium">Persona Target / Day:</span>
                <span className="font-bold text-black">{analysis.movementTarget.targetMinutes} mins</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-600 font-medium">Delta to Goal:</span>
                <span
                  className={`font-black ${
                    analysis.movementTarget.currentSteps >= analysis.movementTarget.targetSteps
                      ? 'text-emerald-600'
                      : 'text-amber-600'
                  }`}
                >
                  {analysis.movementTarget.currentSteps >= analysis.movementTarget.targetSteps ? '+' : ''}
                  {(
                    analysis.movementTarget.currentSteps - analysis.movementTarget.targetSteps
                  ).toLocaleString()}{' '}
                  steps
                </span>
              </div>
            </div>
          </div>

          {/* Insight Quote */}
          <div className="mt-3 pt-2.5 border-t border-zinc-300">
            <p className="text-[11px] text-zinc-700 font-sans italic leading-tight">
              &quot;{analysis.movementTarget.insight}&quot;
            </p>
          </div>
        </div>

        {/* ================================================================= */}
        {/* TARGET 2: BODY COMPOSITION & MASS TRAJECTORY (%) */}
        {/* ================================================================= */}
        <div className="bg-zinc-50 border-2 border-black p-4 flex flex-col justify-between shadow-[4px_4px_0px_#000000]">
          <div>
            {/* Header */}
            <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-zinc-300">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-black text-[#ccff00] flex items-center justify-center border border-black font-black text-xs">
                  02
                </div>
                <div>
                  <div className="text-[10px] font-bold text-zinc-500 uppercase">Measurable Target 2</div>
                  <h3 className="text-xs font-black uppercase text-black">Body Mass Trajectory</h3>
                </div>
              </div>
              <span
                className={`text-[10px] font-black uppercase px-2 py-0.5 border ${getStatusBadge(
                  analysis.compositionTarget.status
                )}`}
              >
                {analysis.compositionTarget.status}
              </span>
            </div>

            {/* Percentage & Big Value */}
            <div className="my-4">
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-black text-black">
                  {analysis.compositionTarget.trajectoryPercentage}%
                </span>
                <span className="text-xs font-bold text-zinc-600">
                  {analysis.compositionTarget.currentWeightKg} kg /{' '}
                  {analysis.compositionTarget.targetWeightKg} kg
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-zinc-200 h-3 border border-black overflow-hidden mt-1.5">
                <div
                  className="bg-purple-400 h-full transition-all duration-500"
                  style={{ width: `${Math.min(100, analysis.compositionTarget.trajectoryPercentage)}%` }}
                />
              </div>
            </div>

            {/* Sub-metrics */}
            <div className="bg-white border border-black p-2.5 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-zinc-600 font-medium">Protocol Mode:</span>
                <span className="font-bold text-black uppercase">
                  {analysis.compositionTarget.trendType.replace('_', ' ')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-600 font-medium">BMI Index:</span>
                <span className="font-bold text-black">
                  {analysis.compositionTarget.bmi} ({analysis.compositionTarget.bmiClassification})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-600 font-medium">Starting Baseline:</span>
                <span className="font-bold text-zinc-700">
                  {analysis.compositionTarget.baselineWeightKg} kg
                </span>
              </div>
            </div>
          </div>

          {/* Insight Quote */}
          <div className="mt-3 pt-2.5 border-t border-zinc-300">
            <p className="text-[11px] text-zinc-700 font-sans italic leading-tight">
              &quot;{analysis.compositionTarget.insight}&quot;
            </p>
          </div>
        </div>

        {/* ================================================================= */}
        {/* TARGET 3: HEMODYNAMIC & VASCULAR RECOVERY SCORE (%) */}
        {/* ================================================================= */}
        <div className="bg-zinc-50 border-2 border-black p-4 flex flex-col justify-between shadow-[4px_4px_0px_#000000]">
          <div>
            {/* Header */}
            <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-zinc-300">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-black text-[#ccff00] flex items-center justify-center border border-black font-black text-xs">
                  03
                </div>
                <div>
                  <div className="text-[10px] font-bold text-zinc-500 uppercase">Measurable Target 3</div>
                  <h3 className="text-xs font-black uppercase text-black">Vascular Tone & Recovery</h3>
                </div>
              </div>
              <span
                className={`text-[10px] font-black uppercase px-2 py-0.5 border ${getStatusBadge(
                  analysis.vascularTarget.clinicalStatus
                )}`}
              >
                {analysis.vascularTarget.clinicalStatus}
              </span>
            </div>

            {/* Percentage & Big Value */}
            <div className="my-4">
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-black text-black">
                  {analysis.vascularTarget.vascularScorePercentage}%
                </span>
                <span className="text-xs font-bold text-zinc-600">
                  {analysis.vascularTarget.currentSystolic} / {analysis.vascularTarget.currentDiastolic} mmHg
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-zinc-200 h-3 border border-black overflow-hidden mt-1.5">
                <div
                  className={`h-full transition-all duration-500 ${
                    analysis.vascularTarget.vascularScorePercentage >= 90
                      ? 'bg-[#ccff00]'
                      : analysis.vascularTarget.vascularScorePercentage >= 70
                      ? 'bg-amber-400'
                      : 'bg-rose-400'
                  }`}
                  style={{
                    width: `${Math.min(100, analysis.vascularTarget.vascularScorePercentage)}%`,
                  }}
                />
              </div>
            </div>

            {/* Sub-metrics */}
            <div className="bg-white border border-black p-2.5 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-zinc-600 font-medium">Mean Arterial Pressure (MAP):</span>
                <span className="font-bold text-black">{analysis.vascularTarget.currentMap} mmHg</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-600 font-medium">Persona Upper Limit:</span>
                <span className="font-bold text-zinc-700">
                  &le; {analysis.vascularTarget.targetSystolicMax} / &le;{' '}
                  {analysis.vascularTarget.targetDiastolicMax} mmHg
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-600 font-medium">Recovery Readiness:</span>
                <span className="font-bold text-black">
                  {analysis.vascularTarget.recoveryReadiness}
                </span>
              </div>
            </div>
          </div>

          {/* Insight Quote */}
          <div className="mt-3 pt-2.5 border-t border-zinc-300">
            <p className="text-[11px] text-zinc-700 font-sans italic leading-tight">
              &quot;{analysis.vascularTarget.insight}&quot;
            </p>
          </div>
        </div>

      </div>
    </section>
  );
};
