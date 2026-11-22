import crypto from 'crypto';

export async function POST(request) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await request.json();

    if (!process.env.RAZORPAY_KEY_SECRET) {
      return Response.json(
        { success: false, error: 'Razorpay credentials are not configured' },
        { status: 500 }
      );
    }

    // Verify the payment signature
    const text = `${razorpay_order_id}|${razorpay_payment_id}`;
    const signature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(text)
      .digest('hex');

    if (signature === razorpay_signature) {
      // Payment is verified
      // Here you would typically:
      // 1. Update user subscription status in database
      // 2. Send confirmation email
      // 3. Log the successful payment
      
      return Response.json({
        success: true,
        message: 'Payment verified successfully',
        order_id: razorpay_order_id,
        payment_id: razorpay_payment_id
      });
    } else {
      return Response.json(
        { success: false, error: 'Invalid signature' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Payment verification error:', error);
    return Response.json(
      { success: false, error: 'Payment verification failed' },
      { status: 500 }
    );
  }
}
