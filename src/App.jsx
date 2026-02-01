import React, { useContext } from 'react'
import { SimulationProvider } from './context/SimulationContext'
import { useSimulation } from './context/SimulationContext'
import TrafficGraph from './components/Dashboard/TrafficGraph'
import ServerHealth from './components/Dashboard/ServerHealth'
import MitigationPanel from './components/Dashboard/MitigationPanel'
import AttackPanel from './components/Dashboard/AttackPanel'
import EventLog from './components/Dashboard/EventLog'
import { Play, Square, RotateCcw, Shield, Zap, Activity, Wifi, WifiOff, AlertCircle } from 'lucide-react'

function App() {
  const {
    isRunning,
    startSimulation,
    stopSimulation,
    resetSimulation,
    serverStats,
    traffic,
    logs
  } = useSimulation()

  const getStatusIndicator = () => {
    if (!isRunning) {
      return (
        <div className="status-indicator">
          <WifiOff size={14} />
          <span>Standby</span>
        </div>
      )
    }
    if (serverStats.cpuLoad > 90) {
      return (
        <div className="status-indicator critical">
          <AlertCircle size={14} />
          <span>Critical</span>
        </div>
      )
    }
    if (serverStats.cpuLoad > 70) {
      return (
        <div className="status-indicator warning">
          <Wifi size={14} />
          <span>Active</span>
        </div>
      )
    }
    return (
      <div className="status-indicator healthy">
        <Wifi size={14} />
        <span>Running</span>
      </div>
    )
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-left">
          <div className="logo-wrapper">
            <Shield className="logo-icon" />
            <div className="logo-glow" />
          </div>
          <div className="title-section">
            <h1>DDoS Attack Detection & Prevention</h1>
            <p className="subtitle">Real-time Cybersecurity Simulator</p>
          </div>
        </div>
        <div className="header-right">
          {getStatusIndicator()}
          <div className="header-stats">
            <div className="stat-item">
              <span className="stat-label">Events</span>
              <span className="stat-value">{logs.length}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Requests</span>
              <span className="stat-value">{traffic.length}</span>
            </div>
          </div>
          <div className="header-controls">
            <button onClick={isRunning ? stopSimulation : startSimulation} className={isRunning ? 'stop-btn' : 'start-btn'}>
              {isRunning ? <Square size={16} /> : <Play size={16} />}
              {isRunning ? 'Stop' : 'Start'}
            </button>
            <button onClick={resetSimulation} className="reset-btn">
              <RotateCcw size={16} />
              Reset
            </button>
          </div>
        </div>
      </header>

      <div className="dashboard-grid">
        <div className="panel attack-panel">
          <AttackPanel />
        </div>

        <div className="panel visualization-panel">
          <div className="panel-header">
            <Activity size={20} />
            <h2>Traffic Visualization</h2>
          </div>
          <TrafficGraph />
        </div>

        <div className="panel mitigation-panel">
          <MitigationPanel />
        </div>

        <div className="panel server-health-panel">
          <ServerHealth />
        </div>

        <div className="panel event-log-panel">
          <EventLog />
        </div>
      </div>
    </div>
  )
}

export default function Root() {
  return (
    <SimulationProvider>
      <App />
    </SimulationProvider>
  )
}