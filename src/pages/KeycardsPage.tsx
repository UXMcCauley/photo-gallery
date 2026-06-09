import { IonContent, IonIcon, IonPage } from '@ionic/react';
import { arrowBackOutline, arrowForwardOutline, statsChartOutline, timeOutline, trophyOutline } from 'ionicons/icons';
import { useMemo, useRef, useState, type TouchEvent } from 'react';
import './KeycardsPage.css';

type ShiftHistoryEntry = {
  id: string;
  label: string;
  hours: string;
  rating: number;
  progress: number;
};

type KeycardItem = {
  id: string;
  name: string;
  title: string;
  shortDescription: string;
  details: string;
  progress: number;
  industryImage: string;
  overallTime: string;
  rating: number;
  milestones: Array<{ label: string; progress: number }>;
  shiftHistory: ShiftHistoryEntry[];
};

const keycards: KeycardItem[] = [
  {
    id: 'healthcare-ops',
    name: 'Healthcare Ops',
    title: 'Patient Flow Specialist',
    shortDescription: 'Optimize intake, room turnover, and care-team handoff quality.',
    details:
      'Focused on moving patients through each shift safely and on-time while preserving chart quality and service experience.',
    progress: 64,
    industryImage:
      'https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=1200&q=80',
    overallTime: '218h total logged',
    rating: 4.6,
    milestones: [
      { label: 'Triage speed consistency', progress: 81 },
      { label: 'Documentation accuracy', progress: 73 },
      { label: 'Handoff quality', progress: 62 }
    ],
    shiftHistory: [
      { id: 'hc-1', label: 'Mon AM Shift', hours: '8h', rating: 4.7, progress: 68 },
      { id: 'hc-2', label: 'Wed PM Shift', hours: '7.5h', rating: 4.4, progress: 64 },
      { id: 'hc-3', label: 'Fri AM Shift', hours: '8h', rating: 4.8, progress: 71 }
    ]
  },
  {
    id: 'hospitality-floor',
    name: 'Hospitality',
    title: 'Guest Experience Lead',
    shortDescription: 'Coordinate front-of-house pace, quality checks, and issue recovery.',
    details:
      'Builds a reliable guest journey by balancing service speed with attention to detail and proactive support.',
    progress: 58,
    industryImage:
      'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=1200&q=80',
    overallTime: '173h total logged',
    rating: 4.3,
    milestones: [
      { label: 'Response time', progress: 69 },
      { label: 'Guest feedback score', progress: 61 },
      { label: 'Cross-team coordination', progress: 55 }
    ],
    shiftHistory: [
      { id: 'ho-1', label: 'Tue Dinner Shift', hours: '6h', rating: 4.2, progress: 57 },
      { id: 'ho-2', label: 'Thu Lunch Shift', hours: '5.5h', rating: 4.5, progress: 60 },
      { id: 'ho-3', label: 'Sat Brunch Shift', hours: '7h', rating: 4.4, progress: 59 }
    ]
  },
  {
    id: 'logistics-yard',
    name: 'Logistics',
    title: 'Dispatch & Yard Controller',
    shortDescription: 'Increase on-time dispatch while reducing staging and loading delays.',
    details:
      'Tracks throughput, queue timing, and team coordination to keep loads moving with fewer bottlenecks each week.',
    progress: 72,
    industryImage:
      'https://images.unsplash.com/photo-1494412574643-ff11b0a5c1c3?auto=format&fit=crop&w=1200&q=80',
    overallTime: '246h total logged',
    rating: 4.8,
    milestones: [
      { label: 'Dispatch reliability', progress: 88 },
      { label: 'Load turnaround', progress: 71 },
      { label: 'Safety compliance', progress: 79 }
    ],
    shiftHistory: [
      { id: 'lg-1', label: 'Mon Night Shift', hours: '9h', rating: 4.8, progress: 73 },
      { id: 'lg-2', label: 'Wed Night Shift', hours: '9h', rating: 4.7, progress: 72 },
      { id: 'lg-3', label: 'Fri Night Shift', hours: '8.5h', rating: 4.9, progress: 75 }
    ]
  },
  {
    id: 'retail-floor',
    name: 'Retail',
    title: 'Floor Performance Captain',
    shortDescription: 'Blend sales support, inventory accuracy, and customer flow execution.',
    details:
      'Improves conversion and checkout speed through floor readiness, rapid restock cycles, and stronger shift routines.',
    progress: 49,
    industryImage:
      'https://images.unsplash.com/photo-1607082349250-3a3f7f2c3e66?auto=format&fit=crop&w=1200&q=80',
    overallTime: '139h total logged',
    rating: 4.1,
    milestones: [
      { label: 'Stock accuracy', progress: 54 },
      { label: 'Checkout wait time', progress: 47 },
      { label: 'Upsell consistency', progress: 46 }
    ],
    shiftHistory: [
      { id: 'rt-1', label: 'Tue Opening Shift', hours: '6.5h', rating: 4.0, progress: 47 },
      { id: 'rt-2', label: 'Thu Closing Shift', hours: '7h', rating: 4.2, progress: 49 },
      { id: 'rt-3', label: 'Sun Mid Shift', hours: '6h', rating: 4.1, progress: 51 }
    ]
  }
];

const SWIPE_NAV_THRESHOLD = 46;
const SWIPE_DISMISS_THRESHOLD = 86;

