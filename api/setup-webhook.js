// api/setup-webhook.js - GEFIXTE VERSIE
const CALENDLY_API_TOKEN = 'eyJraWQiOiIxY2UxZTEzNjE3ZGNmNzY2YjNjZWJjY2Y4ZGM1YmFmYThhNjVlNjg0MDIzZjdjMzJiZTgzNDliMjM4MDEzNWI0IiwidHlwIjoiUEFUIiwiYWxnIjoiRVMyNTYifQ.eyJpc3MiOiJodHRwczovL2F1dGguY2FsZW5kbHkuY29tIiwiaWF0IjoxNzU1OTQxMjk1LCJqdGkiOiI4ZjU3NmE3NC04NWYwLTRjNTYtOWUxYy01MDFmMGYwYTg5ZTIiLCJ1c2VyX3V1aWQiOiJkZjEwMDNlYS1iNDk5LTQ5MzQtOTFmYi01YWI5OTY1OTZlYmQifQ.ak3k8KXAbsBpU9Gtyp4vEmgt7vZQGVvSMW2yaS7ekK2kszBJxkMalaIo0Cxnpv9FnxPSD82X0cadbqtV9LdiyA';

// VERVANG DIT MET JE EIGEN WEBHOOK URL!
// Voor testen: ga naar https://webhook.site en kopieer je unieke URL
const WEBHOOK_URL = 'https://webhook.site/21a58850-6867-4800-8491-951432043f07'; 

async function setupCalendlyWebhook() {
  console.log('🚀 Starting Calendly webhook setup...\n');
  
  try {
    // 1. Get user info eerst
    console.log('1️⃣ Getting user info...');
    const userResponse = await fetch('https://api.calendly.com/users/me', {
      headers: {
        'Authorization': `Bearer ${CALENDLY_API_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!userResponse.ok) {
      const errorText = await userResponse.text();
      throw new Error(`API Error: ${userResponse.status} - ${errorText}`);
    }
    
    const userData = await userResponse.json();
    const userUri = userData.resource.uri;
    const orgUri = userData.resource.current_organization;
    
    console.log('✅ User found:', userData.resource.name);
    console.log('📧 Email:', userData.resource.email);
    console.log('🏢 Organization:', orgUri);
    
    // 2. Check existing webhooks - MET FIX
    console.log('\n2️⃣ Checking existing webhooks...');
    
    // Build URL met query parameters
    const webhookUrl = new URL('https://api.calendly.com/webhook_subscriptions');
    webhookUrl.searchParams.append('organization', orgUri);
    
    const existingResponse = await fetch(webhookUrl.toString(), {
      headers: {
        'Authorization': `Bearer ${CALENDLY_API_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Response status:', existingResponse.status);
    
    if (existingResponse.ok) {
      const existing = await existingResponse.json();
      
      // Check of collection bestaat
      const webhooks = existing.collection || [];
      console.log(`Found ${webhooks.length} existing webhooks`);
      
      // Toon bestaande webhooks
      if (webhooks.length > 0) {
        console.log('\n📋 Existing webhooks:');
        webhooks.forEach(wh => {
          console.log(`  - ${wh.callback_url} (${wh.state})`);
          console.log(`    Events: ${wh.events.join(', ')}`);
        });
        
        // Check of deze URL al bestaat
        const existingUrl = webhooks.find(wh => wh.callback_url === WEBHOOK_URL);
        if (existingUrl) {
          console.log('\n⚠️  WARNING: A webhook with this URL already exists!');
          console.log('Do you want to continue anyway? The API might return an error.');
        }
      }
    } else {
      console.log('Could not fetch existing webhooks (this is OK)');
    }
    
    // 3. Create new webhook
    console.log('\n3️⃣ Creating new webhook subscription...');
    console.log('Webhook URL:', WEBHOOK_URL);
    
    const webhookResponse = await fetch('https://api.calendly.com/webhook_subscriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CALENDLY_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: WEBHOOK_URL,
        events: [
          'invitee.created',
          'invitee.canceled'
        ],
        organization: orgUri,
        user: userUri,
        scope: 'user'
      })
    });
    
    const responseText = await webhookResponse.text();
    
    if (!webhookResponse.ok) {
      console.error('\n❌ Webhook creation failed!');
      console.error('Status:', webhookResponse.status);
      console.error('Response:', responseText);
      
      if (responseText.includes('already exists')) {
        console.error('\n⚠️  This webhook URL is already registered!');
        console.error('Either use a different URL or delete the existing webhook first.');
      }
      
      throw new Error(`Webhook creation failed: ${responseText}`);
    }
    
    const webhook = JSON.parse(responseText);
    
    console.log('\n✅ WEBHOOK CREATED SUCCESSFULLY!');
    console.log('=====================================');
    console.log('Webhook ID:', webhook.resource.uri.split('/').pop());
    console.log('Callback URL:', webhook.resource.callback_url);
    console.log('Events:', webhook.resource.events.join(', '));
    console.log('State:', webhook.resource.state);
    console.log('Created at:', new Date(webhook.resource.created_at).toLocaleString('nl-NL'));
    
    // BELANGRIJK: Signing key
    if (webhook.resource.signing_key) {
      console.log('\n🔐 SIGNING KEY (SAVE THIS!):');
      console.log('=====================================');
      console.log(webhook.resource.signing_key);
      console.log('=====================================');
      console.log('\n⚠️  COPY THIS KEY NOW! You won\'t see it again!');
      console.log('Add it to your .env file as: CALENDLY_WEBHOOK_SECRET=' + webhook.resource.signing_key);
    }
    
    console.log('\n📝 Next steps:');
    console.log('1. Go to', WEBHOOK_URL, 'to see incoming webhooks');
    console.log('2. Make a test booking on any of your Calendly links');
    console.log('3. Check if webhook data arrives at', WEBHOOK_URL);
    console.log('4. Deploy your Supabase function and update the webhook URL');
    
    return webhook.resource;
    
  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    
    if (error.message.includes('401')) {
      console.error('🔑 Token issue - your token might be invalid or expired');
      console.error('Get a new token at: https://calendly.com/integrations/api_webhooks');
    }
    if (error.message.includes('409') || error.message.includes('already exists')) {
      console.error('⚠️  A webhook with this URL already exists');
      console.error('Go to https://calendly.com/app/webhook_subscriptions to manage webhooks');
    }
    if (error.message.includes('403')) {
      console.error('🚫 Permission denied - you might need a paid Calendly plan for webhooks');
    }
  }
}

// Run it!
setupCalendlyWebhook();
