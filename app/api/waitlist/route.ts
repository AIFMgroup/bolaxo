import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { email } = await request.json()
    
    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
    }
    
    // Here you would save the email to your database
    // For now, we'll just log it and return success
    console.log('New waitlist signup:', email)
    
    // TODO: Save to database
    // Example with Prisma:
    // await prisma.waitlist.create({
    //   data: { email }
    // })
    
    // TODO: Send confirmation email
    // Example:
    // await sendEmail({
    //   to: email,
    //   subject: 'Välkommen till Afterfounders väntelista!',
    //   html: '<p>Tack för ditt intresse...</p>'
    // })
    
    return NextResponse.json({ 
      success: true, 
      message: 'Email added to waitlist' 
    })
  } catch (error) {
    console.error('Waitlist error:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}
