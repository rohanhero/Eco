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
  ShieldCheck,
  ClipboardList,
  UserCircle2,
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  PieChart,
  BarChart3,
} from "lucide-react";
import { motion } from "framer-motion";
import { AuroraBackground } from "@/components/ui/aurora-background";
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

    return [
      {
        label: "Total Payments",
        value: total,
        icon: ClipboardList,
        color: "text-sky-600",
      },
      {
        label: "Completed",
        value: completed,
        icon: CheckCircle2,
        color: "text-emerald-600",
      },
      {
        label: "Pending",
        value: pending,
        icon: AlertTriangle,
        color: "text-amber-600",
      },
      {
        label: "Paid Amount",
        value: `Rs ${totalPaidAmount.toFixed(2)}`,
        icon: ShieldCheck,
        color: "text-violet-600",
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
            ? "#10b981"
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

  return (
    <div className="min-h-screen bg-slate-100 overflow-x-hidden">
      {/* Header — premium aurora */}
      <header className="relative overflow-hidden bg-emerald-700 text-white shadow">
        <AuroraBackground className="opacity-20" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-5 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
          <div>
            <h1 className="font-display text-lg sm:text-xl font-semibold tracking-tight">
              Government Tax Payment Portal
            </h1>
            <p className="text-xs sm:text-sm opacity-80">
              Secure Digital Payment System (Nepal) • Premium
            </p>
          </div>
          <div className="text-sm bg-white/10 backdrop-blur px-3 py-1.5 rounded-full border border-white/15">{profile?.name || "Citizen"}</div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 grid gap-6 lg:grid-cols-3">
        {/* LEFT */}
        <div className="lg:col-span-2 space-y-6">
          {/* Payment Summary Cards — premium bento */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {paymentSummary.map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.06, duration: 0.5 }}
                  className="bg-white rounded-[16px] shadow-eco border border-border/60 p-3 sm:p-4 hover:shadow-eco-lg hover:-translate-y-0.5 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-9 w-9 sm:h-10 sm:w-10 shrink-0 grid place-items-center rounded-full bg-white border border-border/60 shadow-sm ${item.color.replace("text-", "bg-").replace("-600", "-100")}`}
                    >
                      <Icon className={`h-4 w-4 sm:h-[18px] sm:w-[18px] ${item.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-semibold tracking-widest uppercase text-slate-500 leading-none">
                        {item.label}
                      </p>
                      <p className="text-[15px] sm:text-[17px] font-bold tracking-tight text-slate-900 mt-1 leading-none truncate">
                        {item.value}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* FORM CARD */}
          <div className="bg-white rounded-xl shadow border overflow-hidden">
            <div className="bg-emerald-700 text-white px-4 sm:px-6 py-4">
              <h2 className="text-base sm:text-lg font-semibold">
                Tax Payment Form
              </h2>
              <p className="text-xs sm:text-sm opacity-80">
                Fill the details below to proceed with secure payment
              </p>
            </div>

            <div className="p-4 sm:p-6 space-y-5 sm:space-y-6">
              {/* Citizen Info */}
              <div className="border rounded-lg p-4 bg-slate-50">
                <h3 className="text-sm font-semibold text-slate-700 mb-3">
                  Taxpayer Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 text-sm">
                  <p>
                    <span className="text-slate-500">Name:</span>{" "}
                    {profile?.name}
                  </p>
                  <p>
                    <span className="text-slate-500">Email:</span>{" "}
                    {profile?.email}
                  </p>
                </div>
              </div>

              {/* Tax Details */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-slate-700">
                  Tax Details
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-slate-600">
                      Tax Category
                    </label>
                    <Select value={taxPeriod} onValueChange={setTaxPeriod}>
                      <SelectTrigger className="w-full mt-1 border rounded-lg px-4 py-2.5 sm:py-3 bg-white text-left">
                        <SelectValue placeholder="Select Revenue Heading" />
                      </SelectTrigger>
                      <SelectContent position="popper" side="bottom" sideOffset={6} avoidCollisions={false} className="z-[60] max-h-[300px] rounded-xl border border-border/60 bg-white shadow-eco-lg">
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

                  <div>
                    <label className="text-sm text-slate-600">
                      Amount (NPR)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full mt-1 border rounded-lg px-4 py-2.5 sm:py-3 focus:ring-2 focus:ring-emerald-500"
                      placeholder="e.g. 5000"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-slate-700">
                  Payment Method
                </h3>

                <div className="grid gap-3">
                  <label className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border rounded-lg p-4 cursor-pointer hover:border-emerald-500">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-emerald-100 flex items-center justify-center rounded">
                        💳
                      </div>
                      <div>
                        <p className="font-medium">eSewa</p>
                        <p className="text-xs text-slate-500">
                          Pay instantly using eSewa wallet
                        </p>
                      </div>
                    </div>
                    <input type="radio" checked readOnly />
                  </label>

                  <label className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border rounded-lg p-4 opacity-50 cursor-not-allowed">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-200 flex items-center justify-center rounded">
                        🏦
                      </div>
                      <div>
                        <p className="font-medium">ConnectIPS (Coming Soon)</p>
                        <p className="text-xs text-slate-500">
                          Bank transfer payment
                        </p>
                      </div>
                    </div>
                    <input type="radio" disabled />
                  </label>
                </div>
              </div>

              {/* Summary */}
              <div className="border rounded-lg p-4 bg-emerald-50">
                <h3 className="text-sm font-semibold text-emerald-700 mb-2">
                  Payment Summary
                </h3>

                <div className="flex flex-col sm:flex-row sm:justify-between text-sm gap-1">
                  <span>Tax Type</span>
                  <span className="break-words">{taxPeriod}</span>
                </div>

                <div className="flex justify-between text-sm mt-1">
                  <span>Amount</span>
                  <span>Rs {amount || "0"}</span>
                </div>

                <div className="flex justify-between text-sm mt-1">
                  <span>Payment Method</span>
                  <span>eSewa</span>
                </div>
              </div>

              {/* Submit */}
              <div className="space-y-3">
                <Button
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 sm:py-3 text-base sm:text-lg"
                  onClick={handleCreatePayment}
                  disabled={paymentLoading || verificationInProgress}
                >
                  {paymentLoading || verificationInProgress
                    ? "Processing Payment..."
                    : "Proceed to Payment"}
                </Button>

                <p className="text-xs text-slate-500 text-center">
                  🔒 Secure Payment • Government Verified System
                </p>

                {(paymentError || successMessage) && (
                  <div
                    className={`p-3 rounded-md text-sm ${
                      paymentError
                        ? "bg-red-50 text-red-600 border border-red-200"
                        : "bg-green-50 text-green-700 border border-green-200"
                    }`}
                  >
                    {paymentError || successMessage}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Payment History */}
          <div className="bg-white rounded-xl shadow border p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold text-slate-800 mb-4">
              Payment History
            </h2>

            {loading ? (
              <p className="text-center text-slate-500">Loading...</p>
            ) : taxPayments.length === 0 ? (
              <p className="text-center text-slate-500">
                No payment records found.
              </p>
            ) : (
              <>
                {/* Mobile cards */}
                <div className="sm:hidden space-y-3">
                  {taxPayments.map((p) => (
                    <div
                      key={p.id}
                      className="border rounded-lg p-3 bg-white shadow-sm"
                    >
                      <p className="text-sm font-medium">{p.tax_period}</p>
                      <p className="text-xs text-slate-500">Rs {p.amount}</p>
                      <p className="text-xs mt-1">{p.status}</p>
                    </div>
                  ))}
                </div>

                {/* Table */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="min-w-[600px] w-full text-sm border">
                    <thead className="bg-slate-100 text-slate-600">
                      <tr>
                        <th className="p-3 text-left">Tax Type</th>
                        <th className="p-3 text-left">Amount</th>
                        <th className="p-3 text-left">Status</th>
                        <th className="p-3 text-left">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {taxPayments.map((p) => (
                        <tr key={p.id} className="border-t">
                          <td className="p-3">{p.tax_period}</td>
                          <td className="p-3">Rs {p.amount}</td>
                          <td className="p-3">{p.status}</td>
                          <td className="p-3">
                            {p.created_at
                              ? new Date(p.created_at).toLocaleString()
                              : "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>

        {/* RIGHT */}
        <aside className="space-y-6 lg:sticky lg:top-6 h-fit">
          <div className="bg-white rounded-xl shadow border p-4 sm:p-6">
            <h3 className="text-lg font-semibold mb-3">Citizen Services</h3>

            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate("/report")}
              >
                Submit Issue
              </Button>
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => navigate("/my-reports")}
              >
                Reports
              </Button>
            </div>
          </div>

          {/* Analytics Summary - Under Citizen Services */}
          {analyticsData && (
            <div className="bg-white rounded-xl shadow border p-4 sm:p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-600" />
                Payment Analytics
              </h3>

              <div className="space-y-4">
                {/* Monthly Payment Trends */}
                <div>
                  <h4 className="text-sm font-medium text-slate-700 mb-2">
                    Monthly Trends
                  </h4>
                  <ChartContainer
                    config={{
                      amount: {
                        label: "Amount (NPR)",
                        color: "#10b981",
                      },
                    }}
                    className="h-[120px]"
                  >
                    <LineChart data={analyticsData.monthlyTrends}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" fontSize={8} />
                      <YAxis fontSize={8} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Line
                        type="monotone"
                        dataKey="amount"
                        stroke="#10b981"
                        strokeWidth={2}
                        dot={{ fill: "#10b981", r: 2 }}
                      />
                    </LineChart>
                  </ChartContainer>
                </div>

                {/* Payment Status Distribution */}
                <div>
                  <h4 className="text-sm font-medium text-slate-700 mb-2">
                    Payment Status
                  </h4>
                  <ChartContainer
                    config={{
                      success: { label: "Success", color: "#10b981" },
                      pending: { label: "Pending", color: "#f59e0b" },
                      failed: { label: "Failed", color: "#ef4444" },
                    }}
                    className="h-[120px]"
                  >
                    <RechartsPieChart>
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Pie
                        data={analyticsData.statusChartData}
                        cx="50%"
                        cy="50%"
                        outerRadius={35}
                        dataKey="count"
                        nameKey="status"
                      >
                        {analyticsData.statusChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                    </RechartsPieChart>
                  </ChartContainer>
                </div>

                {/* Tax Category Breakdown */}
                <div>
                  <h4 className="text-sm font-medium text-slate-700 mb-2">
                    Top Categories
                  </h4>
                  <ChartContainer
                    config={{
                      amount: { label: "Amount (NPR)", color: "#3b82f6" },
                    }}
                    className="h-[120px]"
                  >
                    <BarChart data={analyticsData.categoryChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="category" fontSize={6} />
                      <YAxis fontSize={8} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="amount" fill="#3b82f6" />
                    </BarChart>
                  </ChartContainer>
                </div>

                {/* Yearly Summary */}
                <div>
                  <h4 className="text-sm font-medium text-slate-700 mb-2">
                    Yearly Summary
                  </h4>
                  <ChartContainer
                    config={{
                      amount: { label: "Amount (NPR)", color: "#8b5cf6" },
                    }}
                    className="h-[120px]"
                  >
                    <AreaChart data={analyticsData.yearlyTrends}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="year" fontSize={8} />
                      <YAxis fontSize={8} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Area
                        type="monotone"
                        dataKey="amount"
                        stroke="#8b5cf6"
                        fill="#8b5cf6"
                        fillOpacity={0.3}
                      />
                    </AreaChart>
                  </ChartContainer>
                </div>
              </div>
            </div>
          )}

          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 sm:p-5 text-sm text-slate-700">
            <p className="font-semibold text-emerald-700 mb-2">
              Important Notice
            </p>
            <p>All payments are processed securely through eSewa.</p>
          </div>
        </aside>
      </main>
    </div>
  );
};

export default TaxpayerPortal;
