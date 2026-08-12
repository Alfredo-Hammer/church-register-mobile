import { useCallback, useEffect, useState } from "react";
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, RefreshControl } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import {
  membersService, groupsService, visitorsService,
  baptismsService, activitiesService, financesService,
} from "../services/api";
import SimpleBarChart from "../components/SimpleBarChart";
import { colors, MEMBER_STATUS_META } from "../theme";

const FINANCE_ROLES = ["ADMIN", "PASTOR", "TESORERO"];

function StatCard({ icon, iconColor, label, value, sub }) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: `${iconColor}22` }]}>
        <Ionicons name={icon} size={16} color={iconColor} />
      </View>
      <Text style={styles.statValue}>{value ?? "—"}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      {sub ? <Text style={styles.statSub}>{sub}</Text> : null}
    </View>
  );
}

function Section({ title, children }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionCard}>{children}</View>
    </View>
  );
}

// Espejo condensado del tab "Resumen" de Reportes en la web — mismos
// endpoints de stats, pero solo los números que caben cómodos en una
// pantalla de teléfono. Finanzas se pide y se muestra solo si el rol
// califica (el backend igual la bloquearía con 403 para un Líder).
export default function ResumenScreen() {
  const { user } = useAuth();
  const canSeeFinances = FINANCE_ROLES.includes(user?.role);

  const [memberStats, setMemberStats] = useState(null);
  const [groupStats, setGroupStats] = useState(null);
  const [visitorStats, setVisitorStats] = useState(null);
  const [baptismStats, setBaptismStats] = useState(null);
  const [activityStats, setActivityStats] = useState(null);
  const [finSummary, setFinSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [ms, gs, vs, bs, as_, fs] = await Promise.allSettled([
        membersService.getStats(),
        groupsService.getStats(),
        visitorsService.getStats(),
        baptismsService.getStats(),
        activitiesService.getStats(),
        canSeeFinances ? financesService.getSummary() : Promise.resolve(null),
      ]);
      if (ms.status === "fulfilled") setMemberStats(ms.value);
      if (gs.status === "fulfilled") setGroupStats(gs.value);
      if (vs.status === "fulfilled") setVisitorStats(vs.value?.stats);
      if (bs.status === "fulfilled") setBaptismStats(bs.value);
      if (as_.status === "fulfilled") setActivityStats(as_.value?.stats);
      if (fs.status === "fulfilled" && fs.value) setFinSummary(fs.value.summary);
    } catch { /* silencioso */ }
  }, [canSeeFinances]);

  useEffect(() => { load().then(() => setLoading(false)); }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const statusBars = (memberStats?.byStatus || [])
    .map((s) => ({
      label: MEMBER_STATUS_META[s.status]?.label || s.status,
      value: parseInt(s.count, 10),
      color: MEMBER_STATUS_META[s.status]?.color || colors.muted,
    }));

  const fmtMoney = (v) => "$" + Number(v || 0).toLocaleString("en-US", { maximumFractionDigits: 0 });

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      <View style={styles.grid}>
        <StatCard icon="people-outline" iconColor="#60a5fa"
          label="Miembros Activos" value={memberStats?.active}
          sub={memberStats?.total ? `de ${memberStats.total}` : undefined} />
        <StatCard icon="person-add-outline" iconColor="#fbbf24"
          label="Visitantes" value={visitorStats?.total}
          sub={visitorStats?.nuevos_este_mes ? `+${visitorStats.nuevos_este_mes} este mes` : undefined} />
        <StatCard icon="people-circle-outline" iconColor="#f472b6"
          label="Grupos Activos" value={groupStats?.total}
          sub={groupStats?.membersInGroups ? `${groupStats.membersInGroups} en grupos` : undefined} />
        <StatCard icon="water-outline" iconColor="#22d3ee"
          label="Bautismos" value={baptismStats?.total}
          sub={baptismStats?.year ? `en ${baptismStats.year}` : undefined} />
        <StatCard icon="flag-outline" iconColor="#a78bfa"
          label="Actividades" value={activityStats?.completadas}
          sub="completadas" />
        {canSeeFinances && (
          <StatCard icon="cash-outline" iconColor={Number(finSummary?.balance) >= 0 ? "#34d399" : "#f87171"}
            label="Balance" value={finSummary ? fmtMoney(finSummary.balance) : undefined}
            sub={Number(finSummary?.balance) >= 0 ? "Superávit" : "Déficit"} />
        )}
      </View>

      {statusBars.length > 0 && (
        <Section title="Miembros por estado">
          <SimpleBarChart data={statusBars} />
        </Section>
      )}

      {canSeeFinances && finSummary && (
        <Section title="Finanzas">
          <SimpleBarChart
            money
            data={[
              { label: "Ingresos", value: finSummary.totalIngresos || 0, color: "#34d399" },
              { label: "Egresos", value: finSummary.totalEgresos || 0, color: "#f87171" },
            ]}
          />
        </Section>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  statCard: {
    width: "31%", backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    borderRadius: 14, padding: 12, gap: 4,
  },
  statIcon: { width: 28, height: 28, borderRadius: 8, alignItems: "center", justifyContent: "center", marginBottom: 2 },
  statValue: { fontSize: 18, fontWeight: "800", color: colors.text },
  statLabel: { fontSize: 10.5, color: colors.muted, fontWeight: "600" },
  statSub: { fontSize: 9.5, color: colors.muted },
  section: { marginTop: 20 },
  sectionTitle: {
    fontSize: 12, fontWeight: "700", color: colors.muted,
    textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10,
  },
  sectionCard: {
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    borderRadius: 14, padding: 16,
  },
});
