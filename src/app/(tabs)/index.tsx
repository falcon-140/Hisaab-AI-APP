import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useHisaab } from '../../context/HisaabContext';
import { C, fmt, fmtINR } from '../../constants/theme';

export default function HomeScreen() {
  const { data, save } = useHisaab();
  const router = useRouter();
  const [editBank,  setEditBank]  = useState(false);
  const [editCash,  setEditCash]  = useState(false);
  const [bankVal,   setBankVal]   = useState('');
  const [cashVal,   setCashVal]   = useState('');
  const [editAlert, setEditAlert] = useState(false);
  const [alertVal,  setAlertVal]  = useState('');

  const total     = (data.bankBalance || 0) + (data.cashBalance || 0);
  const thisMonth = new Date().toISOString().slice(0, 7);
  const mTx       = data.transactions.filter(t => t.date?.startsWith(thisMonth));
  const mIn       = mTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const mOut      = mTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const openSplits = data.splits.filter(s => !s.settled);
  const splitToMe  = openSplits.filter(s => s.direction === 'owed_to_me').reduce((a, s) => a + s.amount, 0);
  const splitIOwe  = openSplits.filter(s => s.direction === 'i_owe').reduce((a, s) => a + s.amount, 0);
  const totalCredit = data.creditCards.reduce((a, c) => a + (c.balance || 0), 0);
  const unpaidOwed  = data.hoursLog.filter(h => !h.paid).reduce((s, h) => s + h.hours * (h.rate || 9), 0);
  const belowAlert  = (data.alertThreshold > 0) && (total < data.alertThreshold);

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.headerTitle}>Hisaab 📒</Text>
        <Text style={s.headerSub}>Your money, clear as day</Text>
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        {/* Alert banner */}
        {belowAlert && (
          <View style={s.alertBanner}>
            <Text style={{ fontSize: 20 }}>🚨</Text>
            <View style={{ flex: 1 }}>
              <Text style={[s.alertText, { color: C.expense }]}>Balance below alert threshold!</Text>
              <Text style={s.alertSub}>Total ${fmt(total)} is under ${fmt(data.alertThreshold)}</Text>
            </View>
          </View>
        )}

        {/* Hero balance */}
        <View style={s.hero}>
          <Text style={s.heroLabel}>TOTAL BALANCE</Text>
          <Text style={s.heroAmount}>${fmt(total)}</Text>
          <Text style={s.heroINR}>{fmtINR(total)}</Text>
          <Text style={s.heroSub}>🏦 ${fmt(data.bankBalance)}  +  💵 ${fmt(data.cashBalance)}</Text>
        </View>

        {/* Bank + Cash cards */}
        <View style={s.row2}>
          {/* Bank card */}
          <View style={[s.card, s.flex1]}>
            <Text style={s.label}>🏦 Bank (Chase)</Text>
            {editBank ? (
              <View>
                <TextInput style={s.input} keyboardType="decimal-pad" placeholder="0.00" value={bankVal} onChangeText={setBankVal} autoFocus />
                <View style={s.row2}>
                  <TouchableOpacity style={[s.smBtnGreen, s.flex1]} onPress={() => { save({ ...data, bankBalance: parseFloat(bankVal) || 0 }); setEditBank(false); }}>
                    <Text style={s.smBtnTxt}>Save</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[s.smBtnGray, s.flex1]} onPress={() => setEditBank(false)}>
                    <Text style={s.smBtnTxt}>✕</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity onPress={() => { setBankVal(String(data.bankBalance)); setEditBank(true); }}>
                <Text style={s.balAmount}>${fmt(data.bankBalance)}</Text>
                <Text style={s.balINR}>{fmtINR(data.bankBalance)}</Text>
                <Text style={s.tapHint}>Tap to update</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Cash card */}
          <View style={[s.card, s.flex1]}>
            <Text style={s.label}>💵 Cash in Hand</Text>
            {editCash ? (
              <View>
                <TextInput style={s.input} keyboardType="decimal-pad" placeholder="0.00" value={cashVal} onChangeText={setCashVal} autoFocus />
                <View style={s.row2}>
                  <TouchableOpacity style={[s.smBtnGreen, s.flex1]} onPress={() => { save({ ...data, cashBalance: parseFloat(cashVal) || 0 }); setEditCash(false); }}>
                    <Text style={s.smBtnTxt}>Save</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[s.smBtnGray, s.flex1]} onPress={() => setEditCash(false)}>
                    <Text style={s.smBtnTxt}>✕</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity onPress={() => { setCashVal(String(data.cashBalance)); setEditCash(true); }}>
                <Text style={s.balAmount}>${fmt(data.cashBalance)}</Text>
                <Text style={s.balINR}>{fmtINR(data.cashBalance)}</Text>
                <Text style={s.tapHint}>Tap to update</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Alert threshold */}
        <View style={s.card}>
          <View style={s.rowBetween}>
            <View>
              <Text style={s.label}>🔔 Low Balance Alert</Text>
              {!editAlert && <Text style={[s.balAmount, { color: belowAlert ? C.expense : C.green, fontSize: 16 }]}>Alert at ${fmt(data.alertThreshold)}</Text>}
            </View>
            {!editAlert && (
              <TouchableOpacity style={s.smBtnGreen} onPress={() => { setAlertVal(String(data.alertThreshold)); setEditAlert(true); }}>
                <Text style={s.smBtnTxt}>✏️ Change</Text>
              </TouchableOpacity>
            )}
          </View>
          {editAlert && (
            <View style={{ marginTop: 8 }}>
              <TextInput style={s.input} keyboardType="decimal-pad" placeholder="e.g. 500" value={alertVal} onChangeText={setAlertVal} autoFocus />
              <View style={[s.row2, { marginTop: 8 }]}>
                <TouchableOpacity style={[s.smBtnGreen, s.flex1]} onPress={() => { save({ ...data, alertThreshold: parseFloat(alertVal) || 0 }); setEditAlert(false); }}>
                  <Text style={s.smBtnTxt}>Save</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[s.smBtnGray, s.flex1]} onPress={() => setEditAlert(false)}>
                  <Text style={s.smBtnTxt}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* Month summary */}
        <View style={s.card}>
          <Text style={s.label}>This Month</Text>
          <View style={s.row3}>
            {[
              { label: '↑ Income', val: mIn,       color: C.income },
              { label: '↓ Spent',  val: mOut,       color: C.expense },
              { label: '= Net',    val: mIn - mOut, color: mIn - mOut >= 0 ? C.income : C.expense },
            ].map(({ label, val, color }) => (
              <View key={label} style={{ flex: 1, alignItems: 'center' }}>
                <Text style={[s.statLabel, { color }]}>{label}</Text>
                <Text style={[s.statVal, { color }]}>${fmt(Math.abs(val))}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Pending splits */}
        {(splitToMe > 0 || splitIOwe > 0) && (
          <TouchableOpacity style={[s.card, { backgroundColor: '#FFFBF0', borderColor: C.gold, borderWidth: 1.5, borderStyle: 'dashed' }]} onPress={() => router.push('/(tabs)/money')}>
            <View style={s.rowBetween}>
              <Text style={[s.label, { color: '#A07828' }]}>⏳ Pending Splits</Text>
              <Text style={{ fontSize: 10, color: '#A07828', fontWeight: '600' }}>Not in balance →</Text>
            </View>
            <View style={s.row2}>
              {splitToMe > 0 && <View style={{ flex: 1 }}><Text style={{ fontSize: 10, color: '#856404', fontWeight: '700' }}>WAITING TO RECEIVE</Text><Text style={{ fontSize: 18, fontWeight: '800', color: '#A07828' }}>${fmt(splitToMe)}</Text></View>}
              {splitIOwe > 0 && <View style={{ flex: 1 }}><Text style={{ fontSize: 10, color: C.expense, fontWeight: '700' }}>YOU NEED TO PAY</Text><Text style={{ fontSize: 18, fontWeight: '800', color: C.expense }}>${fmt(splitIOwe)}</Text></View>}
            </View>
          </TouchableOpacity>
        )}

        {/* Credit owed */}
        {totalCredit > 0 && (
          <TouchableOpacity style={[s.card, { backgroundColor: C.purpleLight, borderLeftWidth: 4, borderLeftColor: C.purple }]} onPress={() => router.push('/(tabs)/money')}>
            <Text style={{ fontSize: 13, color: '#4A235A', fontWeight: '700' }}>💳 Total Credit Owed: ${fmt(totalCredit)}</Text>
            <Text style={{ fontSize: 11, color: '#7D3C98', marginTop: 2 }}>{fmtINR(totalCredit)} — tap to manage →</Text>
          </TouchableOpacity>
        )}

        {/* Unpaid hours */}
        {unpaidOwed > 0 && (
          <TouchableOpacity style={[s.card, { backgroundColor: C.goldLight, borderLeftWidth: 4, borderLeftColor: C.gold }]} onPress={() => router.push('/(tabs)/hours')}>
            <Text style={{ fontSize: 13, color: '#7A5C1A', fontWeight: '700' }}>⏱ ${fmt(unpaidOwed)} in unpaid work hours</Text>
            <Text style={{ fontSize: 11, color: '#A07828', marginTop: 2 }}>Tap to see hours tracker →</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container:  { flex: 1, backgroundColor: C.bg },
  header:     { backgroundColor: C.green, paddingTop: 52, paddingBottom: 16, paddingHorizontal: 20 },
  headerTitle:{ color: C.white, fontSize: 22, fontWeight: '800' },
  headerSub:  { color: C.white, fontSize: 11, opacity: 0.65, marginTop: 2 },
  scroll:     { padding: 14 },
  alertBanner:{ backgroundColor: '#FFF0F0', borderRadius: 12, padding: 12, marginBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1.5, borderColor: C.expense },
  alertText:  { fontSize: 13, fontWeight: '700' },
  alertSub:   { fontSize: 11, color: C.muted },
  hero:       { backgroundColor: C.green, borderRadius: 20, padding: 24, alignItems: 'center', marginBottom: 12 },
  heroLabel:  { color: C.white, fontSize: 11, opacity: 0.65, letterSpacing: 1, marginBottom: 6 },
  heroAmount: { color: C.white, fontSize: 44, fontWeight: '900', letterSpacing: -1 },
  heroINR:    { color: C.gold,  fontSize: 18, fontWeight: '700', marginTop: 6 },
  heroSub:    { color: C.white, fontSize: 12, opacity: 0.75, marginTop: 14 },
  card:       { backgroundColor: C.card, borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  label:      { fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6, fontWeight: '600' },
  input:      { backgroundColor: C.bg, borderWidth: 1.5, borderColor: C.border, borderRadius: 10, padding: 11, fontSize: 15, color: C.text, marginBottom: 8 },
  balAmount:  { fontSize: 22, fontWeight: '800', color: C.green },
  balINR:     { fontSize: 12, color: C.gold, marginTop: 2 },
  tapHint:    { fontSize: 10, color: '#CCC', marginTop: 5 },
  row2:       { flexDirection: 'row', gap: 10 },
  row3:       { flexDirection: 'row' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  flex1:      { flex: 1 },
  smBtnGreen: { backgroundColor: '#EEF7F2', borderRadius: 8, padding: 8, alignItems: 'center' },
  smBtnGray:  { backgroundColor: '#EEE',    borderRadius: 8, padding: 8, alignItems: 'center' },
  smBtnTxt:   { color: C.green, fontWeight: '700', fontSize: 13 },
  statLabel:  { fontSize: 10, fontWeight: '600', marginBottom: 3 },
  statVal:    { fontSize: 18, fontWeight: '800' },
});
