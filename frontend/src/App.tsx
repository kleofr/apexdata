import React, { useState, useCallback } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { TopNavigation } from './components/common/TopNavigation';
import { SettingsModal } from './components/common/SettingsModal';
import { TelemetryLoading } from './components/common/TelemetryLoading';
import { LandingGate } from './views/LandingGate';
import { GrandPrixDashboard } from './views/GrandPrixDashboard';
import { TelemetryWorkbench } from './views/features/TelemetryWorkbench';
import { QualifyingDeltaWorkbench } from './views/features/QualifyingDeltaWorkbench';
import { WeekendOverviewResponse } from './types/dashboard';
import { ComparisonData, Driver } from './types/telemetry';
import { fetchLapComparison } from './services/api';

export const AppContent: React.FC = () => {
  const [currentView, setCurrentView] = useState<'landing' | 'dashboard' | 'telemetry' | 'qualifying'>('landing');
  const [year, setYear] = useState<number>(2024);
  const [gp, setGp] = useState<string>('Monaco');

  const [overviewData, setOverviewData] = useState<WeekendOverviewResponse['data'] | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('CONNECTING TO FASTF1');
  const [loadingSubmessage, setLoadingSubmessage] = useState<string>('Compiling weekend intelligence...');

  // Telemetry Feature State
  const [driver1, setDriver1] = useState<string>('LEC');
  const [driver2, setDriver2] = useState<string>('NOR');
  const [comparisonData, setComparisonData] = useState<ComparisonData | null>(null);
  const [loadingCompare, setLoadingCompare] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [qualifyingDriver, setQualifyingDriver] = useState<string>('');


  // Load Dashboard Overview
  const handleLoadOverview = useCallback(async (targetYear: number, targetGp: string) => {
    setLoading(true);
    setLoadingMessage(`INITIALIZING ${targetYear} ${targetGp.toUpperCase()} GP`);
    setLoadingSubmessage('Extracting 20-car classification, weather, and circuit layout...');
    setYear(targetYear);
    setGp(targetGp);

    try {
      const res = await fetch(`/api/overview?year=${targetYear}&gp=${encodeURIComponent(targetGp)}&session=R`);
      const json: WeekendOverviewResponse = await res.json();
      if (json.data) {
        setOverviewData(json.data);
        setCurrentView('dashboard');
      }
    } catch (err) {
      console.warn('Overview fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Launch Telemetry Comparison Feature
  const handleLaunchTelemetry = useCallback(async (d1 = driver1, d2 = driver2) => {
    setLoadingCompare(true);
    setLoading(true);
    setLoadingMessage(`SYNCHRONIZING LAP TELEMETRY // ${d1} vs ${d2}`);
    setLoadingSubmessage(`Aligning telemetry channels and SVD delta for ${gp}...`);
    setDriver1(d1);
    setDriver2(d2);

    try {
      const comp = await fetchLapComparison(year, gp, 'Q', d1, d2);
      setComparisonData(comp);
      setCurrentView('telemetry');
    } catch (err) {
      console.warn('Telemetry comparison error, trying FP1 or Race fallback:', err);
      try {
        const compFallback = await fetchLapComparison(year, gp, 'R', d1, d2);
        setComparisonData(compFallback);
        setCurrentView('telemetry');
      } catch (fbErr: any) {
        alert(`Telemetry not available for ${d1} vs ${d2} in ${year} ${gp}: ${fbErr.message}`);
      }
    } finally {
      setLoadingCompare(false);
      setLoading(false);
    }
  }, [driver1, driver2, year, gp]);

  const extractedDrivers: Driver[] = (overviewData?.drivers || []).map((d) => ({
    number: d.number,
    code: d.code,
    first_name: d.first_name || '',
    last_name: d.last_name || d.code,
    team: d.team,
    team_color: d.team_color || '#FF8000'
  }));

  return (
    <div className="h-screen w-screen max-h-screen overflow-hidden bg-[#07080B] text-slate-100 flex flex-col font-sans select-none">
      <TopNavigation
        currentView={currentView}
        onNavigate={(v) => setCurrentView(v)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        year={year}
        gp={gp}
      />

      <main className="flex-1 min-h-0 overflow-hidden flex flex-col relative">
        {loading && (
          <TelemetryLoading
            message={loadingMessage}
            submessage={loadingSubmessage}
            showPercentage={true}
          />
        )}

        {currentView === 'landing' && (
          <LandingGate
            onEnterHub={handleLoadOverview}
            isLoading={loading}
          />
        )}

        {currentView === 'dashboard' && overviewData && (
          <GrandPrixDashboard
            overviewData={overviewData}
            year={year}
            gp={gp}
            onLaunchTelemetry={(d1, d2) => handleLaunchTelemetry(d1 || driver1, d2 || driver2)}
            onLaunchQualifyingDelta={(drv) => {
              setQualifyingDriver(drv || '');
              setCurrentView('qualifying');
            }}
            onOpenGate={() => setCurrentView('landing')}
          />
        )}

        {currentView === 'qualifying' && (
          <QualifyingDeltaWorkbench
            year={year}
            gp={gp}
            initialDriver={qualifyingDriver}
            availableDrivers={extractedDrivers}
            onBackToDashboard={() => setCurrentView('dashboard')}
          />
        )}

        {currentView === 'telemetry' && comparisonData && (
          <TelemetryWorkbench
            comparisonData={comparisonData}
            drivers={extractedDrivers}
            driver1={driver1}
            driver2={driver2}
            onDriver1Change={setDriver1}
            onDriver2Change={setDriver2}
            onSwapDrivers={() => {
              const temp = driver1;
              setDriver1(driver2);
              setDriver2(temp);
            }}
            onCompare={() => handleLaunchTelemetry(driver1, driver2)}
            onBackToDashboard={() => setCurrentView('dashboard')}
            loadingCompare={loadingCompare}
          />
        )}

      </main>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
};