const KeycardsPage: React.FC = () => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const startPointRef = useRef<{ x: number; y: number } | null>(null);
  const draggingPanelRef = useRef(false);

  const selectedCard = useMemo(
    () => (selectedIndex !== null ? keycards[selectedIndex] : null),
    [selectedIndex]
  );

  const openDetails = (index: number) => {
    setSelectedIndex(index);
  };

  const dismissDetails = () => {
    setSelectedIndex(null);
    startPointRef.current = null;
    draggingPanelRef.current = false;
  };

  const showPrevious = () => {
    setSelectedIndex(current => {
      if (current === null) return current;
      return (current - 1 + keycards.length) % keycards.length;
    });
  };

  const showNext = () => {
    setSelectedIndex(current => {
      if (current === null) return current;
      return (current + 1) % keycards.length;
    });
  };

  const onPanelTouchStart = (event: TouchEvent<HTMLElement>) => {
    const touch = event.changedTouches[0];
    startPointRef.current = { x: touch.clientX, y: touch.clientY };
    draggingPanelRef.current = true;
  };

  const onPanelTouchEnd = (event: TouchEvent<HTMLElement>) => {
    if (!draggingPanelRef.current || !startPointRef.current) return;
    const touch = event.changedTouches[0];
    const dx = touch.clientX - startPointRef.current.x;
    const dy = touch.clientY - startPointRef.current.y;
    const horizontalSwipe = Math.abs(dx) > Math.abs(dy);

    if (horizontalSwipe && Math.abs(dx) >= SWIPE_NAV_THRESHOLD) {
      if (dx < 0) showNext();
      else showPrevious();
    } else if (!horizontalSwipe && dy >= SWIPE_DISMISS_THRESHOLD) {
      dismissDetails();
    }

    startPointRef.current = null;
    draggingPanelRef.current = false;
  };

  return (
    <IonPage className="keycards-page">
      <IonContent fullscreen>
        <div className="keycards-scene">
          <div className="keycards-header">
            <h1>Keycards</h1>
            <p>Tap a card to open details. Swipe in details to browse.</p>
          </div>

          <section className="keycards-grid" aria-label="Keycards list">
            {keycards.map((card, index) => (
              <button
                key={card.id}
                className="keycard-tile"
                style={{ backgroundImage: `url(${card.industryImage})` }}
                onClick={() => openDetails(index)}
                aria-label={`Open ${card.name} keycard`}
              >
                <div className="keycard-overlay">
                  <span className="keycard-name">{card.name}</span>
                  <h2>{card.title}</h2>
                  <p>{card.shortDescription}</p>
                  <div className="keycard-progress-row">
                    <span>Progress</span>
                    <strong>{card.progress}%</strong>
                  </div>
                  <div className="keycard-progress-track">
                    <div className="keycard-progress-fill" style={{ width: `${card.progress}%` }} />
                  </div>
                </div>
              </button>
            ))}
          </section>
        </div>

        {selectedCard ? (
          <div className="keycards-detail-layer" role="dialog" aria-modal="true" aria-label={`${selectedCard.name} details`}>
            <button className="keycards-backdrop" onClick={dismissDetails} aria-label="Dismiss details" />
            <div className="keycards-selected-title">{selectedCard.name}</div>
            <section
              className="keycards-detail-sheet"
              onTouchStart={onPanelTouchStart}
              onTouchEnd={onPanelTouchEnd}
            >
              <div className="keycards-sheet-handle" />

              <div className="keycards-sheet-head">
                <div>
                  <h3>{selectedCard.title}</h3>
                  <p>{selectedCard.details}</p>
                </div>
                <button className="sheet-close-btn" onClick={dismissDetails} aria-label="Close details">
                  Dismiss
                </button>
              </div>

              <div className="detail-metric-grid">
                <div className="detail-metric-box">
                  <IonIcon icon={statsChartOutline} />
                  <span>Work Rating</span>
                  <strong>{selectedCard.rating.toFixed(1)} / 5</strong>
                </div>
                <div className="detail-metric-box">
                  <IonIcon icon={timeOutline} />
                  <span>Overall Time</span>
                  <strong>{selectedCard.overallTime}</strong>
                </div>
                <div className="detail-metric-box">
                  <IonIcon icon={trophyOutline} />
                  <span>Milestone Progress</span>
                  <strong>{selectedCard.progress}%</strong>
                </div>
              </div>

              <div className="detail-section">
                <h4>Progress milestones</h4>
                {selectedCard.milestones.map(milestone => (
                  <div key={milestone.label} className="milestone-row">
                    <div className="milestone-top">
                      <span>{milestone.label}</span>
                      <strong>{milestone.progress}%</strong>
                    </div>
                    <div className="milestone-track">
                      <div className="milestone-fill" style={{ width: `${milestone.progress}%` }} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="detail-section">
                <h4>Shift history</h4>
                <div className="shift-history-list">
                  {selectedCard.shiftHistory.map(entry => (
                    <article key={entry.id} className="shift-history-item">
                      <div>
                        <h5>{entry.label}</h5>
                        <p>{entry.hours} logged</p>
                      </div>
                      <div className="shift-history-right">
                        <span>{entry.rating.toFixed(1)} rating</span>
                        <strong>{entry.progress}% progress</strong>
                      </div>
                    </article>
                  ))}
                </div>
              </div>

              <div className="sheet-swipe-hint">
                <IonIcon icon={arrowBackOutline} />
                <span>Swipe left/right to move between keycards</span>
                <IonIcon icon={arrowForwardOutline} />
              </div>
            </section>
          </div>
        ) : null}
      </IonContent>
    </IonPage>
  );
};

export default KeycardsPage;
