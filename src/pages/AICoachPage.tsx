import { IonContent, IonIcon, IonPage } from '@ionic/react';
import {
  addOutline,
  chevronBackOutline,
  createOutline,
  pinOutline,
  saveOutline,
  searchOutline,
  sendOutline,
  settingsOutline,
  sparklesOutline,
} from 'ionicons/icons';
import { useEffect, useMemo, useRef, useState } from 'react';
import { defaultLoggedInEmployee } from '../data/defaultLoggedInEmployee';
import './ChatPage.css';
import './AICoachPage.css';

type CoachStyle = 'concise' | 'witty' | 'mean';
type AppView = 'chats' | 'settings';

type CoachCategory = { id: string; name: string };
type CoachMessage = { id: string; role: 'user' | 'assistant'; content: string; ts: number };
type CoachConversation = {
  id: string;
  title: string;
  categoryId: string;
  pinned?: boolean;
  createdAt: number;
  updatedAt: number;
  messages: CoachMessage[];
};
type CoachState = {
  coachName: string;
  style: CoachStyle;
  categories: CoachCategory[];
  conversations: CoachConversation[];
  activeConversationId: string | null;
};

const STORAGE_KEY = 'reign_ai_coach_v1';
const STYLE_LABELS: Record<CoachStyle, string> = { concise: 'Concise', witty: 'Witty', mean: 'Mean' };

type CoachApiPayload = {
  coachName: string;
  style: CoachStyle;
  categoryName: string;
  employeeContext: Record<string, unknown>;
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
};

