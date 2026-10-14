import React, { useState } from 'react';
import { AnimatePresence, motion } from "motion/react";
import { useSelector, useDispatch } from "react-redux";
import { X, Crown, Sparkles } from "lucide-react";
import { createOrder } from "../features/Createorder";
import { verifyPayment } from "../features/verifyPayment";
import getCurrentUser from "../features/getCurrentUser";
import { setUserData } from "../redux/userSlice";

function BillingDrawer({ open, onClose }) {
  const dispatch = useDispatch();
  const { userData } = useSelector((state) => state.user);
  const [loadingPlan, setLoadingPlan] = useState(null);

  const handleUpgrade = async (plan) => {
    try {
      setLoadingPlan(plan);

      // Ensure Razorpay SDK is available
      if (typeof window.Razorpay === "undefined") {
        try {
          await new Promise((resolve, reject) => {
            const script = document.createElement("script");
            script.src = "https://checkout.razorpay.com/v1/checkout.js";
            script.onload = resolve;
            script.onerror = () => reject(new Error("Failed to load Razorpay checkout script"));
            document.body.appendChild(script);
          });
        } catch (scriptErr) {
          alert("Razorpay SDK is not loaded. Please check your internet connection.");
          setLoadingPlan(null);
          return;
        }
      }

      const data = await createOrder({ plan });

      // Handle free plan transition
      if (data?.free) {
        if (data.user) {
          dispatch(setUserData(data.user));
        } else {
          const freshUser = await getCurrentUser();
          if (freshUser) dispatch(setUserData(freshUser));
        }
        alert("Switched to Free plan successfully!");
        setLoadingPlan(null);
        return;
      }

      if (!data?.order) {
        alert(`Failed to create Razorpay order: ${data?.message || "Invalid order response"}`);
        setLoadingPlan(null);
        return;
      }

      const razorpayKey = data.keyId || import.meta.env.VITE_RAZORPAY_KEY_ID;
      if (!razorpayKey) {
        alert("Razorpay Key ID is not configured. Please check settings.");
        setLoadingPlan(null);
        return;
      }

      const options = {
        key: razorpayKey,
        amount: data.order.amount,
        currency: data.order.currency,
        name: "CortexAI",
        description: `${data.plan?.name || plan} Plan Upgrade`,
        order_id: data.order.id,
        handler: async (response) => {
          try {
            const verifyRes = await verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            console.log("Payment verification success:", verifyRes);

            if (verifyRes?.user) {
              dispatch(setUserData(verifyRes.user));
            } else {
              const updatedUser = await getCurrentUser();
              if (updatedUser) {
                dispatch(setUserData(updatedUser));
              }
            }
            alert("Payment successful! Your plan and credits have been updated.");
          } catch (error) {
            console.error("Payment verification error:", error);
            alert(`Payment verification failed: ${error?.response?.data?.message || error.message || error}`);
          } finally {
            setLoadingPlan(null);
          }
        },
        modal: {
          ondismiss: () => setLoadingPlan(null),
        },
        prefill: {
          name: userData?.name || "",
          email: userData?.email || "",
        },
        theme: {
          color: "#6366f1",
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.on("payment.failed", function (response) {
        console.error("Payment failed:", response.error);
        alert(`Payment failed: ${response.error.description || response.error.reason}`);
        setLoadingPlan(null);
      });
      razorpay.open();
    } catch (error) {
      console.error("Handle upgrade error:", error);
      alert(`Error initiating upgrade: ${error?.response?.data?.message || error.message || error}`);
      setLoadingPlan(null);
    }
  };

  const currentCredits = userData?.credits ?? 100;
  const totalCredits = userData?.totalCredits ?? 100;
  const percentage = Math.min(Math.max((currentCredits / (totalCredits || 1)) * 100, 0), 100);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black z-40"
          />

          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="fixed right-0 top-0 z-50 h-screen w-full sm:w-[400px] bg-[#0f1117] border-l border-white/10 shadow-2xl flex flex-col font-sans text-slate-100"
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between p-5 border-b border-white/10 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <Sparkles size={18} />
                </div>
                <div>
                  <h2 className="text-white text-lg font-bold">Billing & Credits</h2>
                  <p className="text-slate-400 text-xs">Manage your subscription and quota</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer border-none"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content Area */}
            <div className="p-5 flex-1 overflow-y-auto space-y-6">
              {/* Current Plan Card */}
              <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-5 space-y-4 shadow-lg">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-slate-400 text-xs uppercase font-semibold tracking-wider">Current Plan</p>
                    <h3 className="text-white text-2xl font-extrabold capitalize mt-0.5">
                      {userData?.plan || "Free"}
                    </h3>
                  </div>
                  <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                    <Crown size={22} />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-slate-400 font-medium">
                    <span>Available Credits</span>
                    <span className="text-slate-200 font-semibold">{currentCredits} / {totalCredits}</span>
                  </div>

                  <div className="h-2.5 rounded-full bg-white/10 overflow-hidden p-0.5">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Plans Section */}
              <div className="space-y-4">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 px-1">
                  Upgrade Plans
                </h4>

                {/* Starter Plan */}
                <div className="rounded-2xl border border-white/10 bg-[#141722] p-5 hover:border-indigo-500/40 transition-all duration-200 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-white font-bold text-base">Starter Plan</h3>
                      <p className="text-slate-400 text-xs mt-0.5">Ideal for light generation & tasks</p>
                    </div>
                    <span className="text-indigo-400 text-xl font-extrabold">₹199</span>
                  </div>

                  <div className="text-xs text-slate-300 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                    <span>+500 Monthly AI Credits</span>
                  </div>

                  <button
                    type="button"
                    disabled={loadingPlan === "starter"}
                    onClick={() => handleUpgrade("starter")}
                    className="w-full mt-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 py-2.5 text-white font-semibold text-xs tracking-wide transition-all cursor-pointer border-none shadow-md shadow-indigo-600/30"
                  >
                    {loadingPlan === "starter" ? "Processing..." : "Upgrade to Starter"}
                  </button>
                </div>

                {/* Pro Plan */}
                <div className="rounded-2xl border border-indigo-500/30 bg-[#161a29] p-5 relative overflow-hidden shadow-xl space-y-3">
                  <div className="absolute top-0 right-0 bg-indigo-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-wider">
                    Popular
                  </div>

                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-white font-bold text-base">Pro Plan</h3>
                      <p className="text-slate-400 text-xs mt-0.5">Full multi-agent workflow power</p>
                    </div>
                    <span className="text-indigo-400 text-xl font-extrabold">₹499</span>
                  </div>

                  <div className="text-xs text-slate-300 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                    <span>+2000 Monthly AI Credits</span>
                  </div>

                  <button
                    type="button"
                    disabled={loadingPlan === "pro"}
                    onClick={() => handleUpgrade("pro")}
                    className="w-full mt-2 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:opacity-95 disabled:opacity-50 py-2.5 text-white font-semibold text-xs tracking-wide transition-all cursor-pointer border-none shadow-md shadow-indigo-500/30"
                  >
                    {loadingPlan === "pro" ? "Processing..." : "Upgrade to Pro"}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default BillingDrawer;