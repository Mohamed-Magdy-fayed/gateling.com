"use client";

import { useState } from "react";

import { LinkButton } from "@/components/general/link-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslation } from "@/features/core/i18n/client";
import { ROI_CALCULATOR_DEFAULTS } from "@/features/system/shared/content-blocks";
import { trackGaEvent } from "@/lib/ga4";
import { trackPixelEvent } from "@/lib/meta-pixel";

type RoiCurrency = "EGP" | "USD";

type RoiCalculatorProps = {
  /** When false, hides the "Build This Automation For Us" call-to-action. */
  showCta?: boolean;
  /** Starting values — used to tailor an embedded calculator to a business. */
  teamSize?: number;
  hoursPerWeek?: number;
  hourlyRate?: number;
  currency?: RoiCurrency;
};

/**
 * Formats a currency amount using the numeral system of the active UI
 * language (Latin for `en`, Arabic-Indic for `ar`) rather than the currency's
 * home locale — so the English layout never renders Arabic-Indic digits.
 */
function formatCurrency(amount: number, currency: RoiCurrency, locale: string) {
  const formatter = new Intl.NumberFormat(
    locale === "ar" ? "ar-EG" : "en-US",
    { style: "currency", currency, maximumFractionDigits: 0 },
  );
  return formatter.format(amount);
}

export function RoiCalculator({
  showCta = true,
  teamSize: initialTeamSize = ROI_CALCULATOR_DEFAULTS.teamSize,
  hoursPerWeek: initialHoursPerWeek = ROI_CALCULATOR_DEFAULTS.hoursPerWeek,
  hourlyRate: initialHourlyRate = ROI_CALCULATOR_DEFAULTS.hourlyRate,
  currency: initialCurrency = ROI_CALCULATOR_DEFAULTS.currency,
}: RoiCalculatorProps = {}) {
  const { locale } = useTranslation();
  const numberLocale = locale === "ar" ? "ar-EG" : "en-US";
  const [teamSize, setTeamSize] = useState(initialTeamSize);
  const [hoursPerWeek, setHoursPerWeek] = useState(initialHoursPerWeek);
  const [hourlyRate, setHourlyRate] = useState(initialHourlyRate);
  const [currency, setCurrency] = useState<RoiCurrency>(initialCurrency);

  const weeklyManualCost = teamSize * hoursPerWeek * hourlyRate;
  const annualManualCost = weeklyManualCost * 52;
  const automationSavings = annualManualCost * 0.7;

  return (
    <div className="bg-background rounded-2xl border p-8 shadow-sm">
      {/* Inputs */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Team size (people doing manual work)</Label>
          <Input
            type="number"
            min={1}
            max={1000}
            value={teamSize}
            onChange={(e) => setTeamSize(Math.max(1, Number(e.target.value)))}
          />
        </div>

        <div className="space-y-2">
          <Label>Manual hours per person per week</Label>
          <Input
            type="number"
            min={1}
            max={80}
            value={hoursPerWeek}
            onChange={(e) =>
              setHoursPerWeek(Math.max(1, Number(e.target.value)))
            }
          />
        </div>

        <div className="space-y-2">
          <Label>Average hourly cost per person</Label>
          <Input
            type="number"
            min={1}
            value={hourlyRate}
            onChange={(e) => setHourlyRate(Math.max(1, Number(e.target.value)))}
          />
        </div>

        <div className="space-y-2">
          <Label>Currency</Label>
          <Select
            value={currency}
            onValueChange={(v) => setCurrency(v as "EGP" | "USD")}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="EGP">EGP — Egyptian Pound</SelectItem>
              <SelectItem value="USD">USD — US Dollar</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Results */}
      <div className="mt-8 rounded-xl border bg-muted/30 p-6">
        <h3 className="mb-4 font-bold">Your Numbers</h3>
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <p className="text-muted-foreground text-sm">
              Annual cost of manual work
            </p>
            <p className="text-destructive mt-1 text-2xl font-bold">
              {formatCurrency(annualManualCost, currency, locale)}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-sm">
              Potential annual savings (70% automation)
            </p>
            <p className="mt-1 text-2xl font-bold text-green-600">
              {formatCurrency(automationSavings, currency, locale)}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-sm">
              Hours reclaimed/year
            </p>
            <p className="text-primary mt-1 text-2xl font-bold">
              {(teamSize * hoursPerWeek * 52 * 0.7).toLocaleString(
                numberLocale,
              )}{" "}
              hrs
            </p>
          </div>
        </div>

        <p className="text-muted-foreground mt-4 text-xs">
          * Based on 70% automation rate. Actual results vary by process
          complexity.
        </p>
      </div>

      {showCta && (
        <div className="mt-8 text-center">
          <p className="font-semibold">
            Want to automate this for your business?
          </p>
          <LinkButton
            href="/contact?source=roi-calculator"
            size="lg"
            className="mt-4"
            onClick={() => {
              trackPixelEvent("InitiateCheckout", {
                content_name: "ROI Calculator CTA",
              });
              trackGaEvent("generate_lead", {
                content_name: "ROI Calculator CTA",
              });
            }}
          >
            Build This Automation For Us
          </LinkButton>
        </div>
      )}
    </div>
  );
}