const uid = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 10)}`;

function colorForConversation(id: string): string {
  const palette = ['#7b3fff', '#2e85ff', '#00c875', '#ff6b6b', '#46c9ff', '#e87d30'];
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  return palette[Math.abs(hash) % palette.length];
}

function buildInitialState(): CoachState {
  const defaultCategoryId = 'cat-general';
  const now = Date.now();
  return {
    coachName: 'Nova',
    style: 'concise',
    categories: [
      { id: defaultCategoryId, name: 'General Coaching' },
      { id: 'cat-workplace', name: 'Workplace Relationships' },
      { id: 'cat-career', name: 'Career Development' },
    ],
    conversations: [{
      id: 'conv-welcome',
      title: 'Welcome Plan',
      categoryId: defaultCategoryId,
      createdAt: now,
      updatedAt: now,
      messages: [{
        id: 'msg-welcome',
        role: 'assistant',
        ts: now,
        content: "I can coach you through team dynamics, conflict navigation, and career growth. Start a chat and I'll tailor advice to your current performance metrics.",
      }],
    }],
    activeConversationId: null,
  };
}

const AICoachPage: React.FC = () => {
  const [view, setView] = useState<AppView>('chats');
  const [state, setState] = useState<CoachState>(() => buildInitialState());
  const [search, setSearch] = useState('');
  const [filterCategoryId, setFilterCategoryId] = useState<string>('all');
  const [draft, setDraft] = useState('');
  const [draftCoachName, setDraftCoachName] = useState('');
  const [draftStyle, setDraftStyle] = useState<CoachStyle>('concise');
  const [draftCategories, setDraftCategories] = useState<CoachCategory[]>([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [swipedId, setSwipedId] = useState<string | null>(null);
  const swipeStartX = useRef(0);
  const swipeStartY = useRef(0);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as CoachState;
      if (parsed?.conversations?.length) {
        setState({
          ...parsed,
          activeConversationId: null,
        });
      }
    } catch {
      // Ignore malformed local state.
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    if (!state.categories.length) return;
    if (filterCategoryId === 'all') return;
    if (!state.categories.some(category => category.id === filterCategoryId)) {
      setFilterCategoryId('all');
    }
  }, [state.categories, filterCategoryId]);

  const employeeContext = useMemo(() => ({
    employeeName: defaultLoggedInEmployee.displayName,
    roleTitle: defaultLoggedInEmployee.roleTitle,
    bio: defaultLoggedInEmployee.bio,
    metricsSummary: defaultLoggedInEmployee.dashboard.metrics.map(metric => `${metric.label}: ${metric.value}${metric.total ?? ''}`).join(', '),
    mastery: defaultLoggedInEmployee.dashboard.mastery,
    resumeStats: defaultLoggedInEmployee.resume.stats,
  }), []);

  const activeConversation = useMemo(
    () => state.conversations.find(conversation => conversation.id === state.activeConversationId) ?? null,
    [state.activeConversationId, state.conversations]
  );

  const activeCategoryName =
    state.categories.find(category => category.id === activeConversation?.categoryId)?.name ?? 'General Coaching';

  const filteredConversations = useMemo(() => {
    const query = search.trim().toLowerCase();
    return state.conversations.filter(conversation => {
      if (filterCategoryId !== 'all' && conversation.categoryId !== filterCategoryId) return false;
      if (!query) return true;
      const latest = conversation.messages[conversation.messages.length - 1]?.content ?? '';
      return conversation.title.toLowerCase().includes(query) || latest.toLowerCase().includes(query);
    }).sort((a, b) => {
      if (Boolean(a.pinned) !== Boolean(b.pinned)) return a.pinned ? -1 : 1;
      return b.updatedAt - a.updatedAt;
    });
  }, [state.conversations, filterCategoryId, search]);

  const openSettingsView = () => {
    setDraftCoachName(state.coachName);
    setDraftStyle(state.style);
    setDraftCategories(state.categories);
    setNewCategoryName('');
    setView('settings');
  };

  const saveSettings = () => {
    const fallbackCategoryId = draftCategories[0]?.id ?? 'cat-general';
    setState(prev => ({
      ...prev,
      coachName: draftCoachName.trim() || 'Nova',
      style: draftStyle,
      categories: draftCategories,
      conversations: prev.conversations.map(conversation => ({
        ...conversation,
        categoryId: draftCategories.some(category => category.id === conversation.categoryId)
          ? conversation.categoryId
          : fallbackCategoryId,
      })),
    }));
    setFilterCategoryId(fallbackCategoryId);
    setView('chats');
  };

  const createConversation = () => {
    const now = Date.now();
    const conversation: CoachConversation = {
      id: uid('conv'),
      title: 'New Coaching Chat',
      categoryId: filterCategoryId === 'all'
        ? (state.categories[0]?.id || 'cat-general')
        : filterCategoryId,
      createdAt: now,
      updatedAt: now,
      messages: [],
    };

    setState(prev => ({
      ...prev,
      activeConversationId: conversation.id,
      conversations: [conversation, ...prev.conversations],
    }));
    setError('');
    setDraft('');
  };

  const createCategory = () => {
    const name = newCategoryName.trim();
    if (!name) return;
    if (draftCategories.some(category => category.name.toLowerCase() === name.toLowerCase())) return;
    setDraftCategories(prev => [...prev, { id: uid('cat'), name }]);
    setNewCategoryName('');
  };

  const updateConversationCategory = (conversationId: string, categoryId: string) => {
    setState(prev => ({
      ...prev,
      conversations: prev.conversations.map(conversation =>
        conversation.id === conversationId ? { ...conversation, categoryId, updatedAt: Date.now() } : conversation
      ),
    }));
    setSwipedId(null);
  };

  const toggleConversationPin = (conversationId: string) => {
    setState(prev => ({
      ...prev,
      conversations: prev.conversations.map(conversation =>
        conversation.id === conversationId
          ? { ...conversation, pinned: !conversation.pinned, updatedAt: Date.now() }
          : conversation
      ),
    }));
    setSwipedId(null);
  };

  const onPointerDown = (event: React.PointerEvent) => {
    swipeStartX.current = event.clientX;
    swipeStartY.current = event.clientY;
  };

  const onPointerUp = (conversationId: string, event: React.PointerEvent) => {
    const dx = event.clientX - swipeStartX.current;
    const dy = event.clientY - swipeStartY.current;
    if (Math.abs(dx) < Math.abs(dy)) return;
    if (dx < -60) setSwipedId(conversationId);
    else if (dx > 20) setSwipedId(null);
  };

  const openConversation = (conversationId: string) => {
    if (swipedId) {
      setSwipedId(null);
      return;
    }
    setState(prev => ({ ...prev, activeConversationId: conversationId }));
  };

  const renameConversation = (conversationId: string) => {
    const target = state.conversations.find(conversation => conversation.id === conversationId);
    if (!target) return;
    const nextTitle = window.prompt('Rename chat', target.title)?.trim();
    if (!nextTitle) return;
    setState(prev => ({
      ...prev,
      conversations: prev.conversations.map(conversation =>
        conversation.id === conversationId
          ? { ...conversation, title: nextTitle.slice(0, 48), updatedAt: Date.now() }
          : conversation
      ),
    }));
  };

  const getConversationPromptTitle = (conversation: CoachConversation | null): string => {
    if (!conversation) return 'AI Coach Chat';
    const firstUserMessage = conversation.messages.find(message => message.role === 'user')?.content?.trim();
    if (firstUserMessage) {
      return firstUserMessage.slice(0, 56) + (firstUserMessage.length > 56 ? '...' : '');
    }
    return conversation.title;
  };

  const sendMessage = async () => {
    const text = draft.trim();
    if (!text || !activeConversation || isSending) return;

    const userMessage: CoachMessage = { id: uid('msg-user'), role: 'user', content: text, ts: Date.now() };
    const nextConversations = state.conversations.map(conversation => {
      if (conversation.id !== activeConversation.id) return conversation;
      const nextTitle = conversation.title === 'New Coaching Chat' ? text.slice(0, 34) + (text.length > 34 ? '...' : '') : conversation.title;
      return { ...conversation, title: nextTitle, updatedAt: Date.now(), messages: [...conversation.messages, userMessage] };
    });

    setState(prev => ({ ...prev, conversations: nextConversations }));
    setDraft('');
    setError('');
    setIsSending(true);

    try {
      const payload: CoachApiPayload = {
        coachName: state.coachName,
        style: state.style,
        categoryName: activeCategoryName,
        employeeContext,
        messages: [...(activeConversation.messages ?? []), userMessage].map(message => ({ role: message.role, content: message.content })),
      };

      const reply = await requestCoachReply(payload);
      const assistantMessage: CoachMessage = { id: uid('msg-ai'), role: 'assistant', content: reply, ts: Date.now() };

      setState(prev => ({
        ...prev,
        conversations: prev.conversations.map(conversation =>
          conversation.id === activeConversation.id
            ? { ...conversation, updatedAt: Date.now(), messages: [...conversation.messages, assistantMessage] }
            : conversation
        ),
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to reach AI coach');
    } finally {
      setIsSending(false);
    }
  };

  const onComposerKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void sendMessage();
    }
  };

  const listClass = activeConversation ? 'panel-exit-left' : 'panel-enter';
  const threadClass = activeConversation ? 'panel-enter' : 'panel-exit-right';

  return (
    <IonPage className="chat-page chat-ios ai-coach-page">
      <IonContent fullscreen>
        {view === 'settings' ? (
          <div className="ai-settings-view">
            <div className="chat-list-header">
              <div className="chat-list-title-row">
                <button className="back-btn" onClick={() => setView('chats')} aria-label="Back to AI chats">
                  <IonIcon icon={chevronBackOutline} />
                  <span>Back</span>
                </button>
                <h1 className="chat-list-title">
                  <IonIcon icon={sparklesOutline} className="ai-title-icon" />
                  AI Coach Settings
                </h1>
                <button type="button" className="ai-settings-save" onClick={saveSettings}>
                  <IonIcon icon={saveOutline} />
                  Save
                </button>
              </div>
            </div>
            <section className="ai-settings-sheet ai-settings-sheet--full">
              <label className="ai-coach-field">
                Coach Name
                <input value={draftCoachName} onChange={event => setDraftCoachName(event.target.value.slice(0, 32))} placeholder="Name your coach" />
              </label>
              <label className="ai-coach-field">
                Communication Style
                <select value={draftStyle} onChange={event => setDraftStyle(event.target.value as CoachStyle)}>
                  {Object.entries(STYLE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </label>
              <div className="ai-category-create">
                <input value={newCategoryName} onChange={event => setNewCategoryName(event.target.value)} placeholder="Create category" />
                <button type="button" onClick={createCategory}><IonIcon icon={addOutline} /></button>
              </div>
              <div className="ai-category-list">
                {draftCategories.map(category => <span key={category.id} className="ai-category-chip">{category.name}</span>)}
              </div>
            </section>
          </div>
        ) : (
          <div className="chat-root">
            <section className={`chat-panel chat-list-panel ${listClass}`}>
              <div className="chat-list-header">
                <div className="chat-list-title-row">
                  <h1 className="chat-list-title">
                    <IonIcon icon={sparklesOutline} className="ai-title-icon" />
                    AI Coach
                    <span className="chat-unread-chip">{filteredConversations.length}</span>
                  </h1>
                  <button className="ai-settings-btn" onClick={openSettingsView} aria-label="AI coach settings">
                    <IonIcon icon={settingsOutline} />
                  </button>
                </div>
                <div className="ai-filter-row">
                  <label htmlFor="ai-category-filter">Filter</label>
                  <select id="ai-category-filter" className="ai-filter-select" value={filterCategoryId} onChange={event => setFilterCategoryId(event.target.value)}>
                    <option value="all">All</option>
                    {state.categories.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}
                  </select>
                  <button
                    type="button"
                    className={`ai-filter-search-toggle${showSearch ? ' active' : ''}`}
                    aria-label={showSearch ? 'Hide AI chat search' : 'Show AI chat search'}
                    onClick={() => setShowSearch(prev => !prev)}
                  >
                    <IonIcon icon={searchOutline} />
                  </button>
                </div>
                {showSearch ? (
                  <div className="chat-search-row ai-filter-search-row">
                    <div className="chat-search-wrap">
                      <IonIcon icon={searchOutline} className="chat-search-icon" />
                      <input type="search" className="chat-search" placeholder="Search AI chats" value={search} onChange={event => setSearch(event.target.value)} />
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="chat-list-body" onClick={() => swipedId && setSwipedId(null)}>
                {filteredConversations.map(conversation => {
                  const last = conversation.messages[conversation.messages.length - 1];
                  const isSwiped = swipedId === conversation.id;
                  return (
                    <div key={conversation.id} className="conv-swipe-wrap ai-conv-swipe">
                      <div className="conv-actions ai-conv-actions">
                        <button type="button" className="conv-action ai-conv-action ai-conv-action--pin" onClick={() => toggleConversationPin(conversation.id)}>
                          <IonIcon icon={pinOutline} />
                          <span>{conversation.pinned ? 'Unpin' : 'Pin'}</span>
                        </button>
                        <label className="conv-action ai-conv-action ai-conv-action--category">
                          <span>Category</span>
                          <select
                            className="ai-conv-category-select"
                            value={conversation.categoryId}
                            onChange={event => updateConversationCategory(conversation.id, event.target.value)}
                          >
                            {state.categories.map(category => (
                              <option key={category.id} value={category.id}>{category.name}</option>
                            ))}
                          </select>
                        </label>
                      </div>

                      <button
                        className={`conv-row ai-conv-row${isSwiped ? ' swiped' : ''}`}
                        onClick={() => openConversation(conversation.id)}
                        onPointerDown={onPointerDown}
                        onPointerUp={event => onPointerUp(conversation.id, event)}
                      >
                        <div className="chat-avatar" style={{ background: colorForConversation(conversation.id) }}>
                          {(state.coachName || 'AI').slice(0, 2).toUpperCase()}
                        </div>
                        <div className="conv-body">
                          <div className="conv-top">
                            <span className="conv-name">{conversation.title}</span>
                            <div className="conv-top-right">
                              {conversation.pinned ? <IonIcon icon={pinOutline} className="conv-status-pin" /> : null}
                              <span className="conv-time">{new Date(conversation.updatedAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <div className="conv-bottom">
                            <span className="conv-preview">{last?.content ?? 'No messages yet'}</span>
                          </div>
                        </div>
                      </button>
                    </div>
                  );
                })}
                {filteredConversations.length === 0 ? <div className="conv-empty"><p>No chats in this category yet.</p></div> : null}
              </div>
              <button className="new-message-fab" onClick={createConversation} aria-label="New AI coach chat">
                <IonIcon icon={addOutline} />
              </button>
            </section>

            <section className={`chat-panel chat-thread-panel ${threadClass}`}>
              {activeConversation ? (
                <>
                  <div className="thread-header">
                    <button className="back-btn" onClick={() => setState(prev => ({ ...prev, activeConversationId: null }))} aria-label="Back to AI chats">
                      <IonIcon icon={chevronBackOutline} />
                      <span>Back</span>
                    </button>
                    <div className="thread-contact">
                      <div className="thread-name ai-thread-title">{getConversationPromptTitle(activeConversation)}</div>
                    </div>
                    <button
                      type="button"
                      className="thread-action-btn ai-thread-rename-btn"
                      aria-label="Rename chat"
                      onClick={() => renameConversation(activeConversation.id)}
                    >
                      <IonIcon icon={createOutline} />
                    </button>
                  </div>

                  <div className="thread-messages">
                    {activeConversation.messages.length ? (
                      activeConversation.messages.map((message, index) => {
                        const prev = activeConversation.messages[index - 1];
                        const next = activeConversation.messages[index + 1];
                        const groupStart = !prev || prev.role !== message.role;
                        const groupEnd = !next || next.role !== message.role;
                        const participantLabel = message.role === 'assistant'
                          ? (state.coachName || 'AI Coach')
                          : defaultLoggedInEmployee.displayName;
                        return (
                          <div key={message.id} className={`msg-row ${message.role === 'user' ? 'me' : 'other'}${groupStart ? ' group-start' : ''}`}>
                            <div className="bubble-stack">
                              {groupStart ? (
                                <span className={`ai-bubble-label ${message.role === 'user' ? 'ai-bubble-label--me' : 'ai-bubble-label--assistant'}`}>
                                  {participantLabel}
                                </span>
                              ) : null}
                              <div className={`bubble ${message.role === 'user' ? 'bubble-me' : 'bubble-other'}${groupEnd ? ' tail' : ''}`}>
                                {message.content}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="conv-empty">
                        <p>Ask for help with conflict handling, relationship management, or career growth planning.</p>
                      </div>
                    )}
                    {isSending ? <div className="ai-thinking">Thinking...</div> : null}
                  </div>

                  <div className="thread-input-bar">
                    <textarea className="msg-input" rows={1} value={draft} onChange={event => setDraft(event.target.value)} onKeyDown={onComposerKeyDown} placeholder="Ask your AI coach..." />
                    <button className={`send-btn${draft.trim() ? ' ready' : ''}`} type="button" onClick={sendMessage} disabled={!draft.trim() || isSending}>
                      <IonIcon icon={sendOutline} />
                    </button>
                  </div>
                  {error ? <p className="ai-error">{error}</p> : null}
                </>
              ) : null}
            </section>
          </div>
        )}
      </IonContent>
    </IonPage>
  );
};

async function requestCoachReply(payload: CoachApiPayload): Promise<string> {
  const response = await fetch('/api/ai-coach', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const parsed = (await response.json()) as { reply?: string; error?: string };
  if (!response.ok || !parsed.reply) throw new Error(parsed.error || 'AI coach request failed');
  return parsed.reply;
}

export default AICoachPage;
