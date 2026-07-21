import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { useHisaab } from '../../context/HisaabContext';
import { C, fmt, fmtINR, uid } from '../../constants/theme';

type SubTab = 'split' | 'credit' | 'reminders';

export default function MoneyScreen() {
  const [sub, setSub] = useState<SubTab>('split');
  const { data } = useHisaab();
  const today = new Date().toISOString().slice(0, 10);
  const overdueCount = data.reminders.filter(r => !r.done && r.dueDate && r.dueDate < today).length;

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.headerTitle}>Money 💰</Text>
      </View>
      <View style={s.subTabRow}>
        {(['split', 'credit', 'reminders'] as SubTab[]).map(t => (
          <TouchableOpacity key={t} style={[s.subTab, sub === t && s.subTabActive]} onPress={() => setSub(t)}>
            <Text style={[s.subTabTxt, sub === t && s.subTabTxtActive]}>
              {t === 'split' ? '👥 Split' : t === 'credit' ? '💳 Credit' : `⏰ Reminders${overdueCount > 0 ? ` (${overdueCount})` : ''}`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        {sub === 'split'     && <SplitSection />}
        {sub === 'credit'    && <CreditSection />}
        {sub === 'reminders' && <RemindersSection />}
        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}

// ─── SPLIT ────────────────────────────────────────────────────────────────────
function SplitSection() {
  const { data, save } = useHisaab();
  const [person,    setPerson]    = useState('');
  const [amount,    setAmount]    = useState('');
  const [desc,      setDesc]      = useState('');
  const [direction, setDirection] = useState<'owed_to_me'|'i_owe'>('owed_to_me');
  const [saved,     setSaved]     = useState(false);
  const [settling,  setSettling]  = useState<string|null>(null);

  const add = () => {
    if (!person || !amount) return;
    const e = { id: uid(), person, amount: parseFloat(amount), desc, direction, date: new Date().toISOString().slice(0, 10), settled: false };
    save({ ...data, splits: [e, ...data.splits] });
    setSaved(true);
    setTimeout(() => { setSaved(false); setPerson(''); setAmount(''); setDesc(''); }, 1200);
  };

  const settle = (sp: typeof data.splits[0], source: 'cash'|'bank') => {
    const updated = data.splits.map(x => x.id === sp.id ? { ...x, settled: true, settledDate: new Date().toISOString().slice(0, 10) } : x);
    const isIn    = sp.direction === 'owed_to_me';
    const tx      = { id: uid(), type: (isIn ? 'income' : 'expense') as 'income'|'expense', source, amount: sp.amount, category: isIn ? 'Split Received' : 'Split Paid', desc: `${sp.person}${sp.desc ? ` - ${sp.desc}` : ''}`, date: new Date().toISOString().slice(0, 10) };
    let nd        = { ...data, splits: updated, transactions: [tx, ...data.transactions] };
    if (isIn) { if (source === 'bank') nd.bankBalance += sp.amount; else nd.cashBalance += sp.amount; }
    else       { if (source === 'bank') nd.bankBalance -= sp.amount; else nd.cashBalance -= sp.amount; }
    save(nd); setSettling(null);
  };

  const remove = (id: string) => save({ ...data, splits: data.splits.filter(s => s.id !== id) });

  const open     = data.splits.filter(s => !s.settled);
  const settled  = data.splits.filter(s => s.settled).slice(0, 10);
  const toMe     = open.filter(s => s.direction === 'owed_to_me').reduce((a, s) => a + s.amount, 0);
  const iOwe     = open.filter(s => s.direction === 'i_owe').reduce((a, s) => a + s.amount, 0);

  return (
    <View>
      {(toMe > 0 || iOwe > 0) && (
        <View>
          <View style={s.row2}>
            {toMe > 0 && <View style={[s.card, { flex: 1, backgroundColor: '#FFFBF0', borderWidth: 1.5, borderColor: C.gold, borderStyle: 'dashed' }]}><Text style={{ fontSize: 9, color: '#A07828', fontWeight: '700' }}>⏳ NOT RECEIVED YET</Text><Text style={{ fontSize: 22, fontWeight: '900', color: '#A07828' }}>${fmt(toMe)}</Text></View>}
            {iOwe > 0 && <View style={[s.card, { flex: 1, backgroundColor: '#FFF0F0', borderWidth: 1.5, borderColor: C.expense, borderStyle: 'dashed' }]}><Text style={{ fontSize: 9, color: C.expense, fontWeight: '700' }}>⚠️ YOU OWE</Text><Text style={{ fontSize: 22, fontWeight: '900', color: C.expense }}>${fmt(iOwe)}</Text></View>}
          </View>
          <View style={{ backgroundColor: C.bg, borderRadius: 8, padding: 8, marginBottom: 12 }}>
            <Text style={{ fontSize: 11, color: C.muted, textAlign: 'center' }}>⚠️ Not in your balance until settled</Text>
          </View>
        </View>
      )}

      <View style={s.card}>
        <Text style={s.label}>Add Split Entry</Text>
        <View style={[s.row2, { marginBottom: 12 }]}>
          {(['owed_to_me', 'i_owe'] as const).map(d => (
            <TouchableOpacity key={d} style={[s.toggle, direction === d && { borderColor: d === 'owed_to_me' ? C.income : C.expense, backgroundColor: d === 'owed_to_me' ? '#F0FFF6' : '#FFF0F0' }]} onPress={() => setDirection(d)}>
              <Text style={[s.toggleTxt, direction === d && { color: d === 'owed_to_me' ? C.income : C.expense }]}>{d === 'owed_to_me' ? '💰 They owe me' : '💸 I owe them'}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TextInput style={s.input} placeholder="Person name" value={person} onChangeText={setPerson} />
        <TextInput style={[s.input, { fontSize: 20, fontWeight: '800' }]} keyboardType="decimal-pad" placeholder="Amount ($)" value={amount} onChangeText={setAmount} />
        {!!amount && <Text style={s.inrHint}>{fmtINR(parseFloat(amount) || 0)}</Text>}
        <TextInput style={[s.input, { marginBottom: 14 }]} placeholder="What for? (optional)" value={desc} onChangeText={setDesc} />
        <TouchableOpacity style={[s.bigBtn, { backgroundColor: saved ? C.income : C.green }]} onPress={add}>
          <Text style={s.bigBtnTxt}>{saved ? '✓ Added!' : 'Add Split'}</Text>
        </TouchableOpacity>
      </View>

      {open.length > 0 && (
        <View style={s.card}>
          <View style={s.rowBetween}>
            <Text style={s.label}>Pending Splits</Text>
            <Text style={{ fontSize: 10, color: C.muted }}>not in balance yet</Text>
          </View>
          {open.map(sp => (
            <View key={sp.id}>
              <View style={s.listRow}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 10 }}>{sp.direction === 'owed_to_me' ? '⏳' : '⚠️'} <Text style={{ fontSize: 14, fontWeight: '700' }}>{sp.person}</Text></Text>
                  <Text style={{ fontSize: 11, color: C.muted }}>{sp.direction === 'owed_to_me' ? 'Owes you' : 'You owe'}{sp.desc ? ` · ${sp.desc}` : ''}</Text>
                </View>
                <View style={s.row2}>
                  <Text style={{ fontSize: 15, fontWeight: '800', color: sp.direction === 'owed_to_me' ? '#A07828' : C.expense }}>${fmt(sp.amount)}</Text>
                  <TouchableOpacity style={sp.direction === 'owed_to_me' ? s.smBtnAmber : s.smBtnRed} onPress={() => setSettling(settling === sp.id ? null : sp.id)}>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: sp.direction === 'owed_to_me' ? '#856404' : C.expense }}>{sp.direction === 'owed_to_me' ? 'Received ✓' : 'Paid ✓'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => remove(sp.id)}><Text style={{ color: '#DDD', fontSize: 18 }}>×</Text></TouchableOpacity>
                </View>
              </View>
              {settling === sp.id && (
                <View style={{ backgroundColor: '#FFFBF0', borderRadius: 10, padding: 10, marginBottom: 8, borderWidth: 1, borderColor: C.gold }}>
                  <Text style={{ fontSize: 12, color: '#856404', fontWeight: '600', marginBottom: 8 }}>
                    {sp.direction === 'owed_to_me' ? `Received $${fmt(sp.amount)} — where?` : `Paid $${fmt(sp.amount)} — from where?`}
                  </Text>
                  <View style={s.row2}>
                    <TouchableOpacity style={[s.bigBtn, { flex: 1, marginTop: 0 }]} onPress={() => settle(sp, 'cash')}><Text style={s.bigBtnTxt}>💵 Cash</Text></TouchableOpacity>
                    <TouchableOpacity style={[s.bigBtn, { flex: 1, marginTop: 0, backgroundColor: C.blue }]} onPress={() => settle(sp, 'bank')}><Text style={s.bigBtnTxt}>🏦 Bank</Text></TouchableOpacity>
                    <TouchableOpacity style={[s.bigBtn, { flex: 0.6, marginTop: 0, backgroundColor: '#BBB' }]} onPress={() => setSettling(null)}><Text style={s.bigBtnTxt}>✕</Text></TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          ))}
        </View>
      )}

      {settled.length > 0 && (
        <View style={s.card}>
          <Text style={s.label}>Settled ✓</Text>
          {settled.map((sp, i) => (
            <View key={sp.id} style={[s.listRow, i === settled.length - 1 && { borderBottomWidth: 0 }]}>
              <Text style={{ fontSize: 13, color: C.muted }}>{sp.person}{sp.desc ? ` – ${sp.desc}` : ''}</Text>
              <Text style={{ fontSize: 13, color: '#CCC', fontWeight: '700' }}>✓ ${fmt(sp.amount)}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

// ─── CREDIT ───────────────────────────────────────────────────────────────────
function CreditSection() {
  const { data, save } = useHisaab();
  const [showAdd,    setShowAdd]    = useState(false);
  const [cardName,   setCardName]   = useState('');
  const [balance,    setBalance]    = useState('');
  const [limit,      setLimit]      = useState('');
  const [payingCard, setPayingCard] = useState<string|null>(null);
  const [payAmount,  setPayAmount]  = useState('');
  const [paySource,  setPaySource]  = useState<'bank'|'cash'>('bank');

  const cards     = data.creditCards;
  const totalOwed = cards.reduce((a, c) => a + (c.balance || 0), 0);

  const addCard = () => {
    if (!cardName) return;
    save({ ...data, creditCards: [...cards, { id: uid(), name: cardName, balance: parseFloat(balance) || 0, limit: parseFloat(limit) || 0, payments: [] }] });
    setShowAdd(false); setCardName(''); setBalance(''); setLimit('');
  };

  const logPayment = (cardId: string) => {
    const amt  = parseFloat(payAmount); if (!amt) return;
    const card = cards.find(c => c.id === cardId); if (!card) return;
    const uc   = cards.map(c => c.id === cardId ? { ...c, balance: Math.max(0, c.balance - amt), payments: [...c.payments, { id: uid(), amount: amt, date: new Date().toISOString().slice(0, 10), source: paySource }] } : c);
    const tx   = { id: uid(), type: 'expense' as const, source: paySource, amount: amt, category: 'Credit Payment', desc: `${card.name} payment`, date: new Date().toISOString().slice(0, 10) };
    let nd = { ...data, creditCards: uc, transactions: [tx, ...data.transactions] };
    if (paySource === 'bank') nd.bankBalance -= amt; else nd.cashBalance -= amt;
    save(nd); setPayingCard(null); setPayAmount('');
  };

  return (
    <View>
      {totalOwed > 0 && (
        <View style={[s.card, { backgroundColor: C.purpleLight, alignItems: 'center' }]}>
          <Text style={{ fontSize: 10, color: '#7D3C98', fontWeight: '600', letterSpacing: 1, marginBottom: 4 }}>TOTAL CREDIT OWED</Text>
          <Text style={{ fontSize: 36, fontWeight: '900', color: C.purple }}>${fmt(totalOwed)}</Text>
          <Text style={{ fontSize: 13, color: '#9B59B6', marginTop: 2 }}>{fmtINR(totalOwed)}</Text>
          <Text style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>Separate from your real balance</Text>
        </View>
      )}

      {cards.map(card => {
        const pct  = card.limit > 0 ? Math.min(100, (card.balance / card.limit) * 100) : 0;
        const barC = pct > 70 ? C.expense : pct > 40 ? C.gold : C.purple;
        return (
          <View key={card.id} style={s.card}>
            <View style={s.rowBetween}>
              <View><Text style={{ fontSize: 16, fontWeight: '700' }}>💳 {card.name}</Text>{card.limit > 0 && <Text style={{ fontSize: 11, color: C.muted }}>Limit: ${fmt(card.limit)}</Text>}</View>
              <Text style={{ fontSize: 22, fontWeight: '900', color: C.purple }}>${fmt(card.balance)}</Text>
            </View>
            {card.limit > 0 && (
              <View style={{ marginBottom: 10 }}>
                <View style={{ backgroundColor: '#EEE', borderRadius: 4, height: 7, overflow: 'hidden' }}>
                  <View style={{ backgroundColor: barC, width: `${pct}%`, height: '100%', borderRadius: 4 }} />
                </View>
                <Text style={{ fontSize: 10, color: C.muted, marginTop: 3 }}>{pct.toFixed(0)}% of limit used</Text>
              </View>
            )}
            {payingCard === card.id ? (
              <View>
                <TextInput style={[s.input, { fontSize: 20, fontWeight: '800' }]} keyboardType="decimal-pad" placeholder="Payment amount" value={payAmount} onChangeText={setPayAmount} autoFocus />
                {!!payAmount && <Text style={s.inrHint}>New balance: ${fmt(Math.max(0, card.balance - parseFloat(payAmount)))}</Text>}
                <View style={[s.row2, { marginBottom: 8 }]}>
                  {(['bank', 'cash'] as const).map(src => (
                    <TouchableOpacity key={src} style={[s.toggle, paySource === src && { borderColor: C.purple, backgroundColor: C.purpleLight }]} onPress={() => setPaySource(src)}>
                      <Text style={[s.toggleTxt, paySource === src && { color: C.purple }]}>{src === 'bank' ? '🏦 Bank' : '💵 Cash'}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <View style={s.row2}>
                  <TouchableOpacity style={[s.bigBtn, { flex: 2, backgroundColor: C.purple, marginTop: 0 }]} onPress={() => logPayment(card.id)}><Text style={s.bigBtnTxt}>Log Payment</Text></TouchableOpacity>
                  <TouchableOpacity style={[s.bigBtn, s.grayBtn, { flex: 1, marginTop: 0 }]} onPress={() => { setPayingCard(null); setPayAmount(''); }}><Text style={s.bigBtnTxt}>Cancel</Text></TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity style={[s.bigBtn, { backgroundColor: C.purple }]} onPress={() => { setPayingCard(card.id); setPayAmount(''); }}>
                <Text style={s.bigBtnTxt}>💳 Log Payment</Text>
              </TouchableOpacity>
            )}
          </View>
        );
      })}

      {showAdd ? (
        <View style={s.card}>
          <Text style={s.label}>Add Credit Card</Text>
          <TextInput style={s.input} placeholder="Card name (e.g. Discover, Macy's)" value={cardName} onChangeText={setCardName} autoFocus />
          <TextInput style={s.input} keyboardType="decimal-pad" placeholder="Current balance owed ($)" value={balance} onChangeText={setBalance} />
          <TextInput style={[s.input, { marginBottom: 14 }]} keyboardType="decimal-pad" placeholder="Credit limit (optional)" value={limit} onChangeText={setLimit} />
          <View style={s.row2}>
            <TouchableOpacity style={[s.bigBtn, { flex: 2, backgroundColor: C.purple, marginTop: 0 }]} onPress={addCard}><Text style={s.bigBtnTxt}>Add Card</Text></TouchableOpacity>
            <TouchableOpacity style={[s.bigBtn, s.grayBtn, { flex: 1, marginTop: 0 }]} onPress={() => setShowAdd(false)}><Text style={s.bigBtnTxt}>Cancel</Text></TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity style={[s.dashedBtn, { borderColor: C.purple }]} onPress={() => setShowAdd(true)}>
          <Text style={{ color: C.purple, fontWeight: '700' }}>+ Add Credit Card</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── REMINDERS ────────────────────────────────────────────────────────────────
function RemindersSection() {
  const { data, save } = useHisaab();
  const [title,   setTitle]   = useState('');
  const [amount,  setAmount]  = useState('');
  const [dueDate, setDueDate] = useState('');
  const [saved,   setSaved]   = useState(false);

  const add = () => {
    if (!title.trim()) return;
    const r = { id: uid(), title: title.trim(), amount: parseFloat(amount) || 0, dueDate, done: false, createdDate: new Date().toISOString().slice(0, 10) };
    save({ ...data, reminders: [r, ...data.reminders] });
    setSaved(true);
    setTimeout(() => { setSaved(false); setTitle(''); setAmount(''); setDueDate(''); }, 1200);
  };

  const markDone = (id: string) => save({ ...data, reminders: data.reminders.map(r => r.id === id ? { ...r, done: true } : r) });
  const remove   = (id: string) => save({ ...data, reminders: data.reminders.filter(r => r.id !== id) });

  const today    = new Date().toISOString().slice(0, 10);
  const open     = data.reminders.filter(r => !r.done);
  const done     = data.reminders.filter(r => r.done).slice(0, 5);
  const overdue  = open.filter(r => r.dueDate && r.dueDate < today);
  const upcoming = open.filter(r => !r.dueDate || r.dueDate >= today);

  const ReminderRow = ({ r }: { r: typeof data.reminders[0] }) => {
    const isOverdue = r.dueDate && r.dueDate < today;
    const isDueSoon = r.dueDate && r.dueDate >= today && r.dueDate <= new Date(Date.now() + 3 * 864e5).toISOString().slice(0, 10);
    return (
      <View style={[s.reminderRow, isOverdue ? s.reminderOverdue : isDueSoon ? s.reminderSoon : {}]}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: isOverdue ? C.expense : C.text }}>
            {isOverdue ? '🚨' : isDueSoon ? '⏰' : '📌'} {r.title}
          </Text>
          {r.amount > 0 && <Text style={{ fontSize: 13, color: C.gold, fontWeight: '700' }}>${fmt(r.amount)}</Text>}
          {r.dueDate ? <Text style={{ fontSize: 11, color: isOverdue ? C.expense : C.muted }}>{isOverdue ? 'Overdue: ' : 'Due: '}{r.dueDate}</Text>
                     : <Text style={{ fontSize: 11, color: C.muted }}>No due date</Text>}
        </View>
        <View style={s.row2}>
          <TouchableOpacity style={s.smBtnGreen} onPress={() => markDone(r.id)}><Text style={[s.smBtnTxt, { color: C.income }]}>Done ✓</Text></TouchableOpacity>
          <TouchableOpacity onPress={() => remove(r.id)}><Text style={{ color: '#DDD', fontSize: 18 }}>×</Text></TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View>
      <View style={s.card}>
        <Text style={s.label}>Add Reminder</Text>
        <TextInput style={s.input} placeholder='e.g. "Ask Ashok for IKP pay"' value={title} onChangeText={setTitle} />
        <TextInput style={s.input} keyboardType="decimal-pad" placeholder="Amount (optional)" value={amount} onChangeText={setAmount} />
        <Text style={s.label}>Due Date (optional)</Text>
        <TextInput style={[s.input, { marginBottom: 14 }]} placeholder="YYYY-MM-DD" value={dueDate} onChangeText={setDueDate} />
        <TouchableOpacity style={[s.bigBtn, { backgroundColor: saved ? C.income : C.green }]} onPress={add}>
          <Text style={s.bigBtnTxt}>{saved ? '✓ Added!' : 'Add Reminder'}</Text>
        </TouchableOpacity>
      </View>

      {overdue.length > 0 && (
        <View style={s.card}>
          <Text style={[s.label, { color: C.expense }]}>🚨 Overdue</Text>
          {overdue.map(r => <ReminderRow key={r.id} r={r} />)}
        </View>
      )}
      {upcoming.length > 0 && (
        <View style={s.card}>
          <Text style={s.label}>📌 Upcoming</Text>
          {upcoming.map(r => <ReminderRow key={r.id} r={r} />)}
        </View>
      )}
      {done.length > 0 && (
        <View style={s.card}>
          <Text style={s.label}>Done ✓</Text>
          {done.map((r, i) => (
            <View key={r.id} style={[s.listRow, i === done.length - 1 && { borderBottomWidth: 0 }]}>
              <Text style={{ fontSize: 13, color: C.muted }}>{r.title}{r.amount > 0 ? ` · $${fmt(r.amount)}` : ''}</Text>
              <TouchableOpacity onPress={() => remove(r.id)}><Text style={{ color: '#DDD', fontSize: 16 }}>×</Text></TouchableOpacity>
            </View>
          ))}
        </View>
      )}
      {open.length === 0 && done.length === 0 && (
        <View style={{ alignItems: 'center', marginTop: 40 }}>
          <Text style={{ fontSize: 28 }}>⏰</Text>
          <Text style={{ color: '#CCC', fontSize: 14, marginTop: 8 }}>No reminders yet</Text>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container:       { flex: 1, backgroundColor: C.bg },
  header:          { backgroundColor: C.green, paddingTop: 52, paddingBottom: 16, paddingHorizontal: 20 },
  headerTitle:     { color: C.white, fontSize: 22, fontWeight: '800' },
  subTabRow:       { flexDirection: 'row', gap: 6, padding: 12, backgroundColor: C.white, borderBottomWidth: 1, borderBottomColor: C.border },
  subTab:          { flex: 1, padding: 9, borderRadius: 12, borderWidth: 1.5, borderColor: C.border, alignItems: 'center' },
  subTabActive:    { backgroundColor: C.green, borderColor: C.green },
  subTabTxt:       { fontSize: 11, fontWeight: '700', color: C.muted },
  subTabTxtActive: { color: C.white },
  scroll:          { padding: 14 },
  card:            { backgroundColor: C.card, borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  label:           { fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6, fontWeight: '600' },
  input:           { backgroundColor: C.bg, borderWidth: 1.5, borderColor: C.border, borderRadius: 10, padding: 11, fontSize: 15, color: C.text, marginBottom: 8 },
  inrHint:         { fontSize: 13, color: C.gold, fontWeight: '600', marginBottom: 8 },
  row2:            { flexDirection: 'row', gap: 8, alignItems: 'center' },
  rowBetween:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  toggle:          { flex: 1, padding: 9, borderRadius: 10, borderWidth: 1.5, borderColor: C.border, backgroundColor: C.white, alignItems: 'center' },
  toggleTxt:       { fontWeight: '600', fontSize: 12, color: C.muted },
  listRow:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: C.border },
  bigBtn:          { backgroundColor: C.green, borderRadius: 12, padding: 13, alignItems: 'center', marginTop: 8 },
  bigBtnTxt:       { color: C.white, fontWeight: '700', fontSize: 14 },
  grayBtn:         { backgroundColor: '#BBB' },
  dashedBtn:       { borderWidth: 2, borderColor: C.green, borderStyle: 'dashed', borderRadius: 12, padding: 12, alignItems: 'center', marginBottom: 12 },
  smBtnGreen:      { backgroundColor: '#E8F5EE', borderRadius: 8, paddingVertical: 5, paddingHorizontal: 10 },
  smBtnAmber:      { backgroundColor: '#FFF3CD', borderRadius: 8, paddingVertical: 5, paddingHorizontal: 10 },
  smBtnRed:        { backgroundColor: '#FFF0F0', borderRadius: 8, paddingVertical: 5, paddingHorizontal: 10 },
  smBtnTxt:        { fontWeight: '700', fontSize: 11 },
  reminderRow:     { backgroundColor: C.bg, borderRadius: 10, padding: 12, marginBottom: 8, flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  reminderOverdue: { backgroundColor: '#FFF0F0', borderWidth: 1, borderColor: C.expense },
  reminderSoon:    { backgroundColor: '#FFFBF0', borderWidth: 1, borderColor: C.gold },
  purpleLight:     C.purpleLight,
});
