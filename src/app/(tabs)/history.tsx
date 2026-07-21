import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useHisaab } from '../../context/HisaabContext';
import { C, fmt } from '../../constants/theme';

type Filter = 'all' | 'income' | 'expense';

export default function HistoryScreen() {
  const { data, save } = useHisaab();
  const [filter,    setFilter]    = useState<Filter>('all');
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const txs = data.transactions.filter(t => filter === 'all' || t.type === filter);

  const del = (tid: string) => {
    const tx = data.transactions.find(t => t.id === tid);
    if (!tx) return;
    let nd = { ...data, transactions: data.transactions.filter(t => t.id !== tid) };
    if (tx.type === 'income') {
      if (tx.source === 'bank') nd.bankBalance = (nd.bankBalance || 0) - tx.amount;
      else                      nd.cashBalance  = (nd.cashBalance  || 0) - tx.amount;
    } else {
      if (tx.source === 'bank') nd.bankBalance = (nd.bankBalance || 0) + tx.amount;
      else                      nd.cashBalance  = (nd.cashBalance  || 0) + tx.amount;
    }
    save(nd);
    setConfirmId(null);
  };

  const balanceEffect = (tx: typeof data.transactions[0]) =>
    tx.type === 'income'
      ? `${tx.source === 'bank' ? 'Bank' : 'Cash'} -$${fmt(tx.amount)} (reversed)`
      : `${tx.source === 'bank' ? 'Bank' : 'Cash'} +$${fmt(tx.amount)} (reversed)`;

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.headerTitle}>History 📋</Text>
      </View>

      {/* Info tip */}
      <View style={s.tip}>
        <Text style={s.tipTxt}>🗑 Tap the red button to delete a transaction. Your balance updates automatically.</Text>
      </View>

      {/* Filter buttons */}
      <View style={s.filterRow}>
        {(['all', 'income', 'expense'] as Filter[]).map(f => (
          <TouchableOpacity
            key={f}
            style={[s.filterBtn, filter === f && s.filterBtnActive]}
            onPress={() => { setFilter(f); setConfirmId(null); }}
          >
            <Text style={[s.filterTxt, filter === f && s.filterTxtActive]}>
              {f === 'all' ? 'All' : f === 'income' ? '💰 Income' : '💸 Expenses'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {txs.length === 0 ? (
          <View style={s.emptyState}>
            <Text style={{ fontSize: 32, marginBottom: 8 }}>📋</Text>
            <Text style={s.emptyTxt}>No transactions yet</Text>
          </View>
        ) : (
          <View style={s.card}>
            {txs.map((t, i) => {
              const isConf = confirmId === t.id;
              return (
                <View key={t.id} style={[s.txWrapper, i === txs.length - 1 && !isConf && { borderBottomWidth: 0 }]}>
                  {/* Transaction row */}
                  <View style={s.txRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={s.txCategory}>{t.category}</Text>
                      <Text style={s.txMeta}>
                        {t.desc ? `${t.desc} · ` : ''}
                        {t.source === 'cash' ? '💵' : '🏦'} {t.date}
                      </Text>
                    </View>
                    <View style={s.txRight}>
                      <Text style={[s.txAmount, { color: t.type === 'income' ? C.income : C.expense }]}>
                        {t.type === 'income' ? '+' : '-'}${fmt(t.amount)}
                      </Text>
                      <TouchableOpacity
                        style={[s.deleteBtn, isConf && s.deleteBtnActive]}
                        onPress={() => setConfirmId(isConf ? null : t.id)}
                      >
                        <Text style={{ fontSize: 16 }}>🗑</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Confirm panel */}
                  {isConf && (
                    <View style={s.confirmBox}>
                      <Text style={s.confirmTitle}>Delete this transaction?</Text>
                      <Text style={s.confirmDetail}>
                        <Text style={{ fontWeight: '700' }}>{t.category}</Text>
                        {t.desc ? ` — ${t.desc}` : ''} · ${fmt(t.amount)}
                      </Text>
                      <View style={s.confirmWarning}>
                        <Text style={s.confirmWarningTxt}>⚠️ {balanceEffect(t)}</Text>
                      </View>
                      <View style={s.confirmBtns}>
                        <TouchableOpacity style={[s.confirmBtn, { backgroundColor: C.expense }]} onPress={() => del(t.id)}>
                          <Text style={s.confirmBtnTxt}>Yes, Delete It</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[s.confirmBtn, { backgroundColor: '#BBB', flex: 0.7 }]} onPress={() => setConfirmId(null)}>
                          <Text style={s.confirmBtnTxt}>Cancel</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}
        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container:       { flex: 1, backgroundColor: C.bg },
  header:          { backgroundColor: C.green, paddingTop: 52, paddingBottom: 16, paddingHorizontal: 20 },
  headerTitle:     { color: C.white, fontSize: 22, fontWeight: '800' },
  tip:             { backgroundColor: '#EEF7F2', padding: 10, paddingHorizontal: 14 },
  tipTxt:          { fontSize: 12, color: C.green, fontWeight: '500' },
  filterRow:       { flexDirection: 'row', gap: 8, padding: 12, backgroundColor: C.white, borderBottomWidth: 1, borderBottomColor: C.border },
  filterBtn:       { flex: 1, padding: 8, borderRadius: 10, borderWidth: 1.5, borderColor: C.border, backgroundColor: C.white, alignItems: 'center' },
  filterBtnActive: { backgroundColor: C.green, borderColor: C.green },
  filterTxt:       { fontSize: 11, fontWeight: '600', color: C.muted },
  filterTxtActive: { color: C.white },
  scroll:          { padding: 14 },
  card:            { backgroundColor: C.card, borderRadius: 16, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, elevation: 2, overflow: 'hidden' },
  emptyState:      { alignItems: 'center', marginTop: 60 },
  emptyTxt:        { color: '#CCC', fontSize: 14, marginTop: 4 },
  txWrapper:       { borderBottomWidth: 1, borderBottomColor: C.border },
  txRow:           { flexDirection: 'row', alignItems: 'center', padding: 14 },
  txCategory:      { fontSize: 13, fontWeight: '700', color: C.text, marginBottom: 2 },
  txMeta:          { fontSize: 11, color: C.muted },
  txRight:         { flexDirection: 'row', alignItems: 'center', gap: 8 },
  txAmount:        { fontSize: 15, fontWeight: '800' },
  deleteBtn:       { backgroundColor: '#FFF0F0', borderRadius: 8, width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  deleteBtnActive: { backgroundColor: C.expense },
  confirmBox:      { backgroundColor: '#FFF0F0', margin: 10, marginTop: 0, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: C.expense },
  confirmTitle:    { fontSize: 13, fontWeight: '700', color: C.expense, marginBottom: 4 },
  confirmDetail:   { fontSize: 12, color: C.muted, marginBottom: 8 },
  confirmWarning:  { backgroundColor: '#FFFBF0', borderRadius: 6, padding: 6, marginBottom: 10 },
  confirmWarningTxt: { fontSize: 11, color: '#856404' },
  confirmBtns:     { flexDirection: 'row', gap: 8 },
  confirmBtn:      { flex: 1, borderRadius: 10, padding: 10, alignItems: 'center' },
  confirmBtnTxt:   { color: C.white, fontWeight: '700', fontSize: 13 },
});
