import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');
    
    console.log('Webhook test received:');
    console.log('Body:', body);
    console.log('Signature:', signature);
    
    return NextResponse.json({ 
      received: true, 
      bodyLength: body.length,
      hasSignature: !!signature 
    });
  } catch (error: any) {
    console.error('Webhook test error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ 
    message: 'Stripe webhook test endpoint is working',
    timestamp: new Date().toISOString()
  });
}
