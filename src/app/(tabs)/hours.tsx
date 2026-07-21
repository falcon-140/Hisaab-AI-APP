import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { useHisaab } from '../../context/HisaabContext';
import { C, fmt, fmtINR, uid, DEFAULT_LOCATIONS } from '../../constants/theme';

export default function HoursScreen() {
  const { data, save } = useHisaab();
  const locations = (data.locations && data.locations.length > 0) ? data.locations : DEFAULT_LOCATIONS;

  const [selId,      setSelId]      = useState(locations[0]?.id || '');
  const [hrs,        setHrs]        = useState('');
  const [date,       setDate]       = useState(new Date().toISOString().slice(0, 10));
  const [saved,      setSaved]      = useState(false);
  const [showJobs,   setShowJobs]   = useState(false);
  const [showAddJob, setShowAddJob] = useState(false);
  const [newName,    setNewName]    = useState('');
  const [newRate,    setNewRate]    = useState('');
  const [editingJob, setEditingJob] = useState<string|null>(null);
  const [editRate,   setEditRate]   = useState('');
  const [confirmDel, setConfirmDel] = useState<string|null>(null);

  const safeId  = locations.find(l => l.id === selId) ? selId : locations[0]?.id;
  const selLoc  = locations.find(l => l.id === safeId) || locations[0];
  const rate    = selLoc?.rate || 9;
  const earned  = (parseFloat(hrs) || 0) * rate;
  const unpaid  = data.hoursLog.filter(h => !h.paid);
  const paid    = data.hoursLog.filter(h => h.paid).slice(0, 8);
  const owed    = unpaid.reduce((s, h) => s + h.hours * (h.rate || 9), 0);

  const addJob = () => {
    if (!newName.trim()) return;
    save({ ...data, locations: [...locations, { id: uid(), name: newName.trim(), rate: parseFloat(newRate) || 0 }] });
    setNewName(''); setNewRate(''); setShowAddJob(false);
  };
  const saveRate = (id: string) => {
    save({ ...data, locations: locations.map(l => l.id === id ? { ...l, rate: parseFloat(editRate) || 0 } : l) });
    setEditingJob(null);
  };
  const deleteJob = (id: string) => {
    const updated = locations.filter(l => l.id !== id);
    save({ ...data, locations: updated });
    setConfirmDel(null);
    if (safeId === id && updated.length > 0) setSelId(updated[0].id);
  };
  const logHours = () => {
    if (!hrs || !selLoc) return;
    const entry = { id: uid(), locationId: selLoc.id, location: selLoc.name, hours: parseFloat(hrs), rate, date, paid: false };
    save({ ...data, hoursLog: [entry, ...data.hoursLog] });
    setSaved(true);
    setTimeout(() => { setSaved(false); setHrs(''); }, 1200);
  };
  const markPaid = (hid: string) => {
    const e = data.hoursLog.find(h => h.id === hid); if (!e) return;
    const amt = e.hours * (e.rate || 9);
    const log = data.hoursLog.map(h => h.id === hid ? { ...h, paid: true } : h);
    const tx  = { id: uid(), type: 'income' as const, source: 'cash' as const, amount: amt, category: 'Work Income', desc: e.location, date: new Date().toISOString().slice(0, 10) };
    save({ ...data, hoursLog: log, transactions: [tx, ...data.transactions], cashBalance: (data.cashBalance || 0) + amt });
  };
  const delEntry = (hid: string) => save({ ...data, hoursLog: data.hoursLog.filter(h => h.id !== hid) });

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.headerTitle}>Work Hours ⏱</Text>
      </View>

      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

        {/* Manage jobs */}
        <View style={s.card}>
          <View style={s.rowBetween}>
            <Text style={s.label}>Your Jobs ({locations.length})</Text>
            <TouchableOpacity style={showJobs ? s.smBtnGray : s.smBtnGreen} onPress={() => { setShowJobs(!showJobs); setShowAddJob(false); setConfirmDel(null); setEditingJob(null); }}>
              <Text style={[s.smBtnTxt, { color: showJobs ? C.muted : C.white }]}>{showJobs ? 'Done' : '⚙️ Manage Jobs'}</Text>
            </TouchableOpacity>
          </View>

          {!showJobs && (
            <View style={s.row2}>
              {locations.map(l => (
                <View key={l.id} style={s.rateChip}>
                  <Text style={{ fontSize: 10, fontWeight: '700', color: C.text }}>{l.name}</Text>
                  <Text style={{ fontSize: 14, fontWeight: '800', color: C.green }}>${l.rate}/hr</Text>
                </View>
              ))}
            </View>
          )}

          {showJobs && (
            <View style={{ marginTop: 10 }}>
              {locations.map(l => {
                const uc = data.hoursLog.filter(h => (h.locationId === l.id || h.location === l.name) && !h.paid).length;
                return (
                  <View key={l.id} style={s.jobRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 14, fontWeight: '700' }}>{l.name}</Text>
                      {uc > 0 && <Text style={{ fontSize: 10, color: C.gold }}>{uc} unpaid session{uc > 1 ? 's' : ''}</Text>}
                    </View>
                    {editingJob !== l.id && confirmDel !== l.id && (
                      <View style={s.row2}>
                        <Text style={{ fontSize: 15, fontWeight: '800', color: C.green }}>${l.rate}/hr</Text>
                        <TouchableOpacity style={s.smBtnGreen} onPress={() => { setEditingJob(l.id); setEditRate(String(l.rate)); setConfirmDel(null); }}>
                          <Text style={[s.smBtnTxt, { color: C.green }]}>✏️</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={s.smBtnRed} onPress={() => { setConfirmDel(l.id); setEditingJob(null); }}>
                          <Text style={[s.smBtnTxt, { color: C.expense }]}>🗑</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                    {editingJob === l.id && (
                      <View style={{ flex: 1, marginTop: 8 }}>
                        <TextInput style={[s.input, { textAlign: 'center', fontSize: 18, fontWeight: '800' }]} keyboardType="decimal-pad" value={editRate} onChangeText={setEditRate} autoFocus />
                        <View style={s.row2}>
                          <TouchableOpacity style={[s.bigBtn, { flex: 2 }]} onPress={() => saveRate(l.id)}><Text style={s.bigBtnTxt}>Save Rate</Text></TouchableOpacity>
                          <TouchableOpacity style={[s.bigBtn, s.grayBtn, { flex: 1 }]} onPress={() => setEditingJob(null)}><Text style={s.bigBtnTxt}>Cancel</Text></TouchableOpacity>
                        </View>
                      </View>
                    )}
                    {confirmDel === l.id && (
                      <View style={{ flex: 1, marginTop: 8, backgroundColor: '#FFF0F0', borderRadius: 8, padding: 10 }}>
                        <Text style={{ fontSize: 13, color: C.expense, fontWeight: '700', marginBottom: 8 }}>Delete "{l.name}"?</Text>
                        <View style={s.row2}>
                          <TouchableOpacity style={[s.bigBtn, s.redBtn, { flex: 2 }]} onPress={() => deleteJob(l.id)}><Text style={s.bigBtnTxt}>Yes, Delete</Text></TouchableOpacity>
                          <TouchableOpacity style={[s.bigBtn, s.grayBtn, { flex: 1 }]} onPress={() => setConfirmDel(null)}><Text style={s.bigBtnTxt}>Cancel</Text></TouchableOpacity>
                        </View>
                      </View>
                    )}
                  </View>
                );
              })}

              {showAddJob ? (
                <View style={{ backgroundColor: '#EEF7F2', borderRadius: 12, padding: 12 }}>
                  <TextInput style={s.input} placeholder="Job / location name" value={newName} onChangeText={setNewName} autoFocus />
                  <TextInput style={[s.input, { fontSize: 18, fontWeight: '800' }]} keyboardType="decimal-pad" placeholder="Pay per hour" value={newRate} onChangeText={setNewRate} />
                  <View style={s.row2}>
                    <TouchableOpacity style={[s.bigBtn, { flex: 2 }]} onPress={addJob}><Text style={s.bigBtnTxt}>Add Job</Text></TouchableOpacity>
                    <TouchableOpacity style={[s.bigBtn, s.grayBtn, { flex: 1 }]} onPress={() => { setShowAddJob(false); setNewName(''); setNewRate(''); }}><Text style={s.bigBtnTxt}>Cancel</Text></TouchableOpacity>
                  </View>
                </View>
              ) : (
                <TouchableOpacity style={s.dashedBtn} onPress={() => setShowAddJob(true)}>
                  <Text style={{ color: C.green, fontWeight: '700' }}>+ Add New Job</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* Log hours */}
        <View style={s.card}>
          <Text style={s.label}>Log Hours Worked</Text>
          <View style={s.chips}>
            {locations.map(l => (
              <TouchableOpacity key={l.id} style={[s.chip, safeId === l.id && s.chipActive]} onPress={() => setSelId(l.id)}>
                <Text style={[s.chipTxt, safeId === l.id && s.chipTxtActive]}>{l.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {selLoc && <Text style={{ fontSize: 12, color: C.muted, marginBottom: 10, fontWeight: '600' }}>Rate: ${rate}/hr at {selLoc.name}</Text>}
          <TextInput style={[s.input, { fontSize: 22, fontWeight: '800', marginBottom: 8 }]} keyboardType="decimal-pad" placeholder="Hours worked (e.g. 8.5)" value={hrs} onChangeText={setHrs} />
          {!!hrs && <Text style={{ fontSize: 14, color: C.income, marginBottom: 10, fontWeight: '700' }}>= ${fmt(earned)} earned · {fmtINR(earned)}</Text>}
          <TextInput style={[s.input, { marginBottom: 12 }]} placeholder="Date (YYYY-MM-DD)" value={date} onChangeText={setDate} />
          <TouchableOpacity style={[s.bigBtn, { backgroundColor: saved ? C.income : C.green }]} onPress={logHours}>
            <Text style={s.bigBtnTxt}>{saved ? '✓ Logged!' : 'Log Hours'}</Text>
          </TouchableOpacity>
        </View>

        {/* Unpaid */}
        {unpaid.length > 0 && (
          <View style={s.card}>
            <View style={s.rowBetween}>
              <Text style={s.label}>Unpaid Hours</Text>
              <Text style={{ fontSize: 15, fontWeight: '800', color: C.gold }}>Owed: ${fmt(owed)}</Text>
            </View>
            {unpaid.map((h, i) => (
              <View key={h.id} style={[s.listRow, i === unpaid.length - 1 && { borderBottomWidth: 0 }]}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: '700' }}>{h.location}</Text>
                  <Text style={{ fontSize: 11, color: C.muted }}>{h.date} · {h.hours}hrs × ${h.rate || 9}/hr</Text>
                </View>
                <View style={s.row2}>
                  <Text style={{ fontSize: 15, fontWeight: '800', color: C.green }}>${fmt(h.hours * (h.rate || 9))}</Text>
                  <TouchableOpacity style={s.smBtnGreen} onPress={() => markPaid(h.id)}>
                    <Text style={[s.smBtnTxt, { color: C.income }]}>Got Paid ✓</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={s.smBtnRed} onPress={() => delEntry(h.id)}>
                    <Text style={[s.smBtnTxt, { color: C.expense }]}>🗑</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Paid */}
        {paid.length > 0 && (
          <View style={s.card}>
            <Text style={s.label}>Paid ✓</Text>
            {paid.map((h, i) => (
              <View key={h.id} style={[s.listRow, i === paid.length - 1 && { borderBottomWidth: 0 }]}>
                <View><Text style={{ fontSize: 13, color: C.muted }}>{h.location}</Text><Text style={{ fontSize: 11, color: '#CCC' }}>{h.date} · {h.hours}hrs</Text></View>
                <Text style={{ fontSize: 13, color: C.income, fontWeight: '700' }}>✓ ${fmt(h.hours * (h.rate || 9))}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container:    { flex: 1, backgroundColor: C.bg },
  header:       { backgroundColor: C.green, paddingTop: 52, paddingBottom: 16, paddingHorizontal: 20 },
  headerTitle:  { color: C.white, fontSize: 22, fontWeight: '800' },
  scroll:       { padding: 14 },
  card:         { backgroundColor: C.card, borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  label:        { fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6, fontWeight: '600' },
  input:        { backgroundColor: C.bg, borderWidth: 1.5, borderColor: C.border, borderRadius: 10, padding: 11, fontSize: 15, color: C.text, marginBottom: 8 },
  row2:         { flexDirection: 'row', gap: 8, alignItems: 'center', flexWrap: 'wrap' },
  rowBetween:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  rateChip:     { backgroundColor: C.bg, borderRadius: 10, padding: 8, alignItems: 'center', flex: 1 },
  jobRow:       { backgroundColor: C.bg, borderRadius: 12, padding: 12, marginBottom: 8, flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  chips:        { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  chip:         { paddingVertical: 7, paddingHorizontal: 13, borderRadius: 20, borderWidth: 1.5, borderColor: C.border, backgroundColor: C.white },
  chipActive:   { backgroundColor: C.green, borderColor: C.green },
  chipTxt:      { fontSize: 12, color: '#555' },
  chipTxtActive:{ color: C.white, fontWeight: '600' },
  listRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: C.border, gap: 8, flexWrap: 'wrap' },
  smBtnGreen:   { backgroundColor: '#EEF7F2', borderRadius: 8, paddingVertical: 5, paddingHorizontal: 10 },
  smBtnGray:    { backgroundColor: '#EEE',    borderRadius: 8, paddingVertical: 5, paddingHorizontal: 10 },
  smBtnRed:     { backgroundColor: '#FFF0F0', borderRadius: 8, paddingVertical: 5, paddingHorizontal: 10 },
  smBtnTxt:     { fontWeight: '700', fontSize: 11 },
  bigBtn:       { backgroundColor: C.green, borderRadius: 12, padding: 13, alignItems: 'center', marginTop: 8 },
  bigBtnTxt:    { color: C.white, fontWeight: '700', fontSize: 14 },
  grayBtn:      { backgroundColor: '#BBB' },
  redBtn:       { backgroundColor: C.expense },
  dashedBtn:    { borderWidth: 2, borderColor: C.green, borderStyle: 'dashed', borderRadius: 12, padding: 12, alignItems: 'center', marginTop: 8 },
});
