"use client"

import { useState } from "react"
import {
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Activity,
  RotateCcw,
  ChevronRight,
} from "lucide-react"

// ── 위험요인 기여도 (SHAP 스타일) ────────────────────────────────
type Factor = { label: string; value: string; score: number; max: number; desc: string; unknown?: boolean }

// ── 입력 필드 정의 (7개) ─────────────────────────────────────────
const FIELDS = [
  {
    key: "age",
    label: "나이",
    unit: "세",
    type: "number" as const,
    placeholder: "65 – 99",
    hint: "만 나이 기준",
  },
  {
    key: "livingAlone",
    label: "독거 여부",
    type: "select" as const,
    options: ["선택", "독거 (혼자 거주)", "동거 (가족·시설)"],
    hint: "현재 주거 형태",
  },
  {
    key: "weight",
    label: "체중",
    unit: "kg",
    type: "number" as const,
    placeholder: "30 – 100",
    hint: "소수점 1자리",
  },
  {
    key: "height",
    label: "키",
    unit: "cm",
    type: "number" as const,
    placeholder: "140 – 185",
  },
  {
    key: "income",
    label: "소득 수준",
    type: "select" as const,
    options: ["선택", "저소득 (기초수급·차상위)", "일반"],
    hint: "복지급여 수급 기준",
  },
  {
    key: "education",
    label: "최종 학력",
    type: "select" as const,
    options: ["선택", "초졸 이하 (무학 포함)", "중졸 이상"],
  },
  {
    key: "glucose",
    label: "공복혈당",
    unit: "mg/dL",
    type: "number" as const,
    placeholder: "70 – 300",
    hint: "최근 검진 결과 기준",
  },
]

// ── 위험도 계산 ───────────────────────────────────────────────────
type RiskLevel = "정상" | "주의" | "위험"
type FormState = Record<string, string>

