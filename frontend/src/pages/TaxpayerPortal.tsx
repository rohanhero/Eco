import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowRight,
  ClipboardList,
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Landmark,
  FileText,
} from "lucide-react";
import { motion } from "framer-motion";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  AreaChart,
  Area,
  ResponsiveContainer,
} from "recharts";
import { formatDate, formatDateTime } from "@/utils/formatDate";

type TaxPayment = {
  id: number;
  pid: string;
  amount: number;
  tax_period: string;
  description?: string;
  status: string;
  esewa_ref?: string;
  created_at?: string;
};

type Profile = {
  id: number;
  name: string;
  email: string;
};

const formatNPR = (value: number | string) =>
  `Rs ${Number(value).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

const TaxpayerPortal = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [taxPayments, setTaxPayments] = useState<TaxPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [verificationInProgress, setVerificationInProgress] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [taxPeriod, setTaxPeriod] = useState("");
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);

  const token = localStorage.getItem("access");

  const paymentSummary = useMemo(() => {
    const total = taxPayments.length;
    const completed = taxPayments.filter(
      (payment) => payment.status === "success",
    ).length;
    const pending = taxPayments.filter(
      (payment) => payment.status === "pending",
    ).length;
    const totalPaidAmount = taxPayments
      .filter((payment) => payment.status === "success")
      .reduce((sum, payment) => sum + Number(payment.amount), 0);

    const successRate =
      total > 0 ? `${Math.round((completed / total) * 100)}% success rate` : "No payments yet";
    return [
      {
        label: "Total Paid",
        value: formatNPR(totalPaidAmount),
        icon: CreditCard,
        tone: "text-primary",
        sub: "Successful payments • FY 2024/25",
      },
      {
        label: "Total Payments",
        value: total,
        icon: ClipboardList,
        tone: "text-primary",
        sub: `${completed} completed`,
      },
      {
        label: "Successful",
        value: completed,
        icon: CheckCircle2,
        tone: "text-emerald-600",
        sub: successRate,
      },
      {
        label: "Pending",
        value: pending,
        icon: AlertTriangle,
        tone: "text-orange-600",
        sub: "Awaiting confirmation",
      },
    ];
  }, [taxPayments]);

  // Analytics data processing
  const analyticsData = useMemo(() => {
    if (taxPayments.length === 0) return null;

    // Monthly payment trends
    const monthlyData = taxPayments.reduce(
      (acc, payment) => {
        if (!payment.created_at) return acc;
        const date = new Date(payment.created_at);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

        if (!acc[monthKey]) {
          acc[monthKey] = { month: monthKey, amount: 0, count: 0 };
        }
        acc[monthKey].amount += Number(payment.amount);
        acc[monthKey].count += 1;
        return acc;
      },
      {} as Record<string, { month: string; amount: number; count: number }>,
    );

    const monthlyTrends = Object.values(monthlyData)
      .sort((a, b) => a.month.localeCompare(b.month))
      .map((item) => ({
        ...item,
        month: new Date(item.month + "-01").toLocaleDateString("en-US", {
          month: "short",
          year: "numeric",
        }),
      }));

    // Payment status distribution
    const statusData = taxPayments.reduce(
      (acc, payment) => {
        acc[payment.status] = (acc[payment.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const statusChartData = Object.entries(statusData).map(
      ([status, count]) => ({
        status: status.charAt(0).toUpperCase() + status.slice(1),
        count,
        fill:
          status === "success"
            ? "#087A50"
            : status === "pending"
              ? "#f59e0b"
              : "#ef4444",
      }),
    );

    // Tax category breakdown
    const categoryData = taxPayments.reduce(
      (acc, payment) => {
        const category = payment.tax_period || "Other";
        acc[category] = (acc[category] || 0) + Number(payment.amount);
        return acc;
      },
      {} as Record<string, number>,
    );

    const categoryChartData = Object.entries(categoryData)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5) // Top 5 categories
      .map(([category, amount]) => ({
        category:
          category.length > 20 ? category.substring(0, 20) + "..." : category,
        amount,
      }));

    // Yearly summary
    const yearlyData = taxPayments.reduce(
      (acc, payment) => {
        if (!payment.created_at) return acc;
        const year = new Date(payment.created_at).getFullYear().toString();

        if (!acc[year]) {
          acc[year] = { year, amount: 0, count: 0 };
        }
        acc[year].amount += Number(payment.amount);
        acc[year].count += 1;
        return acc;
      },
      {} as Record<string, { year: string; amount: number; count: number }>,
    );

    const yearlyTrends = Object.values(yearlyData).sort((a, b) =>
      a.year.localeCompare(b.year),
    );

    return {
      monthlyTrends,
      statusChartData,
      categoryChartData,
      yearlyTrends,
    };
  }, [taxPayments]);

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    let mounted = true;

    const loadPortalData = async () => {
      setPaymentError(null);
      setSuccessMessage(null);
      setLoading(true);

      try {
        const [profileRes, paymentsRes] = await Promise.all([
          fetch("http://127.0.0.1:8000/api/profile/", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("http://127.0.0.1:8000/api/tax-payments/my/", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (!mounted) return;

        if (!profileRes.ok) {
          throw new Error("Failed to load profile");
        }
        if (!paymentsRes.ok) {
          throw new Error("Failed to load payment history");
        }

        const profileJson = await profileRes.json();
        const paymentsJson = await paymentsRes.json();

        setProfile({
          id: profileJson.id,
          name: profileJson.name,
          email: profileJson.email,
        });
        setTaxPayments(Array.isArray(paymentsJson) ? paymentsJson : []);
      } catch (err) {
        console.error(err);
        setPaymentError(
          "Unable to load the tax payment portal. Please try again.",
        );
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadPortalData();
    return () => {
      mounted = false;
    };
  }, [navigate, token]);

  useEffect(() => {
    const status = searchParams.get("status");
    const pid = searchParams.get("pid");

    if (status === "success" && pid) {
      setSuccessMessage(
        "Payment completed successfully! Your payment is being processed.",
      );
      setSearchParams({});
      refreshPaymentHistory();
    } else if (status === "failed") {
      setPaymentError(
        "eSewa payment failed or was canceled. Please try again.",
      );
      (async () => {
        try {
          if (token) {
            await fetch("http://127.0.0.1:8000/api/tax-payments/mark-failed/", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ pid: pid || undefined }),
            });
            await refreshPaymentHistory();
          }
        } catch (err) {
          console.error("mark failed error:", err);
        } finally {
          setSearchParams({});
        }
      })();
    }
  }, [searchParams]);

  const verifyPayment = async (pid: string, amt: string, refId: string) => {
    if (!token) return;

    setVerificationInProgress(true);
    setPaymentError(null);
    setSuccessMessage(null);

    try {
      const res = await fetch(
        "http://127.0.0.1:8000/api/tax-payments/verify/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ pid, amt, refId }),
        },
      );

      const payload = await res.json().catch(() => null);
      if (res.ok) {
        setSuccessMessage("Tax payment verified successfully.");
      } else {
        setPaymentError(
          payload?.error || payload?.message || "Payment verification failed.",
        );
      }
    } catch (err) {
      console.error(err);
      setPaymentError("Unable to verify payment. Please try again.");
    } finally {
      setVerificationInProgress(false);
      setSearchParams({});
      refreshPaymentHistory();
    }
  };

  const refreshPaymentHistory = async () => {
    if (!token) return;

    try {
      const res = await fetch("http://127.0.0.1:8000/api/tax-payments/my/", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const paymentsJson = await res.json().catch(() => null);
      setTaxPayments(Array.isArray(paymentsJson) ? paymentsJson : []);
    } catch (err) {
      console.error(err);
    }
  };

  const submitEsewaForm = (esewaFormData: Record<string, string>) => {
    // Create a hidden form and submit it via POST
    const form = document.createElement("form");
    form.method = "POST";
    form.action = esewaFormData.action_url;

    Object.entries(esewaFormData).forEach(([key, value]) => {
      if (key === "action_url") return;
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = key;
      input.value = value;
      form.appendChild(input);
    });

    document.body.appendChild(form);
    form.submit();
  };

  const handleCreatePayment = async () => {
    if (!token) {
      navigate("/login");
      return;
    }

    setPaymentError(null);
    setSuccessMessage(null);
    setPaymentLoading(true);

    try {
      const amountValue = parseFloat(amount);
      if (Number.isNaN(amountValue) || amountValue <= 0) {
        setPaymentError("Please enter a valid amount greater than 0.");
        return;
      }

      const res = await fetch(
        "http://127.0.0.1:8000/api/tax-payments/create/",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            amount: amountValue,
            tax_period: taxPeriod,
            description: "Online tax payment",
            package_id: selectedPackage ? parseInt(selectedPackage) : null,
          }),
        },
      );

      const payload = await res.json();
      if (!res.ok) {
        setPaymentError(
          payload?.error || payload?.detail || "Failed to create payment.",
        );
        return;
      }

      // Submit eSewa form via POST
      submitEsewaForm(payload.esewa_form);
    } catch (err) {
      console.error(err);
      setPaymentError("Unable to start payment. Please try again.");
    } finally {
      setPaymentLoading(false);
    }
  };

  // ONLY UI responsiveness improved — logic untouched

  const statusBadge = (status: string) => {
    const s = status.toLowerCase();
    if (s === "success" || s === "verified")
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    if (s === "pending")
      return "bg-orange-50 text-orange-700 border-orange-200";
    return "bg-red-50 text-red-700 border-red-200";
  };

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Banner — full-bleed dark green, stats inside (approved design) */}
      <section className="eg-banner text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-12 sm:pt-12 sm:pb-14">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.6fr] gap-6 lg:gap-8 items-center">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
            >
              <h1 className="text-4xl sm:text-[44px] font-extrabold tracking-tight leading-[1.08]">
                Pay Your Municipal Taxes
              </h1>
              <p className="text-base sm:text-lg text-white/80 mt-3 max-w-md">
                Pay your municipal taxes online quickly and securely.
              </p>
              {profile?.name && (
                <div className="mt-4 inline-flex items-center gap-2 h-9 px-4 rounded-full bg-white/10 border border-white/20 backdrop-blur text-sm">
                  {profile.name}
                </div>
              )}
            </motion.div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {paymentSummary.map((item, index) => {
                const Icon = item.icon;
                return (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + index * 0.05, duration: 0.35 }}
                    className="rounded-2xl bg-white text-foreground shadow-eco-lg p-4"
                  >
                    <div className="flex items-center gap-2">
                      <span className="h-8 w-8 rounded-lg bg-secondary grid place-items-center shrink-0">
                        <Icon className={`h-4 w-4 ${item.tone}`} />
                      </span>
                      <span className="text-[12px] font-medium text-muted-foreground leading-tight">
                        {item.label}
                      </span>
                    </div>
                    <p className="text-xl sm:text-[22px] font-extrabold tracking-tight text-[#064A37] mt-2.5 leading-none truncate">
                      {item.value}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-1.5 leading-tight">
                      {item.sub}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-5 mt-6 items-start">
          {/* LEFT — form + history */}
          <div className="space-y-5">
            {/* Payment Form */}
            <div className="bg-white rounded-2xl border border-border/70 shadow-eco p-5 sm:p-6">
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-xl bg-secondary grid place-items-center shrink-0">
                  <ClipboardList className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-[#064A37]">Make Tax Payment</h2>
                  <p className="text-[13px] text-muted-foreground mt-0.5">
                    Complete the form below to submit your tax payment securely.
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-5">
                {/* Taxpayer info */}
                <div className="rounded-xl bg-secondary/50 border border-border/60 p-4">
                  <h3 className="text-[13px] font-semibold text-foreground/80 mb-2">Taxpayer Information</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[13px]">
                    <p className="truncate"><span className="text-muted-foreground">Name:</span> {profile?.name}</p>
                    <p className="truncate"><span className="text-muted-foreground">Email:</span> {profile?.email}</p>
                  </div>
                </div>

                {/* Tax details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[13px] font-medium">Tax Category</label>
                    <Select value={taxPeriod} onValueChange={setTaxPeriod}>
                      <SelectTrigger className="eco-input w-full">
                        <SelectValue placeholder="Select revenue heading" />
                      </SelectTrigger>
                      <SelectContent position="popper" sideOffset={6} avoidCollisions={false} className="z-[60] max-h-[300px] rounded-xl border border-border/60 bg-white shadow-eco-lg">
                        <SelectItem value="11111 - Income Tax (Individual / Proprietorship Firm)">11111 - Income Tax (Individual / Proprietorship Firm)</SelectItem>
                        <SelectItem value="11112 - Income Tax (Remittance)">11112 - Income Tax (Remittance)</SelectItem>
                        <SelectItem value="11113 - Income Tax (Capital Gains - Individual)">11113 - Income Tax (Capital Gains - Individual)</SelectItem>
                        <SelectItem value="11121 - Income Tax (Government Institutions)">11121 - Income Tax (Government Institutions)</SelectItem>
                        <SelectItem value="11122 - Income Tax (Partnership Firm)">11122 - Income Tax (Partnership Firm)</SelectItem>
                        <SelectItem value="11123 - Income Tax (Private Limited Company)">11123 - Income Tax (Private Limited Company)</SelectItem>
                        <SelectItem value="11124 - Income Tax (Public Corporation)">11124 - Income Tax (Public Corporation)</SelectItem>
                        <SelectItem value="11125 - Income Tax (Other Institutions)">11125 - Income Tax (Other Institutions)</SelectItem>
                        <SelectItem value="11131 - Interest Tax">11131 - Interest Tax</SelectItem>
                        <SelectItem value="11132 - Dividend Tax">11132 - Dividend Tax</SelectItem>
                        <SelectItem value="11133 - Rent Tax">11133 - Rent Tax</SelectItem>
                        <SelectItem value="11134 - Other Income Tax">11134 - Other Income Tax</SelectItem>
                        <SelectItem value="11135 - Casual Gain Tax">11135 - Casual Gain Tax</SelectItem>
                        <SelectItem value="11139 - Miscellaneous Income Tax">11139 - Miscellaneous Income Tax</SelectItem>
                        <SelectItem value="11211 - Social Security Tax (Employment-Based)">11211 - Social Security Tax (Employment-Based)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[13px] font-medium">Amount (in Rs.)</label>
                    <input
                      type="number"
                      min="1"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="eco-input w-full"
                      placeholder="e.g. 5000"
                    />
                  </div>
                </div>

                {/* Payment method */}
                <div className="space-y-2.5">
                  <h3 className="text-[13px] font-semibold text-foreground/80">Payment Method</h3>
                  <label className="flex items-center justify-between gap-3 rounded-xl border-2 border-primary/50 bg-secondary/30 px-4 py-3.5 cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-secondary grid place-items-center shrink-0">
                        <CreditCard className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-[14px]">eSewa</p>
                        <p className="text-xs text-muted-foreground">Pay instantly using your eSewa wallet</p>
                      </div>
                    </div>
                    <input type="radio" checked readOnly className="accent-primary" />
                  </label>

                  <label className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-muted/40 px-4 py-3.5 opacity-60 cursor-not-allowed">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-white border border-border/60 grid place-items-center shrink-0">
                        <Landmark className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-semibold text-[14px] text-muted-foreground">ConnectIPS (Coming Soon)</p>
                        <p className="text-xs text-muted-foreground">Bank transfer payment — not available yet. Please pay with eSewa for now.</p>
                      </div>
                    </div>
                    <input type="radio" disabled className="accent-primary" />
                  </label>
                </div>

                {/* Summary */}
                <div className="rounded-xl bg-secondary/50 border border-border/60 p-4 space-y-2 text-[13px]">
                  <h3 className="text-[13px] font-semibold text-primary mb-1">Payment Summary</h3>
                  <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground">Tax Type</span>
                    <span className="text-right break-words min-w-0">{taxPeriod || "—"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Amount</span>
                    <span className="font-semibold">{amount ? formatNPR(amount) : "Rs 0"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Payment Method</span>
                    <span className="font-semibold">eSewa</span>
                  </div>
                </div>

                {/* Submit */}
                <Button
                  variant="eco"
                  className="w-full rounded-xl h-11 text-[15px] gap-2"
                  onClick={handleCreatePayment}
                  disabled={paymentLoading || verificationInProgress}
                >
                  {paymentLoading || verificationInProgress
                    ? "Processing Payment..."
                    : "Proceed to Payment"}
                  <ArrowRight className="h-4 w-4" />
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  Secure payment powered by eSewa
                </p>

                {(paymentError || successMessage) && (
                  <div
                    role={paymentError ? "alert" : "status"}
                    className={`flex items-start gap-2.5 p-3.5 rounded-xl text-[13px] leading-5 ${
                      paymentError
                        ? "bg-red-50 text-red-700 border border-red-200"
                        : "bg-emerald-50 text-primary border border-emerald-200"
                    }`}
                  >
                    {paymentError ? (
                      <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                    )}
                    <span>{paymentError || successMessage}</span>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* RIGHT — services + analytics */}
          <aside className="space-y-5">
            {/* Tax Payment History */}
            <div className="bg-white rounded-2xl border border-border/70 shadow-eco p-5 sm:p-6">
              <h2 className="text-lg font-bold tracking-tight text-[#064A37]">Tax Payment History</h2>

              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="h-9 w-9 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
                </div>
              ) : taxPayments.length === 0 ? (
                <div className="text-center py-8 mt-4">
                  <div className="rounded-xl border border-dashed border-border/70 py-8">
                    <FileText className="h-8 w-8 text-muted-foreground/50 mx-auto" />
                  </div>
                  <p className="font-bold text-[17px] text-[#064A37] mt-4">No tax payments yet</p>
                  <p className="text-[13px] text-muted-foreground mt-1">Your payments will appear here once you complete a transaction.</p>
                </div>
              ) : (
                <>
                  {/* Mobile cards */}
                  <div className="sm:hidden mt-4 space-y-3">
                    {taxPayments.map((p) => (
                      <div key={p.id} className="border border-border/70 rounded-xl p-3.5 bg-white shadow-eco">
                        <div className="flex justify-between items-start gap-2">
                          <p className="text-[13px] font-semibold pr-2">{p.tax_period}</p>
                          <span className={`shrink-0 text-[11px] font-semibold border px-2 py-0.5 rounded-full ${statusBadge(p.status)}`}>
                            {p.status}
                          </span>
                        </div>
                        <div className="mt-2 flex justify-between text-[13px]">
                          <span className="font-semibold">{formatNPR(p.amount)}</span>
                          <span className="text-muted-foreground">
                            {formatDate(p.created_at)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Table */}
                  <div className="hidden sm:block mt-4 rounded-xl border border-border/70 overflow-x-auto">
                    <table className="min-w-[600px] w-full text-sm">
                      <thead className="bg-muted/40 text-muted-foreground text-[12px] uppercase tracking-wider">
                        <tr>
                          <th className="p-3.5 text-left font-semibold">Tax Type</th>
                          <th className="p-3.5 text-left font-semibold">Amount</th>
                          <th className="p-3.5 text-left font-semibold">Status</th>
                          <th className="p-3.5 text-left font-semibold">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {taxPayments.map((p) => (
                          <tr key={p.id} className="border-t border-border/60">
                            <td className="p-3.5 text-[13px] pr-4">{p.tax_period}</td>
                            <td className="p-3.5 font-semibold text-[13px]">{formatNPR(p.amount)}</td>
                            <td className="p-3.5">
                              <span className={`text-[11px] font-semibold border px-2 py-0.5 rounded-full ${statusBadge(p.status)}`}>
                                {p.status}
                              </span>
                            </td>
                            <td className="p-3.5 text-[13px] text-muted-foreground">
                              {formatDateTime(p.created_at)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>

            {/* Notice */}
            <div className="rounded-2xl bg-amber-100 border border-amber-200 p-5 text-[13px] leading-5">
              <p className="font-bold text-amber-800 mb-2 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" /> Important Notice
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-amber-900/90">
                <li>Please verify the tax category and amount before proceeding.</li>
                <li>Payments are non-refundable once processed.</li>
              </ul>
            </div>
            <div className="bg-white rounded-2xl border border-border/70 shadow-eco p-5">
              <h3 className="font-semibold text-[15px] mb-3">Citizen Services</h3>
              <div className="space-y-2.5">
                <Button variant="eco-outline" className="w-full rounded-xl" onClick={() => navigate("/report")}>
                  Submit Issue
                </Button>
                <Button variant="eco-ghost" className="w-full rounded-xl" onClick={() => navigate("/my-reports")}>
                  View Reports
                </Button>
              </div>
            </div>

            {/* Analytics — real data with designed empty state */}
            <div className="bg-white rounded-2xl border border-border/70 shadow-eco p-5">
              <h3 className="font-semibold text-[15px] flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Payment Analytics
              </h3>

              {!analyticsData ? (
                <div className="mt-4 rounded-xl border border-dashed border-border/70 bg-muted/30 p-5 text-center">
                  <FileText className="h-6 w-6 text-muted-foreground mx-auto" />
                  <p className="text-[13px] text-muted-foreground mt-2">
                    Analytics will appear here once you make your first payment.
                  </p>
                </div>
              ) : (
                <div className="mt-4 space-y-5">
                  {/* Monthly trends */}
                  <div>
                    <h4 className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">Monthly Trends</h4>
                    <ChartContainer
                      config={{ amount: { label: "Amount (NPR)", color: "#087A50" } }}
                      className="h-[120px]"
                    >
                      <LineChart data={analyticsData.monthlyTrends}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="month" fontSize={9} />
                        <YAxis fontSize={9} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Line
                          type="monotone"
                          dataKey="amount"
                          stroke="#087A50"
                          strokeWidth={2}
                          dot={{ fill: "#087A50", r: 2 }}
                        />
                      </LineChart>
                    </ChartContainer>
                  </div>

                  {/* Status doughnut */}
                  <div>
                    <h4 className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">Payment Status</h4>
                    <div className="relative">
                      <ChartContainer
                        config={{ status: { label: "Payments" } }}
                        className="h-[120px]"
                      >
                        <RechartsPieChart>
                          <ChartTooltip content={<ChartTooltipContent />} />
                          <Pie
                            data={analyticsData.statusChartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={30}
                            outerRadius={48}
                            paddingAngle={3}
                            dataKey="count"
                            nameKey="status"
                          >
                            {analyticsData.statusChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                          </Pie>
                        </RechartsPieChart>
                      </ChartContainer>
                      <div className="absolute inset-0 grid place-items-center pointer-events-none">
                        <div className="text-center">
                          <div className="text-base font-bold leading-none">{taxPayments.length}</div>
                          <div className="text-[10px] text-muted-foreground mt-0.5">payments</div>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 mt-1">
                      {analyticsData.statusChartData.map((entry) => (
                        <span key={entry.status} className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                          <span className="h-2 w-2 rounded-full" style={{ background: entry.fill }} />
                          {entry.status}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Top categories */}
                  <div>
                    <h4 className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">Top Categories</h4>
                    <ChartContainer
                      config={{ amount: { label: "Amount (NPR)", color: "#12A66A" } }}
                      className="h-[120px]"
                    >
                      <BarChart data={analyticsData.categoryChartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="category" fontSize={6} />
                        <YAxis fontSize={9} width={38} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="amount" fill="#12A66A" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ChartContainer>
                  </div>

                  {/* Yearly summary */}
                  <div>
                    <h4 className="text-[12px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">Yearly Summary</h4>
                    <ChartContainer
                      config={{ amount: { label: "Amount (NPR)", color: "#07583F" } }}
                      className="h-[120px]"
                    >
                      <AreaChart data={analyticsData.yearlyTrends}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="year" fontSize={9} />
                        <YAxis fontSize={9} width={38} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Area
                          type="monotone"
                          dataKey="amount"
                          stroke="#07583F"
                          fill="#07583F"
                          fillOpacity={0.15}
                        />
                      </AreaChart>
                    </ChartContainer>
                  </div>
                </div>
              )}
            </div>

          </aside>
        </div>
      </main>
    </div>
  );
};

export default TaxpayerPortal;
