import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useHisaab } from '../../context/HisaabContext';
import { C, fmt, fmtINR, uid, EXPENSE_CATS, INCOME_CATS } from '../../constants/theme';

// ── Replace with your Anthropic API key in .env or here for personal use ──
const ANTHROPIC_KEY = 'YOUR_API_KEY_HERE';

async function scanReceipt(base64: string): Promise<{ amount?: number; merchant?: string; date?: string; category?: string } | null> {
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 300,
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: base64 } },
            { type: 'text', text: `Extract from this receipt: total amount, merchant name, date, category from: ${EXPENSE_CATS.join(', ')}. Reply ONLY valid JSON no markdown: {"amount":number,"merchant":"string","date":"YYYY-MM-DD or empty","category":"string"}` },
          ],
        }],
      }),
    });
    const d    = await res.json();
    const text = (d.content || []).map((c: any) => c.text || '').join('').replace(/```json|```/g, '').trim();
    return JSON.parse(text);
  } catch { return null; }
}

export default function AddScreen() {
  const { data, save } = useHisaab();
  const [type,     setType]     = useState<'expense'|'income'>('expense');
  const [source,   setSource]   = useState<'cash'|'bank'>('cash');
  const [amount,   setAmount]   = useState('');
  const [category, setCategory] = useState('');
  const [desc,     setDesc]     = useState('');
  const [date,     setDate]     = useState(new Date().toISOString().slice(0, 10));
  const [saved,    setSaved]    = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanMsg,  setScanMsg]  = useState('');

  const cats        = type === 'expense' ? EXPENSE_CATS : INCOME_CATS;
  const accentColor = type === 'expense' ? C.expense : C.income;

  // ── Receipt scan via camera ──
  const handleScan = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) { Alert.alert('Permission needed', 'Please allow camera access to scan receipts.'); return; }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.7,
      base64: true,
    });

    if (result.canceled || !result.assets[0]?.base64) return;

    setScanning(true);
    setScanMsg('Reading receipt with AI...');

    if (ANTHROPIC_KEY === 'YOUR_API_KEY_HERE') {
      setScanMsg('⚠️ Add your Anthropic API key to use receipt scanning.');
      setScanning(false);
      return;
    }

    const parsed = await scanReceipt(result.assets[0].base64);
    if (parsed) {
      if (parsed.amount)   setAmount(String(parsed.amount));
      if (parsed.category) setCategory(parsed.category);
      if (parsed.date)     setDate(parsed.date);
      if (parsed.merchant) setDesc(parsed.merchant);
      setType('expense');
      setScanMsg('✓ Receipt scanned! Review below and save.');
    } else {
      setScanMsg('Could not read receipt. Please fill in manually.');
    }
    setScanning(false);
  };

  const handleSave = () => {
    if (!amount || !category) return;
    const amt = parseFloat(amount);
    const tx = { id: uid(), type, source, amount: amt, category, desc, date };
    let nd = { ...data, transactions: [tx, ...data.transactions] };
    if (type === 'income') {
      if (source === 'bank') nd.bankBalance = (nd.bankBalance || 0) + amt;
      else                   nd.cashBalance = (nd.cashBalance || 0) + amt;
    } else {
      if (source === 'bank') nd.bankBalance = (nd.bankBalance || 0) - amt;
      else                   nd.cashBalance = (nd.cashBalance || 0) - amt;
    }
    save(nd);
    setSaved(true);
    setScanMsg('');
    setTimeout(() => { setSaved(false); setAmount(''); setCategory(''); setDesc(''); }, 1500);
  };

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.headerTitle}>Add Transaction</Text>
      </View>

      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

        {/* Scan receipt button */}
        <TouchableOpacity style={s.scanBtn} onPress={handleScan} disabled={scanning}>
          <Text style={{ fontSize: 32 }}>{scanning ? '⏳' : '📷'}</Text>
          <View style={{ flex: 1 }}>
            <Text style={s.scanTitle}>{scanning ? 'Scanning...' : 'Scan Receipt'}</Text>
            <Text style={s.scanSub}>Take a photo — AI fills in the details</Text>
          </View>
        </TouchableOpacity>

        {/* Voice tip */}
        <View style={[s.scanBtn, { backgroundColor: '#F0F7FF', borderColor: C.blue }]}>
          <Text style={{ fontSize: 32 }}>🎤</Text>
          <View style={{ flex: 1 }}>
            <Text style={[s.scanTitle, { color: C.blue }]}>Voice Input</Text>
            <Text style={s.scanSub}>Tap the mic 🎤 on your keyboard when typing the amount or note</Text>
          </View>
        </View>

        {scanMsg ? (
          <View style={s.scanMsg}><Text style={{ color: C.green, fontWeight: '600', fontSize: 12 }}>{scanMsg}</Text></View>
        ) : null}

        {/* Form */}
        <View style={s.card}>
          {/* Type toggle */}
          <Text style={s.label}>Type</Text>
          <View style={[s.row2, { marginBottom: 16 }]}>
            {(['expense', 'income'] as const).map(t => (
              <TouchableOpacity key={t} style={[s.toggle, type === t && { borderColor: t === 'expense' ? C.expense : C.income, backgroundColor: t === 'expense' ? '#FFF0F0' : '#F0FFF6' }]} onPress={() => { setType(t); setCategory(''); }}>
                <Text style={[s.toggleTxt, type === t && { color: t === 'expense' ? C.expense : C.income }]}>{t === 'expense' ? '💸 Expense' : '💰 Income'}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Source toggle */}
          <Text style={s.label}>Cash or Bank?</Text>
          <View style={[s.row2, { marginBottom: 16 }]}>
            {(['cash', 'bank'] as const).map(src => (
              <TouchableOpacity key={src} style={[s.toggle, source === src && { borderColor: C.green, backgroundColor: '#EEF7F2' }]} onPress={() => setSource(src)}>
                <Text style={[s.toggleTxt, source === src && { color: C.green }]}>{src === 'cash' ? '💵 Cash' : '🏦 Bank'}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Amount */}
          <Text style={s.label}>Amount (USD)</Text>
          <TextInput
            style={[s.input, { fontSize: 28, fontWeight: '800', color: accentColor, marginBottom: amount ? 4 : 16 }]}
            keyboardType="decimal-pad"
            placeholder="0.00"
            placeholderTextColor="#CCC"
            value={amount}
            onChangeText={setAmount}
          />
          {!!amount && <Text style={[s.inrHint, { marginBottom: 14 }]}>{fmtINR(parseFloat(amount) || 0)}</Text>}

          {/* Category chips */}
          <Text style={s.label}>Category</Text>
          <View style={s.chips}>
            {cats.map(c => (
              <TouchableOpacity key={c} style={[s.chip, category === c && s.chipActive]} onPress={() => setCategory(c)}>
                <Text style={[s.chipTxt, category === c && s.chipTxtActive]}>{c}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Note */}
          <Text style={s.label}>Note (optional)</Text>
          <TextInput style={[s.input, { marginBottom: 14 }]} placeholder='e.g. "Ashok nav"' value={desc} onChangeText={setDesc} />

          {/* Date */}
          <Text style={s.label}>Date</Text>
          <TextInput style={[s.input, { marginBottom: 16 }]} placeholder="YYYY-MM-DD" value={date} onChangeText={setDate} />

          {/* Save */}
          <TouchableOpacity
            style={[s.saveBtn, { backgroundColor: saved ? C.income : accentColor, opacity: (!amount || !category) ? 0.5 : 1 }]}
            onPress={handleSave}
            disabled={!amount || !category}
          >
            <Text style={s.saveTxt}>{saved ? '✓ Saved!' : type === 'expense' ? 'Add Expense' : 'Add Income'}</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container:  { flex: 1, backgroundColor: C.bg },
  header:     { backgroundColor: C.green, paddingTop: 52, paddingBottom: 16, paddingHorizontal: 20 },
  headerTitle:{ color: C.white, fontSize: 22, fontWeight: '800' },
  scroll:     { padding: 14 },
  scanBtn:    { backgroundColor: C.white, borderRadius: 16, padding: 16, marginBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 14, borderWidth: 1.5, borderColor: C.green, shadowColor: '#000', shadowOpacity: 0.05, elevation: 2 },
  scanTitle:  { fontSize: 14, fontWeight: '700', color: C.green, marginBottom: 2 },
  scanSub:    { fontSize: 11, color: C.muted },
  scanMsg:    { backgroundColor: '#EEF7F2', borderRadius: 10, padding: 10, marginBottom: 12 },
  card:       { backgroundColor: C.card, borderRadius: 16, padding: 16, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  label:      { fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6, fontWeight: '600' },
  input:      { backgroundColor: C.bg, borderWidth: 1.5, borderColor: C.border, borderRadius: 10, padding: 11, fontSize: 15, color: C.text, marginBottom: 8 },
  inrHint:    { fontSize: 13, color: C.gold, fontWeight: '600' },
  row2:       { flexDirection: 'row', gap: 10 },
  toggle:     { flex: 1, padding: 11, borderRadius: 12, borderWidth: 2, borderColor: C.border, backgroundColor: C.white, alignItems: 'center' },
  toggleTxt:  { fontWeight: '700', fontSize: 14, color: C.muted },
  chips:      { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 16 },
  chip:       { paddingVertical: 6, paddingHorizontal: 13, borderRadius: 20, borderWidth: 1.5, borderColor: C.border, backgroundColor: C.white },
  chipActive: { backgroundColor: C.green, borderColor: C.green },
  chipTxt:    { fontSize: 12, color: '#555' },
  chipTxtActive: { color: C.white, fontWeight: '600' },
  saveBtn:    { borderRadius: 12, padding: 14, alignItems: 'center' },
  saveTxt:    { color: C.white, fontWeight: '700', fontSize: 16 },
});