function calcRisk(f: FormState, filledCount: number): {
  level: RiskLevel; score: number; total: number; factors: Factor[]; confidence: number; isPartial: boolean
} | null {
  if (filledCount === 0) return null

  const age     = Number(f.age)
  const weight  = Number(f.weight)
  const height  = Number(f.height)
  const glucose = Number(f.glucose)
  const bmi     = f.weight && f.height && weight > 0 && height > 0
    ? weight / ((height / 100) ** 2) : null

  // 조건별 점수 (미입력 = null)
  const aloneScore   = f.livingAlone ? (f.livingAlone.includes("독거") ? 15 : 0) : null
  const bmiScore     = bmi !== null  ? (bmi < 18.5 ? 15 : 0)                     : null
  const ageScore     = f.age        ? (age >= 85 ? 10 : 0)                       : null
  const incomeScore  = f.income     ? (f.income.includes("저소득") ? 10 : 0)     : null
  const eduScore     = f.education  ? (f.education.includes("초졸") ? 10 : 0)    : null
  const glucoseScore = f.glucose    ? (glucose >= 126 ? 10 : 0)                  : null

  const addScores = [aloneScore, bmiScore, ageScore, incomeScore, eduScore, glucoseScore]
  const knownAdd  = addScores.filter((s): s is number => s !== null).reduce((a, b) => a + b, 0)
  const score     = Math.min(20 + knownAdd, 100)

  const isPartial  = filledCount < FIELDS.length
  const confidence = Math.round((filledCount / FIELDS.length) * 100)
  const level: RiskLevel = score >= 60 ? "위험" : score >= 40 ? "주의" : "정상"

  const factors: Factor[] = [
    {
      label: "독거 여부", value: f.livingAlone || "미입력", score: aloneScore ?? 0, max: 15,
      unknown: aloneScore === null,
      desc: aloneScore === null ? "항목 미입력" : aloneScore === 15 ? "독거 — 식사 준비·돌봄 공백, 영양 위험 최대 요인" : "동거 — 식사 지원 가능 환경",
    },
    {
      label: "저체중 (BMI)", value: bmi !== null ? `${bmi.toFixed(1)} kg/m²` : "미입력", score: bmiScore ?? 0, max: 15,
      unknown: bmiScore === null,
      desc: bmiScore === null ? "체중·키 미입력" : bmiScore === 15 ? `BMI ${bmi!.toFixed(1)} — 18.5 미만, 단백질 결핍 직접 지표` : `BMI ${bmi!.toFixed(1)} — 정상 범위`,
    },
    {
      label: "고령 (85세 이상)", value: f.age ? `${age}세` : "미입력", score: ageScore ?? 0, max: 10,
      unknown: ageScore === null,
      desc: ageScore === null ? "항목 미입력" : ageScore === 10 ? "85세 이상 — 근육 합성 능력 현저히 저하, 단백질 흡수율 감소" : `${age}세 — 85세 미만`,
    },
    {
      label: "소득 수준", value: f.income || "미입력", score: incomeScore ?? 0, max: 10,
      unknown: incomeScore === null,
      desc: incomeScore === null ? "항목 미입력" : incomeScore === 10 ? "저소득 — 단백질 식품(육류·생선·달걀) 구매 제약" : "일반 — 식품 접근성 양호",
    },
    {
      label: "학력", value: f.education || "미입력", score: eduScore ?? 0, max: 10,
      unknown: eduScore === null,
      desc: eduScore === null ? "항목 미입력" : eduScore === 10 ? "초졸 이하 — 영양 정보 접근·이해 격차로 결핍 위험 상승" : "중졸 이상 — 건강 리터러시 상대적 우위",
    },
    {
      label: "당뇨 (공복혈당)", value: f.glucose ? `${glucose} mg/dL` : "미입력", score: glucoseScore ?? 0, max: 10,
      unknown: glucoseScore === null,
      desc: glucoseScore === null ? "항목 미입력" : glucoseScore === 10 ? `공복혈당 ${glucose} mg/dL — 당뇨 기준(≥126) 초과, 단백질 대사 이상 위험` : `공복혈당 ${glucose} mg/dL — 정상 범위`,
    },
  ]

  return { level, score, total: 100, factors, confidence, isPartial }
}

// ── 위험도 설정 ───────────────────────────────────────────────────
const RISK_CFG = {
  정상: {
    bg: "bg-green-50",
    border: "border-green-400",
    text: "text-green-700",
    badge: "bg-green-100 text-green-800",
    ring: "ring-green-300",
    icon: CheckCircle2,
    light: "bg-green-500",
    lightOff: "bg-gray-200",
    label: "NORMAL",
    summary: "위험 요인 미검출. 현재 생활 환경·건강 상태 유지를 권장합니다. (점수 20–39)",
    action: "기본 영양관리 권장",
  },
  주의: {
    bg: "bg-amber-50",
    border: "border-amber-400",
    text: "text-amber-700",
    badge: "bg-amber-100 text-amber-800",
    ring: "ring-amber-300",
    icon: AlertCircle,
    light: "bg-amber-400",
    lightOff: "bg-gray-200",
    label: "CAUTION",
    summary: "복합 위험 요인 확인. 단백질 결핍 위험이 누적되고 있습니다. (점수 40–59)",
    action: "단백질 섭취 모니터링 권장",
  },
  위험: {
    bg: "bg-red-50",
    border: "border-red-400",
    text: "text-red-700",
    badge: "bg-red-100 text-red-800",
    ring: "ring-red-300",
    icon: AlertTriangle,
    light: "bg-red-500",
    lightOff: "bg-gray-200",
    label: "RISK",
    summary: "고위험군 판정. 즉각적인 영양 개입 및 의료 연계가 필요합니다. (점수 60–100)",
    action: "영양개입 및 복지 연계 권장",
  },
}

