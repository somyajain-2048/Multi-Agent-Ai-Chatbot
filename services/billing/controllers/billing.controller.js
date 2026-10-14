import { PLANS } from "../config/Plans.js";
import Payment from "../models/payment.model.js";
import razorpay from "../config/razorpay.js";
import crypto from "crypto";
import axios from "axios";

export const createOrder = async (req, res) => {
    try {
        const { plan } = req.body;
        const userId = req.headers["x-user-id"];
        const selectedPlan = PLANS[plan];

        if (!selectedPlan) {
            return res.status(404).json({ message: "Plan not found" });
        }

        if (selectedPlan.amount === 0) {
            const authRes = await axios.post(`${process.env.AUTH_SERVICE}/update-plan`, {
                userId,
                plan: selectedPlan.id,
                credits: selectedPlan.credits
            });
            return res.status(200).json({
                free: true,
                plan: selectedPlan,
                user: authRes.data.user,
                message: "Switched to Free plan successfully"
            });
        }

        const order = await razorpay.orders.create({
            amount: selectedPlan.amount * 100,
            currency: "INR",
            receipt: `receipt-${Date.now()}`
        });

        await Payment.create({
            userId,
            orderId: order.id,
            amount: selectedPlan.amount,
            credits: selectedPlan.credits,
            plan: selectedPlan.id,
            currency: order.currency,
            status: "created"
        });

        return res.status(200).json({ 
            order, 
            plan: selectedPlan,
            keyId: process.env.RAZORPAY_KEY_ID 
        });
    } catch (error) {
        console.error("Create order error:", error);
        return res.status(500).json({ message: `Create order error: ${error.message || error}` });
    }
};

export const verifyPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        const generateSignature = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest("hex");

        if (generateSignature !== razorpay_signature) {
            return res.status(400).json({ message: "Payment verification failed" });
        }

        const payment = await Payment.findOne({ orderId: razorpay_order_id });

        if (!payment) {
            return res.status(404).json({ message: "Payment not found" });
        }

        payment.status = "paid";
        payment.paymentId = razorpay_payment_id;

        await payment.save();

        const authRes = await axios.post(`${process.env.AUTH_SERVICE}/update-plan`, {
            userId: payment.userId,
            plan: payment.plan,
            credits: payment.credits
        });

        return res.status(200).json({ 
            success: true, 
            user: authRes.data.user, 
            message: "Payment verified successfully" 
        });
    } catch (error) {
        console.error("Verify payment error:", error);
        return res.status(500).json({ message: `Verify payment error: ${error.message || error}` });
    }
};
