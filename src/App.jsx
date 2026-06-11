import { useState, useEffect, useRef, useCallback } from 'react'
import './App.css'

const DEFAULT_TARGET = 3 * 60

const PRESETS = [
  { label: '30초', seconds: 30 },
  { label: '1분', seconds: 60 },
  { label: '3분', seconds: 180 },
]

function formatTime(ms) {
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  const centiseconds = Math.floor((ms % 1000) / 10)
  return {
    display: `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`,
    centiseconds: String(centiseconds).padStart(2, '0'),
  }
}

function formatTargetTime(seconds) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export default function App() {
  const [elapsed, setElapsed] = useState(0)
  const [running, setRunning] = useState(false)
  const [laps, setLaps] = useState([])
  const [targetSeconds, setTargetSeconds] = useState(DEFAULT_TARGET)
  const [editingTarget, setEditingTarget] = useState(false)
  const [targetInput, setTargetInput] = useState('03:00')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [theme, setTheme] = useState('system')
  const [warning, setWarning] = useState(false)
  const [finished, setFinished] = useState(false)
  const [overtime, setOvertime] = useState(false)
  const [allowOvertime, setAllowOvertime] = useState(false)
  const [lapStart, setLapStart] = useState(0)
  const [showSettings, setShowSettings] = useState(false)

  const startTimeRef = useRef(null)
  const elapsedRef = useRef(0)
  const rafRef = useRef(null)
  const warningFiredRef = useRef(false)
  const overtimeFiredRef = useRef(false)
  const allowOvertimeRef = useRef(false)
  const containerRef = useRef(null)
  const settingsRef = useRef(null)

  const tick = useCallback(function tickFrame() {
    const now = Date.now()
    const newElapsed = now - startTimeRef.current + elapsedRef.current
    setElapsed(newElapsed)

    const remaining = targetSeconds * 1000 - newElapsed

    if (remaining <= 10000 && remaining > 0 && !warningFiredRef.current) {
      warningFiredRef.current = true
      setWarning(true)
    }

    if (remaining <= 0) {
      setWarning(false)
      if (!allowOvertimeRef.current) {
        setElapsed(targetSeconds * 1000)
        elapsedRef.current = targetSeconds * 1000
        setFinished(true)
        setRunning(false)
        return
      }
      if (!overtimeFiredRef.current) {
        overtimeFiredRef.current = true
        setOvertime(true)
      }
    }

    rafRef.current = requestAnimationFrame(tickFrame)
  }, [targetSeconds])

  const stopRaf = () => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }

  const handleStart = () => {
    if (running) {
      stopRaf()
      elapsedRef.current = elapsed
      setRunning(false)
    } else {
      startTimeRef.current = Date.now()
      rafRef.current = requestAnimationFrame(tick)
      setRunning(true)
    }
  }

  useEffect(() => {
    if (running) {
      stopRaf()
      startTimeRef.current = Date.now()
      elapsedRef.current = elapsed
      rafRef.current = requestAnimationFrame(tick)
    }
    return stopRaf
  }, [tick])

  const handleReset = () => {
    stopRaf()
    setRunning(false)
    setElapsed(0)
    setLaps([])
    setWarning(false)
    setFinished(false)
    setOvertime(false)
    setLapStart(0)
    elapsedRef.current = 0
    warningFiredRef.current = false
    overtimeFiredRef.current = false
  }

  const toggleOvertime = () => {
    const next = !allowOvertime
    setAllowOvertime(next)
    allowOvertimeRef.current = next
  }

  const handleLap = () => {
    if (!running) return
    const lapTime = elapsed - lapStart
    setLaps(prev => [...prev, { total: elapsed, split: lapTime, index: prev.length + 1 }])
    setLapStart(elapsed)
  }

  const handleTargetEdit = () => {
    setTargetInput(formatTargetTime(targetSeconds))
    setEditingTarget(true)
  }

  const applyTarget = (total) => {
    setTargetSeconds(total)
    setWarning(false)
    setFinished(false)
    setOvertime(false)
    warningFiredRef.current = false
    overtimeFiredRef.current = false
  }

  const handleTargetSave = () => {
    const parts = targetInput.split(':')
    if (parts.length === 2) {
      const m = parseInt(parts[0], 10) || 0
      const s = parseInt(parts[1], 10) || 0
      const total = m * 60 + s
      if (total > 0) {
        applyTarget(total)
      }
    }
    setEditingTarget(false)
  }

  const handlePreset = (seconds) => {
    applyTarget(seconds)
    setEditingTarget(false)
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen()
    } else {
      document.exitFullscreen()
    }
  }

  // 외부 클릭 시 설정 패널 닫기
  useEffect(() => {
    const handler = (e) => {
      if (settingsRef.current && !settingsRef.current.contains(e.target)) {
        setShowSettings(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handler)
    return () => document.removeEventListener('fullscreenchange', handler)
  }, [])

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'system') {
      root.removeAttribute('data-theme')
    } else {
      root.setAttribute('data-theme', theme)
    }
  }, [theme])

  const remaining = targetSeconds * 1000 - elapsed
  const remainingSeconds = Math.ceil(remaining / 1000)
  const progress = Math.min(elapsed / (targetSeconds * 1000), 1)
  const elapsedObj = formatTime(elapsed)
  const remainingObj = formatTime(Math.max(remaining, 0))
  const overtimeObj = formatTime(Math.max(elapsed - targetSeconds * 1000, 0))

  const showCountdown = warning && remainingSeconds > 0 && remainingSeconds <= 10

  let appClass = 'app'
  if (overtime) appClass += ' overtime'
  else if (finished) appClass += ' finished'
  else if (warning) appClass += ' warning'
  if (isFullscreen) appClass += ' fullscreen'

  const controls = (
    <div className="controls">
      <button
        className={`btn btn-start${running ? ' active' : ''}`}
        onClick={handleStart}
      >
        {running ? '⏸ 일시정지' : elapsed === 0 || finished ? '▶ 시작' : '▶ 재개'}
      </button>
      <button className="btn btn-lap" onClick={handleLap} disabled={!running}>
        ◎ 랩
      </button>
      <button className="btn btn-reset" onClick={handleReset}>
        ↺ 리셋
      </button>
    </div>
  )

  return (
    <div ref={containerRef} className={appClass}>
      <div className="progress-bar" style={{ width: `${progress * 100}%` }} />

      <div className="content">
        {/* 헤더 */}
        <div className="header">
          <div className="header-titles">
            <p className="org-name">부경온라인비즈니스협회</p>
            <h1 className="title">IR Pitching Timer</h1>
          </div>
          <div className="header-right">
            {/* 설정 버튼 */}
            <div className="settings-wrap" ref={settingsRef}>
              <button
                className={`btn-icon${showSettings ? ' active' : ''}`}
                onClick={() => setShowSettings(v => !v)}
                title="설정"
              >
                ⚙
              </button>
              {showSettings && (
                <div className="settings-panel">
                  <p className="settings-section-title">테마</p>
                  <div className="theme-switcher">
                    <button
                      className={`theme-btn${theme === 'dark' ? ' active' : ''}`}
                      onClick={() => setTheme('dark')}
                    >🌙 다크</button>
                    <button
                      className={`theme-btn${theme === 'system' ? ' active' : ''}`}
                      onClick={() => setTheme('system')}
                    >💻 시스템</button>
                    <button
                      className={`theme-btn${theme === 'light' ? ' active' : ''}`}
                      onClick={() => setTheme('light')}
                    >☀️ 라이트</button>
                  </div>

                  <div className="settings-divider" />

                  <p className="settings-section-title">목표 시간</p>
                  <div className="preset-switcher">
                    {PRESETS.map(preset => (
                      <button
                        key={preset.seconds}
                        className={`preset-btn${targetSeconds === preset.seconds ? ' active' : ''}`}
                        onClick={() => handlePreset(preset.seconds)}
                      >★ {preset.label}</button>
                    ))}
                  </div>
                  <div className="settings-row">
                    {editingTarget ? (
                      <>
                        <input
                          className="target-input"
                          value={targetInput}
                          onChange={e => setTargetInput(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && handleTargetSave()}
                          placeholder="MM:SS"
                          autoFocus
                        />
                        <button className="btn-sm" onClick={handleTargetSave}>확인</button>
                      </>
                    ) : (
                      <span className="target-value" onClick={handleTargetEdit}>
                        {formatTargetTime(targetSeconds)} <span className="edit-hint">✎</span>
                      </span>
                    )}
                  </div>

                  <div className="settings-divider" />

                  <div className="settings-row">
                    <span className="settings-label">오버타임</span>
                    <button
                      className={`toggle${allowOvertime ? ' on' : ''}`}
                      onClick={toggleOvertime}
                    >
                      <span className="toggle-knob" />
                    </button>
                    <span className="toggle-label">{allowOvertime ? 'ON' : 'OFF'}</span>
                  </div>
                </div>
              )}
            </div>

            {/* 전체화면 */}
            <button className="btn-icon" onClick={toggleFullscreen} title="전체화면">
              {isFullscreen ? '⊡' : '⛶'}
            </button>
          </div>
        </div>

        {/* 메인 타이머 */}
        <div className={`timer-display${showCountdown ? ' pulse' : ''}`}>
          {overtime && <span className="time-prefix">+</span>}
          <span className="time-main">
            {overtime ? overtimeObj.display : remainingObj.display}
          </span>
          <span className="time-cs">
            .{overtime ? overtimeObj.centiseconds : remainingObj.centiseconds}
          </span>
        </div>

        {/* 상태 뱃지 */}
        {showCountdown && (
          <div className="status-badge countdown-badge">⚠ {remainingSeconds}초 남음</div>
        )}
        {finished && (
          <div className="status-badge finished-badge">✓ 종료</div>
        )}
        {overtime && (
          <div className="status-badge overtime-badge">시간 초과</div>
        )}

        {/* 경과 시간 */}
        <div className="sub-elapsed">
          경과 {elapsedObj.display}
          {elapsed === 0 && <span className="hint"> · 시작 버튼을 눌러 피칭을 시작하세요</span>}
        </div>

        {/* 일반 모드 컨트롤 */}
        {!isFullscreen && controls}

        {/* 랩 타임 */}
        {laps.length > 0 && (
          <div className="laps">
            <div className="laps-header">
              <span>#</span><span>랩 타임</span><span>누적</span>
            </div>
            {[...laps].reverse().map(lap => {
              const s = formatTime(lap.split)
              const t = formatTime(lap.total)
              return (
                <div key={lap.index} className="lap-row">
                  <span className="lap-index">Lap {lap.index}</span>
                  <span className="lap-split">{s.display}.{s.centiseconds}</span>
                  <span className="lap-total">{t.display}.{t.centiseconds}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* 전체화면 모드 컨트롤: 하단 고정 */}
      {isFullscreen && (
        <div className="controls-fullscreen">
          {controls}
        </div>
      )}
    </div>
  )
}