// ── 메인 컴포넌트 ─────────────────────────────────────────────────
export function HealthDashboard() {
  const [form, setForm] = useState<FormState>(
    Object.fromEntries(FIELDS.map((f) => [f.key, ""]))
  )

  const filledCount = FIELDS.filter((f) => form[f.key] !== "").length
  const allFilled = filledCount === FIELDS.length
  const result = calcRisk(form, filledCount)
  const cfg = result ? RISK_CFG[result.level] : null

  const bmi =
    Number(form.weight) > 0 && Number(form.height) > 0
      ? (Number(form.weight) / (Number(form.height) / 100) ** 2).toFixed(1)
      : null

  function reset() {
    setForm(Object.fromEntries(FIELDS.map((f) => [f.key, ""])))
  }

  function handlePrint() {
    if (!result || !cfg) return
    const levelClass = result.level === "위험" ? "danger" : result.level === "주의" ? "caution" : "normal"
    const factors = result.factors
      .filter((f) => f.score > 0)
      .sort((a, b) => b.score - a.score)
    const date = new Date().toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" })

    const html = `<!DOCTYPE html>
<html lang="ko"><head><meta charset="UTF-8"><title>단백질 결핍 위험도 리포트</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Malgun Gothic','Apple SD Gothic Neo',sans-serif;padding:28px 32px;color:#374151;font-size:12px;line-height:1.6}
  h1{font-size:20px;font-weight:800;color:#111827}
  .meta{font-size:10px;color:#6b7280;padding-bottom:12px;border-bottom:1px solid #e5e7eb;margin-bottom:16px}
  .grid3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:12px}
  .cell{background:#f9fafb;border:1px solid #e5e7eb;padding:8px;text-align:center;border-radius:4px}
  .cell-label{font-size:9px;color:#9ca3af}
  .cell-value{font-weight:700;color:#111827;margin-top:2px}
  .result-box{border:2px solid;padding:14px;border-radius:6px;margin-bottom:14px}
  .result-tag{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#6b7280;margin-bottom:4px}
  .result-level{font-size:26px;font-weight:900}
  .result-score{font-size:11px;margin-top:2px;color:#6b7280}
  .result-summary{font-size:11px;margin-top:6px}
  .result-action{font-size:11px;font-weight:700;margin-top:10px;padding-top:10px;border-top:2px solid}
  .factors-title{font-size:9px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:.1em;margin-bottom:8px}
  ul{list-style:none}
  li{display:flex;align-items:flex-start;gap:6px;margin-bottom:5px;font-size:11px}
  .dot{width:7px;height:7px;border-radius:50%;flex-shrink:0;margin-top:4px}
  .footer{margin-top:16px;padding-top:10px;border-top:1px solid #e5e7eb;font-size:10px;color:#9ca3af;display:flex;justify-content:space-between}
  .danger{color:#b91c1c;border-color:#fca5a5;background:#fff5f5}
  .caution{color:#92400e;border-color:#fcd34d;background:#fffbeb}
  .normal{color:#166534;border-color:#86efac;background:#f0fdf4}
</style></head><body>
<h1>노인 단백질 결핍 위험도 평가 리포트</h1>
<div class="meta">복지사 전용 &nbsp;·&nbsp; 노인 단백질 위험군 스크리닝 시스템</div>
<div class="grid3">
  <div class="cell"><div class="cell-label">나이</div><div class="cell-value">${form.age}세</div></div>
  <div class="cell"><div class="cell-label">독거 여부</div><div class="cell-value">${form.livingAlone?.includes("독거") ? "독거" : "동거"}</div></div>
  <div class="cell"><div class="cell-label">BMI</div><div class="cell-value">${bmi ? `${bmi} kg/m²` : "—"}</div></div>
</div>
<div class="result-box ${levelClass}">
  <div class="result-tag">판정 결과</div>
  <div class="result-level">${result.level}</div>
  <div class="result-score">${result.score}점 / ${result.total}점</div>
  <div class="result-summary">${cfg.summary}</div>
  <div class="result-action">→ ${cfg.action}</div>
</div>
<div class="factors-title">주요 위험요인</div>
<ul>${
  factors.length > 0
    ? factors.map((f) => `<li><span class="dot" style="background:${f.score >= 10 ? "#ef4444" : "#f59e0b"}"></span><span><strong>${f.label}</strong> — ${f.desc}</span></li>`).join("")
    : '<li>위험요인 없음 — 현재 상태 양호</li>'
}</ul>
<div class="footer"><span>스크리닝 일시: ${date}</span><span>노인 단백질 위험군 스크리닝 시스템</span></div>
<script>window.onload=function(){window.print();window.close();}<\/script>
</body></html>`

    const win = window.open("", "_blank", "width=720,height=960")
    if (!win) return
    win.document.write(html)
    win.document.close()
  }

  return (
    <div className="min-h-screen bg-[#f0f4f8]">
      {/* ── 헤더 ── */}
      <header className="bg-[#1b5e7b] text-white shadow-md">
        <div className="max-w-[1100px] mx-auto px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded bg-white/15 flex items-center justify-center">
              <Activity className="size-5 text-[#7dd3f0]" />
            </div>
            <div>
              <p className="text-sm font-bold leading-none tracking-wide">노인 단백질 위험군 스크리닝</p>
              <p className="text-[10px] text-[#a8d8f0] mt-0.5 tracking-widest uppercase">
                복지사 전용 · Protein Risk Screening for Elderly
              </p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 bg-white/10 rounded px-3 py-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-[11px] text-[#c8eaf8]">식단 기록 없이 7개 항목으로 선별</span>
          </div>
        </div>
        <div className="bg-[#154e67] max-w-full px-0">
          <div className="max-w-[1100px] mx-auto px-5 flex gap-1 text-[11px]">
            {["스크리닝", "결과 이력", "대상자 관리", "통계"].map((m, i) => (
              <button
                key={m}
                className={`px-4 py-2 transition-colors whitespace-nowrap font-medium ${
                  i === 0
                    ? "text-[#7dd3f0] border-b-2 border-[#7dd3f0] bg-white/5"
                    : "text-[#6eafc7] hover:text-white hover:bg-white/5"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-[1100px] mx-auto px-4 md:px-6 py-6">
        {/* ── 상단 안내 ── */}
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-base font-bold text-gray-800">노인 단백질 결핍 위험도 평가</h1>
            <p className="text-[11px] text-gray-500 mt-0.5">
              7개 항목 입력 → AI 위험도 산출 → SHAP 기반 요인 설명 → 한국어 리포트 출력
            </p>
          </div>
          <button
            onClick={reset}
            className="flex items-center gap-1.5 text-[11px] text-gray-500 border border-gray-200 rounded px-3 py-1.5 hover:bg-gray-50 transition-colors shrink-0"
          >
            <RotateCcw className="size-3" />
            초기화
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          {/* ── 좌측: 입력 폼 (7개 항목) ── */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
              <div className="bg-[#1b5e7b] px-4 py-3">
                <h2 className="text-sm font-semibold text-white">기본 정보 입력</h2>
                <p className="text-[10px] text-[#a8d8f0] mt-0.5">7개 항목 — 식단 기록 불필요</p>
              </div>

              <div className="p-4 space-y-4">
                {FIELDS.map((field, idx) => (
                  <div key={field.key}>
                    <label className="flex items-center justify-between mb-1">
                      <span className="text-[12px] font-semibold text-gray-700">
                        <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-[#1b5e7b] text-white text-[9px] font-bold mr-1.5">
                          {idx + 1}
                        </span>
                        {field.label}
                      </span>
                      {"hint" in field && field.hint && (
                        <span className="text-[10px] text-gray-400">{field.hint}</span>
                      )}
                    </label>

                    {field.type === "number" ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          step={field.key === "weight" ? 0.1 : 1}
                          placeholder={field.placeholder}
                          value={form[field.key]}
                          onChange={(e) => setForm((p) => ({ ...p, [field.key]: e.target.value }))}
                          className="flex-1 h-9 px-3 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1b5e7b]/30 focus:border-[#1b5e7b] transition-colors"
                        />
                        {"unit" in field && (
                          <span className="text-[11px] text-gray-400 w-8 shrink-0">{field.unit}</span>
                        )}
                      </div>
                    ) : (
                      <select
                        value={form[field.key]}
                        onChange={(e) => setForm((p) => ({ ...p, [field.key]: e.target.value }))}
                        className="w-full h-9 px-3 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#1b5e7b]/30 focus:border-[#1b5e7b] transition-colors bg-white"
                      >
                        {field.options?.map((o) => (
                          <option key={o} value={o === "선택" ? "" : o}>
                            {o}
                          </option>
                        ))}
                      </select>
                    )}

                    {/* BMI 실시간 표시 */}
                    {field.key === "height" && bmi && (
                      <p className="mt-1 text-[10px] text-[#1b5e7b] font-semibold">
                        → BMI {bmi} kg/m²{" "}
                        <span className="text-gray-400 font-normal">
                          ({Number(bmi) < 18.5 ? "저체중" : Number(bmi) < 23 ? "정상" : "과체중"})
                        </span>
                      </p>
                    )}
                  </div>
                ))}

                {/* 입력 진행률 */}
                <div>
                  <div className="flex justify-between text-[10px] text-gray-500 mb-1">
                    <span>입력 진행률</span>
                    <span className="font-semibold">{filledCount} / {FIELDS.length}</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        allFilled ? "bg-[#1b5e7b]" : "bg-[#4fa8c7]"
                      }`}
                      style={{ width: `${(filledCount / FIELDS.length) * 100}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1">
                    {allFilled ? "✓ 모든 항목 입력 완료 — 우측에서 결과 확인" : "나머지 항목을 입력하면 실시간으로 결과가 갱신됩니다"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ── 우측: 결과 카드 ── */}
          <div className="lg:col-span-3 space-y-4">
            {filledCount === 0 ? (
              /* 초기 상태 */
              <div className="bg-white rounded-lg border border-dashed border-gray-200 shadow-sm min-h-[400px] flex flex-col items-center justify-center text-center p-8 gap-4">
                <div className="w-16 h-16 rounded-full bg-[#1b5e7b]/8 flex items-center justify-center">
                  <Activity className="size-8 text-[#1b5e7b]/30" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-600">7개 항목을 입력하면</p>
                  <p className="text-sm font-semibold text-[#1b5e7b]">AI가 위험도를 분석합니다</p>
                  <p className="text-[11px] text-gray-400 mt-2">식단 기록 없이 기본 정보만으로 단백질 결핍 위험을 선별합니다</p>
                </div>
                <div className="flex flex-wrap justify-center gap-2 mt-1">
                  {["신호등 위험도", "SHAP 요인 분석", "한국어 리포트"].map((t) => (
                    <span key={t} className="text-[10px] bg-gray-50 border border-gray-200 rounded-full px-3 py-1 text-gray-400">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            ) : result && cfg ? (
              <>
                {/* 신호등 위험도 카드 */}
                <div className={`bg-white rounded-lg border-2 ${cfg.border} shadow-sm overflow-hidden transition-all duration-500`}>
                  {/* 분석 신뢰도 바 */}
                  <div className="px-5 pt-3">
                    <div className="flex justify-between text-[10px] mb-1">
                      <span className="text-gray-400">분석 정확도</span>
                      <span className={`font-bold ${allFilled ? "text-[#1b5e7b]" : "text-amber-600"}`}>
                        {result.confidence}% {result.isPartial ? "— 나머지 항목 입력 시 정확도 상승" : "— 완전 분석"}
                      </span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-3">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${allFilled ? "bg-[#1b5e7b]" : "bg-amber-400"}`}
                        style={{ width: `${result.confidence}%` }}
                      />
                    </div>
                  </div>

                  <div className="px-5 pb-4">
                    <div className="flex items-start justify-between gap-4">
                      {/* 신호등 */}
                      <div className="flex flex-col items-center gap-1.5 shrink-0">
                        <div className={`w-7 h-7 rounded-full transition-all duration-500 ${result.level === "위험" ? RISK_CFG.위험.light : RISK_CFG.위험.lightOff}`} />
                        <div className={`w-7 h-7 rounded-full transition-all duration-500 ${result.level === "주의" ? RISK_CFG.주의.light : RISK_CFG.주의.lightOff}`} />
                        <div className={`w-7 h-7 rounded-full transition-all duration-500 ${result.level === "정상" ? RISK_CFG.정상.light : RISK_CFG.정상.lightOff}`} />
                        <div className="w-1 h-4 bg-gray-200 rounded-full mt-0.5" />
                      </div>

                      {/* 결과 */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <cfg.icon className={`size-5 ${cfg.text}`} />
                          <span className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">
                            {result.isPartial ? "예상 위험도" : "단백질 결핍 위험도"}
                          </span>
                        </div>
                        <div className="flex items-baseline gap-2 mb-2">
                          <span className={`text-4xl font-black transition-colors duration-500 ${cfg.text}`}>{result.level}</span>
                          <span className={`text-sm font-bold px-2 py-0.5 rounded ${cfg.badge}`}>
                            {cfg.label}
                          </span>
                        </div>
                        {/* 점수 바 */}
                        <div className="mb-2">
                          <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                            <span>누적 위험 점수</span>
                            <span className="font-mono font-bold">{result.score} / {result.total}</span>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-700 ${
                                result.level === "위험" ? "bg-red-500" : result.level === "주의" ? "bg-amber-400" : "bg-green-500"
                              }`}
                              style={{ width: `${(result.score / result.total) * 100}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-[9px] text-gray-300 mt-0.5">
                            <span>정상 20–39</span>
                            <span>주의 40–59</span>
                            <span>위험 60+</span>
                          </div>
                        </div>
                        <p className={`text-[11px] font-medium ${cfg.text}`}>
                          {result.isPartial ? `현재까지 입력된 ${filledCount}개 항목 기준 ${result.level} 판정` : cfg.summary}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 조치 권고 */}
                  <div className={`${cfg.bg} px-5 py-2.5 flex items-center gap-2 border-t ${cfg.border}`}>
                    <ChevronRight className={`size-3 ${cfg.text} shrink-0`} />
                    <span className={`text-[11px] font-semibold ${cfg.text}`}>
                      {result.isPartial ? `${FIELDS.length - filledCount}개 항목 추가 입력 시 정확도 상승` : cfg.action}
                    </span>
                  </div>
                </div>

                {/* SHAP 스타일 위험요인 설명 */}
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="text-xs font-semibold text-gray-700">위험요인 기여도 분석</h3>
                    <span className="text-[10px] text-gray-400 bg-gray-50 border border-gray-200 rounded px-2 py-0.5">
                      SHAP 기반 설명 가능 AI
                    </span>
                  </div>
                  <div className="p-4 space-y-3">
                    {result.factors.sort((a, b) => {
                      if (a.unknown && !b.unknown) return 1
                      if (!a.unknown && b.unknown) return -1
                      return b.score - a.score
                    }).map((f) => (
                      <div key={f.label} className={f.unknown ? "opacity-40" : ""}>
                        <div className="flex items-center justify-between mb-1 gap-2">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="text-[11px] font-semibold text-gray-700 shrink-0">{f.label}</span>
                            <span className={`text-[10px] truncate ${f.unknown ? "text-gray-300 italic" : "text-gray-400"}`}>
                              {f.value}
                            </span>
                          </div>
                          <span className={`text-[10px] font-bold shrink-0 ${
                            f.unknown ? "text-gray-300" : f.score === 0 ? "text-green-600" : f.score === 1 ? "text-amber-600" : "text-red-600"
                          }`}>
                            {f.unknown ? "미입력" : f.score === 0 ? "기여 없음" : `+${f.score}점`}
                          </span>
                        </div>
                        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ${
                              f.unknown ? "bg-gray-200" : f.score === 0 ? "bg-green-400" : f.score === 1 ? "bg-amber-400" : "bg-red-500"
                            }`}
                            style={{ width: f.unknown ? "100%" : f.max > 0 ? `${(f.score / f.max) * 100}%` : "0%" }}
                          />
                        </div>
                        <p className={`text-[10px] mt-0.5 ${f.unknown ? "text-gray-300" : "text-gray-500"}`}>{f.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 한국어 리포트 카드 */}
                <div id="print-report" className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <h3 className="text-xs font-semibold text-gray-700">복지사용 리포트 카드</h3>
                    <p className="text-[10px] text-gray-400 mt-0.5">출력·공유 가능한 요약 리포트</p>
                  </div>
                  <div className="p-4 text-[11px] text-gray-700 space-y-3 leading-relaxed">
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { k: "나이", v: `${form.age}세` },
                        { k: "독거여부", v: form.livingAlone?.includes("독거") ? "독거" : "동거" },
                        { k: "BMI", v: bmi ? `${bmi} kg/m²` : "—" },
                      ].map(({ k, v }) => (
                        <div key={k} className="bg-gray-50 rounded p-2 text-center border border-gray-100">
                          <p className="text-[10px] text-gray-400">{k}</p>
                          <p className="font-semibold text-gray-800 mt-0.5">{v}</p>
                        </div>
                      ))}
                    </div>

                    <div className={`rounded border p-3 ${cfg.bg} ${cfg.border}`}>
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">
                        판정 결과
                      </p>
                      <p className={`font-bold text-base ${cfg.text}`}>
                        {result.level} ({result.score}점 / {result.total}점)
                      </p>
                      <p className={`text-[11px] mt-1 ${cfg.text}`}>{cfg.summary}</p>
                      <p className={`text-[11px] font-semibold mt-2 pt-2 border-t ${cfg.border} ${cfg.text}`}>
                        → {cfg.action}
                      </p>
                    </div>

                    {/* 상위 위험요인 */}
                    <div>
                      <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-1.5">
                        주요 위험요인
                      </p>
                      <ul className="space-y-1">
                        {result.factors
                          .filter((f) => f.score > 0)
                          .sort((a, b) => b.score - a.score)
                          .map((f) => (
                            <li key={f.label} className="flex items-start gap-1.5">
                              <span className={`mt-0.5 w-1.5 h-1.5 rounded-full shrink-0 ${
                                f.score >= 2 ? "bg-red-500" : "bg-amber-400"
                              }`} />
                              <span>
                                <span className="font-semibold">{f.label}</span> — {f.desc}
                              </span>
                            </li>
                          ))}
                        {result.factors.filter((f) => f.score > 0).length === 0 && (
                          <li className="text-green-700">위험요인 없음 — 현재 상태 양호</li>
                        )}
                      </ul>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-gray-100">
                      <span className="text-[10px] text-gray-400">
                        스크리닝 일시: {new Date().toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" })}
                      </span>
                      <button
                        onClick={handlePrint}
                        className="text-[10px] font-semibold text-[#1b5e7b] hover:underline"
                      >
                        리포트 출력 →
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : null}
          </div>
        </div>
      </main>

      <footer className="mt-8 border-t border-gray-200 bg-white px-6 py-3">
        <p className="text-center text-[10px] text-gray-400">
          노인 단백질 위험군 스크리닝 시스템 v1.0 &nbsp;|&nbsp; 본 도구는 의료 진단을 대체하지 않습니다 &nbsp;|&nbsp;
          보건복지부 고령자 영양관리 지침 기반
        </p>
      </footer>
    </div>
  )
}
