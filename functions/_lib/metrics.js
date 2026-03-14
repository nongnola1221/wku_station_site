const FUNCTIONS_FREE_LIMIT_PER_DAY = 100_000

function getUtcDateKey(date = new Date()) {
  return date.toISOString().slice(0, 10)
}

export function getMetricsDateKey() {
  return getUtcDateKey()
}

export async function incrementMetric(env, metricKey, amount = 1, dateKey = getUtcDateKey()) {
  await env.DB.prepare(
    `
      INSERT INTO daily_metrics (
        date_key,
        metric_key,
        metric_count,
        updated_at
      ) VALUES (?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(date_key, metric_key) DO UPDATE SET
        metric_count = daily_metrics.metric_count + excluded.metric_count,
        updated_at = CURRENT_TIMESTAMP
    `,
  )
    .bind(dateKey, metricKey, amount)
    .run()
}

export async function getDailyMetricsMap(env, dateKey = getUtcDateKey()) {
  const result = await env.DB.prepare(
    `
      SELECT metric_key, metric_count
      FROM daily_metrics
      WHERE date_key = ?
    `,
  )
    .bind(dateKey)
    .all()

  return Object.fromEntries((result.results ?? []).map((row) => [row.metric_key, Number(row.metric_count ?? 0)]))
}

export function buildUsageSummary(metricsMap) {
  const totalRequests = Object.entries(metricsMap)
    .filter(([key]) => key.startsWith('req:'))
    .reduce((sum, [, value]) => sum + Number(value ?? 0), 0)

  const reservationCreateCount = Number(metricsMap['req:public:create-reservation'] ?? 0)
  const rateLimitedCount = Number(metricsMap['rate_limited'] ?? 0)
  const estimatedRequestsPerReservation = reservationCreateCount > 0
    ? Math.max(
        2,
        Math.ceil(
          (
            Number(metricsMap['req:public:bootstrap'] ?? 0) +
            Number(metricsMap['req:public:create-reservation'] ?? 0) +
            Number(metricsMap['req:admin:reservations'] ?? 0)
          ) / reservationCreateCount,
        ),
      )
    : 4

  const remainingRequests = Math.max(0, FUNCTIONS_FREE_LIMIT_PER_DAY - totalRequests)
  const estimatedRemainingReservations = Math.max(
    0,
    Math.floor(remainingRequests / estimatedRequestsPerReservation),
  )

  return {
    functionsFreeLimitPerDay: FUNCTIONS_FREE_LIMIT_PER_DAY,
    totalRequests,
    usagePercent: Number(((totalRequests / FUNCTIONS_FREE_LIMIT_PER_DAY) * 100).toFixed(2)),
    remainingRequests,
    reservationCreateCount,
    estimatedRequestsPerReservation,
    estimatedRemainingReservations,
    rateLimitedCount,
  }
}

export function getResetInfo() {
  const now = new Date()
  const nextUtcMidnight = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + 1,
    0,
    0,
    0,
  ))

  const kstFormatter = new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })

  return {
    resetsAtUtc: nextUtcMidnight.toISOString(),
    resetsAtKst: kstFormatter.format(nextUtcMidnight),
  }
}
