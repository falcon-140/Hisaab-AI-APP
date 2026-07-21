import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { BarChart, PieChart } from 'react-native-chart-kit';
import { useHisaab } from '../../context/HisaabContext';
import { C, fmt, fmtINR, PIE_COLORS } from '../../constants/theme';

const W = Dimensions.get('window').width - 32;

const chartConfig = {
  backgroundColor: '#ffffff',
  backgroundGradientFrom: '#ffffff',
  backgroundGradientTo: '#ffffff',
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(26, 61, 43, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(138, 129, 120, ${opacity})`,
  style: { borderRadius: 12 },
  barPercentage: 0.6,
  propsForDots: { r: '4', strokeWidth: '2', stroke: C.green },
};

function getMonthlyData(transactions: any[]) {
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - (5 - i));
    const key   = d.toISOString().slice(0, 7);
    const label = d.toLocaleDateString('en-US', { month: 'short' });
    const mTx   = transactions.filter(t => t.date?.startsWith(key));
    return {
      label,
      income:  +mTx.filter(t => t.type === 'income').reduce((s: number, t: any) => s + t.amount, 0).toFixed(2),
      expense: +mTx.filter(t => t.type === 'expense').reduce((s: number, t: any) => s + t.amount, 0).toFixed(2),
    };
  });
}

function getPieData(transactions: any[]) {
  const key  = new Date().toISOString().slice(0, 7);
  const mExp = transactions.filter(t => t.type === 'expense' && t.date?.startsWith(key));
  const byC: Record<string, number> = {};
  mExp.forEach((t: any) => { byC[t.category] = (byC[t.category] || 0) + t.amount; });
  return Object.entries(byC)
    .map(([name, population], i) => ({ name, population: +population.toFixed(2), color: PIE_COLORS[i % PIE_COLORS.length], legendFontColor: C.muted, legendFontSize: 11 }))
    .sort((a, b) => b.population - a.population);
}

export default function SummaryScreen() {
  const { data } = useHisaab();
  const [view, setView] = useState<'bar'|'pie'>('bar');

  const monthly   = getMonthlyData(data.transactions);
  const pieData   = getPieData(data.transactions);
  const thisMonth = new Date().toISOString().slice(0, 7);
  const mTx       = data.transactions.filter(t => t.date?.startsWith(thisMonth));
  const mIn       = mTx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const mOut      = mTx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const net       = mIn - mOut;

  const hasBarData = monthly.some(m => m.income > 0 || m.expense > 0);
  const hasPieData = pieData.length > 0;

  // Income bar data
  const incomeBarData = {
    labels: monthly.map(m => m.label),
    datasets: [{ data: monthly.map(m => m.income || 0) }],
  };
  // Expense bar data
  const expenseBarData = {
    labels: monthly.map(m => m.label),
    datasets: [{ data: monthly.map(m => m.expense || 0) }],
  };

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.headerTitle}>Summary 📊</Text>
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Month snapshot */}
        <View style={s.heroCard}>
          <Text style={s.heroMonth}>
            {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toUpperCase()}
          </Text>
          <View style={s.heroRow}>
            <View style={s.heroStat}>
              <Text style={s.heroStatLabel}>INCOME</Text>
              <Text style={s.heroStatVal}>${fmt(mIn)}</Text>
            </View>
            <View style={s.heroDivider} />
            <View style={s.heroStat}>
              <Text style={s.heroStatLabel}>SPENT</Text>
              <Text style={s.heroStatVal}>${fmt(mOut)}</Text>
            </View>
            <View style={s.heroDivider} />
            <View style={s.heroStat}>
              <Text style={s.heroStatLabel}>NET</Text>
              <Text style={[s.heroStatVal, { color: net >= 0 ? '#90EE90' : '#FFB3B3' }]}>${fmt(Math.abs(net))}</Text>
            </View>
          </View>
          <Text style={s.heroINR}>≈ {fmtINR(mIn)} earned this month</Text>
        </View>

        {/* Chart toggle */}
        <View style={s.toggleRow}>
          <TouchableOpacity style={[s.toggleBtn, view === 'bar' && s.toggleBtnActive]} onPress={() => setView('bar')}>
            <Text style={[s.toggleTxt, view === 'bar' && s.toggleTxtActive]}>📊 Monthly Trend</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.toggleBtn, view === 'pie' && s.toggleBtnActive]} onPress={() => setView('pie')}>
            <Text style={[s.toggleTxt, view === 'pie' && s.toggleTxtActive]}>🥧 Expense Split</Text>
          </TouchableOpacity>
        </View>

        {/* ── BAR CHART ── */}
        {view === 'bar' && (
          <View style={s.card}>
            {!hasBarData ? (
              <View style={s.emptyState}>
                <Text style={{ fontSize: 28, marginBottom: 8 }}>📊</Text>
                <Text style={s.emptyTxt}>No transactions yet to chart</Text>
              </View>
            ) : (
              <View>
                <Text style={s.label}>Income — Last 6 Months</Text>
                <BarChart
                  data={incomeBarData}
                  width={W}
                  height={160}
                  chartConfig={{ ...chartConfig, color: (opacity = 1) => `rgba(46, 125, 82, ${opacity})` }}
                  fromZero
                  withInnerLines={false}
                  showValuesOnTopOfBars
                  style={{ borderRadius: 12, marginBottom: 16 }}
                  yAxisLabel="$"
                  yAxisSuffix=""
                />

                <Text style={s.label}>Expenses — Last 6 Months</Text>
                <BarChart
                  data={expenseBarData}
                  width={W}
                  height={160}
                  chartConfig={{ ...chartConfig, color: (opacity = 1) => `rgba(192, 57, 43, ${opacity})` }}
                  fromZero
                  withInnerLines={false}
                  showValuesOnTopOfBars
                  style={{ borderRadius: 12 }}
                  yAxisLabel="$"
                  yAxisSuffix=""
                />

                <View style={s.legend}>
                  <Text style={s.legendItem}><Text style={{ color: C.income }}>■</Text> Income</Text>
                  <Text style={s.legendItem}><Text style={{ color: C.expense }}>■</Text> Expenses</Text>
                </View>
              </View>
            )}
          </View>
        )}

        {/* ── PIE CHART ── */}
        {view === 'pie' && (
          <View style={s.card}>
            <Text style={s.label}>This Month's Expenses by Category</Text>
            {!hasPieData ? (
              <View style={s.emptyState}>
                <Text style={{ fontSize: 28, marginBottom: 8 }}>🥧</Text>
                <Text style={s.emptyTxt}>No expenses this month yet</Text>
              </View>
            ) : (
              <View>
                <PieChart
                  data={pieData}
                  width={W}
                  height={200}
                  chartConfig={chartConfig}
                  accessor="population"
                  backgroundColor="transparent"
                  paddingLeft="10"
                  absolute
                />
                <View style={{ marginTop: 8 }}>
                  {pieData.map((d, i) => (
                    <View key={d.name} style={[s.pieRow, i === pieData.length - 1 && { borderBottomWidth: 0 }]}>
                      <View style={s.pieLegendDot}>
                        <View style={[s.dot, { backgroundColor: d.color }]} />
                        <Text style={s.pieName}>{d.name}</Text>
                      </View>
                      <Text style={s.pieVal}>${fmt(d.population)}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        )}

        {/* Monthly breakdown table */}
        <View style={s.card}>
          <Text style={s.label}>6-Month Breakdown</Text>
          <View style={s.tableHeader}>
            <Text style={[s.tableCell, { flex: 1.2 }]}>Month</Text>
            <Text style={[s.tableCell, s.tableCellRight, { color: C.income }]}>Income</Text>
            <Text style={[s.tableCell, s.tableCellRight, { color: C.expense }]}>Spent</Text>
            <Text style={[s.tableCell, s.tableCellRight]}>Net</Text>
          </View>
          {monthly.map((m, i) => {
            const n = m.income - m.expense;
            return (
              <View key={m.label} style={[s.tableRow, i === monthly.length - 1 && { borderBottomWidth: 0 }]}>
                <Text style={[s.tableCell, { flex: 1.2, fontWeight: '700' }]}>{m.label}</Text>
                <Text style={[s.tableCell, s.tableCellRight, { color: C.income }]}>${fmt(m.income)}</Text>
                <Text style={[s.tableCell, s.tableCellRight, { color: C.expense }]}>${fmt(m.expense)}</Text>
                <Text style={[s.tableCell, s.tableCellRight, { color: n >= 0 ? C.income : C.expense, fontWeight: '700' }]}>{n >= 0 ? '+' : '-'}${fmt(Math.abs(n))}</Text>
              </View>
            );
          })}
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container:      { flex: 1, backgroundColor: C.bg },
  header:         { backgroundColor: C.green, paddingTop: 52, paddingBottom: 16, paddingHorizontal: 20 },
  headerTitle:    { color: C.white, fontSize: 22, fontWeight: '800' },
  scroll:         { padding: 16 },
  heroCard:       { backgroundColor: C.green, borderRadius: 20, padding: 20, marginBottom: 12, alignItems: 'center' },
  heroMonth:      { color: C.white, fontSize: 11, opacity: 0.65, letterSpacing: 1, marginBottom: 12 },
  heroRow:        { flexDirection: 'row', alignItems: 'center' },
  heroStat:       { flex: 1, alignItems: 'center' },
  heroStatLabel:  { color: C.white, fontSize: 10, opacity: 0.7, marginBottom: 4 },
  heroStatVal:    { color: C.white, fontSize: 22, fontWeight: '900' },
  heroDivider:    { width: 1, height: 40, backgroundColor: 'rgba(255,255,255,0.2)', marginHorizontal: 8 },
  heroINR:        { color: C.gold, fontSize: 12, fontWeight: '600', marginTop: 12 },
  toggleRow:      { flexDirection: 'row', gap: 8, marginBottom: 12 },
  toggleBtn:      { flex: 1, padding: 10, borderRadius: 12, borderWidth: 1.5, borderColor: C.border, backgroundColor: C.white, alignItems: 'center' },
  toggleBtnActive:{ backgroundColor: C.green, borderColor: C.green },
  toggleTxt:      { fontSize: 12, fontWeight: '600', color: C.muted },
  toggleTxtActive:{ color: C.white },
  card:           { backgroundColor: C.card, borderRadius: 16, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  label:          { fontSize: 10, color: C.muted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10, fontWeight: '600' },
  emptyState:     { alignItems: 'center', paddingVertical: 30 },
  emptyTxt:       { color: '#CCC', fontSize: 13 },
  legend:         { flexDirection: 'row', justifyContent: 'center', gap: 16, marginTop: 10 },
  legendItem:     { fontSize: 11, color: C.muted },
  pieRow:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: C.border },
  pieLegendDot:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot:            { width: 10, height: 10, borderRadius: 5 },
  pieName:        { fontSize: 13, color: C.text },
  pieVal:         { fontSize: 13, fontWeight: '700', color: C.text },
  tableHeader:    { flexDirection: 'row', marginBottom: 6, paddingBottom: 6, borderBottomWidth: 2, borderBottomColor: C.border },
  tableRow:       { flexDirection: 'row', paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: C.border },
  tableCell:      { flex: 1, fontSize: 12, color: C.muted },
  tableCellRight: { textAlign: 'right' },
});
