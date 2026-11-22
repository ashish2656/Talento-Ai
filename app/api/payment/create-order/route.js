import Razorpay from 'razorpay';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export async function POST(request) {
  try {
    if (!process.env.RAZORPAY_KEY_SECRET) {
      return Response.json(
        { success: false, error: 'Razorpay credentials are not configured' },
        { status: 500 }
      );
    }

    const { amount, currency = 'INR' } = await request.json();

    const options = {
      amount: amount, // amount in paise
      currency: currency,
      receipt: 'order_' + Date.now(),
    };

    const order = await razorpay.orders.create(options);

    return Response.json({
      success: true,
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (error) {
    console.error('Error creating order:', error);
    return Response.json(
      { success: false, error: 'Failed to create order' },
      { status: 500 }
    );
  }
}
