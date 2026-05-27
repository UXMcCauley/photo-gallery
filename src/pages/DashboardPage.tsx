import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardSubtitle,
  IonCardTitle,
  IonContent,
  IonHeader,
  IonIcon,
  IonPage,
  IonText,
  IonToolbar
} from '@ionic/react';
import { checkmarkCircleOutline, timeOutline } from 'ionicons/icons';
import { useHistory } from 'react-router-dom';
import logo from '../assets/reignos-logo.png';
import './DashboardPage.css';

const metrics = [
  { label: 'PPI', title: 'Predictive Performance Indicator', value: '1.0', total: '/5' },
  { label: 'OTS', title: 'On-time Punch Streak', value: '132', total: '/365' },
  { label: 'Performance', title: 'Daily Performance Rating Average', value: '0.0', total: '/10' },
  { label: 'Team', title: 'Team Average Performance Rating', value: '8.7', total: '/10' },
  { label: 'Success Score', title: 'Probability of Success', value: '87.9%' },
  { label: 'UMI', title: 'Usefulness Margin Indicator', value: '93.3%' }
];

const announcements = [
  {
    id: 'cricket-game',
    title: 'Cricket Game after work',
    time: '6:00 PM',
    image:
      'https://images.unsplash.com/photo-1593766788306-28561086694e?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'team-townhall',
    title: 'Team Townhall Broadcast',
    time: '9:30 AM',
    image:
      'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'coaching-clinic',
    title: 'AI Coaching Clinic',
    time: '2:15 PM',
    image:
      'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'shift-swaps',
    title: 'Shift Swap Window Open',
    time: '4:45 PM',
    image:
      'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=1200&q=80'
  }
];

const DashboardPage: React.FC = () => {
  const history = useHistory();

  const onAnnouncementTap = (announcementId: string) => {
    history.push(`/announcements/${announcementId}`);
  };

  return (
    <IonPage>
      <IonHeader translucent>
        <IonToolbar className="dashboard-toolbar">
          <img alt="ReignOS" src={logo} className="dashboard-logo" />
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <div className="dashboard-content">
          <div className="dashboard-section">
            <IonCard className="clock-card ios-surface">
              <IonCardHeader>
                <IonCardSubtitle>General Purpose Clock In/Out</IonCardSubtitle>
                <IonCardTitle>00:00:00</IonCardTitle>
              </IonCardHeader>
              <IonCardContent>
                <p className="clock-label">Time Worked</p>
                <IonText color="medium">
                  <p className="clock-status">Not Clocked In</p>
                </IonText>
                <IonButton expand="block" color="success">
                  <IonIcon icon={checkmarkCircleOutline} slot="start" />
                  Clock In
                </IonButton>
                <IonText color="medium">
                  <p className="clock-note">
                    You have not been added to a team yet. Please contact your employer.
                  </p>
                </IonText>
              </IonCardContent>
            </IonCard>
          </div>

          <div className="dashboard-section">
            <div className="metrics-grid">
              {metrics.map((metric) => (
                <IonCard key={metric.label} className="metric-card ios-surface">
                  <IonCardHeader>
                    <IonCardSubtitle>{metric.label}</IonCardSubtitle>
                    <IonCardTitle>{metric.title}</IonCardTitle>
                  </IonCardHeader>
                  <IonCardContent>
                    <span className="metric-value">{metric.value}</span>
                    {metric.total ? <span className="metric-total">{metric.total}</span> : null}
                  </IonCardContent>
                </IonCard>
              ))}
            </div>
          </div>

          <div className="dashboard-section">
            <div className="announcement-shell ios-surface">
              <h2 className="announcement-heading">Announcements</h2>
              <div className="announcement-rail">
                {announcements.map((announcement) => (
                  <IonCard
                    key={announcement.id}
                    button
                    className="announcement-card ios-surface"
                    onClick={() => onAnnouncementTap(announcement.id)}
                  >
                    <img alt={announcement.title} src={announcement.image} />
                    <IonCardHeader>
                      <IonCardTitle>{announcement.title}</IonCardTitle>
                      <IonCardSubtitle>
                        <IonIcon icon={timeOutline} /> {announcement.time}
                      </IonCardSubtitle>
                    </IonCardHeader>
                    <IonCardContent>Tap to open details</IonCardContent>
                  </IonCard>
                ))}
              </div>
            </div>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default DashboardPage;
